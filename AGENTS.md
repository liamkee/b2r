# AGENTS.md — B2R ASEAN Intelligence

## What this is

Next.js App Router web app grouped by ASEAN country (11: BN KH ID LA MY MM PH SG TH VN TL).
Each country page shows 3 pillars: 1) government regulation 2) market demands 3) competitor analysis.
Any-industry via `industryTemplates` in JSON. Hybrid: static JSON + live free APIs + optional BYOK AI enhance.

## Stack

- Next.js App Router (latest, 16.x verified) + TypeScript strict, Tailwind only (no UI/chart libs)
- pnpm only. Node 20+. `next/font` + `next/image` AVIF required. Tests: `pnpm exec vitest run` (dlx crashes in this env).
- No DB, no auth. EN only v1.

## Commands

```bash
pnpm install
pnpm dev
pnpm dlx vitest run
pnpm tsc --noEmit
pnpm lint
pnpm build
```

## Structure

- `app/page.tsx` — 11-card grid + `?industry=` picker
- `app/countries/[code]/page.tsx` — header + 3 tabs, `generateStaticParams` for 11 codes
- `app/compare/page.tsx` — market-only table, max 3 codes
- `app/api/enhance/route.ts` — POST `{code, industry, apiKey}` → `{markdown}`, 400 if missing, never log/store key
- `lib/types.ts` — `CountryData`, `RegulationItem`
- `lib/countries.ts` — `getCountry(code)`, `listCountries()`
- `lib/sources.ts` — `fetchWorldBank`, `fetchFx`, `fetchGdelt`, `fetchBasics` (each returns `{ok, data, updatedAt}`, 5s timeout, 24h revalidate)
- `data/countries/{CODE}.json` — uppercase (`TH.json`), IDs only for market values
- `docs/superpowers/specs/2026-10-31-b2r-asean-design.md` — spec (source of truth)
- `docs/superpowers/plans/2026-10-31-b2r-asean.md` — 6-task plan

## Rules (from spec — do not violate)

- Every `regulation[]` entry needs `sourceUrl (https://) + sourceName + lastVerified (YYYY-MM-DD)`.
- Market values never hard-coded; store World Bank indicator IDs only.
- Live fetch: `revalidate 86400`, timeout 5s, 1 retry, per-tab fallback with "last updated" note. Never blank page.
- BYOK: `type=password` input, in-memory only, cleared after call, never in logs/commits.
- Do NOT use REST Countries v3.1 (deprecated, needs key). Use `countries.dev/alpha/{CODE}`.
- Free no-key sources: World Bank `api.worldbank.org/v2`, Frankfurter `api.frankfurter.app`, countries.dev, GDELT `api.gdeltproject.org/api/v2/doc/doc`.
- Perf: <150KB first-load JS, no client waterfalls, field trimming.
- Commits: small, per task; push to `origin main` (`https://github.com/liamkee/b2r.git`).

## Adding a country

Copy `data/countries/TH.json` shape verbatim, swap capital/currency/languages, 1–2 regulation entries with official source + date, `_default + saas` templates. Run `pnpm dlx vitest run tests/all-countries.test.ts`.
