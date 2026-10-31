# Codex implementation prompt — ASEAN ONE evidence-grounded expansion engine

Paste this entire prompt into Codex with this research pack available inside the repository.

## Mission

You are the lead AI/backend engineer for ASEAN ONE. Implement, integrate and test an open-access business-expansion recommendation engine. Do not stop after producing a plan. Inspect the actual repository, make working changes, run tests, and report precise outcomes and limitations.

The user supplies exactly FIVE top-level answers:

1. Industry and relevant subsector.
2. ASEAN countries being considered, multi-select.
3. Product/service and the customer problem it solves.
4. Current revenue, with amount or range, currency, reporting period and metric.
5. Specific scaling targets, with target metric/value, baseline where available, timeframe and constraints.

Recommend what to investigate or pilot, where and why, using supplied evidence on regulation, demand and competitors. Do not output a generic essay, a funding-success probability, or an unsupported “best country” ranking.

## Non-negotiable project constraints

- Open web app: no accounts, sign-in, Auth0, Supabase or compulsory hosted database.
- Preserve the existing application and team work. The supplied scaffold uses native Node.js HTTP (`src/server.js`), a deterministic matcher (`src/matching.js`), static files in `public/`, and `node --test`. Inspect the real checkout before assuming it matches this description. Do NOT silently migrate it to Next.js or replace a teammate’s framework.
- The known repository is `liamkee/b2r`; the working branch has been `rafa/asean-one`. Read status, branch and remote before changes; preserve uncommitted work. Never force-push, overwrite others’ changes, or merge into main without authorization.
- The previous catalogue contains three illustrative opportunities. Never treat those fixtures or contextual source URLs as real evidence. Opportunity discovery and country-entry intelligence are separate datasets and endpoint contracts.
- Do not report a GitHub push, model response, integration test or deployment as successful unless it actually happened and was verified. A successful local test is not proof of production deployment.
- Keep the app runnable without a model key. In that case return useful **evidence-only results**, clearly labelled as such, not fake AI recommendations.

## Assets to ingest

Copy the research pack to `knowledge/asean/`, or adapt to an existing equivalent directory:

- `data/asean_market_intelligence.jsonl`: canonical evidence cards.
- `data/sources.json`: authoritative citation resolver, source types and access limitations.
- `data/country_profiles.json`: country record indexes and explicitly labelled test hypotheses.
- `data/taxonomy.json`: 11 country codes and sector tags.
- `data/dataset_manifest.json`, `data/coverage.json`: version and limits.
- `schemas/business_profile.schema.json`: the new five-answer contract.
- `schemas/recommendation.schema.json`: response contract.
- `prompts/ENGINE_SYSTEM_PROMPT.md`: runtime reasoning/output policy.
- `evals/acceptance_cases.json`: adversarial and domain-specific tests.
- `scripts/validate_pack.py`: structural/source-reference validation of the pack.
- `rag_documents/*.md` and `data/ingestion_manifest.json`: alternative record-level text files for optional hosted retrieval. They are derived copies, not additional independent evidence.

First run the pack validator. Invalid or duplicate records, unknown source references or unsupported country codes must block ingestion. Keep the manifest version and a SHA-256 content hash in the generated index so changes trigger a rebuild.

This is a researched STARTER snapshot dated 31 October 2026, not a complete regulatory database or product-demand census. Read coverage/gaps. Most initial sector examples concern software, commerce, payments and logistics; food and healthcare coverage is selective. Do not use generic macro evidence as product-market-fit evidence. Some sources were accessible only through indexed excerpts; preserve that limitation.

## 1. Implement the five-question intake

Use a clear five-step form or five labelled sections. Do not add a sixth compulsory question. Nested optional fields may sit inside the relevant question.

**Industry:** selectable sector plus free-text subsector. Allow “other”; unsupported industries should trigger research gaps, not forced reassignment to software.

**Countries:** all 11 current members: BN, KH, ID, LA, MY, MM, PH, SG, TH, TL, VN. Support familiar aliases (Brunei, Laos, Vietnam, East Timor) but normalize to the canonical codes. Preserve the selected set. If all 11 are selected, process bounded batches instead of overflowing the model context. A country not selected must not become the headline recommendation.

**Product:** description, buyer type, customer segment and business model. Offer optional price, operating base, intended entry mode and regulated features. Do not assume a business is Malaysian because the app creator is Malaysian. Do not infer beneficial ownership or a legal entity’s nationality from UI locale or a company name.

