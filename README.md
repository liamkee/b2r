# B2R ASEAN Intelligence

Grouped by ASEAN country: regulation, market, competitors.

## Country-entry research backend

The backend now ingests the supplied 11-country research pack and exposes `POST /api/recommendations` and `GET /api/knowledge/status`. It works in evidence-only mode without credentials. Optional model analysis requires explicit server-side configuration and shared spend admission. The frontend intake/comparison screens are being integrated separately.

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
