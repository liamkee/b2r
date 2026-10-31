# B2R ASEAN Intelligence

Grouped by ASEAN country: regulation, market, competitors.

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
