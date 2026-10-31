import type { BusinessProfile } from "./profile";
import { mechanicalGrowth } from "./profile";
import type { EvidenceRecord } from "./knowledge";
import type { RetrievalResult } from "./retrieval";
import type { Claim, Citation, CountryRecommendation, Dimension, Recommendation } from "./schema";

export const RESEARCH_DISCLAIMER = "This is a dated starter research snapshot, not legal, tax, sanctions or investment clearance. Original instruments, amendments, activity scope and counterparties need current verification. Source summaries have not been live-checked by this request. Proposed validation targets are research tests, not forecasts or promises.";

const unknown = (text: string): Claim => ({ text, kind: "unknown", citations: [], assumptions: [] });
const userFact = (text: string): Claim => ({ text, kind: "user_provided", citations: [], assumptions: [] });

export function recordCitation(record: EvidenceRecord): Citation {
  return { record_id: record.id, source_ids: [...record.source_ids] };
}

/** Exact source-summary extraction avoids making an unverified paraphrase look like a new fact. */
export function recordClaims(records: EvidenceRecord[], maximum = 6): Claim[] {
  return records.filter((record) => record.record_type === "evidence" && record.source_ids.length)
    .flatMap((record) => record.facts.map((text) => ({ text, kind: "source_fact" as const, citations: [recordCitation(record)], assumptions: [] })))
    .slice(0, maximum);
}

function dimension(records: EvidenceRecord[], gap: string, unresolved: string[] = []): Dimension {
  return { assessment: "unknown", confidence: "low", reasons: [...recordClaims(records), unknown(gap)].slice(0, 8), unresolved_inputs: unresolved.slice(0, 15) };
}

function unique(values: string[], maximum = 20) { return [...new Set(values.filter(Boolean))].slice(0, maximum); }

export function missingBusinessInformation(profile: BusinessProfile): string[] {
  const missing: string[] = ["Investor nationality, beneficial ownership and proposed legal structure are not established by this intake."];
  if (!profile.product.current_base_country) missing.push("Current operating base country is unspecified.");
  if (profile.product.entry_mode_preference === "undecided") missing.push("Intended entry mode is undecided; cross-border sales, a distributor and a local entity need different checks.");
  if (!profile.product.customer_segment) missing.push("Target customer segment is unspecified.");
  if (!profile.product.business_model) missing.push("Business model is unspecified.");
  if (!profile.product.price_description) missing.push("Locally validated pricing and willingness to pay are unknown.");
  if (profile.revenue.status === "not_disclosed") missing.push("Revenue is not disclosed; commercial traction remains unknown.");
  if (profile.scalability_targets.expansion_budget.amount === null) missing.push("Expansion budget, cash and runway are unknown; revenue is not a substitute for any of them.");
  if (profile.scalability_targets.baseline_value === null) missing.push("Scaling baseline is unspecified; a growth multiple cannot be inferred.");
  if (profile.scalability_targets.horizon_months === null && !profile.scalability_targets.target_date) missing.push("Scaling deadline is unspecified.");
  if (profile.scalability_targets.metric === "not_specified" || profile.scalability_targets.target_value === null) missing.push("A measurable scaling target has not been specified.");
  return missing;
}

export function proposedValidationPlan(): CountryRecommendation["validation_plan"] {
  const assumption: Claim = {
    text: "These are proposed research targets. The windows and sample sizes are adjustable tests, not evidence of launch feasibility or permission to conduct regulated operations.",
    kind: "analyst_inference", citations: [], assumptions: ["The team will agree capacity, budget and legal prerequisites before starting a test."],
  };
  return [
    { time_window: "days_1_30", action: "Map the exact activity, entry mode and regulated features to current original rules; interview ten qualified buyers about their current workflow and the stated customer problem.", success_metric: "A documented applicability checklist and ten completed buyer interviews with problem frequency and existing alternatives.", go_no_go_condition: "Continue research only if a repeated buyer problem is documented. Hold any regulated operation until activity-specific permission and current legal checks are resolved.", evidence_or_assumptions: [assumption] },
    { time_window: "days_31_60", action: "Test the proposed value proposition and price with five qualified prospects; verify competitor or channel job overlap and obtain actual local partner quotes where relevant.", success_metric: "Five documented value-and-price conversations, a sourced alternatives comparison and explicit cost assumptions.", go_no_go_condition: "Consider a limited validation test only if buyers show a concrete commitment and legal, data-handling and budget prerequisites are documented; otherwise revise the hypothesis.", evidence_or_assumptions: [assumption] },
    { time_window: "days_61_90", action: "If prerequisites are cleared, run a small agreed pilot and measure activation, retention, delivery effort and willingness to pay against thresholds fixed before the pilot.", success_metric: "A pilot scorecard with the agreed baseline, target, actual results, sample size and delivery costs.", go_no_go_condition: "Expand only when pre-agreed buyer and operational thresholds are met and current legal checks remain satisfied. Pause or redesign if they are not.", evidence_or_assumptions: [assumption] },
  ];
}

