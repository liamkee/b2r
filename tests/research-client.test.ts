import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/knowledge/countries/route";
import { clearResearch, loadResearchDraft, loadResearchResult, requestResearch, saveResearchDraft } from "@/lib/research-client";
import example from "@/knowledge/asean/evals/example_business_profile.json";
import { normalizeProfile } from "@/lib/engine/profile";

afterEach(() => { vi.unstubAllGlobals(); });
describe("connected country research", () => {
  it("returns authoritative scoped content for selected countries", async () => {
    const response = GET(new Request("http://localhost/api/knowledge/countries?codes=MY,TL"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.countries.map((country: {code:string}) => country.code)).toEqual(["MY","TL"]);
    for (const country of data.countries) {
      expect(country.records.every((record: {country_codes:string[]}) => record.country_codes.includes(country.code))).toBe(true);
      expect(country.sources.every((source: {url:string}) => source.url.startsWith("https://"))).toBe(true);
    }
  });
  it("rejects invalid country codes instead of rendering fallback country data", () => {
    expect(GET(new Request("http://localhost/api/knowledge/countries?codes=US")).status).toBe(400);
  });
  it("keeps corrupt and blocked browser storage usable", () => {
    vi.stubGlobal("localStorage", {getItem:()=>"{broken",setItem:()=>{throw new Error("blocked");},removeItem:()=>{throw new Error("blocked");}});
    vi.stubGlobal("sessionStorage", {getItem:()=>"{broken",removeItem:()=>{throw new Error("blocked");}});
    vi.stubGlobal("window", {dispatchEvent:()=>true});
    expect(loadResearchDraft()).toBeNull();
    expect(loadResearchResult()).toBeNull();
    expect(saveResearchDraft(normalizeProfile(example))).toBe(false);
    expect(clearResearch()).toBe(false);
  });
  it("reports throttling in plain language", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({error:"rate_limit"},{status:429})));
    await expect(requestResearch(normalizeProfile(example))).rejects.toThrow("Wait a minute");
  });
});
