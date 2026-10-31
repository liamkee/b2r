import { createHmac, randomUUID } from "node:crypto";

export class RequestError extends Error {
  constructor(public status: number, public code: string) { super(code); }
}

export const MAX_BODY_BYTES = 32_768;
const windows = new Map<string, { count: number; until: number }>();
let active = 0;

/** Local load shedding only. Paid work additionally requires durable admission below. */
export function enterRequest(now = Date.now()): () => void {
  if (active >= 4) throw new RequestError(429, "engine_busy");
  const key = "instance";
  const window = windows.get(key);
  if (!window || window.until <= now) windows.set(key, { count: 1, until: now + 60_000 });
  else {
    if (window.count >= 30) throw new RequestError(429, "instance_rate_limit");
    window.count++;
  }
  active++;
  let released = false;
  return () => { if (!released) { active--; released = true; } };
}

export async function readJsonBody(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new RequestError(415, "json_required");
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw new RequestError(413, "body_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "invalid_json");
  const chunks: Uint8Array[] = [];
  let total = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const read = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BODY_BYTES) throw new RequestError(413, "body_too_large");
        chunks.push(value);
      }
      try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
      catch { throw new RequestError(400, "invalid_json"); }
    };
    return await Promise.race([read(), new Promise<never>((_, reject) => {
      timer = setTimeout(() => { void reader.cancel().catch(() => undefined); reject(new RequestError(408, "body_timeout")); }, 5000);
    })]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => undefined);
  }
}

export function paidModeConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.ENGINE_PAID_ENABLED !== "true" || !env.OPENAI_API_KEY || !env.OPENAI_MODEL || !env.ENGINE_ADMISSION_TOKEN || !env.ENGINE_ADMISSION_URL) return false;
  try {
    const url = new URL(env.ENGINE_ADMISSION_URL);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

/** The operator's gateway must atomically reserve shared spend/rate/concurrency capacity.
 * No gateway is provisioned automatically. Failure never permits paid work.
 */
export async function reservePaidWork(request: Request, calls: number, env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): Promise<boolean> {
  if (!paidModeConfigured(env)) return false;
  const identity = env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for") ?? "unknown" : "local";
  const client_hash = createHmac("sha256", env.ENGINE_ADMISSION_TOKEN!).update(identity).digest("hex");
  try {
    const response = await fetcher(env.ENGINE_ADMISSION_URL!, {
      method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(2000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.ENGINE_ADMISSION_TOKEN}` },
      body: JSON.stringify({ request_id: randomUUID(), client_hash, provider: "openai", model: env.OPENAI_MODEL, max_calls: calls, max_input_bytes_per_call: 100_000, max_output_tokens_per_call: 6000, lease_seconds: 60 }),
    });
    if (!response.ok) return false;
    const result = await response.json() as { allowed?: boolean; reserved_calls?: number };
    return result.allowed === true && result.reserved_calls === calls;
  } catch { return false; }
}
