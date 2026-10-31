# B2R ASEAN Intelligence — Design Spec

Date: 2026-10-31
Status: Approved (approach A — static-first)
Repo: https://github.com/liamkee/b2r.git
Checkout: /Users/liam/Documents/Coding/aseanone (branch main)

## 1. Goal

Next.js web app grouped by ASEAN country to help any-industry business understand:
1. Government regulation
2. Market demands
3. Competitor analysis

User selects country + industry, sees tailored view. Hybrid: static base + live free APIs + optional BYOK AI enhance.

## 2. Scope (v1)

- Countries (11): BN Brunei, KH Cambodia, ID Indonesia, LA Laos, MY Malaysia, MM Myanmar, PH Philippines, SG Singapore, TH Thailand, VN Vietnam, TL Timor-Leste.
- Industries: generic templates, starter set: saas, fnb, retail, manufacturing. Any other industry falls back to generic template.
- Pages: `/` grid, `/countries/[code]` detail (3 tabs), `/compare` market-only (max 3), `/api/enhance` BYOK proxy.
- EN only, no auth, mobile-responsive.
- Out of scope v2: auth, CMS, DB history, auto regulation scraping, AI without key, regulation compare.

## 3. Architecture (Approach A)

- Next.js App Router + TypeScript, `app/` only. Tailwind only, no component-lib bloat.
- Static-first: country pages pre-rendered (SSG). Live data fetched server-side with `revalidate: 86400`.
- Data files: `data/countries/{code}.json` (lowercase or upper, locked: uppercase `TH.json` pattern → `data/countries/TH.json`).
- No secrets at build. No DB. Edge-cacheable.

Routes:
- `app/page.tsx` — grid + `?industry=` picker
- `app/countries/[code]/page.tsx` — header + 3 tabs (server components per tab for independent failure)
- `app/compare/page.tsx` — `?codes=TH,SG&industry=saas`, market table only
- `app/api/enhance/route.ts` — POST { code, industry, userKey, context } → LLM, never logs/stores key. 429 + 400 on missing key.

## 4. Data model

`data/countries/TH.json` shape:
```json
{
  "code": "TH",
  "name": "Thailand",
  "basics": { "capital": "Bangkok", "currency": "THB", "languages": ["th"] },
  "regulation": [
    {
      "topic": "Foreign ownership",
      "summary": "1-2 sentences, plain language",
      "sourceUrl": "https://...",
      "sourceName": "BOI Thailand",
      "lastVerified": "2026-10-01"
    }
  ],
  "market": {
    "worldBankCodes": ["SP.POP.TOTL", "NY.GDP.MKTP.CD", "NY.GDP.PCAP.CD", "NE.EXP.GNFS.ZS", "BX.KLT.DINV.WD.GD.ZS"],
    "notes": "Short caveats"
  },
  "competitors": {
    "howTo": "Add 3 rivals locally; news below is context only",
    "sampleQueries": ["Thailand fintech funding", "Thailand retail expansion"]
  },
  "industryTemplates": {
    "saas": { "regulationFocus": ["Data protection", "Foreign ownership"], "marketMetrics": ["NY.GDP.PCAP.CD", "IT.NET.USER.ZS"], "competitorAngles": ["Pricing in THB", "Local payment rails"] }
  }
}
```
Rules: every `regulation[]` entry requires `sourceUrl + sourceName + lastVerified`. Market values never hard-coded, only indicator IDs. Generic fallback template `"_default"` required.

## 5. Base data sources (free, no-key) — verified 2026-10-31

| Pillar | Source | Endpoint / usage | Auth | License / attribution |
|---|---|---|---|---|
| Basics | countries.dev | `https://countries.dev/alpha/{TH}` — capital, currency, lang, population | none, verified working | GeoNames CC BY 4.0, flags via flagcdn.com |
| Market | World Bank Indicators API | `https://api.worldbank.org/v2/country/{code}/indicator/{id}?format=json` — POP, GDP, GDP/capita, exports, FDI | none per docs (docs: "keys no longer necessary"); live test 502 via sandbox fetch, implement with cache+fallback+retry | World Bank Terms of Use, cite WDI |
| Market FX | Frankfurter | `https://api.frankfurter.app/latest?from=USD` — THB, SGD, etc. | none, verified working | ECB reference rates |
| Competitor/news | GDELT DOC 2.0 | `https://api.gdeltproject.org/api/v2/doc/doc?query=...&mode=artlist&maxrecords=5&format=json` | none, verified working (2 articles returned for "Thailand investment") | GDELT, link outlet + seendate |
| Regulation | Static curated (no API) | ASEAN Secretariat, national gazette/ministry, WTO, WIPO, World Bank Doing Business archive | n/a | Every card links source + date; no unsourced claims |

No free no-key API exists for private competitor data or consolidated regulation — v1 uses user-entered rivals + news context. REST Countries v3.1 legacy is deprecated (returns deprecation error, requires v5 key) — do NOT use.

## 6. Data flow

1. Build: bundle JSON, pre-render 11 pages.
2. Request: load JSON → parallel server fetches (5s timeout, 1 retry) to 4 sources above with 24h cache. Each tab independent.
3. Enhance (BYOK): client form (industry select + key `type=password`, in-memory only) → POST `/api/enhance` with country JSON + live metrics as context → returns markdown. No key → button disabled + explainer. Key never written to disk/log/repo.

## 7. UI

- Home: 11 cards (flag via `next/image` flagcdn, name, capital, population, GDP). Industry picker syncs to `?industry=`.
- Detail: header (flag, basics, FX vs USD) + tabs. Regulation: cards with source link + verified badge. Market: table + simple bars (no chart lib v1, CSS bars). Competitors: 3 local inputs (useState, not persisted) + GDELT list (title, outlet, date, link) + BYOK generate.
- Compare: market-only table.
- Loading: route-level `loading.tsx` skeletons. Empty: fallback text + source link, never blank.

## 8. Speed (repo fast)

- Tailwind only, `next/font`, `next/image` AVIF, no chart/map libs.
- `revalidate 86400`, field trimming (`?fields=` where supported), no client waterfalls.
- Budget: <150KB first-load JS, Lighthouse >90, `pnpm build` clean.

## 9. Errors & testing

- Per-island failure: tab shows "Live data unavailable — showing last static snapshot (date) + source link".
- `/api/enhance`: 400 missing key/industry, 502 LLM fail with message, never leak key in error.
- Checks: `pnpm lint && pnpm tsc --noEmit && pnpm build`; smoke TH + SG render 3 tabs; block network → fallback renders; empty key → 400.

## 10. Implementation order (for plan)

1. Remote + Next.js scaffold + Tailwind + font
2. Data schema + 2 sample countries (TH, SG) + types
3. Home grid + detail tabs (static only)
4. Live API wiring + cache/fallback
5. Compare + BYOK route
6. Remaining 9 countries data + verify + docs
