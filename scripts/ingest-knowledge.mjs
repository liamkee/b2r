import { createHash } from "node:crypto";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const knowledgeRoot = join(repositoryRoot, "knowledge", "asean");
const inputFiles = ["data/asean_market_intelligence.jsonl", "data/sources.json", "data/taxonomy.json", "data/dataset_manifest.json", "data/coverage.json", "data/country_profiles.json", "data/ingestion_manifest.json", "schemas/evidence_record.schema.json", "schemas/business_profile.schema.json", "schemas/recommendation.schema.json", "prompts/ENGINE_SYSTEM_PROMPT.md"];
const STOP = new Set("a an the and or of to for in on at by with from as is are be that this it its your our their into how which who what can may must not only within current business product service country countries record source summary supported evidence review date due stated unknowns offering conditional relevance".split(" "));
export function tokenize(text) {
  return String(text).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter(t => t.length > 2 && !STOP.has(t));
}
function assert(test, message) { if (!test) throw new Error(`Knowledge ingestion blocked: ${message}`); }
const isDate = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().startsWith(value);
const strings = value => Array.isArray(value) && value.every(v => typeof v === "string");
const unique = values => new Set(values).size === values.length;

/** Validate trusted repository assets before generating a server-only index. No network fetches. */
export function buildKnowledge(root = knowledgeRoot) {
  const read = path => readFileSync(join(root, path), "utf8").replace(/\r\n/g, "\n");
  const json = path => JSON.parse(read(path));
  const manifest = json("data/dataset_manifest.json");
  const taxonomy = json("data/taxonomy.json");
  const sources = json("data/sources.json");
  const records = read("data/asean_market_intelligence.jsonl").split(/\r?\n/).filter(line => line.trim()).map((line, i) => {
    try { return JSON.parse(line); } catch { throw new Error(`Knowledge ingestion blocked: invalid JSONL line ${i + 1}`); }
  });
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  const validateEvidence = ajv.compile(json("schemas/evidence_record.schema.json"));
  // Draft 2020-12 schema validation is complemented below by domain consistency checks.
  for (const record of records) assert(validateEvidence(record), `evidence schema violation: ${typeof record.id === "string" ? record.id : "unknown"}; ${ajv.errorsText(validateEvidence.errors, { dataVar: "record" })}`);
  const countries = new Set(taxonomy.countries.map(c => c.code));
  const sectors = new Set(taxonomy.sectors);
  const topics = new Set(taxonomy.topics);
  const sourceIds = new Set(sources.map(s => s.source_id));
  const sourceById = new Map(sources.map(source => [source.source_id, source]));
  const ids = new Set(records.map(r => r.id));
  assert(countries.size === 11 && taxonomy.countries.length === 11 && manifest.country_count === 11, "country membership count mismatch");
  assert(sourceIds.size === sources.length && sources.length === manifest.source_count, "duplicate source ID or count mismatch");
  assert(ids.size === records.length && records.length === manifest.record_count, "duplicate evidence ID or count mismatch");
  assert(typeof manifest.version === "string" && isDate(manifest.created_on), "invalid dataset manifest");
  for (const source of sources) {
    let url;
    try { url = new URL(source.url); } catch { assert(false, `invalid source URL: ${source.source_id}`); }
    assert(typeof source.source_id === "string" && url.protocol === "https:" && !url.username && !url.password, `unsafe source URL: ${source.source_id}`);
    assert(["publisher", "title", "source_type", "access_method", "verification_scope", "notes"].every(field => typeof source[field] === "string"), `incomplete source: ${source.source_id}`);
    assert(isDate(source.retrieved_on) && (!source.publication_date || isDate(source.publication_date) && source.publication_date <= manifest.created_on), `invalid source dates: ${source.source_id}`);
  }
  const schema = json("schemas/evidence_record.schema.json");
  for (const record of records) {
    assert(schema.required.every(field => Object.hasOwn(record, field)), `missing evidence fields: ${record.id}`);
    assert(Object.keys(record).every(field => Object.hasOwn(schema.properties, field)), `unknown evidence fields: ${record.id}`);
    assert(typeof record.id === "string" && /^[A-Z0-9-]+$/.test(record.id) && record.schema_version === "1.0.0", "invalid record ID/version");
    assert(strings(record.country_codes) && record.country_codes.length > 0 && unique(record.country_codes) && record.country_codes.every(code => countries.has(code)), `unsupported country: ${record.id}`);
    assert(strings(record.sector_tags) && record.sector_tags.length > 0 && record.sector_tags.every(s => sectors.has(s)), `unsupported sector: ${record.id}`);
    assert(topics.has(record.topic) && ["evidence", "research_gap"].includes(record.record_type), `invalid record type/topic: ${record.id}`);
    assert(strings(record.countries) && record.countries.length === record.country_codes.length && ["subtopic", "source_support", "legal_review_status", "ranking_use"].every(field => typeof record[field] === "string") && Number.isInteger(record.review_policy_days) && record.review_policy_days >= 0 && Array.isArray(record.quantitative_metrics) && (record.analyst_inference === null || typeof record.analyst_inference === "string"), `invalid record metadata types: ${record.id}`);
    assert(strings(record.source_ids) && unique(record.source_ids) && record.source_ids.every(id => sourceIds.has(id)), `unresolved source: ${record.id}`);
    assert(strings(record.supersedes_record_ids) && record.supersedes_record_ids.every(id => ids.has(id) && id !== record.id), `unresolved supersedes record: ${record.id}`);
    assert(isDate(record.reviewed_on) && isDate(record.review_due) && record.review_due >= record.reviewed_on, `invalid review dates: ${record.id}`);
    for (const date of [record.effective_from, record.effective_to]) assert(date === null || isDate(date), `invalid effective date: ${record.id}`);
    assert(typeof record.title === "string" && typeof record.text_for_embedding === "string" && record.text_for_embedding.length > 0 && record.text_for_embedding.length <= 15000 && strings(record.facts) && strings(record.unknowns), `invalid evidence text: ${record.id}`);
    if (record.record_type === "evidence") assert(record.facts.length > 0 && record.facts.every(fact => fact.trim().length > 0) && record.source_ids.length > 0, `evidence without facts/sources: ${record.id}`);
    if (record.record_type === "research_gap") assert(record.facts.length === 0 && record.source_ids.length === 0 && record.topic === "research_gap", `gap masquerades as source fact: ${record.id}`);
    if (record.topic === "competition") assert(record.entity && !Array.isArray(record.entity) && ["name", "customer_job", "country_scope_note"].every(field => typeof record.entity[field] === "string" && record.entity[field].length > 0) && record.market_share == null && record.pricing == null, `invalid competitor evidence: ${record.id}`);
    assert(existsSync(join(root, "rag_documents", `${record.id}.md`)), `missing derived Markdown: ${record.id}`);
    assert(record.text_for_embedding.includes(record.title) && [...record.facts, ...record.unknowns, ...(record.analyst_inference ? [record.analyst_inference] : [])].every(text => record.text_for_embedding.includes(text)), `canonical text disagrees with structured facts/gaps: ${record.id}`);
    for (const id of record.source_ids) {
      const source = sourceById.get(id);
      assert(record.text_for_embedding.includes(`${id} | ${source.publisher} | ${source.url} | access=${source.access_method}`), `canonical text has stale source metadata: ${record.id}/${id}`);
    }
    const derived = read(`rag_documents/${record.id}.md`).replace(/\r\n/g, "\n").trim();
    assert(derived === record.text_for_embedding.replace(/\r\n/g, "\n").trim(), `derived Markdown differs from canonical text: ${record.id}`);
  }
  const recordById = new Map(records.map(record => [record.id, record]));
  const visiting = new Set();
  const visited = new Set();
  const checkSupersession = id => {
    assert(!visiting.has(id), `cyclic supersession: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const previous of recordById.get(id).supersedes_record_ids) checkSupersession(previous);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of ids) checkSupersession(id);
  for (const code of countries) {
    const countryTopics = new Set(records.filter(record => record.country_codes.includes(code)).map(record => record.topic));
    assert(["regulation", "market_demand", "competition", "research_gap"].every(topic => countryTopics.has(topic)), `missing topic coverage: ${code}`);
  }
  const profiles = json("data/country_profiles.json");
  assert(profiles.length === countries.size && unique(profiles.map(profile => profile.country_code)), "missing or duplicate country profile");
  const profileTopics = { regulatory_record_ids: "regulation", market_record_ids: "market_demand", competition_record_ids: "competition", risk_record_ids: "operational_risk", gap_record_ids: "research_gap" };
  for (const profile of profiles) {
    assert(countries.has(profile.country_code), "unsupported country profile");
    for (const [key, values] of Object.entries(profile)) if (key.endsWith("_record_ids")) assert(Array.isArray(values) && values.every(id => ids.has(id)), "unresolved profile record");
    assert(profile.initial_test_hypothesis.supporting_record_ids.every(id => ids.has(id)), "unresolved test hypothesis record");
    assert(profile.initial_test_hypothesis.analysis_not_observed_fact === true, "unlabelled test hypothesis");
    for (const [key, topic] of Object.entries(profileTopics)) assert(Array.isArray(profile[key]) && unique(profile[key]) && profile[key].every(id => recordById.get(id)?.topic === topic && recordById.get(id).country_codes.includes(profile.country_code)), `profile record scope/topic mismatch: ${profile.country_code}/${key}`);
    assert(profile.initial_test_hypothesis.supporting_record_ids.every(id => recordById.get(id).country_codes.includes(profile.country_code)), "test hypothesis country scope mismatch");
  }
  const ingestion = json("data/ingestion_manifest.json");
  assert(ingestion.length === records.length && unique(ingestion.map(i => i.record_id)), "ingestion manifest count/duplicates");
  for (const item of ingestion) {
    assert(ids.has(item.record_id) && item.attributes.record_id === item.record_id && item.path === `rag_documents/${item.record_id}.md` && existsSync(join(root, item.path)), "invalid derived-document mapping");
    const record = recordById.get(item.record_id);
    for (const field of ["topic", "record_type", "reviewed_on"]) assert(item.attributes[field] === record[field], `derived metadata mismatch: ${item.record_id}/${field}`);
    for (const country of countries) assert(item.attributes[`country_${country}`] === record.country_codes.includes(country), `derived country metadata mismatch: ${item.record_id}/${country}`);
  }
  const coverage = json("data/coverage.json");
  for (const code of countries) for (const topic of ["regulation", "market_demand", "competition", "operational_risk", "research_gap"]) assert(coverage.country_counts?.[code]?.[topic] === records.filter(record => record.country_codes.includes(code) && record.topic === topic).length, `coverage count mismatch: ${code}/${topic}`);
  const contentHash = createHash("sha256");
  for (const path of inputFiles) contentHash.update(path).update("\0").update(read(path)).update("\0");
  const documents = records.map(record => {
    const tokens = tokenize([record.title, record.title, ...record.sector_tags, record.entity?.customer_job ?? "", record.text_for_embedding].join(" "));
    const terms = Object.create(null);
    for (const token of tokens) terms[token] = (terms[token] ?? 0) + 1;
    return { id: record.id, length: tokens.length, terms };
  });
  const frequencies = Object.create(null);
  for (const doc of documents) for (const term of Object.keys(doc.terms)) frequencies[term] = (frequencies[term] ?? 0) + 1;
  return {
    index_version: 1,
    datasetVersion: manifest.version,
    contentHash: contentHash.digest("hex"),
    manifest,
    taxonomy,
    sources,
    records,
    coverage,
    runtimeSystemPrompt: read("prompts/ENGINE_SYSTEM_PROMPT.md"),
    bm25: { documents, document_frequencies: frequencies, average_length: documents.reduce((sum, d) => sum + d.length, 0) / documents.length },
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const index = buildKnowledge();
  const target = join(knowledgeRoot, "generated", "index.json");
  const serialized = `${JSON.stringify(index)}\n`;
  mkdirSync(dirname(target), { recursive: true });
  if (!existsSync(target) || readFileSync(target, "utf8") !== serialized) writeFileSync(target, serialized);
  console.log(`Knowledge validated: ${index.records.length} records, ${index.sources.length} sources, ${index.taxonomy.countries.length} countries; ${index.datasetVersion}; SHA-256 ${index.contentHash}`);
}
