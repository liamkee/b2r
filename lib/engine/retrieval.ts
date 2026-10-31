import { loadKnowledge, type EvidenceRecord, type EvidenceTopic, type KnowledgeIndex, type SourceRecord } from "@/lib/engine/knowledge";

export interface RetrievalProfile {
  industry: { sector: string; subsector?: string | null; description?: string | null };
  target_countries: string[];
  product: { description: string; buyer_type?: string | null; customer_segment?: string | null; business_model?: string | null; regulated_features?: string[] };
}
export interface RetrievalLimits {
  regulation: number;
  market_demand: number;
  competition: number;
  operational_risk: number;
  research_gap: number;
  regional_context: number;
}
export type DemandClassification = "macro_only" | "policy_priority" | "sector_signal" | "product_specific" | "not_demand";
export interface RetrievalTrace {
  country_code: string;
  topic: EvidenceTopic;
  record_id: string;
  query_terms: string[];
  reason_selected: string;
  relevance_score: number;
  demand_classification: DemandClassification;
  source_access: { source_id: string; access_method: string }[];
  publication_dates: { source_id: string; publication_date: string | null }[];
  evidence_period: string | null;
  effective_from: string | null;
  effective_to: string | null;
  reviewed_on: string;
  review_due: string;
  stale: boolean;
  conflict_flags: string[];
  verification_flags: string[];
  relationship: "candidate_overlap_needs_verification" | null;
}
export interface CountryRetrieval {
  country_code: string;
  record_ids: string[];
  traces: RetrievalTrace[];
  gaps: string[];
}
export interface RetrievalResult {
  countries: CountryRetrieval[];
  records: EvidenceRecord[];
  sources: SourceRecord[];
  dataset_version: string;
  content_hash: string;
  technique: "bm25";
  limits: RetrievalLimits;
}
const STOP = new Set("a an the and or of to for in on at by with from as is are be that this it its your our their into how which who what can may must not only within current business product service country countries record source summary supported evidence review date due stated unknowns offering conditional relevance".split(" "));
export function queryTerms(text: string): string[] {
  return [...new Set(text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter(term => term.length > 2 && !STOP.has(term)))].slice(0, 96);
}
export function classifyDemand(record: EvidenceRecord): DemandClassification {
  if (record.topic !== "market_demand") return "not_demand";
  if (record.subtopic === "macro_context") return "macro_only";
  if (record.subtopic === "policy_priority") return "policy_priority";
  // Even a documented broad business problem does not establish demand for this user's exact product.
  return "sector_signal";
}
function score(index: KnowledgeIndex, id: string, terms: string[]): number {
  const doc = index.bm25.documents.find(document => document.id === id);
  if (!doc) return 0;
  const count = index.bm25.documents.length;
  return terms.reduce((sum, term) => {
    const tf = doc.terms[term] ?? 0;
    if (!tf) return sum;
    const df = index.bm25.document_frequencies[term] ?? 0;
    const idf = Math.log(1 + (count - df + 0.5) / (df + 0.5));
    return sum + idf * tf * 2.2 / (tf + 1.2 * (0.25 + 0.75 * doc.length / index.bm25.average_length));
  }, 0);
}
const GENERAL_ENTRY = new Set(["business_establishment", "foreign_ownership", "capital_requirements", "trade_agreements", "sanctions"]);
const MAXIMUM: RetrievalLimits = { regulation: 3, market_demand: 3, competition: 4, operational_risk: 1, research_gap: 1, regional_context: 1 };

