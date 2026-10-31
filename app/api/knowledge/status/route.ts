import { knowledgeStatus } from "@/lib/engine/knowledge";
import { paidModeConfigured } from "@/lib/engine/controls";

export const runtime = "nodejs";
export function GET() {
  return Response.json({ ...knowledgeStatus(), api_version: "1.0.0", paid_analysis_configured: paidModeConfigured(), paid_analysis_requires_shared_admission: true }, { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