export interface RegulatoryGate {
  country_code: string;
  status: "confirmed_activity_restriction" | "conditional_unknown" | "reviewed_requirement";
  final_clearance: false;
  record_ids: string[];
  reason: string;
}

/** The starter snapshot cannot supply current activity-specific legal clearance. */
export function buildRegulatoryGates(profile: BusinessProfile, retrieval: RetrievalResult): RegulatoryGate[] {
  return profile.target_countries.map((country_code) => ({
    country_code, status: "conditional_unknown", final_clearance: false,
    record_ids: retrieval.records.filter((record) => record.country_codes.includes(country_code) && ["regulation", "operational_risk"].includes(record.topic)).map((record) => record.id),
    reason: "Activity, ownership, entry mode, original instruments and amendments require current review; editorial review dates do not establish clearance.",
  }));
}

export function buildEvidenceReport(profile: BusinessProfile, retrieval: RetrievalResult, now: string): Recommendation {
  const missing = missingBusinessInformation(profile);
  const countries: CountryRecommendation[] = profile.target_countries.map((country_code) => {
    const selection = retrieval.countries.find((entry) => entry.country_code === country_code);
    const selectedIds = new Set(selection?.record_ids ?? []);
    const records = retrieval.records.filter((record) => selectedIds.has(record.id) && record.country_codes.includes(country_code));
    const regulation = records.filter((record) => record.topic === "regulation");
    const demand = records.filter((record) => record.topic === "market_demand");
    const competition = records.filter((record) => record.topic === "competition" && record.entity);
    const risk = records.filter((record) => record.topic === "operational_risk");
    const dated = records.filter((record) => record.review_due && record.review_due < now.slice(0, 10));
    const stale = (group: EvidenceRecord[]) => group.some((record) => dated.includes(record));
    const freshnessFlags = unique([
      "No sources were live-checked in this request; researched summaries are not legal audits.",
      ...(selection?.traces.flatMap((trace) => trace.conflict_flags.map((flag) => `${trace.record_id}: ${flag}`)) ?? []),
      ...dated.map((record) => `${record.id}: editorial refresh overdue since ${record.review_due}; this is not a law-expiration date.`),
      ...records.filter((record) => record.source_support === "excerpt_supported").slice(0, 8).map((record) => `${record.id}: indexed/excerpt-only source support; inspect the original source before a consequential decision.`),
    ]);
    const countryUnknowns = unique([
      ...records.filter((record) => record.topic === "research_gap" || record.topic === "operational_risk").flatMap((record) => record.unknowns),
      "City-level demand, licensing and delivery coverage have not been established; this report compares countries only.",
      "Product-specific paying demand, actual acquisition costs and current competitor terms need primary research.",
      "Conditional legal applicability remains unresolved; no final clearance is supplied.",
      ...(country_code === "MM" ? ["Current applicable-jurisdiction, counterparty, ownership and payment-route sanctions screening is required before commitment; the snapshot is neither screening nor a blanket embargo claim."] : []),
      ...missing,
    ]);
    const commercial = dimension([], "Commercial readiness is unassessed: reported traction does not establish profit, cash, runway, expansion budget or statutory paid-up capital.", ["Unit economics, retention, sales cycle, team capacity and available expansion resources."]);
    commercial.reasons.unshift(userFact(`Revenue status: ${profile.revenue.status}; metric: ${profile.revenue.metric}; currency: ${profile.revenue.currency ?? "unknown"}; period: ${profile.revenue.period}.`));
    const scaling = dimension([], "The scaling target is a user goal; capacity, channels, localization and timeframe feasibility require validation.", ["Channel access, localization effort, delivery capacity and agreed go/no-go thresholds."]);
    const growth = mechanicalGrowth(profile);
    if (growth) scaling.reasons.push(userFact(`User target arithmetic: ${growth.target} / ${growth.baseline} = ${growth.multiple} times, measured in ${growth.unit}. ${growth.note}`));
    return {
      country_code, status: "research_first", confidence: "low",
      recommendation: unknown("Evidence-only mode: investigate product-specific demand and legal applicability before choosing a pilot. This snapshot does not support a definitive market-entry recommendation."),
      evidence_coverage: {
        regulation: regulation.length ? (stale(regulation) ? "stale" : "starter") : "missing",
        demand: demand.length ? (stale(demand) ? "stale" : demand.every((record) => ["macro_context", "policy_priority", "public_investment_signal", "company_announced_investment"].includes(record.subtopic)) ? "macro_only" : "sector_signal") : "missing",
        competition: competition.length ? (stale(competition) ? "stale" : "examples_only") : "missing",
        freshness_flags: freshnessFlags,
      },
      dimensions: {
        demand_fit: dimension(demand, "Retrieved macro, policy and sector context does not establish product-market fit, a product TAM or willingness to pay.", ["Evidence from the exact buyer segment and customer job."]),
        regulatory_feasibility: dimension([...regulation, ...risk], "Legal applicability is conditional/unknown: source summaries do not establish activity-specific permission, licensing or sanctions clearance.", ["Activity classification, nationality/ownership, entry mode, current instruments and amendments."]),
        competitive_positioning: dimension(competition, "A retrieved offering is an example for investigation, not a competition census, proven differentiation, current pricing or market share.", ["Same-buyer/customer-job overlap and current alternatives, terms and availability."]),
        commercial_readiness: commercial,
        scaling_feasibility: scaling,
      },
      entry_mode_options: [unknown("Compare cross-border sales, a distributor or partner, and a local entity only after checking their activity-specific requirements and operating costs.")],
      competitors_and_channels: competition.slice(0, 4).map((record) => ({
        name: record.entity!.name, relationship: "unclear", customer_job_overlap: `Offering customer job: ${record.entity!.customer_job}. Relationship to the submitted product requires buyer/job validation.`,
        offering_evidence: [recordCitation(record)], differentiation_hypotheses: [], commercial_terms_verified: false,
      })),
      critical_unknowns: countryUnknowns,
      validation_plan: proposedValidationPlan(),
      record_ids_used: records.map((record) => record.id),
    };
  });
  return {
    schema_version: "1.0.0", dataset_version: retrieval.dataset_version, generated_at: now, mode: "evidence_only",
    summary: unknown("Evidence-only comparison of the selected countries. Source evidence and research gaps are provided, with no AI-generated recommendation or national-attractiveness ranking. Relevant, comparable product evidence is insufficient for a supported testing priority."),
    comparison_order: [], ordering_status: "not_ranked_insufficient_evidence", countries,
    cross_country_tradeoffs: [unknown("Different amounts of available evidence do not establish relative market attractiveness; compare the same buyer problem, period and activity scope before prioritizing countries.")],
    missing_business_information: missing, disclaimer: RESEARCH_DISCLAIMER,
  };
}

/** Trusted conservative template for the optional model's evidence extraction pass. */
export function buildModelReportTemplate(profile: BusinessProfile, retrieval: RetrievalResult, now: string): Recommendation {
  const report = buildEvidenceReport(profile, retrieval, now);
  report.mode = "rag_model";
  report.summary = unknown("Model-assisted evidence extraction for the selected countries, checked against the supplied source summaries. The starter snapshot does not establish product-specific demand or a supported testing priority; all assessments remain low-confidence research questions.");
  for (const country of report.countries) {
    country.recommendation = unknown("Model-assisted evidence review: investigate product-specific demand and legal applicability before choosing a pilot. Extracted source evidence does not establish market-entry feasibility or permission to operate.");
  }
  return report;
}
