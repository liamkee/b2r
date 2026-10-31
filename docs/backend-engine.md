# ASEAN ONE country-entry backend

The Next.js root app now connects Match and Compare to this Node-runtime backend. Match supplies the five-answer intake; Compare reuses its session report or fetches the public country evidence library from `GET /api/knowledge/countries?codes=MY,SG`. Source drawers resolve registry citations, with regulation, demand, competition, execution, gaps and report export. Draft persistence is optional, with reset and storage-failure handling. The independent Node scaffold under `asean-one/` retains its opportunity endpoints. Existing `/api/enhance` remains a separate BYOK prompt preview.

## Data and refresh

`knowledge/asean/` contains the supplied 2026-10-31.v1 starter snapshot: canonical JSONL, source registry, schemas, prompts, coverage, country briefs, derived Markdown, and acceptance specifications. These are researched summaries with recorded access limitations, not live source verification. Opportunity demo fixtures never enter this corpus. This release supports country research; city recommendations require city-specific evidence.

Run `pnpm knowledge:ingest` after updates. Ingestion blocks malformed/duplicate IDs, invalid country/sector tags and source references, unsafe source URLs, missing coverage, broken supersession and inconsistent derived files. A versioned SHA-256 index includes canonical data, schemas and runtime policy. `pnpm build` regenerates it through `prebuild`. The generated JSON is a server-imported asset, so Vercel needs neither Python nor writable runtime storage. Optional original Python checks: `python knowledge/asean/scripts/validate_pack.py` (add `--jsonschema` if installed).

Update source entries and facts together, maintain supersession links, align derived Markdown/ingestion manifest, bump dataset version, ingest and run tests. Publication/effective/observation/editorial dates remain separate. Review-due dates indicate editorial staleness, not legal expiry. Regulatory and sanctions decisions always need current instrument, amendment and applicability checks.

## API contract for the frontend team

`GET /api/knowledge/status` returns version, SHA-256, 11 country names/aliases, sectors, coverage and limits. It contains no keys. `POST /api/recommendations` takes exactly five top-level groups from `knowledge/asean/schemas/business_profile.schema.json`:

1. `industry`: sector, optional subsector/description.
2. `target_countries`: one to eleven codes or familiar aliases; duplicates after normalization rejected.
3. `product`: description plus optional buyer, customer, model, price, base, entry mode, regulated features.
4. `revenue`: pre-revenue, amount/range or nondisclosure; currency, period and metric required for reported revenue.
5. `scalability_targets`: description plus optional metric, baseline, target, timeframe, constraints and explicitly supplied budget.

Nested omitted optional values become explicit unknown/null defaults; no nationality, budget, ownership, ARR or legal eligibility is inferred. Zero is valid; generating revenue cannot combine an amount and range. Revenue is not cash, profit, budget or statutory capital. No FX conversion. Mechanical ratios only use explicit compatible nonmonetary baseline and target measures.

Example (synthetic data, same origin):

```js
const response = await fetch('/api/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    industry: { sector: 'software_saas', subsector: 'Restaurant operations' },
    target_countries: ['MY', 'TH', 'VN'],
    product: { description: 'Inventory and purchasing software for independent restaurant groups', buyer_type: 'B2B', customer_segment: 'Restaurant groups', business_model: 'Subscription' },
    revenue: { status: 'pre_revenue', amount: 0 },
    scalability_targets: { description: 'Validate one market before expanding', metric: 'customers', baseline_value: 20, target_value: 100, unit: 'outlets', horizon_months: 12 }
  })
});
const result = await response.json();
```

Or use `curl --json @knowledge/asean/evals/example_business_profile.json http://localhost:3000/api/recommendations`.

The versioned response envelope includes:

- `report`: exactly `recommendation.schema.json`: mode, summary, abstention/ranking status, all selected countries, five assessment dimensions, competitors/channels where relevant, unknowns and proposed 30/60/90-day tests.
- `retrieval`: BM25 technique, bounded country traces, deduplicated evidence and authoritative sources for citation resolution. This is keyword retrieval, not embeddings. Counters measure coverage, not national attractiveness. Missing evidence stays missing.
- `regulatory_gates`: explicit conditional/unknown applicability rather than clearance.
- `mechanical_calculations`: labelled compatible input arithmetic, not a forecast.
- `execution`: safe fallback reason and actual attempted model-call count; no claim of live source checks.
- `privacy`: server/provider transmission disclosure. Profiles/results are not persisted or publicly cached by this endpoint.

Render text with normal React escaping, never raw HTML. Resolve citation drawer links only from returned `retrieval.sources` and render validated HTTPS links with `rel="noopener noreferrer"`. Show publisher, access method, evidence period, effective/review dates and unknowns. Evidence-only results are unranked research comparisons with verbatim attributed source summaries; unknown product fit never becomes a success score. Competitor candidate overlap is provisional, not proof of direct competition. Do not translate absent competitors into low competition.

The API is same-origin. Serve the repaired frontend and these API routes from the same Vercel project, or deliberately configure a trusted reverse proxy. Browser submissions require JSON. Limits: 32 KiB streamed body, five-second body deadline, schema/string/array caps, four in-flight requests and 30 requests/minute per instance. Errors use safe JSON (`400` validation, `403` origin, `408` read deadline, `413` size, `415` content type, `429` load, `503` internal failure). Local load shedding is not global serverless throttling; configure Vercel Firewall at the project for public evidence endpoint abuse if needed. Every POST response is private/no-store.