/** Independent country budgets prevent source-rich countries crowding out sparse ones. No paid service. */
export function retrieveEvidence(profile: RetrievalProfile, options: { now?: string; limits?: Partial<RetrievalLimits> } = {}, index: KnowledgeIndex = loadKnowledge()): RetrievalResult {
  const today = (options.now ?? new Date().toISOString()).slice(0, 10);
  const limits = Object.fromEntries(Object.entries(MAXIMUM).map(([topic, maximum]) => [topic, Math.max(0, Math.min(maximum, Math.floor(options.limits?.[topic as EvidenceTopic] ?? maximum)))])) as unknown as RetrievalLimits;
  const text = [profile.industry.sector.replace(/_/g, " "), profile.industry.subsector, profile.industry.description, profile.product.description, profile.product.customer_segment, profile.product.business_model, ...(profile.product.regulated_features ?? [])].filter(Boolean).join(" ");
  const terms = queryTerms(text);
  const jobTerms = queryTerms([profile.industry.subsector, profile.product.description, profile.product.customer_segment].filter(Boolean).join(" "));
  const selected = new Set<string>();
  const sources = new Map(index.sources.map(source => [source.source_id, source]));
  const superseded = new Map<string, string[]>();
  for (const record of index.records) for (const previous of record.supersedes_record_ids) superseded.set(previous, [...(superseded.get(previous) ?? []), record.id]);
  const countries = profile.target_countries.map(country_code => {
    const pool = index.records.filter(record => record.country_codes.includes(country_code));
    const eligible = pool.filter(record => {
      const sectorMatch = record.sector_tags.includes(profile.industry.sector);
      const general = record.sector_tags.includes("general");
      if (["research_gap", "regional_context", "operational_risk"].includes(record.topic)) return general || sectorMatch || record.topic === "research_gap";
      if (record.topic === "regulation") return general || sectorMatch;
      if (record.topic === "market_demand") return general || sectorMatch;
      // Require both scoped country footprint and actual customer-job word overlap, not sector tags alone.
      if (record.topic === "competition") return sectorMatch && !!record.entity && jobTerms.some(term => queryTerms(record.entity!.customer_job).includes(term));
      return false;
    });
    const chosen: EvidenceRecord[] = [];
    const reasons = new Map<string, string>();
    const ranked = (records: EvidenceRecord[]) => [...records].sort((a, b) => score(index, b.id, terms) - score(index, a.id, terms) || a.id.localeCompare(b.id));
    for (const topic of Object.keys(limits) as EvidenceTopic[]) {
      const candidates = eligible.filter(record => record.topic === topic);
      let picks: EvidenceRecord[];
      if (topic === "regulation" && limits.regulation > 0) {
        const establishment = ranked(candidates.filter(record => GENERAL_ENTRY.has(record.subtopic)))[0];
        picks = establishment ? [establishment] : [];
        const triggers = ranked(candidates.filter(record => record.id !== establishment?.id));
        picks.push(...triggers.slice(0, limits.regulation - picks.length));
      } else picks = ranked(candidates).slice(0, limits[topic]);
      for (const record of picks) {
        chosen.push(record);
        selected.add(record.id);
        reasons.set(record.id, topic === "regulation" && GENERAL_ENTRY.has(record.subtopic) ? "General establishment, ownership or entry-risk context; applicability still requires review." : topic === "competition" ? "Selected country footprint, sector tag and customer-job keyword overlap; relationship needs verification." : topic === "research_gap" ? "Country research gaps; not source-supported facts." : topic === "market_demand" ? `Country/sector context classified as ${classifyDemand(record)}; not proof of product-market fit.` : topic === "regional_context" ? "Regional context scoped to this country; same record is deduplicated across countries." : "Country and sector-scoped risk or regulatory trigger.");
      }
    }
    const traces = chosen.map(record => {
      const recordSources = record.source_ids.map(id => sources.get(id)!);
      const conflict_flags = [
        ...(superseded.has(record.id) ? [`superseded_by:${superseded.get(record.id)!.join(",")}`] : []),
        ...record.supersedes_record_ids.map(id => `supersedes:${id}`),
      ];
      return {
        country_code,
        topic: record.topic,
        record_id: record.id,
        query_terms: terms,
        reason_selected: reasons.get(record.id)!,
        relevance_score: Number(score(index, record.id, terms).toFixed(4)),
        demand_classification: classifyDemand(record),
        source_access: recordSources.map(source => ({ source_id: source.source_id, access_method: source.access_method })),
        publication_dates: recordSources.map(source => ({ source_id: source.source_id, publication_date: source.publication_date })),
        evidence_period: record.evidence_period,
        effective_from: record.effective_from,
        effective_to: record.effective_to,
        reviewed_on: record.reviewed_on,
        review_due: record.review_due,
        stale: record.review_due < today,
        conflict_flags,
        verification_flags: ["not_live_checked", ...(recordSources.some(source => source.access_method === "indexed_excerpt") ? ["excerpt_only"] : []), ...(record.topic === "regulation" ? ["current_original_instrument_and_amendments_required", "legal_applicability_unknown"] : []), ...(record.subtopic === "sanctions" ? ["decision_time_sanctions_screening_required"] : [])],
        relationship: record.topic === "competition" ? "candidate_overlap_needs_verification" as const : null,
      };
    });
    const gaps = [
      ...chosen.filter(record => record.record_type === "research_gap").flatMap(record => record.unknowns),
      ...(!chosen.some(record => record.topic === "competition") ? ["No sufficiently matched competitor offering retrieved; this does not mean no competitors exist."] : []),
      "Product-specific paying-customer demand remains unverified; macro and sector signals are context.",
      "City-level availability, demand and regulatory applicability have not been established.",
      ...(profile.industry.sector === "other" ? ["This industry is unsupported by the starter sector taxonomy; commission industry-specific research."] : []),
    ];
    return { country_code, record_ids: chosen.map(record => record.id), traces, gaps };
  });
  const records = index.records.filter(record => selected.has(record.id));
  const selectedSources = new Set(records.flatMap(record => record.source_ids));
  return { countries, records, sources: index.sources.filter(source => selectedSources.has(source.source_id)), dataset_version: index.datasetVersion, content_hash: index.contentHash, technique: "bm25", limits };
}
