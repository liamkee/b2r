import Ajv2020 from "ajv/dist/2020";
import rawRecommendationSchema from "@/knowledge/asean/schemas/recommendation.schema.json";

export interface Citation {
  record_id: string;
  source_ids: string[];
}
export interface Claim {
  text: string;
  kind: "source_fact" | "analyst_inference" | "user_provided" | "unknown";
  citations: Citation[];
  assumptions: string[];
}
export type Confidence = "low" | "moderate" | "high";
export interface Dimension {
  assessment: "supportive" | "mixed" | "constraining" | "unknown";
  confidence: Confidence;
  reasons: Claim[];
  unresolved_inputs: string[];
}
export interface CountryRecommendation {
  country_code: string;
  status: "pilot_candidate" | "research_first" | "defer" | "not_recommended";
  recommendation: Claim;
  confidence: Confidence;
  evidence_coverage: {
    regulation: "starter" | "sector_specific" | "missing" | "stale";
    demand: "macro_only" | "sector_signal" | "product_specific" | "missing" | "stale";
    competition: "examples_only" | "product_specific" | "missing" | "stale";
    freshness_flags: string[];
  };
  dimensions: {
    demand_fit: Dimension;
    regulatory_feasibility: Dimension;
    competitive_positioning: Dimension;
    commercial_readiness: Dimension;
    scaling_feasibility: Dimension;
  };
  entry_mode_options: Claim[];
  competitors_and_channels: {
    name: string;
    relationship: "direct_competitor" | "adjacent_competitor" | "substitute" | "channel" | "potential_partner" | "unclear";
    customer_job_overlap: string;
    offering_evidence: Citation[];
    differentiation_hypotheses: Claim[];
    commercial_terms_verified: boolean;
  }[];
  critical_unknowns: string[];
  validation_plan: {
    time_window: "days_1_30" | "days_31_60" | "days_61_90" | "custom";
    action: string;
    success_metric: string;
    go_no_go_condition: string;
    evidence_or_assumptions: Claim[];
  }[];
  record_ids_used: string[];
}
export interface Recommendation {
  schema_version: "1.0.0";
  dataset_version: string;
  generated_at: string;
  mode: "rag_model" | "evidence_only";
  summary: Claim;
  comparison_order: string[];
  ordering_status: "supported_test_priority" | "not_ranked_insufficient_evidence" | "not_ranked_unequal_coverage";
  countries: CountryRecommendation[];
  cross_country_tradeoffs: Claim[];
  missing_business_information: string[];
  disclaimer: string;
}

/** Canonical supplied contract; semantic validation is a separate, mandatory step. */
export const recommendationSchema = rawRecommendationSchema;
const ajv = new Ajv2020({ allErrors: true, strict: false, strictNumbers: true });
const validator = ajv.compile<Recommendation>(recommendationSchema);

export function validateRecommendationSchema(value: unknown): value is Recommendation {
  return validator(value) as boolean;
}

/** Error metadata deliberately excludes submitted values. */
export function recommendationSchemaErrors(): { path: string; message: string }[] {
  return (validator.errors ?? []).slice(0, 20).map((error) => ({
    path: error.instancePath || "/",
    message: error.message ?? "Invalid recommendation shape",
  }));
}
