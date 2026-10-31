import raw from "@/data/opportunities.json";

/**
 * Opportunity catalogue loader.
 *
 * `data/opportunities.json` holds illustrative entries compiled for the demo.
 * Each record names the real programme it models and links to that programme's
 * public page, but the wording is our own summary — always show the
 * "verify with official sources" note alongside them.
 *
 * `type` drives the category filter chips on the home explorer and the badges
 * on cards.
 */

/** Category union — must stay in sync with the `type` values in the dataset. */
export type OpportunityType =
  | "investor"
  | "accelerator"
  | "partner"
  | "market"
  | "funding"
  | "talent";

export interface Opportunity {
  id: string;
  name: string;
  type: OpportunityType;
  /** ISO-2 country code. */
  country: string;
  city: string;
  blurb: string;
  whyItFits: string;
  amount: string;
  stage: string;
  /** True when we have checked the source link resolves to the named body. */
  verified: boolean;
  sourceUrl: string;
  sourceName: string;
}

/** All opportunities, validated once at module load. */
export const OPPORTUNITIES: readonly Opportunity[] = raw as Opportunity[];

/** Display metadata for each category, used by chips and badges. */
export interface CategoryMeta {
  id: OpportunityType;
  label: string;
  /** Short label for tight spaces (card badges). */
  short: string;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { id: "accelerator", label: "Accelerators", short: "Accelerator" },
  { id: "investor", label: "Investors", short: "Investor" },
  { id: "partner", label: "Partners", short: "Partner" },
  { id: "market", label: "Market entry", short: "Market entry" },
  { id: "funding", label: "Funding", short: "Funding" },
  { id: "talent", label: "Talent", short: "Talent" },
] as const;

const CATEGORY_BY_ID = new Map<OpportunityType, CategoryMeta>(
  CATEGORIES.map((c) => [c.id, c]),
);

export function categoryLabel(type: OpportunityType): string {
  return CATEGORY_BY_ID.get(type)?.short ?? type;
}

/** Opportunities for one country code, optionally filtered by category. */
export function opportunitiesFor(
  code: string,
  type?: OpportunityType | "all",
): Opportunity[] {
  const upper = code.toUpperCase();
  return OPPORTUNITIES.filter(
    (o) =>
      o.country === upper && (type === undefined || type === "all" || o.type === type),
  );
}

/** Every opportunity, optionally filtered by category (ASEAN-wide). */
export function allOpportunities(type?: OpportunityType | "all"): Opportunity[] {
  return OPPORTUNITIES.filter(
    (o) => type === undefined || type === "all" || o.type === type,
  );
}

/** Count per category for one country — powers the explorer panel chips. */
export function categoryCounts(code: string): Record<OpportunityType, number> {
  const counts = {
    investor: 0,
    accelerator: 0,
    partner: 0,
    market: 0,
    funding: 0,
    talent: 0,
  } satisfies Record<OpportunityType, number>;
  for (const o of OPPORTUNITIES) {
    if (o.country === code.toUpperCase()) counts[o.type] += 1;
  }
  return counts;
}

/** ASEAN-wide count per category. */
export function globalCategoryCounts(): Record<OpportunityType, number> {
  const counts = {
    investor: 0,
    accelerator: 0,
    partner: 0,
    market: 0,
    funding: 0,
    talent: 0,
  } satisfies Record<OpportunityType, number>;
  for (const o of OPPORTUNITIES) counts[o.type] += 1;
  return counts;
}

/** Total number of opportunities. */
export function totalOpportunities(): number {
  return OPPORTUNITIES.length;
}

/** Distinct country count covered by the catalogue. */
export function coveredCountries(): number {
  return new Set(OPPORTUNITIES.map((o) => o.country)).size;
}

/**
 * Featured opportunities for the home rail: verified first, spread across
 * countries so the row does not read as one market.
 */
export function featuredOpportunities(limit = 6): Opportunity[] {
  const byCountry = new Map<string, Opportunity[]>();
  for (const o of OPPORTUNITIES) {
    if (!o.verified) continue;
    const list = byCountry.get(o.country) ?? [];
    list.push(o);
    byCountry.set(o.country, list);
  }
  const picks: Opportunity[] = [];
  // Round-robin across countries for variety, then top up if short.
  const groups = [...byCountry.values()];
  let i = 0;
  while (picks.length < limit && groups.some((g) => g.length > 0)) {
    const group = groups[i % groups.length];
    const next = group.shift();
    if (next) picks.push(next);
    i += 1;
  }
  return picks.slice(0, limit);
}

/** Looks up one opportunity by id. */
export function getOpportunity(id: string): Opportunity | undefined {
  return OPPORTUNITIES.find((o) => o.id === id);
}