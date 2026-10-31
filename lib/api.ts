/**
 * Match API client.
 *
 * The ONE place to swap in the real backend: replace the body of
 * `matchRequest` with a `fetch("/api/match", ...)` call and keep the same
 * request/response types — no component changes required.
 */
import { OPPORTUNITIES } from "@/lib/opportunities";
import type { Opportunity } from "@/lib/opportunities";

/** What the user asked the AI to focus on. */
export type FocusKey = "opportunities" | "regulation" | "market" | "competitors";

export const FOCUS_OPTIONS: readonly { id: FocusKey; label: string }[] = [
  { id: "opportunities", label: "Opportunities" },
  { id: "regulation", label: "Government Regulations" },
  { id: "market", label: "Market Demand" },
  { id: "competitors", label: "Competitor Analysis" },
] as const;

export interface MatchRequest {
  /** Free-text description of the startup. */
  text: string;
  /** ISO-2 codes the founder is targeting; empty means "anywhere in ASEAN". */
  markets: string[];
  /** Which sections to generate. Always includes `opportunities`. */
  focus: FocusKey[];
}

/** Scored opportunity returned by the matchmaker. */
export interface MatchedOpportunity extends Opportunity {
  /** 0–100 relevance score. */
  score: number;
  /** Human-readable explanation of why this matched. */
  reason: string;
}

export interface CountryMatches {
  /** ISO-2 code. */
  country: string;
  countryName: string;
  opportunities: MatchedOpportunity[];
}

/** An AI-generated insight section (regulation / market / competitors). */
export interface Insight {
  focus: Exclude<FocusKey, "opportunities">;
  title: string;
  summary: string;
  points: string[];
}

/** The founder profile the AI parsed out of the free text. */
export interface ParsedProfile {
  industry: string;
  stage: string;
  homeCountry: string;
  targets: string[];
}

export interface MatchResponse {
  profile: ParsedProfile;
  matches: CountryMatches[];
  insights: Insight[];
}

export class MatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchError";
  }
}

/* ── Mock generation ───────────────────────────────────────────────── */

const COUNTRY_NAMES: Record<string, string> = {
  ID: "Indonesia",
  MY: "Malaysia",
  PH: "Philippines",
  SG: "Singapore",
  TH: "Thailand",
  VN: "Vietnam",
  MM: "Myanmar",
  KH: "Cambodia",
  LA: "Laos",
  BN: "Brunei",
};

/** Very small keyword → industry classifier, enough for the demo. */
function inferIndustry(text: string): string {
  const t = text.toLowerCase();
  if (/fintech|payment|bank|lending|wallet/.test(t)) return "Fintech";
  if (/health|medtech|clinic|patient/.test(t)) return "Health tech";
  if (/agri|farm|crop|food/.test(t)) return "Agri-food";
  if (/climate|energy|solar|carbon/.test(t)) return "Climate tech";
  if (/logistic|supply|freight|delivery/.test(t)) return "Logistics";
  if (/edu|school|learn|course/.test(t)) return "Education";
  if (/saas|b2b|software|platform|api/.test(t)) return "B2B SaaS";
  return "Technology";
}

function inferStage(text: string): string {
  const t = text.toLowerCase();
  if (/pre-?seed|idea|prototype/.test(t)) return "Pre-seed";
  if (/\bseed\b|mvp|early/.test(t)) return "Seed";
  if (/series a|growth|scale/.test(t)) return "Growth";
  if (/series b|expansion/.test(t)) return "Expansion";
  return "Early";
}

function inferHome(text: string, markets: string[]): string {
  const t = text.toLowerCase();
  for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
    if (t.includes(name.toLowerCase())) {
      // The first country named is usually the founder's home market.
      if (!markets.includes(code) || markets.length === 0) return code;
    }
  }
  return markets[0] ?? "SG";
}

