import { describe, expect, it } from "vitest";
import example from "@/knowledge/asean/evals/example_business_profile.json";
import { mechanicalGrowth, normalizeProfile, ProfileValidationError } from "@/lib/engine/profile";
import { recommendationSchema, validateRecommendationSchema } from "@/lib/engine/schema";

function profile() { return structuredClone(example); }

describe("five-answer profile validation", () => {
  it("accepts the supplied complete example without changing financial facts", () => {
    const result = normalizeProfile(profile());
    expect(result.target_countries).toEqual(["MY", "TH", "VN"]);
    expect(result.revenue.amount).toBe(50000);
    expect(result.revenue.metric).toBe("recognized_revenue");
    expect(result.scalability_targets.expansion_budget.amount).toBeNull();
  });
  it("fills optional nested defaults without inventing nationality, finances or a sixth question", () => {
    const result = normalizeProfile({ industry: { sector: "other" }, target_countries: ["East Timor"], product: { description: "Cryogenic satellite propulsion" }, revenue: { status: "not_disclosed" }, scalability_targets: { description: "Investigate a market" } });
    expect(Object.keys(result)).toHaveLength(5);
    expect(result.target_countries).toEqual(["TL"]);
    expect(result.product.current_base_country).toBeNull();
    expect(result.revenue.amount).toBeNull();
    expect(result.scalability_targets.horizon_months).toBeNull();
  });
  it("normalizes country aliases and rejects duplicate selections after normalization", () => {
    const input = profile();
    input.target_countries = ["Laos", "Vietnam", "East Timor"];
    expect(normalizeProfile(input).target_countries).toEqual(["LA", "VN", "TL"]);
    input.target_countries = ["MY", "Malaysia"];
    expect(() => normalizeProfile(input)).toThrow(ProfileValidationError);
  });
  it("accepts all 11 selected countries without dropping one", () => {
    const input = profile();
    input.target_countries = ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "TL", "VN"];
    expect(normalizeProfile(input).target_countries).toHaveLength(11);
  });
  it("accepts explicit zero pre-revenue and nondisclosure", () => {
    const input = profile();
    input.revenue.status = "pre_revenue";
    input.revenue.amount = 0;
    expect(normalizeProfile(input).revenue.amount).toBe(0);
    input.revenue = { ...input.revenue, status: "not_disclosed", amount: null as unknown as number, currency: null as unknown as string, period: "not_disclosed", metric: "not_disclosed" };
    expect(normalizeProfile(input).revenue.currency).toBeNull();
  });
  it.each(["currency", "period", "metric"])("requires explicit %s for generating revenue", (field) => {
    const input = profile();
    Reflect.deleteProperty(input.revenue, field);
    expect(() => normalizeProfile(input)).toThrow(ProfileValidationError);
  });
  it("accepts a coherent range and rejects inverted, partial or ambiguous ranges", () => {
    const input = profile();
    input.revenue = { ...input.revenue, amount: null as unknown as number, range_min: 100 as unknown as null, range_max: 200 as unknown as null };
    expect(normalizeProfile(input).revenue.range_min).toBe(100);
    input.revenue.range_max = 50 as unknown as null;
    expect(() => normalizeProfile(input)).toThrow();
    input.revenue.range_max = null;
    expect(() => normalizeProfile(input)).toThrow();
    input.revenue.range_max = 200 as unknown as null;
    input.revenue.amount = 150;
    expect(() => normalizeProfile(input)).toThrow();
  });
  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, "50000"])("rejects invalid numeric amount %s", (amount) => {
    const input = profile();
    input.revenue.amount = amount as number;
    expect(() => normalizeProfile(input)).toThrow(ProfileValidationError);
  });
  it("preserves GMV and never treats revenue as cash or expansion budget", () => {
    const input = profile();
    input.revenue.metric = "gmv";
    const output = normalizeProfile(input);
    expect(output.revenue.metric).toBe("gmv");
    expect(output.scalability_targets.expansion_budget.amount).toBeNull();
    expect(output.revenue.amount).toBe(50000);
  });
  it("rejects incompatible ARR/MRR periods", () => {
    const input = profile();
    input.revenue.metric = "arr";
    expect(() => normalizeProfile(input)).toThrow();
    input.revenue.metric = "mrr";
    expect(normalizeProfile(input).revenue.metric).toBe("mrr");
    input.revenue.period = "annual";
    expect(() => normalizeProfile(input)).toThrow();
  });
  it("validates ISO currency and budget currency independently", () => {
    const input = profile();
    input.revenue.currency = "myr";
    expect(normalizeProfile(input).revenue.currency).toBe("MYR");
    input.revenue.currency = "ZZZ";
    expect(() => normalizeProfile(input)).toThrow();
    input.revenue.currency = "MYR";
    input.scalability_targets.expansion_budget.amount = 10 as unknown as null;
    expect(() => normalizeProfile(input)).toThrow();
  });
  it("rejects a sixth answer group and unsupported nested fields", () => {
    expect(() => normalizeProfile({ ...profile(), nationality: "MY" })).toThrow();
    const input = profile();
    Object.assign(input.product, { apiKey: "untrusted-value" });
    expect(() => normalizeProfile(input)).toThrow();
  });
  it("bounds schema-unbounded fields and validates calendar dates", () => {
    const input = profile();
    input.product.current_base_country = "x".repeat(101);
    expect(() => normalizeProfile(input)).toThrow();
    input.product.current_base_country = "MY";
    input.revenue.period_end = "2026-02-31";
    expect(() => normalizeProfile(input)).toThrow();
  });
  it("returns safe validation metadata without confidential business text", () => {
    const input = profile();
    input.product.description = "PRIVATE";
    try { normalizeProfile(input); expect.unreachable(); }
    catch (error) {
      expect(error).toBeInstanceOf(ProfileValidationError);
      expect(JSON.stringify((error as ProfileValidationError).issues)).not.toContain("PRIVATE");
    }
  });
  it("does not mutate the submitted object while normalizing", () => {
    const input = profile();
    input.scalability_targets.expansion_budget.currency = "myr" as unknown as null;
    const before = structuredClone(input);
    normalizeProfile(input);
    expect(input).toEqual(before);
  });
});

describe("mechanical growth", () => {
  it("computes fivefold growth from 20 to 100 in the same unit and labels its limits", () => {
    const output = mechanicalGrowth(normalizeProfile(profile()));
    expect(output?.multiple).toBe(5);
    expect(output?.kind).toBe("mechanical_calculation");
    expect(output?.note).toContain("not a forecast");
  });
  it("withholds calculations without a positive baseline or compatible unit", () => {
    const input = normalizeProfile(profile());
    input.scalability_targets.baseline_value = 0;
    expect(mechanicalGrowth(input)).toBeNull();
    input.scalability_targets.baseline_value = 20;
    input.scalability_targets.unit = null;
    expect(mechanicalGrowth(input)).toBeNull();
  });
  it("does not combine revenue, periods or currencies absent from the target contract", () => {
    const input = normalizeProfile(profile());
    input.scalability_targets.metric = "revenue";
    expect(mechanicalGrowth(input)).toBeNull();
    expect(input.revenue.amount).toBe(50000);
  });
});

describe("recommendation shape", () => {
  it("uses the supplied recommendation schema and rejects malformed provider output", () => {
    expect(recommendationSchema.$id).toBe("urn:asean-one:recommendation:v1");
    expect(validateRecommendationSchema({ mode: "rag_model", countries: [] })).toBe(false);
  });
});
