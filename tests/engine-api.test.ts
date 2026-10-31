import { afterEach, describe, expect, it, vi } from "vitest";
import example from "@/knowledge/asean/evals/example_business_profile.json";
import { POST } from "@/app/api/recommendations/route";
import { GET } from "@/app/api/knowledge/status/route";
import { recommend } from "@/lib/engine/service";
import { buildModelReportTemplate } from "@/lib/engine/report";
import { MAX_BODY_BYTES, enterRequest, readJsonBody, paidModeConfigured, reservePaidWork } from "@/lib/engine/controls";
import { OpenAIResponsesProvider, ProviderError, buildOpenAIRequestBody } from "@/lib/engine/provider";
import { normalizeProfile } from "@/lib/engine/profile";
import { retrieveEvidence } from "@/lib/engine/retrieval";
import { validateRecommendationSchema } from "@/lib/engine/schema";

const now = "2026-10-31T09:00:00.000Z";
const env = { NODE_ENV: "test" as const, ENGINE_PAID_ENABLED: "true", OPENAI_API_KEY: "test-secret-do-not-expose", OPENAI_MODEL: "operator-configured-model", ENGINE_ADMISSION_URL: "https://usage.example.test/reserve", ENGINE_ADMISSION_TOKEN: "gateway-secret" };
function request(body: unknown = example, extra: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/recommendations", { method: "POST", headers: { "Content-Type": "application/json", ...extra }, body: JSON.stringify(body) });
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("recommendation API", () => {
  it("exposes version and coverage without configuration secrets", async () => {
    vi.stubEnv("OPENAI_API_KEY", "hidden-key");
    const response = GET();
    const status = await response.json();
    expect(status.country_count).toBe(11);
    expect(status.record_count).toBe(78);
    expect(status.content_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(status)).not.toContain("hidden-key");
  });
  it("returns complete schema-valid private evidence report without credentials", async () => {
    vi.stubEnv("ENGINE_PAID_ENABLED", "false");
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    const result = await response.json();
    expect(validateRecommendationSchema(result.report)).toBe(true);
    expect(result.report.mode).toBe("evidence_only");
    expect(result.report.countries.map((country: {country_code:string}) => country.country_code)).toEqual(example.target_countries);
    expect(result.privacy.profile_persisted).toBe(false);
    expect(result.execution.provider_calls).toBe(0);
  });
  it("rejects a sixth answer and emits no submitted text", async () => {
    const response = await POST(request({ ...example, secret_extra: "confidential-product" }));
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain("confidential-product");
  });
  it("rejects foreign browser origin", async () => {
    expect((await POST(request(example, { Origin: "https://untrusted.test" }))).status).toBe(403);
  });
  it("rejects oversized declared body", async () => {
    expect((await POST(request(example, { "Content-Length": String(MAX_BODY_BYTES + 1) }))).status).toBe(413);
  });
  it("rejects non-JSON and malformed JSON safely", async () => {
    expect((await POST(new Request("http://localhost:3000/api/recommendations", { method: "POST", body: "a=b" }))).status).toBe(415);
    expect((await POST(new Request("http://localhost:3000/api/recommendations", { method: "POST", headers: {"Content-Type":"application/json"}, body: "{" }))).status).toBe(400);
  });
  it("bounds chunked bodies even without content-length", async () => {
    await expect(readJsonBody(request("x".repeat(MAX_BODY_BYTES)))).rejects.toMatchObject({ status: 413 });
  });
  it("bounds stalled body streams", async () => {
    vi.useFakeTimers();
    const stream = new ReadableStream<Uint8Array>({ start() {} });
    const stalled = new Request("http://localhost:3000", { method:"POST", headers:{"Content-Type":"application/json"}, body:stream, duplex:"half" } as RequestInit);
    const result = expect(readJsonBody(stalled)).rejects.toMatchObject({ status: 408 });
    await vi.advanceTimersByTimeAsync(5001);
    await result;
  });
  it("enforces instance concurrency and allows release only once", () => {
    const releases = Array.from({length:4}, () => enterRequest(Date.now() + 120_000));
    try { expect(() => enterRequest(Date.now() + 120_000)).toThrow("engine_busy"); }
    finally { releases.forEach(release => { release(); release(); }); }
  });
});

describe("provider admission and fallback", () => {
  it("a key alone never enables paid work", () => {
    expect(paidModeConfigured({ NODE_ENV:"test", OPENAI_API_KEY:"secret" })).toBe(false);
    expect(paidModeConfigured({...env, ENGINE_PAID_ENABLED:"false"})).toBe(false);
    expect(paidModeConfigured({...env, ENGINE_ADMISSION_URL:"http://usage.test"})).toBe(false);
  });
  it("fails closed on missing, denied, partial and failed durable reservation", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ allowed:true, reserved_calls:0 }));
    expect(await reservePaidWork(request(),1,env,fetcher)).toBe(false);
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain(env.OPENAI_API_KEY);
    fetcher.mockRejectedValue(new Error("secret service error"));
    expect(await reservePaidWork(request(),1,env,fetcher)).toBe(false);
  });
  it("accepts exact reservation and passes bounded cost and opaque identity", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ allowed:true, reserved_calls:4 }));
    expect(await reservePaidWork(request(),4,env,fetcher)).toBe(true);
    const payload = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(payload.max_output_tokens_per_call).toBe(6000);
    expect(payload.client_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(payload).not.toHaveProperty("profile");
  });
  it("no provider call occurs on admission denial", async () => {
    const generate = vi.fn();
    const result = await recommend(example,request(),{ now,env,provider:{generate},admit:async()=>false });
    expect(generate).not.toHaveBeenCalled();
    expect(result.execution.fallback_reason).toBe("shared_usage_or_budget_control_denied");
  });
  it.each(["provider_timeout","provider_refusal","provider_invalid_output"] as const)("falls back on %s", async code => {
    const result = await recommend(example,request(),{ now,env,provider:{generate:async()=>{throw new ProviderError(code);}},admit:async()=>true });
    expect(result.report.mode).toBe("evidence_only");
    expect(result.execution.fallback_reason).toBe(code);
    expect(result.execution.provider_calls).toBe(1);
  });
  it("rejects fabricated response and citations", async () => {
    const result = await recommend(example,request(),{ now,env,provider:{generate:async()=>({mode:"rag_model",url:"https://forged.test"})},admit:async()=>true });
    expect(result.report.mode).toBe("evidence_only");
    expect(result.execution.fallback_reason).toBe("provider_invalid_output");
    expect(JSON.stringify(result)).not.toContain("forged.test");
  });
  it("all eleven countries get bounded sequential model batches", async () => {
    const codes = ["BN","KH","ID","LA","MY","MM","PH","SG","TH","TL","VN"];
    const seen: string[][] = [];
    const generate = vi.fn(async (profile, retrieval) => {
      seen.push(profile.target_countries);
      return buildModelReportTemplate(profile,retrieval,now);
    });
    const result = await recommend({...example,target_countries:codes},request(),{now,env,provider:{generate},admit:async(_request,calls)=>calls===4});
    expect(seen).toHaveLength(4);
    expect(seen.flat()).toEqual(codes);
    expect(seen.every(batch=>batch.length<=3)).toBe(true);
    expect(result.report.countries).toHaveLength(11);
  });
});

