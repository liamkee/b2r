# B2R ASEAN Intelligence

Grouped by ASEAN country: regulation, market, competitors.

## Country-entry research backend

Match now submits a five-answer business profile to `POST /api/recommendations` and displays sourced country research. Compare reuses that report or loads the country evidence library from `GET /api/knowledge/countries`. All eleven countries are supported. Evidence-only mode works without credentials; optional model analysis requires server configuration and shared spend admission. Saved answers are optional browser-local data; the latest report is kept for the browser session and can be exported.

See [backend contract, refresh and deployment instructions](docs/backend-engine.md). Existing country pages, BYOK Enhance preview and the independent `asean-one/` opportunity scaffold retain their contracts.

## Run

pnpm install
pnpm dev

## Sources (free, no key)

- countries.dev (`/alpha/{CODE}`) — GeoNames CC BY 4.0
- World Bank Indicators API (`api.worldbank.org/v2`) — WDI
- Frankfurter (`api.frankfurter.app`) — ECB rates
- GDELT DOC 2.0 (`api.gdeltproject.org`) — news context
- Regulation: static curated JSON with sourceUrl + lastVerified (no API exists)

## BYOK

Paste key in Enhance box; POSTs to `/api/enhance`; key cleared after call, never stored.
