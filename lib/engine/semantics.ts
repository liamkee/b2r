import type { BusinessProfile } from "./profile";
import type { EvidenceRecord } from "./knowledge";
import type { RetrievalResult } from "./retrieval";
import { buildEvidenceReport, buildModelReportTemplate } from "./report";
import { validateRecommendationSchema, type Claim, type Citation, type CountryRecommendation, type Recommendation } from "./schema";

export interface SemanticValidation { valid: boolean; issues: string[] }
const normalized = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim();
const equal = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
const sameSet = (left: string[], right: string[]) => left.length === right.length && new Set(left).size === left.length && left.every((value) => right.includes(value));

function countryClaims(country: CountryRecommendation): { claim: Claim; topic?: string[] }[] {
  return [
    { claim: country.recommendation },
    ...country.entry_mode_options.map((claim) => ({ claim })),
    ...country.dimensions.demand_fit.reasons.map((claim) => ({ claim, topic: ["market_demand"] })),
    ...country.dimensions.regulatory_feasibility.reasons.map((claim) => ({ claim, topic: ["regulation", "operational_risk"] })),
    ...country.dimensions.competitive_positioning.reasons.map((claim) => ({ claim, topic: ["competition"] })),
    ...country.dimensions.commercial_readiness.reasons.map((claim) => ({ claim })),
    ...country.dimensions.scaling_feasibility.reasons.map((claim) => ({ claim })),
    ...country.competitors_and_channels.flatMap((entity) => entity.differentiation_hypotheses.map((claim) => ({ claim, topic: ["competition"] }))),
    ...country.validation_plan.flatMap((step) => step.evidence_or_assumptions.map((claim) => ({ claim }))),
  ];
}

/**
 * Conservative entailment gate for the starter corpus. A factual summary must be an
 * exact, whitespace-normalized extraction from a cited fact, not merely cite a real ID.
 * Novel narrative inferences cannot be mechanically verified and are rejected until a
 * reviewed entailment adapter/rubric is available. The caller must fall back to the
 * useful evidence report rather than claim this lexical test verifies arbitrary prose.
 */