describe("OpenAI REST adapter (mocked, not live evaluation)", () => {
  const profile = normalizeProfile(example);
  const retrieval = retrieveEvidence(profile,{now});
  it("fits a three-country example and avoids repeating query text, source URLs and derived evidence", () => {
    const serialized = buildOpenAIRequestBody(profile,retrieval,now,env.OPENAI_MODEL);
    expect(Buffer.byteLength(serialized)).toBeLessThanOrEqual(100_000);
    const body = JSON.parse(serialized);
    const data = JSON.parse(body.input[0].content[0].text);
    expect(data.evidence[0]).not.toHaveProperty("text_for_embedding");
    expect(data.coverage[0].traces[0]).not.toHaveProperty("query_terms");
    expect(data.coverage[0].traces[0]).not.toHaveProperty("reason_selected");
    expect(data.sources[0]).not.toHaveProperty("url");
    expect(data.sources[0]).toHaveProperty("access_method");
    expect(data.evidence[0]).toHaveProperty("reviewed_on");
  });
  it("caps the entire request including schema and policy before calling the provider", async () => {
    const oversized = structuredClone(profile);
    const base = buildOpenAIRequestBody(oversized,retrieval,now,env.OPENAI_MODEL);
    oversized.product.description += "x".repeat(Math.max(0,100_001-Buffer.byteLength(base)));
    const serialized = buildOpenAIRequestBody(oversized,retrieval,now,env.OPENAI_MODEL);
    expect(Buffer.byteLength(serialized)).toBeGreaterThan(100_000);
    // The inner data alone fits; policy/schema/outer JSON are the deciding bytes.
    expect(Buffer.byteLength(JSON.parse(serialized).input[0].content[0].text)).toBeLessThan(100_000);
    const fetcher = vi.fn();
    await expect(new OpenAIResponsesProvider(env,fetcher).generate(oversized,retrieval,now)).rejects.toMatchObject({code:"context_budget_exceeded"});
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("sends policy separate from untrusted input and enforces structured outputs", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({status:"completed",output:[{type:"message",content:[{type:"output_text",text:'{"mock":true}'}]}]}));
    expect(await new OpenAIResponsesProvider(env,fetcher).generate(profile,retrieval,now)).toEqual({mock:true});
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.store).toBe(false);
    expect(body.text.format.strict).toBe(true);
    expect(body.text.format.type).toBe("json_schema");
    expect(body).not.toHaveProperty("tools");
    expect(JSON.stringify(body)).not.toContain(env.OPENAI_API_KEY);
  });
  it.each([
    [{status:"incomplete"},"provider_incomplete"],
    [{status:"completed",output:[{content:[{type:"refusal"}]}]},"provider_refusal"],
    [{status:"completed",output:[{content:[{type:"output_text",text:"invalid json"}]}]},"provider_invalid_output"],
  ])("handles provider state safely", async (body,code) => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(body));
    await expect(new OpenAIResponsesProvider(env,fetcher).generate(profile,retrieval,now)).rejects.toMatchObject({code});
  });
  it("handles abort without leaking provider errors", async () => {
    const fetcher = vi.fn().mockRejectedValue(new DOMException("sensitive provider output","TimeoutError"));
    await expect(new OpenAIResponsesProvider(env,fetcher).generate(profile,retrieval,now)).rejects.toMatchObject({code:"provider_timeout"});
  });
});
