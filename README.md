# B2R ASEAN Intelligence

Business-to-region intelligence for expanding into Southeast Asia. Pick a
country and an industry, get a tailored view of what matters before you
enter: government regulation, market demand, and the competitor landscape —
grouped by ASEAN country, in English.

## How it works

1. **Pick a country** — all 11 ASEAN members: BN, KH, ID, LA, MY, MM, PH,
   SG, TH, VN, TL. Home shows an animated map plus an 11-card grid.
2. **Pick an industry** (`?industry=`, e.g. `saas`, `fnb`, `retail`,
   `manufacturing`) — each country file carries per-industry templates
   (`regulationFocus`, `marketMetrics`, `competitorAngles`) with a
   `_default` fallback for anything else.
3. **Read the three pillars** on `/countries/[code]`:
   - **Regulation** — curated entries, each with `sourceUrl`, `sourceName`
     and `lastVerified`; per-tab fallback with a "last updated" note.
   - **Market** — live World Bank indicators (IDs stored, values never
     hard-coded) plus a USD FX row; `/compare` puts up to 3 countries
     side by side on market data only.
   - **Competitors** — how-to guidance, sample queries, and live GDELT
     news context.
4. **Optional AI enhance (BYOK)** — paste your own key in the Enhance box;
   it POSTs to `/api/enhance`, the key is cleared after the call and never
   stored, logged, or committed.

## Run

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

## Sources (free, no key)

- countries.dev (`/alpha/{CODE}`) — GeoNames CC BY 4.0
- World Bank Indicators API (`api.worldbank.org/v2`) — WDI
- Frankfurter (`api.frankfurter.app`) — ECB rates
- GDELT DOC 2.0 (`api.gdeltproject.org`) — news context
- Regulation: static curated JSON with sourceUrl + lastVerified (no API exists)

## Stack

Next.js App Router + TypeScript strict, Tailwind only (no UI/chart libs),
`pnpm` + Node 20+. No DB, no auth. Live fetch: 24h revalidate, 5s timeout,
1 retry, never a blank page. Tests: `pnpm exec vitest run` (unit) and
`pnpm test:e2e` (Playwright; `test:e2e:headed` for screen-capture runs).
