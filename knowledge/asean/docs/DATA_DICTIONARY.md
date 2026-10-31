# Data dictionary and evidence policy

## Purpose

The JSONL file is a country-entry research corpus, not a trained model, a complete law database, or a verified opportunity listing. One line is one self-contained retrieval card. Keep IDs stable when refreshing facts. Version changed content and record supersession explicitly.

## Important fields

| Field | Meaning |
|---|---|
| `id` | Stable citation and retrieval identifier. |
| `country_codes` | Countries actually within this record's scope. A regional company's footprint is not every ASEAN country. |
| `topic`, `subtopic` | Regulatory, demand, competition, risk, regional or research-gap context. |
| `sector_tags` | Retrieval hints; not proof that all products or regulations in a sector were researched. |
| `record_type` | `evidence` or `research_gap`. Gap records contain no asserted facts. |
| `facts` | Concise source-supported paraphrase, limited to what was retrieved. |
| `source_ids` | Foreign keys to `sources.json`. Use these to resolve publisher, URL and access method. |
| `source_support` | `page_supported` or `excerpt_supported`; not a legal certainty or attractiveness score. |
| `evidence_period` | Period measured, described or forecast. Null when not established. |
| `effective_from`, `effective_to` | Legal effective dates only where established; null does not mean timeless validity. |
| `reviewed_on` | Date this research summary was prepared/reviewed. Not proof that the source was republished or amended that day. |
| `review_due`, `review_policy_days` | Editorial refresh schedule. A review overdue flag is not a legal expiry date. |
| `unknowns` | Missing applicability, quantitative evidence or current verification. Never fill these automatically. |
| `analyst_inference` | A conditional strategic implication. It must remain an inference when retrieved. |
| `ranking_use` | Macro/policy context cannot alone determine product fit or national attractiveness. |
| `quantitative_metrics` | Value, unit, observation period, measure type and limitations. Do not compare incompatible measures. |
| `entity` | Competitor/partner candidate and the customer job it serves. |
| `market_share`, `pricing` | Null in this release: not independently researched. |
| `supersedes_record_ids` | Explicit evidence lineage; currently empty because this is the first version. |
| `text_for_embedding` | Derived retrieval text. Do not count this copy as separate supporting evidence. |

## Source registry

`source_type` distinguishes government law/guidance, institutional research and company descriptions. `access_method=indexed_excerpt` is used when the relevant material was read through an indexed search extract rather than a complete page. This deliberately avoids claiming full-document review. Some pages returned access errors when opened directly; notes identify material cases.

Source excerpts were summarized, not copied wholesale. The pack does not transfer rights to third-party reports. Retain publisher attribution and verify permissions before storing or distributing complete source texts.

## Dates and versions

Snapshot: **31 October 2026**. Regulations were not comprehensively audited for every amendment. Macro forecasts remain forecasts; 2025 accounts are not 2026 observations. No 2027 outcome is stated as fact. Several reference instruments are older but are included as starting points pending current applicability checks.

## Gaps and confidence

All 11 countries have the three requested categories, but depth differs by product and sector. `coverage.json` counts records, not quality or market attractiveness. A country with fewer competitor examples must not receive a higher score for supposedly “low competition.” A country with more sources must not win because it is easier to retrieve.

There are no independently calculated TAM/SAM/SOM figures, market-share tables, paid price surveys, complete tax/import schedules or comprehensive licensing checklists. Medical products, financial services, education, telecom operations, energy projects, land/property and other regulated activities require additional sector-specific research.

## Recommended refresh process

1. Identify the country, actual product/customer job and entry mode.
2. Reopen applicable original law/regulator sources and check later instruments. For legal conclusions, obtain qualified local review.
3. Check each company's current product page, country availability and commercial terms. Attribute all self-reported claims.
4. For demand, obtain segment-level official statistics, customer interviews, procurement data or credible primary surveys. Do not substitute regional GDP or online attention for willingness to pay.
5. Add a new card or update an existing ID, record the period/source and keep facts separate from hypotheses.
6. Record conflicts and supersession. Do not delete inconvenient counter-evidence.
7. Validate the pack and rebuild the index; preserve the version in saved recommendation reports.
8. Recheck sanctions at transaction/decision time, not merely at the next monthly editorial review.

The default editorial policy is 30 days for regulation, 90 days for demand/competition, and 7 days for operational-risk and sanctions cards. These are proposed maintenance intervals, not guarantees that content remains valid between reviews.