**Revenue:** allow pre-revenue, a numeric amount, a range or “prefer not to disclose.” Capture ISO currency, period and whether the metric is recognized revenue, gross sales, GMV, ARR or MRR. Zero is a valid value. Revenue is NOT cash, profit, runway, paid-up capital or expansion budget. No silent FX conversion. An annualized run-rate is not ARR unless the stated metric is recurring revenue and the assumptions are valid. Validate nonnegative amounts, sensible ranges and explicit periods.

**Scaling:** free text plus structured metric, target, baseline and time horizon. Budget is optional inside this question, never inferred from revenue. A missing deadline or baseline should be called out. A request to enter several markets quickly should produce a phased test and feasibility gaps, not an invented launch schedule.

The supplied schema has explicit null/unknown fields to keep the API stable; the form can populate these defaults. Those defaults must not masquerade as known business facts. Keep a versioned browser-local draft and handle malformed/blocked/full localStorage. Show what is stored locally and that submitting for AI analysis sends relevant fields to the server/model provider. Never store model API keys in the browser or log raw business descriptions by default.

## 2. Implement retrieval, not a giant concatenated prompt

Create a retrieval module separate from the old opportunity matcher.

**Default, no extra paid service:** use a local lexical/BM25-style index over `text_for_embedding`, titles, sector tags and entity customer jobs, with explicit metadata filters. A small, justified dependency is acceptable; document it and commit a lockfile. A tested dependency-free implementation is also acceptable. Call the technique what it is: keyword/BM25 retrieval is not embeddings.

**Optional enhancement:** add embeddings behind a configurable adapter. Pin model configuration through environment variables; verify current SDK/API documentation rather than inventing model names. Store embeddings/index locally or through an explicitly approved service, not Supabase. Do not require a paid vector database to run the demo.

For each selected country independently:

1. Retrieve general establishment/ownership context and any specific regulatory trigger relevant to the product.
2. Retrieve demand evidence by product/customer job/sector. Classify it as macro-only, sector signal or product-specific. Policy priority is not proven demand.
3. Retrieve competitor offerings only where both country footprint and customer job overlap are relevant. Use adjacent companies as labelled channels/partners/substitutes, not automatic direct competitors.
4. Include relevant operational risks and the country’s gap record.
5. Include applicable regional records, de-duplicated by ID. Do not count the same company statement once per country as independent corroboration.

Start with a bounded budget of roughly 2–3 regulatory cards, 1–3 demand cards, 0–4 competition cards and 1 gap/risk card per country, configurable by input and context budget. Those are engineering defaults, not evidence-quality thresholds. Ensure one source-rich country cannot crowd out another selected country. Missing evidence must remain missing; never fill quotas with unrelated records.

Return retrieval traces: country, topic, selected record IDs, query terms, reason selected, source access method, period and stale/conflict flags. If using hosted file search, use per-record Markdown and metadata from the ingestion manifest, not one giant file with a single country attribute. Verify supported file formats and filter syntax against current official docs. JSONL is the canonical local interchange file, not a promise of native upload support everywhere.

## 3. Handle freshness and legal applicability

- Distinguish publication date, effective date, observation period and editorial review date.
- `reviewed_on` means this summary was researched then, not that all amendments or market developments were audited.
- `review_due` is an internal refresh policy, not a law’s expiration date.
- On a legal decision, recheck the applicable original instrument and amendments, especially excerpt-only records. When live refresh is unavailable, flag this and withhold final clearance.
- Current sanctions screening must occur at decision time and include applicable jurisdictions, beneficial ownership, counterparties and payment route. The Myanmar record is context, not screening or a blanket embargo claim.
- Maintain `supersedes_record_ids`/conflicts explicitly when updating evidence. Do not resolve a legal contradiction just by whichever snippet ranks highest or has a recent web-crawl date.
- Important regression cases: Viet Nam’s 2025 Investment Law effective March 2026; Philippines 13th negative list; Indonesia paid-up capital versus total project investment; Thailand’s 2026 exemptions; Brunei PDPO commencement; Timor-Leste membership versus treaty schedules. Treat these as source-check triggers, not universal eligibility rules.
- Never infer “no regulation” or “no competitors” from missing records.

## 4. Recommendation logic