/** Stable pseudo-random from a string, so mock results do not jitter. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function scoreFor(o: Opportunity, text: string, targets: string[]): number {
  let score = 55 + (hash(o.id + text) % 30);
  if (targets.includes(o.country)) score += 8;
  const t = text.toLowerCase();
  if (t.includes(o.country.toLowerCase())) score += 3;
  if (/fintech|payment/.test(t) && o.type === "market") score += 4;
  if (/funding|grant|raise/.test(t) && (o.type === "funding" || o.type === "investor"))
    score += 5;
  return Math.max(45, Math.min(98, score));
}

function reasonFor(o: Opportunity, profile: ParsedProfile): string {
  const where = COUNTRY_NAMES[o.country] ?? o.country;
  switch (o.type) {
    case "investor":
      return `${o.sourceName} backs ${profile.industry.toLowerCase()} teams at ${profile.stage.toLowerCase()} stage — a fit for your raise profile in ${where}.`;
    case "accelerator":
      return `Programme support and local network in ${where}, useful for a ${profile.stage.toLowerCase()}-stage team entering the market.`;
    case "funding":
      return `Non-dilutive funding aligned with a ${profile.industry.toLowerCase()} build-out in ${where}.`;
    case "partner":
      return `Distribution or technology partner in ${where} that shortens time to first customers.`;
    case "market":
      return `Practical market-entry pathway for ${where}, covering the regulatory or licensing step.`;
    case "talent":
      return `Access to local technical talent in ${where} while you scale the team.`;
  }
}

function insightFor(
  focus: Exclude<FocusKey, "opportunities">,
  profile: ParsedProfile,
  targets: string[],
): Insight {
  const where =
    targets.length > 0
      ? targets.map((c) => COUNTRY_NAMES[c] ?? c).join(", ")
      : "ASEAN";
  switch (focus) {
    case "regulation":
      return {
        focus,
        title: "Government Regulations",
        summary: `Key compliance areas a ${profile.industry.toLowerCase()} company should check before operating in ${where}.`,
        points: [
          "Foreign ownership caps vary by sector — confirm the negative list for your activity before incorporating.",
          "Financial services usually need a licence or sandbox entry rather than a straightforward company registration.",
          "Cross-border data transfer rules differ per country; map where customer data may be stored.",
          "Local entity or local director requirements can affect how quickly you can invoice customers.",
        ],
      };
    case "market":
      return {
        focus,
        title: "Market Demand",
        summary: `Demand signals worth validating for ${profile.industry.toLowerCase()} in ${where}.`,
        points: [
          "Compare addressable spend using national statistics before committing to a full launch.",
          "Check digital adoption and payment habits — card penetration and wallet share vary widely across ASEAN.",
          "Look at how incumbents price today; undercutting is often harder than it looks once local costs land.",
          "Pilot in one city first, then expand — regional rollout before product-market fit is a common failure mode.",
        ],
      };
    case "competitors":
      return {
        focus,
        title: "Competitor Analysis",
        summary: `Landscape to map before positioning a ${profile.industry.toLowerCase()} product in ${where}.`,
        points: [
          "Identify the local incumbent in each target market — they usually have distribution you do not.",
          "Note regional players expanding across borders; they are your most direct comparables.",
          "Check whether a global player has localised pricing, which changes the value story.",
          "Find the wedge you can defend: a segment, a workflow, or a partnership the incumbents cannot copy quickly.",
        ],
      };
  }
}

function opportunityTypeMatchesFocus(_focus: FocusKey[], o: Opportunity): boolean {
  // All focus sets include opportunities; the others add insight sections.
  return o.type !== undefined;
}

/**
 * Generates mock results. Deterministic for a given input so screenshots and
 * re-runs stay stable.
 */
async function mockMatch(req: MatchRequest): Promise<MatchResponse> {
  const targets = req.markets.length > 0 ? req.markets : [];
  const profile: ParsedProfile = {
    industry: inferIndustry(req.text),
    stage: inferStage(req.text),
    homeCountry: inferHome(req.text, targets),
    targets: targets.length > 0 ? targets : ["SG", "MY", "ID"],
  };

  const pool = OPPORTUNITIES.filter(
    (o) =>
      opportunityTypeMatchesFocus(req.focus, o) &&
      (targets.length === 0
        ? true
        : targets.includes(o.country) || o.country === profile.homeCountry),
  );

  const scored: MatchedOpportunity[] = pool
    .map((o) => ({
      ...o,
      score: scoreFor(o, req.text, targets),
      reason: reasonFor(o, profile),
    }))
    .sort((a, b) => b.score - a.score);

  // Group by country, ranked within each group, in the order countries first
  // appear in the ranked list so the strongest market leads.
  const byCountry = new Map<string, MatchedOpportunity[]>();
  for (const o of scored) {
    const list = byCountry.get(o.country) ?? [];
    list.push(o);
    byCountry.set(o.country, list);
  }

  const matches: CountryMatches[] = [...byCountry.entries()].map(
    ([country, opportunities]) => ({
      country,
      countryName: COUNTRY_NAMES[country] ?? country,
      opportunities: opportunities.slice(0, 4),
    }),
  );

  const insights = req.focus
    .filter((f): f is Exclude<FocusKey, "opportunities"> => f !== "opportunities")
    .map((f) => insightFor(f, profile, targets));

  return { profile, matches, insights };
}

/**
 * Runs a match request.
 *
 * Currently returns mock data after a simulated round-trip so the UI has a
 * realistic loading state. Swap the `mockMatch` call for a real fetch when the
 * backend endpoint exists.
 */
export async function matchRequest(req: MatchRequest): Promise<MatchResponse> {
  if (!req.text.trim()) {
    throw new MatchError("Describe your startup before searching.");
  }

  // ── Replace from here when POST /api/match is available ──────────────
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return mockMatch(req);
  // ─────────────────────────────────────────────────────────────────────
}

/** Exposed for tests. */
export const __internals = { inferIndustry, inferStage, scoreFor };