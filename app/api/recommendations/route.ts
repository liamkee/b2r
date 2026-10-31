import { recommend } from "@/lib/engine/service";
import { enterRequest, readJsonBody, RequestError } from "@/lib/engine/controls";
import { ProfileValidationError } from "@/lib/engine/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff" };
export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new RequestError(403, "same_origin_required");
    release = enterRequest();
    const input = await readJsonBody(request);
    return Response.json(await recommend(input, request), { headers });
  } catch (error) {
    if (error instanceof ProfileValidationError) return Response.json({ error: "invalid_profile", issues: error.issues }, { status: 400, headers });
    if (error instanceof RequestError) return Response.json({ error: error.code }, { status: error.status, headers: { ...headers, ...(error.status === 429 ? { "Retry-After": "60" } : {}) } });
    return Response.json({ error: "recommendation_unavailable" }, { status: 503, headers });
  } finally { release?.(); }
}
