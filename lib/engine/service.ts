import { buildEvidenceReport, buildModelReportTemplate, buildRegulatoryGates } from "@/lib/engine/report";
import { normalizeProfile, mechanicalGrowth } from "@/lib/engine/profile";
import type { BusinessProfile } from "@/lib/engine/profile";
import { retrieveEvidence, type RetrievalResult } from "@/lib/engine/retrieval";
import { validateRecommendationSchema, type Recommendation } from "@/lib/engine/schema";
import { validateRecommendationSemantics } from "@/lib/engine/semantics";
import { OpenAIResponsesProvider, ProviderError, type RecommendationProvider } from "@/lib/engine/provider";
import { paidModeConfigured, reservePaidWork } from "@/lib/engine/controls";

function countryBatch(retrieval: RetrievalResult, countries: string[]): RetrievalResult {
  const selected = retrieval.countries.filter(country => countries.includes(country.country_code));
  const ids = new Set(selected.flatMap(country => country.record_ids));
  const records = retrieval.records.filter(record => ids.has(record.id));
  const sources = new Set(records.flatMap(record => record.source_ids));
  return { ...retrieval, countries: selected, records, sources: retrieval.sources.filter(source => sources.has(source.source_id)) };
}

export async function recommend(input: unknown, request: Request, options: {
  now?: string; env?: NodeJS.ProcessEnv; provider?: RecommendationProvider;
  admit?: (request: Request, calls: number) => Promise<boolean>;
} = {}) {
  const profile = normalizeProfile(input);
  const now = options.now ?? new Date().toISOString();
  const retrieval = retrieveEvidence(profile, { now });
  const fallback = buildEvidenceReport(profile, retrieval, now);
  if (!validateRecommendationSchema(fallback) || !validateRecommendationSemantics(fallback, profile, retrieval, now).valid) throw new Error("Invalid evidence report");
  const env = options.env ?? process.env;
  let report: Recommendation = fallback;
  let reason: string | null = "paid_mode_not_configured";
  let providerCalls = 0;
  const batchSize = 3;
  const maxCalls = Math.ceil(profile.target_countries.length / batchSize);
  if (paidModeConfigured(env)) {
    const admitted = await (options.admit ?? ((req, calls) => reservePaidWork(req, calls, env)))(request, maxCalls);
    if (!admitted) reason = "shared_usage_or_budget_control_denied";
    else {
      const provider = options.provider ?? new OpenAIResponsesProvider(env);
      const countries: Recommendation["countries"] = [];
      try {
        for (let offset = 0; offset < profile.target_countries.length; offset += batchSize) {
          const batch = profile.target_countries.slice(offset, offset + batchSize);
          const batchProfile: BusinessProfile = { ...profile, target_countries: batch };
          const batchRetrieval = countryBatch(retrieval, batch);
          providerCalls++;
          const candidate = await provider.generate(batchProfile, batchRetrieval, now);
          if (!validateRecommendationSchema(candidate) || candidate.mode !== "rag_model" || !validateRecommendationSemantics(candidate, batchProfile, batchRetrieval, now).valid) throw new ProviderError("provider_invalid_output");
          countries.push(...candidate.countries);
        }
        // Comparison is deliberately unranked until comparable product evidence exists.
        const combined: Recommendation = { ...buildModelReportTemplate(profile, retrieval, now), countries };
        if (!validateRecommendationSchema(combined) || !validateRecommendationSemantics(combined, profile, retrieval, now).valid) throw new ProviderError("provider_invalid_output");
        report = combined;
        reason = null;
      } catch (error) {
        reason = error instanceof ProviderError ? error.code : "provider_unavailable";
      }
    }
  }
  return {
    api_version: "1.0.0",
    report,
    retrieval,
    regulatory_gates: buildRegulatoryGates(profile, retrieval),
    mechanical_calculations: mechanicalGrowth(profile) ? [mechanicalGrowth(profile)] : [],
    execution: { fallback_reason: reason, provider_calls: providerCalls, provider_live_checked_sources: false },
    privacy: { profile_persisted: false, publicly_cached: false, submitted_to_model: providerCalls > 0, disclosure: "The profile is processed on this server. If paid analysis is enabled and admitted, relevant answers and retrieved evidence are sent to the configured model provider. This endpoint does not save the profile." },
  };
}
