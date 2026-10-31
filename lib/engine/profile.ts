import Ajv2020 from "ajv/dist/2020";
import profileSchema from "@/knowledge/asean/schemas/business_profile.schema.json";
import taxonomy from "@/knowledge/asean/data/taxonomy.json";

export interface BusinessProfile {
  industry: { sector: string; subsector: string; description: string };
  target_countries: string[];
  product: {
    description: string;
    buyer_type: "B2B" | "B2C" | "B2G" | "mixed" | "unknown";
    customer_segment: string;
    business_model: string;
    price_description: string;
    regulated_features: string[];
    current_base_country: string | null;
    entry_mode_preference: "cross_border_sales" | "distributor_partner" | "local_entity" | "franchise" | "undecided";
  };
  revenue: {
    status: "pre_revenue" | "revenue_generating" | "not_disclosed";
    amount: number | null;
    range_min: number | null;
    range_max: number | null;
    currency: string | null;
    period: "monthly" | "annual" | "trailing_12_months" | "other" | "not_disclosed";
    metric: "recognized_revenue" | "gross_sales" | "gmv" | "arr" | "mrr" | "other" | "not_disclosed";
    period_end: string | null;
    notes: string;
  };
  scalability_targets: {
    description: string;
    metric: "revenue" | "customers" | "users" | "stores" | "transactions" | "production_capacity" | "countries" | "other" | "not_specified";
    target_value: number | null;
    unit: string | null;
    baseline_value: number | null;
    horizon_months: number | null;
    target_date: string | null;
    expansion_budget: { amount: number | null; currency: string | null };
    constraints: string[];
  };
}

export interface ProfileIssue { path: string; message: string }
export class ProfileValidationError extends Error {
  readonly issues: ProfileIssue[];
  constructor(issues: ProfileIssue[]) {
    super("The five-answer business profile is invalid.");
    this.name = "ProfileValidationError";
    this.issues = issues.slice(0, 20);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: false, strictNumbers: true });