## Optional model analysis and spend admission

Default: disabled. No key or paid services needed for useful evidence retrieval. Set the server-only variables in `.env.example` only after selecting a supported model and an operator-approved durable admission service. OpenAI uses the direct [Responses API Structured Outputs format](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), with `store:false`, strict JSON schema, no tools, no browsing, no retry loop, eight-second per-call deadline, 6000 output-token cap, and a 100000-byte cap on the entire serialized request, including policy, schema and JSON overhead. Evidence dates, source access limitations and flags are retained while duplicated embedding text, query traces, source URLs and template fact copies are removed from model input. The public response still contains complete retrieval traces and authoritative source URLs. All 11 countries run sequential batches of at most three (at most four paid calls). No key is sent to the admission service or browser. No live-model test is implied by mocked tests.

Paid mode requires ALL: `ENGINE_PAID_ENABLED=true`, `OPENAI_API_KEY`, explicit `OPENAI_MODEL`, `ENGINE_ADMISSION_URL` (HTTPS) and `ENGINE_ADMISSION_TOKEN`. Setting just a model key never enables paid work. Setting `ENGINE_PAID_ENABLED=false` is the operator kill switch. No external database/service is provisioned by this change.

Admission protocol: server POSTs to the fixed operator URL (redirects forbidden, 2s timeout), bearer `ENGINE_ADMISSION_TOKEN`, JSON `{request_id,client_hash,provider,model,max_calls,max_input_bytes_per_call,max_output_tokens_per_call,lease_seconds}`. The gateway MUST atomically enforce an operator-configured daily spend cap, per-client/global rate limits, and global concurrency with a 60-second lease across all Vercel instances. Reserve worst-case usage for all calls; do not refund failed calls unless billing is known. Use the configured model's current token pricing with conservative input-byte/token bounds, or a stricter request allowance. A successful response must be `{allowed:true,reserved_calls:<exact requested max_calls>}`. Denial, malformed response, timeout or missing config returns evidence-only output and makes zero provider calls. Configure the gateway behind service authentication; do not use a public always-allow mock. `client_hash` is HMAC of Vercel's forwarding header (local dev shares one identity), never raw business data. Do not trust client-supplied identity headers outside the configured host.

Each model batch must pass JSON schema and country/citation/topic/entailment rules. In this starter release the optional model performs conservative evidence extraction: it may select/reorder exact source facts within the trusted report template. Assessments remain unknown, confidence low and countries unranked. Novel recommendations, relationship classifications, free-form conclusions and validation plans require a future reviewed entailment/rubric workflow. Source-fact claims must copy a complete retrieved fact verbatim; paraphrases cannot be established by offline ID checks. This conservative check can reject useful model output, but avoids treating an existing citation as proof of an unrelated assertion. Successful extraction is labelled model-assisted; failure is explicitly evidence-only. Invalid/refused/incomplete/timed-out output falls back for the whole request; no partial ranked result is presented. Retrieved text and business descriptions are untrusted JSON, never system instructions. No confidential input or keys are logged by this code.

## Frontend handoff and deployment

The repaired Next.js frontend is connected: `/match` submits five answers and preserves a session report; `/compare` shows that report or the public country library with country and topic selectors. The submission disclosure explains server/model transmission. Browser draft storage is opt-in, versioned and resettable; malformed/blocked/full storage has safe fallbacks. Report export is available in Compare. Homepage briefs pass through session storage instead of putting business descriptions in URLs.

For Vercel use repository root, existing Next.js preset, Node 20+, `pnpm install --frozen-lockfile`, `pnpm build`. Import routes under the frontend's final same-origin deployment. A feature branch push creates reviewable source; it does not prove `b2r-lake.vercel.app` deployed this code. Verify preview status plus POST against a preview before production promotion. Main/frontend work is preserved by keeping these changes on the backend feature branch.

Validation: `pnpm knowledge:ingest`, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`, `pnpm test:e2e`. Browser tests cover the actual Match API submission, transfer to Compare, citation drawer, country library, mobile overflow and server-error recovery. `PLAYWRIGHT_BASE_URL`, `PLAYWRIGHT_SERVER_COMMAND` and optional `PLAYWRIGHT_EXECUTABLE_PATH` support testing a local production build. Original pack acceptance cases remain specifications, not live-model evaluations. Live source refresh, city data, trained scoring weights, product-specific demand validation and live provider evaluation are not supplied by this snapshot.

Verified locally on 31 October 2026: ingestion passed (78 cards/77 sources/11 countries); 101 Vitest tests and 3 native Node scaffold tests passed; TypeScript passed; changed-file lint passed; full-repository lint had zero errors and one existing anonymous-default-export warning in `postcss.config.mjs`; `corepack pnpm build` passed with both new API routes. Production-server HTTP checks on `127.0.0.1:3101` returned 200 for status and three-/eleven-country POSTs, private/no-store headers, 11 conditional gates and zero model calls. Provider failure/success paths were mocked, not a live-model evaluation. No live-model call, production deployment or browser intake/export check was run. The machine's pnpm 11 release-age check rejected existing lockfile entries on the initial install; using the repository-pinned pnpm 10.33.0 installed successfully without changing those locked frontend versions.
