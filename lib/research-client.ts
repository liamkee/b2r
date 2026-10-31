import type { recommend } from "@/lib/engine/service";
import type { BusinessProfile } from "@/lib/engine/profile";

export type ResearchResponse = Awaited<ReturnType<typeof recommend>>;
export const RESEARCH_EVENT = "asean:research-changed";
const DRAFT_KEY = "asean:research-draft:v1";
const RESULT_KEY = "asean:research-result:v1";
let memoryResult: ResearchResponse | null = null;

function validResult(value: unknown): value is ResearchResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<ResearchResponse>;
  return data.api_version === "1.0.0" && data.report?.schema_version === "1.0.0" && typeof data.report.summary?.text === "string" && Array.isArray(data.report.countries) && data.report.countries.length > 0 && data.report.countries.every(country =>
    typeof country.country_code === "string" && country.recommendation && country.evidence_coverage && Array.isArray(country.evidence_coverage.freshness_flags) && Array.isArray(country.critical_unknowns) && Array.isArray(country.validation_plan) && Array.isArray(country.competitors_and_channels) &&
    ["demand_fit","regulatory_feasibility","competitive_positioning","commercial_readiness","scaling_feasibility"].every(key => {
      const dimension = country.dimensions?.[key as keyof typeof country.dimensions];
      return dimension && Array.isArray(dimension.reasons) && Array.isArray(dimension.unresolved_inputs);
    })) && Array.isArray(data.retrieval?.records) && Array.isArray(data.retrieval?.sources);
}
export function loadResearchDraft(): BusinessProfile | null {
  try {
    const stored = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    if (stored?.version !== 1 || !stored.profile || !Array.isArray(stored.profile.target_countries) || !stored.profile.industry || !stored.profile.product || !stored.profile.revenue || !stored.profile.scalability_targets) return null;
    const profile = stored.profile;
    if (typeof profile.industry.sector !== "string" || typeof profile.product.description !== "string" || !Array.isArray(profile.product.regulated_features) || !profile.product.regulated_features.every((value:unknown) => typeof value === "string") || !Array.isArray(profile.scalability_targets.constraints) || !profile.scalability_targets.constraints.every((value:unknown) => typeof value === "string") || !profile.scalability_targets.expansion_budget || typeof profile.scalability_targets.description !== "string" || typeof profile.revenue.status !== "string") return null;
    return stored.profile;
  } catch { return null; }
}
export function saveResearchDraft(profile: BusinessProfile): boolean {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify({version:1, profile})); return true; } catch { return false; }
}
export function loadResearchResult(): ResearchResponse | null {
  if (memoryResult) return memoryResult;
  try { const data = JSON.parse(sessionStorage.getItem(RESULT_KEY) ?? "null"); return validResult(data) ? data : null; } catch { return null; }
}
export function saveResearchResult(result: ResearchResponse): boolean {
  memoryResult = result;
  let saved = true;
  try { sessionStorage.setItem(RESULT_KEY, JSON.stringify(result)); } catch { saved = false; }
  window.dispatchEvent(new Event(RESEARCH_EVENT));
  return saved;
}
export function clearResearch(): boolean {
  memoryResult = null;
  let cleared = true;
  try { localStorage.removeItem(DRAFT_KEY); } catch { cleared = false; }
  try { sessionStorage.removeItem(RESULT_KEY); } catch { cleared = false; }
  window.dispatchEvent(new Event(RESEARCH_EVENT));
  return cleared;
}
export async function requestResearch(profile: BusinessProfile, signal?: AbortSignal): Promise<ResearchResponse> {
  const response = await fetch("/api/recommendations", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(profile), cache:"no-store", signal:signal ? AbortSignal.any([signal,AbortSignal.timeout(50_000)]) : AbortSignal.timeout(50_000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 429) throw new Error("Research is busy. Wait a minute and try again.");
    if (data?.issues?.length) throw new Error(data.issues.slice(0,3).map((issue:{path:string;message:string}) => `${issue.path.replaceAll("/"," ").trim()}: ${issue.message}`).join(" "));
    throw new Error("Research could not be completed. Your answers are still here; please try again.");
  }
  if (!validResult(data)) throw new Error("The research response was incomplete. Please try again.");
  return data;
}