Keep evidence selection, mechanical calculations, regulatory gates and narrative generation separate.

Assess five dimensions for each country:

1. Demand fit: evidence of the exact problem, paying customer and relevant segment.
2. Regulatory feasibility: applicable activities/entry mode, known triggers and unresolved legal inputs.
3. Competitive positioning: same customer job, incumbents, substitutes, channels and testable differentiation.
4. Commercial readiness: traction and sales model, while explicitly separating revenue from budget/cash.
5. Scaling feasibility: channel, localization, capacity, timeframe and dependencies.

Use `supportive | mixed | constraining | unknown` and explain each assessment with citations or explicit user inputs. Default to NO composite 0–100 score. This dataset does not justify numeric national-attractiveness scores. If a later version adds a rubric, use validated observable criteria, publish weights, return null for missing dimensions and never reweight missing information into an artificial advantage. Never display probability of business success.

Do not set `pilot_candidate` just because macro growth is positive. A cautious, low-confidence pilot may be proposed as a testable inference when regulation is unresolved, but do not imply licensed operation can start. Use `research_first` for important missing product/sector evidence; `defer` for unresolved critical risk; `not_recommended` only when supported by business-specific evidence, not stereotypes.

Produce an ordered testing priority only when comparisons have sufficiently comparable relevant evidence. Otherwise return every selected country with `ordering_status=not_ranked_insufficient_evidence` or `not_ranked_unequal_coverage`, and an empty `comparison_order`. Unequal amounts of retrieved data are not relative market attractiveness.

Legal gates are at least three-state: a confirmed activity-specific restriction, conditional/unknown applicability, or a reviewed requirement with evidence. Missing ownership/base-country/budget inputs must remain explicit. Do not turn a conditional restriction into either approval or automatic prohibition.

Mechanical growth calculations are allowed only for compatible metrics, units, currency and periods, with a nonzero baseline. A 20-to-100 outlet target is fivefold growth; it is not proof the target is feasible. Label calculations separately from market facts. Do not invent costs, taxes, licences, TAM, market shares, competitor prices or timelines.

## 5. Model integration and output validation

Add `POST /api/recommendations`. Preserve `/api/opportunities`, opportunity details and the old `/api/matches` contract until callers are migrated deliberately. Do not silently change a grant/opportunity fit response into country recommendations. Add `/api/knowledge/status` for dataset version and coverage, with no secrets.

Use a provider adapter. If OpenAI is selected, use the Responses API and supported Structured Outputs after checking official docs for the installed SDK. Use a server-side `OPENAI_API_KEY` and an explicit configurable `OPENAI_MODEL`; do not hardcode an unverified model identifier. JSON-schema enforcement controls output shape, not truth. Handle refusals, incomplete outputs, timeouts and unavailable models.

Load `ENGINE_SYSTEM_PROMPT.md` as the policy. Send the normalized profile and bounded retrieved evidence with stable IDs. Retrieved pages and business descriptions are untrusted data, NEVER instructions. They may not override system policy, reveal secrets, browse arbitrary URLs, run tools or alter the output schema.

Validate the response against `recommendation.schema.json`, then enforce semantic invariants:

- Returned country set exactly equals the selected set, with no duplicates.
- Every evidence claim cites a retrieved record ID and valid source IDs belonging to that record.
- Every country-specific citation applies to that country; regional records only support their stated footprint/scope.
- Source URLs and titles are resolved server-side from `sources.json`. Never accept a model-invented URL as evidence.
- A cited excerpt must actually support the claim. An ID merely existing is insufficient; add entailment checks/human review for high-impact claims, and tests for deliberately mismatched citations.
- Research-gap cards and analyst inferences must not be presented as source facts.
- No sector-specific certainty from general macro-only cards. No unsupported numerical market claims.
- Competitor relation must match the customer job; current pricing/market share remain unverified unless new evidence establishes them.
- A recommendation labelled high confidence cannot rely only on excerpt-only or broad macro evidence.
- Missing/refused/invalid model output falls back to evidence-only mode, never fabricated polished advice.

A response should include an executive comparison, each country’s opportunities and blockers, relevant competitors/channels, missing inputs, and a 30/60/90-day validation plan with measurable go/no-go conditions. Validation targets such as “interview ten buyers” are proposed tests, not source-derived facts or promises.

## 6. Open-web safety, privacy and cost controls