export function validateRecommendationSemantics(value: unknown, profile: BusinessProfile, retrieval: RetrievalResult, now?: string): SemanticValidation {
  if (!validateRecommendationSchema(value)) return { valid: false, issues: ["recommendation_schema_mismatch"] };
  const report: Recommendation = value;
  const issues: string[] = [];
  const fail = (issue: string) => { if (!issues.includes(issue) && issues.length < 30) issues.push(issue); };
  const baseline = report.mode === "rag_model"
    ? buildModelReportTemplate(profile, retrieval, now ?? report.generated_at)
    : buildEvidenceReport(profile, retrieval, now ?? report.generated_at);
  const records = new Map(retrieval.records.map((record) => [record.id, record]));
  const sources = new Set(retrieval.sources.map((source) => source.source_id));
  if (report.dataset_version !== retrieval.dataset_version) fail("dataset_version_mismatch");
  if (now && report.generated_at !== now) fail("generation_date_mismatch");
  if (!Number.isFinite(Date.parse(report.generated_at))) fail("invalid_generation_date");
  if (!sameSet(report.countries.map((country) => country.country_code), profile.target_countries)) fail("selected_country_set_mismatch");
  // Starter data contains no validated product-specific, comparable demand rubric.
  if (report.comparison_order.length || report.ordering_status === "supported_test_priority") fail("unsupported_comparison_ranking");
  if (report.disclaimer !== baseline.disclaimer) fail("required_disclaimer_changed");
  if (!sameSet(report.missing_business_information, baseline.missing_business_information)) fail("missing_business_information_changed");

  function validateCitations(citations: Citation[], country?: string, topic?: string[]): EvidenceRecord[] {
    const linked: EvidenceRecord[] = [];
    const selection = country ? retrieval.countries.find((entry) => entry.country_code === country) : undefined;
    for (const citation of citations) {
      const record = records.get(citation.record_id);
      if (!record || (country && !selection?.record_ids.includes(citation.record_id))) { fail("citation_not_retrieved"); continue; }
      if (country && !record.country_codes.includes(country)) fail("citation_country_scope_mismatch");
      if (topic && !topic.includes(record.topic)) fail("citation_topic_mismatch");
      if (!citation.source_ids.length || new Set(citation.source_ids).size !== citation.source_ids.length || citation.source_ids.some((id) => !sources.has(id) || !record.source_ids.includes(id))) fail("citation_source_mismatch");
      linked.push(record);
    }
    return linked;
  }

  function validateClaim(claim: Claim, allowed: Claim[], country?: string, topic?: string[]) {
    const linked = validateCitations(claim.citations, country, topic);
    if (/https?:\/\/|javascript:|data:text\/html/i.test(claim.text)) fail("unresolved_model_url");
    if (claim.kind === "source_fact") {
      if (!claim.citations.length) fail("source_fact_missing_citation");
      if (!linked.length || linked.some((record) => record.record_type !== "evidence" || record.topic === "research_gap" || !record.source_ids.length)) fail("gap_presented_as_fact");
      // Each record cited for a source fact must actually support that exact statement.
      if (!linked.length || linked.some((record) => !record.facts.some((fact) => normalized(fact) === normalized(claim.text)))) fail("non_entailing_source_fact");
      if (claim.assumptions.length) fail("source_fact_contains_assumptions");
      return;
    }
    const canonical = allowed.find((candidate) => equal(candidate, claim));
    const explicitInference = claim.kind === "analyst_inference" && linked.length > 0 && claim.assumptions.length > 0 && linked.every((record) => record.analyst_inference && normalized(record.analyst_inference) === normalized(claim.text));
    const explicitGap = claim.kind === "unknown" && claim.citations.length === 0 && retrieval.records.some((record) => (!country || record.country_codes.includes(country)) && record.unknowns.some((gap) => normalized(gap) === normalized(claim.text)));
    if (!canonical && !explicitInference && !explicitGap) fail("unverified_narrative_claim");
  }
  validateClaim(report.summary, [baseline.summary]);
  for (const claim of report.cross_country_tradeoffs) validateClaim(claim, baseline.cross_country_tradeoffs);
  for (const country of report.countries) {
    const expected = baseline.countries.find((entry) => entry.country_code === country.country_code);
    if (!expected) continue;
    if (country.confidence !== "low") fail("unsupported_country_confidence");
    if (country.status !== "research_first") fail("unsupported_country_recommendation");
    if (!equal(country.evidence_coverage, expected.evidence_coverage)) fail("coverage_or_freshness_changed");
    if (!sameSet(country.record_ids_used, expected.record_ids_used)) fail("record_usage_set_mismatch");
    if (!equal(country.critical_unknowns, expected.critical_unknowns)) fail("critical_unknowns_changed");
    if (!equal(country.validation_plan, expected.validation_plan)) fail("unreviewed_validation_plan");
    const allowed = countryClaims(expected).map((entry) => entry.claim);
    for (const { claim, topic } of countryClaims(country)) validateClaim(claim, allowed, country.country_code, topic);
    for (const key of Object.keys(country.dimensions) as (keyof CountryRecommendation["dimensions"])[]) {
      const dimension = country.dimensions[key];
      if (dimension.assessment !== "unknown" || dimension.confidence !== "low") fail("unsupported_dimension_assessment");
      if (!equal(dimension.unresolved_inputs, expected.dimensions[key].unresolved_inputs)) fail("unresolved_inputs_changed");
    }
    for (const entity of country.competitors_and_channels) {
      const offering = validateCitations(entity.offering_evidence, country.country_code, ["competition"]);
      if (!offering.length || offering.some((record) => record.entity?.name !== entity.name)) fail("competitor_entity_mismatch");
      const original = expected.competitors_and_channels.find((candidate) => candidate.name === entity.name);
      if (!original || entity.relationship !== "unclear" || entity.customer_job_overlap !== original.customer_job_overlap) fail("unverified_competitor_relationship");
      if (entity.commercial_terms_verified) fail("unverified_competitor_terms");
      if (entity.differentiation_hypotheses.length) fail("unreviewed_differentiation_hypothesis");
    }
  }
  return { valid: issues.length === 0, issues };
}
