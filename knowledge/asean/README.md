# ASEAN ONE — RAG data and AI-engine build pack

**Research snapshot:** 31 October 2026  
**Version:** `2026-10-31.v1`  
**Scope:** all 11 ASEAN countries; 78 evidence/gap cards; 77 source entries; 23 named competitor/partner offering records.

## Start here

1. Put this folder inside the project as `knowledge/asean/`.
2. Run `python knowledge/asean/scripts/validate_pack.py` from the project root, or `python scripts/validate_pack.py` from this folder.
3. Give Codex **`prompts/CODEX_BUILD_PROMPT.md`** and tell it to implement it in the existing application.
4. Use **`data/asean_market_intelligence.jsonl`** as the canonical data source. Do not ingest only the README or assume the ZIP trains a model.
5. For an upload-oriented retrieval service, use the separate Markdown files in `rag_documents/` and `data/ingestion_manifest.json`; verify supported types and metadata limits before uploading.

The app remains open: **no Auth0, Supabase or sign-in**. The build prompt preserves the existing Node.js/static-frontend scaffold unless the actual repository has already changed. This pack is data and implementation instructions, not a completed live AI integration or a GitHub push.

## Contents

| Location | Use |
|---|---|
| `data/asean_market_intelligence.jsonl` | One structured evidence card per line; includes citations, scope, dates, gaps and labelled inferences. |
| `data/sources.json` | Exact source URLs, publishers, source types, access methods and limitations. |
| `data/country_profiles.json` | Country indexes and explicitly labelled initial test hypotheses. |
| `data/taxonomy.json` | Country codes/aliases and sector tags. |
| `data/coverage.json` | Coverage counts; not an attractiveness ranking. |
| `data/dataset_manifest.json` | Snapshot/version/scope. |
| `rag_documents/` | 78 record-level Markdown files suitable for adapted upload pipelines. |
| `countries/` | Eleven compact human-readable country briefs. |
| `schemas/` | Evidence, five-answer input and recommendation JSON Schemas. |
| `prompts/CODEX_BUILD_PROMPT.md` | Full engineering brief to build and test the integrated engine. |
| `prompts/ENGINE_SYSTEM_PROMPT.md` | Runtime evidence-grounding and output policy. |
| `evals/example_business_profile.json` | Synthetic five-answer business input for local tests. |
| `evals/acceptance_cases.json` | 40 acceptance/adversarial test specifications; not claimed as executed model tests. |
| `scripts/validate_pack.py` | Offline integrity/source-reference checks. |
| `scripts/retrieve_evidence.py` | Small offline lexical retrieval demonstration; not the production AI engine. |
| `docs/DATA_DICTIONARY.md` | Field meanings, provenance and update policy. |
| `docs/validation_report.json` | Actual offline pack-validation results. |

## Countries and coverage

Brunei Darussalam (BN), Cambodia (KH), Indonesia (ID), Lao PDR (LA), Malaysia (MY), Myanmar (MM), Philippines (PH), Singapore (SG), Thailand (TH), Timor-Leste (TL), Viet Nam (VN).

Country research covers establishment/foreign-investment context, selected digital/data rules, dated economic or sector signals, and actual named company offerings. The first release is strongest in software, commerce, payments and logistics, with selective food and healthcare examples. **All-country coverage does not mean all-industry coverage.** Demand signals often describe the economy or a sector, not proven demand for the user's exact product.

Each country includes explicit research gaps. Tax, employment, product approvals, import duties, financing, local-language details and complete sector regulation are not exhaustively covered. Company pages establish claimed offerings, not verified market shares or competitor weaknesses. Current prices are not supplied.

## Five business answers

1. Industry/subsector.
2. Countries under consideration.
3. Product, customer and business model.
4. Revenue amount/range, currency, period and metric; pre-revenue/nondisclosure supported.
5. Scale target, timeframe and constraints; optional budget.

Optional supporting fields stay inside those questions. Missing ownership, origin, budget or licensing information must remain explicit, not invented. Revenue is not expansion budget, profit, paid-up capital or runway.

## How recommendations should work

Validated profile → country/sector/job filtering → balanced evidence retrieval → applicability and freshness checks → provider-backed analysis or evidence-only fallback → schema and citation validation → comparison with sources and a measurable validation plan.

The default design uses local lexical retrieval. Optional embeddings can be added behind an adapter. No model or API key is bundled. No current market facts should be invented by the model. The engine should abstain from a definitive ranking when evidence is thin or unequal.

Do not repurpose the old demo opportunity records as research evidence. The existing opportunity-fit matcher and the new country-entry engine should have separate, explicit endpoint contracts.

## Important limits

- Research summaries are not legal, tax, sanctions or investment clearance.
- Some facts were supported by indexed extracts, not full-document inspection. Source access is recorded honestly.
- Research date is not proof of legal currency; confirm original instruments and later amendments before acting.
- Macroeconomic growth, policy priorities and announced infrastructure do not prove product demand.
- A company may be a competitor, channel, customer or partner depending on the user's exact offering.
- There is no live external refresh or live AI application in this ZIP. The Codex prompt specifies that implementation.
- Browser-local storage is not cross-device synchronization, and API submission is not purely on-device processing.

## Validation

The standard-library validator checks parsing, IDs, country/sector scope, source references, dates, required topic coverage, gap/fact separation and derived-document alignment. `--jsonschema` adds formal schema/example validation if Python `jsonschema` is installed.

```sh
python scripts/validate_pack.py
python scripts/validate_pack.py --jsonschema
python scripts/retrieve_evidence.py --countries MY TH VN --sector software_saas --query "restaurant inventory purchasing POS integration"
```

Validation does **not** assert that every source URL is live, all laws are current, model answers are accurate, or the app is deployed. Consult `docs/validation_report.json` for the checks actually run.
