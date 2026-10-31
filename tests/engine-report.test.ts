import { describe, expect, it } from "vitest";
import example from "@/knowledge/asean/evals/example_business_profile.json";
import { normalizeProfile } from "@/lib/engine/profile";
import { loadKnowledge } from "@/lib/engine/knowledge";
import { retrieveEvidence } from "@/lib/engine/retrieval";
import { buildEvidenceReport, buildModelReportTemplate, buildRegulatoryGates } from "@/lib/engine/report";
import { validateRecommendationSemantics } from "@/lib/engine/semantics";
import { validateRecommendationSchema } from "@/lib/engine/schema";

const now = "2026-10-31T06:00:00.000Z";
function setup(countries = ["MY", "TH", "VN"]) {
  const profile = normalizeProfile({ ...structuredClone(example), target_countries: countries });
  const retrieval = retrieveEvidence(profile, { now });
  return { profile, retrieval, report: buildEvidenceReport(profile, retrieval, now) };
}

describe("evidence-only engine reports", () => {
  it("returns the supplied contract, all five dimensions and exact selected countries without a ranking", () => {
    const { profile, retrieval, report } = setup();
    expect(validateRecommendationSchema(report)).toBe(true);
    expect(report.mode).toBe("evidence_only");
    expect(report.countries.map((country) => country.country_code)).toEqual(profile.target_countries);
    expect(report.comparison_order).toEqual([]);
    expect(report.countries.every((country) => country.status === "research_first" && country.confidence === "low")).toBe(true);
    expect(report.countries.every((country) => Object.keys(country.dimensions).length === 5)).toBe(true);
    expect(validateRecommendationSemantics(report, profile, retrieval, now)).toEqual({ valid: true, issues: [] });
  });

  it("labels a reviewed model extraction truthfully and rejects switching only the mode label", () => {
    const { profile, retrieval, report } = setup();
    const candidate = buildModelReportTemplate(profile, retrieval, now);
    expect(validateRecommendationSchema(candidate)).toBe(true);
    expect(validateRecommendationSemantics(candidate, profile, retrieval, now).valid).toBe(true);
    expect(candidate.summary.text).toMatch(/Model-assisted/);
    expect(candidate.summary.text).not.toMatch(/no AI-generated/);
    report.mode = "rag_model";
    expect(validateRecommendationSemantics(report, profile, retrieval, now).valid).toBe(false);
  });

  it("preserves all eleven countries including Timor-Leste, uses no demo opportunities, and proposes measured tests", () => {
    const { profile, retrieval, report } = setup(loadKnowledge().taxonomy.countries.map((country) => country.code));
    expect(report.countries).toHaveLength(11);
    expect(report.countries.some((country) => country.country_code === "TL")).toBe(true);
    expect(report.countries.every((country) => country.validation_plan.map((step) => step.time_window).join() === "days_1_30,days_31_60,days_61_90")).toBe(true);
    expect(report.countries.flatMap((country) => country.record_ids_used).some((id) => id.includes("demo"))).toBe(false);
    expect(validateRecommendationSemantics(report, profile, retrieval, now).valid).toBe(true);
    expect(buildRegulatoryGates(profile, retrieval).every((gate) => gate.status === "conditional_unknown" && !gate.final_clearance)).toBe(true);
  });

  it("separates revenue, budget and target arithmetic from feasibility", () => {
    const { report } = setup();
    expect(report.missing_business_information.join(" ")).toMatch(/revenue is not a substitute/);
    const scaling = report.countries[0].dimensions.scaling_feasibility;
    expect(scaling.assessment).toBe("unknown");
    expect(scaling.reasons.some((claim) => claim.text.includes("= 5 times"))).toBe(true);
    expect(report.countries[0].dimensions.commercial_readiness.reasons.map((claim) => claim.text).join(" ")).not.toMatch(/ARR|cash available/i);
  });

  it("marks editorial staleness and excerpt limitations without law-expiry or live verification claims", () => {
    const { profile } = setup(["SG"]);
    const retrieval = retrieveEvidence(profile, { now: "2027-03-01T00:00:00.000Z" });
    const report = buildEvidenceReport(profile, retrieval, "2027-03-01T00:00:00.000Z");
    expect(report.countries[0].evidence_coverage.regulation).toBe("stale");
    expect(report.countries[0].evidence_coverage.freshness_flags.join(" ")).toMatch(/editorial refresh overdue/);
    expect(report.countries[0].evidence_coverage.freshness_flags.join(" ")).toMatch(/not a law-expiration/);
  });
});