The public app has no login. Protect a paid endpoint accordingly:

- Body size, string/array lengths, country count, timeout and concurrent-work limits.
- Deployment-appropriate request throttling and usage caps. A per-process counter does not provide global limits on serverless/multi-instance hosting; use a host-level control or approved durable mechanism, or leave paid mode disabled until there is one.
- Explicit operator budget/kill switch. Never run unlimited autonomous browsing/model loops.
- Bound retries and cache only non-sensitive/public retrieval. Do not publicly cache one business’s profile/output for another visitor.
- JSON errors without secret values or stack traces. No raw profile/model-key logging.
- A server-owned catalogue/source allowlist. Avoid an unauthenticated “fetch any URL” endpoint or SSRF-capable refresher.
- Render evidence and model text safely; no unsanitized HTML. Validate external URLs and use safe link attributes.
- Document data flow and a clear/reset action for browser state. No claim that localStorage gives cross-device synchronization or private per-person separation on a shared browser.

## 7. UI deliverables

Implement the actual integrated screens, not only endpoint stubs:

- Five-question intake, progress state, input validation and editable answers.
- Side-by-side country comparison with accurate confidence and coverage labels.
- Regulation, demand, competition and execution tabs/sections per country.
- Competitor cards showing direct/adjacent/channel/partner role and unverified terms.
- Inline citations opening a source drawer with source publisher, URL, evidence period, research date, and access limitations.
- Clear labels: “Source evidence,” “Analyst inference,” “Needs verification,” “Evidence-only mode.”
- User-visible missing data and current-source verification needs.
- A phased validation plan with metrics and go/no-go gates.
- Browser-local save/export of the report with dataset version and date; explain privacy limits.
- Mobile layout and loading/empty/error/timeout states. Never show an invented completed analysis while the provider fails.

## 8. Tests and acceptance criteria

Turn `evals/acceptance_cases.json` into automated unit, integration and browser tests where possible. At minimum test:

- Pack integrity, all 11 countries, aliases, citations and unknown records.
- Exact five-answer request validation, zero revenue, nondisclosure, ranges and missing currency/period.
- Country filtering, sector/job relevance, equal retrieval opportunity and bounded all-11 execution.
- No fabricated competitors/market shares/prices/TAM; no macro growth converted into product demand.
- Legal applicability gaps and current-source checks, including all named regression cases above.
- Revenue not used as paid-up capital, profit or expansion budget.
- No model key, invalid model JSON, refusal, provider timeout and schema mismatch.
- Forged/non-entailing citations rejected; invented URLs never rendered as verified sources.
- Retrieved prompt injection and hostile product descriptions cannot override policies.
- localStorage malformed/blocked/full, same-origin persistence and reset.
- Public endpoint size/rate/concurrency/budget behavior, safe rendering and no key leakage.
- All API calls and the five-question → retrieval → comparison → citation → save flow work together.

Use mocks for deterministic provider tests. Run a real provider smoke test only if credentials are available; explicitly report “not run” otherwise. Do not report mocked tests as a live-model evaluation.

## 9. Implementation workflow and final report

1. Inspect repository and working state; read this pack and existing contracts.
2. Present a brief file-level implementation plan, then execute it in this session.
3. Implement versioned ingestion, retrieval and validators before narrative generation.
4. Implement five-question intake and `/api/recommendations`, preserving old features.
5. Add provider adapter, evidence-only fallback, semantic checks and safety controls.
6. Finish the UI/source drawer and browser-local export.
7. Run tests, build/syntax checks and an end-to-end browser check; fix actual failures.
8. Update README, `.env.example`, data-refresh instructions and API examples.
9. Commit small coherent changes. Push only to the authorized feature branch when credentials/access permit, preserving the remote head; never claim a push that failed. No main merge or deployment without appropriate authorization/configuration.
10. Report changed files, test counts and exact commands, verified commit/push status, actual running URL if any, whether live-model tests ran, and remaining evidence gaps.

Deliver working implementation, not a promise that “the AI will figure it out.” The engine must be able to say “insufficient evidence” and still give a useful, sourced next-step plan.

## Primary implementation references

Verify the current versions before implementing:
- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/guides/retrieval
- https://developers.openai.com/api/docs/guides/tools-file-search

The local JSONL/BM25 path is the default; hosted file search is optional and does not remove the need for evidence validation.