const validate = ajv.compile<BusinessProfile>(profileSchema);
const countryAliases = new Map<string, string>();
for (const country of taxonomy.countries) {
  for (const alias of [country.code, country.name, ...country.aliases]) {
    countryAliases.set(alias.trim().toLocaleLowerCase("en"), country.code);
  }
}
const currencies = new Set(Intl.supportedValuesOf("currency"));
const groups = ["industry", "target_countries", "product", "revenue", "scalability_targets"];

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function normalizeCountry(value: unknown): unknown {
  return typeof value === "string" ? countryAliases.get(value.trim().toLocaleLowerCase("en")) ?? value.trim() : value;
}
function currency(value: unknown): unknown {
  return typeof value === "string" ? value.trim().toUpperCase() : value;
}
function dateIsValid(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

/** Fill optional nested fields only. The five business answers remain mandatory. */
export function normalizeProfile(input: unknown): BusinessProfile {
  if (!object(input)) throw new ProfileValidationError([{ path: "/", message: "Expected an object with exactly five answer groups." }]);
  const topIssues: ProfileIssue[] = [];
  for (const key of groups) if (!(key in input)) topIssues.push({ path: `/${key}`, message: "This answer group is required." });
  for (const key of Object.keys(input)) if (!groups.includes(key)) topIssues.push({ path: "/", message: "Only the five documented answer groups are accepted." });
  for (const key of groups.filter((key) => key !== "target_countries")) {
    if (key in input && !object(input[key])) topIssues.push({ path: `/${key}`, message: "Expected an answer object." });
  }
  if (topIssues.length) throw new ProfileValidationError(topIssues);
  const industry = input.industry as Record<string, unknown>;
  const product = input.product as Record<string, unknown>;
  const revenue = input.revenue as Record<string, unknown>;
  const scaling = input.scalability_targets as Record<string, unknown>;
  const normalized = {
    ...input,
    industry: { subsector: "", description: "", ...industry },
    target_countries: Array.isArray(input.target_countries) ? input.target_countries.map(normalizeCountry) : input.target_countries,
    product: {
      buyer_type: "unknown", customer_segment: "", business_model: "", price_description: "", regulated_features: [],
      current_base_country: null, entry_mode_preference: "undecided", ...product,
    },
    revenue: {
      amount: null, range_min: null, range_max: null, currency: null, period: "not_disclosed", metric: "not_disclosed", period_end: null, notes: "", ...revenue,
      ...(typeof revenue.currency === "string" ? { currency: currency(revenue.currency) } : {}),
    },
    scalability_targets: {
      metric: "not_specified", target_value: null, unit: null, baseline_value: null, horizon_months: null, target_date: null,
      constraints: [], ...scaling,
      expansion_budget: object(scaling.expansion_budget)
        ? { amount: null, currency: null, ...scaling.expansion_budget }
        : "expansion_budget" in scaling ? scaling.expansion_budget : { amount: null, currency: null },
    },
  };
  // No runtime coercion: strings pretending to be amounts and nonfinite numbers are rejected.
  if (!validate(normalized)) {
    throw new ProfileValidationError((validate.errors ?? []).map((error) => ({ path: error.instancePath || "/", message: error.message ?? "Invalid value." })));
  }
  const result = normalized as BusinessProfile;
  const issues: ProfileIssue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });
  const r = result.revenue;
  const s = result.scalability_targets;
  if (result.product.description.trim().length < 10) add("/product/description", "Describe the product in at least 10 non-padding characters.");
  if (!s.description.trim()) add("/scalability_targets/description", "Describe the scaling target.");
  // Fields without a length bound in the supplied schema still need an HTTP-facing bound.
  if (result.product.current_base_country !== null) {
    if (!result.product.current_base_country.trim() || result.product.current_base_country.length > 100) add("/product/current_base_country", "Use a country name/code of at most 100 characters, or null.");
    else result.product.current_base_country = normalizeCountry(result.product.current_base_country) as string;
  }
  if (s.unit !== null && (!s.unit.trim() || s.unit.length > 100)) add("/scalability_targets/unit", "Use a nonempty unit of at most 100 characters, or null.");
  for (const [path, value] of [["/revenue/period_end", r.period_end], ["/scalability_targets/target_date", s.target_date]] as const) {
    if (value !== null && !dateIsValid(value)) add(path, "Use a valid calendar date in YYYY-MM-DD format, or null.");
  }
  if (r.currency !== null && !currencies.has(r.currency)) add("/revenue/currency", "Use a supported ISO 4217 currency code.");
  const hasAmount = r.amount !== null;
  const hasRange = r.range_min !== null || r.range_max !== null;
  if (hasRange && (r.range_min === null || r.range_max === null)) add("/revenue", "A revenue range requires both bounds.");
  if (hasAmount && hasRange) add("/revenue", "Provide either an amount or a range, not both.");
  if (r.range_min !== null && r.range_max !== null && r.range_min > r.range_max) add("/revenue", "Range minimum must not exceed its maximum.");
  if (r.status === "pre_revenue" && [r.amount, r.range_min, r.range_max].some((amount) => amount !== null && amount !== 0)) add("/revenue", "Pre-revenue cannot include a positive revenue amount.");
  if (r.status === "not_disclosed" && (hasAmount || hasRange)) add("/revenue", "Use null amounts when revenue is not disclosed.");
  if (r.status === "revenue_generating" && (r.period === "other" || r.metric === "other") && !r.notes.trim()) add("/revenue/notes", "Describe the reporting period or metric when choosing other.");
  if (r.metric === "arr" && r.period !== "annual" && r.period !== "trailing_12_months") add("/revenue/period", "ARR requires an explicit annual reporting basis.");
  if (r.metric === "mrr" && r.period !== "monthly") add("/revenue/period", "MRR requires an explicit monthly reporting basis.");
  const budget = s.expansion_budget;
  if (budget.currency !== null) {
    budget.currency = currency(budget.currency) as string;
    if (!currencies.has(budget.currency)) add("/scalability_targets/expansion_budget/currency", "Use a supported ISO 4217 currency code.");
  }
  if (budget.amount !== null && budget.currency === null) add("/scalability_targets/expansion_budget/currency", "An explicit currency is required for a budget amount.");
  if (issues.length) throw new ProfileValidationError(issues);
  return result;
}

export interface GrowthCalculation {
  kind: "mechanical_calculation";
  baseline: number;
  target: number;
  multiple: number;
  unit: string;
  metric: string;
  horizon_months: number | null;
  note: string;
}

/** Both values are from the same structured, non-monetary target; no FX or ARR inference. */
export function mechanicalGrowth(profile: BusinessProfile): GrowthCalculation | null {
  const s = profile.scalability_targets;
  if (s.metric === "revenue" || s.metric === "not_specified" || s.metric === "other" || !s.unit?.trim() || s.baseline_value === null || s.baseline_value <= 0 || s.target_value === null) return null;
  const multiple = s.target_value / s.baseline_value;
  if (!Number.isFinite(multiple)) return null;
  return {
    kind: "mechanical_calculation", baseline: s.baseline_value, target: s.target_value, multiple,
    unit: s.unit, metric: s.metric, horizon_months: s.horizon_months,
    note: "Arithmetic from the user's compatible target and baseline only; this is not a forecast or evidence of feasibility.",
  };
}
