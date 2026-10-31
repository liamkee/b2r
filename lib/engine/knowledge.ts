import generated from "@/knowledge/asean/generated/index.json";

export type EvidenceTopic = "regulation" | "market_demand" | "competition" | "operational_risk" | "research_gap" | "regional_context";
export interface SourceRecord {
  source_id: string;
  publisher: string;
  title: string;
  url: string;
  source_type: string;
  publication_date: string | null;
  retrieved_on: string;
  access_method: string;
  verification_scope: string;
  notes: string;
}
export interface EvidenceRecord {
  id: string;
  schema_version: string;
  country_codes: string[];
  countries: string[];
  topic: EvidenceTopic;
  subtopic: string;
  title: string;
  record_type: "evidence" | "research_gap";
  sector_tags: string[];
  facts: string[];
  source_ids: string[];
  evidence_period: string | null;
  effective_from: string | null;
  effective_to: string | null;
  reviewed_on: string;
  review_due: string;
  review_policy_days: number;
  source_support: string;
  unknowns: string[];
  analyst_inference: string | null;
  legal_review_status: string;
  ranking_use: string;
  quantitative_metrics: unknown[];
  entity: { name: string; customer_job: string; country_scope_note: string } | null;
  supersedes_record_ids: string[];
  text_for_embedding: string;
  market_share?: number | null;
  pricing?: string | null;
  entity_role?: string | null;
}
export interface KnowledgeIndex {
  index_version: number;
  datasetVersion: string;
  contentHash: string;
  manifest: { version: string; created_on: string; country_count: number; record_count: number; source_count: number; [key: string]: unknown };
  taxonomy: { countries: { code: string; name: string; aliases: string[] }[]; sectors: string[]; topics: string[] };
  sources: SourceRecord[];
  records: EvidenceRecord[];
  coverage: Record<string, unknown>;
  runtimeSystemPrompt: string;
  bm25: { documents: { id: string; length: number; terms: Record<string, number> }[]; document_frequencies: Record<string, number>; average_length: number };
}
/** Build-time asset import keeps Vercel independent of Python, cwd and writable disk. */
export function loadKnowledge(): KnowledgeIndex {
  return generated as unknown as KnowledgeIndex;
}
export function knowledgeStatus() {
  const index = loadKnowledge();
  return {
    dataset_version: index.datasetVersion,
    content_hash: index.contentHash,
    technique: "bm25",
    snapshot_date: index.manifest.created_on,
    snapshot_not_live: true,
    legal_audit_completed: false,
    country_count: index.taxonomy.countries.length,
    record_count: index.records.length,
    source_count: index.sources.length,
    countries: index.taxonomy.countries,
    sectors: index.taxonomy.sectors,
    coverage: index.coverage,
    limitations: ["Starter snapshot; country coverage does not establish complete industry coverage.", "Sources have not been refreshed at request time.", "Editorial review dates do not establish legal currency.", "No city-level ranking or clearance is supported by this dataset."],
  };
}