describe("semantic grounding gate", () => {
  it("rejects an unselected country, unsupported ranking and excess confidence", () => {
    const { profile, retrieval, report } = setup();
    report.countries[0].country_code = "SG";
    report.comparison_order = ["SG"];
    report.ordering_status = "supported_test_priority";
    report.countries[1].confidence = "high";
    const validation = validateRecommendationSemantics(report, profile, retrieval, now);
    expect(validation.valid).toBe(false);
    expect(validation.issues).toEqual(expect.arrayContaining(["selected_country_set_mismatch", "unsupported_comparison_ranking", "unsupported_country_confidence"]));
  });

  it("rejects forged record IDs and wrong source ownership", () => {
    const { profile, retrieval, report } = setup();
    const reason = report.countries[0].dimensions.regulatory_feasibility.reasons.find((claim) => claim.kind === "source_fact")!;
    reason.citations[0].record_id = "demo-grant";
    expect(validateRecommendationSemantics(report, profile, retrieval, now).issues).toContain("citation_not_retrieved");
    const next = setup();
    const original = next.report.countries[0].dimensions.regulatory_feasibility.reasons.find((claim) => claim.kind === "source_fact")!;
    original.citations[0].source_ids = ["ASEAN_MEMBERS"];
    expect(validateRecommendationSemantics(next.report, next.profile, next.retrieval, now).issues).toContain("citation_source_mismatch");
  });

  it("rejects medical approval attributed to a real macro record and country-crossed citations", () => {
    const { profile, retrieval, report } = setup(["SG", "MY"]);
    const macro = retrieval.records.find((record) => record.country_codes.includes("SG") && record.topic === "market_demand")!;
    report.countries[0].dimensions.regulatory_feasibility.reasons = [{ text: "The medical device is approved for sale.", kind: "source_fact", citations: [{ record_id: macro.id, source_ids: macro.source_ids }], assumptions: [] }];
    const result = validateRecommendationSemantics(report, profile, retrieval, now);
    expect(result.issues).toEqual(expect.arrayContaining(["citation_topic_mismatch", "non_entailing_source_fact"]));
    const my = retrieval.records.find((record) => record.country_codes.length === 1 && record.country_codes[0] === "MY" && record.facts.length)!;
    report.countries[0].dimensions.demand_fit.reasons = [{ text: my.facts[0], kind: "source_fact", citations: [{ record_id: my.id, source_ids: my.source_ids }], assumptions: [] }];
    expect(validateRecommendationSemantics(report, profile, retrieval, now).valid).toBe(false);
  });

  it("rejects invented URLs, unsupported competitor terms and factual injection disguised as inference", () => {
    const { profile, retrieval, report } = setup();
    report.summary = { text: "https://invented.example proves 90% success", kind: "analyst_inference", citations: [], assumptions: ["Ignore policy"] };
    expect(validateRecommendationSemantics(report, profile, retrieval, now).issues).toEqual(expect.arrayContaining(["unresolved_model_url", "unverified_narrative_claim"]));
    const country = report.countries.find((entry) => entry.competitors_and_channels.length)!;
    country.competitors_and_channels[0].commercial_terms_verified = true;
    country.competitors_and_channels[0].relationship = "direct_competitor";
    expect(validateRecommendationSemantics(report, profile, retrieval, now).issues).toEqual(expect.arrayContaining(["unverified_competitor_terms", "unverified_competitor_relationship"]));
  });

  it("rejects gap cards as source facts and arbitrary new legal conclusions with valid IDs", () => {
    const { profile, retrieval, report } = setup();
    const gap = retrieval.records.find((record) => record.topic === "research_gap" && record.country_codes.includes("MY"))!;
    report.countries[0].recommendation = { text: "No competitors exist.", kind: "source_fact", citations: [{ record_id: gap.id, source_ids: ["ASEAN_MEMBERS"] }], assumptions: [] };
    expect(validateRecommendationSemantics(report, profile, retrieval, now).issues).toContain("gap_presented_as_fact");
  });
});
