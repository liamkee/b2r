# ASEAN ONE

Open-access hackathon proof of concept for Startup ASEAN problem statement #2: ecosystem fragmentation.

## Run

Requires Node.js 20+. No external services or dependencies.

```bash
npm start
npm test
npm run check
```

Open http://localhost:3000. Set `PORT` to change the port.

## API

- `GET /api/health`
- `GET /api/opportunities?market=Malaysia&sector=Fintech&type=funding&q=grant`
- `GET /api/opportunities/:id`
- `POST /api/matches` with JSON `{ "description":"...", "homeCountry":"Malaysia", "targetMarkets":["Singapore"], "sectors":["Fintech"], "stage":"MVP", "needs":["funding"] }`

Matching is deterministic (35 points target market, 25 sector, 20 stage, 20 need). Scores indicate rule-based fit, not application success probability. Eligibility remains unknown unless the source supplies eligibility information.

## Architecture

Node.js native HTTP server serves the static UI, versioned catalogue, and matching API. Browser `localStorage` holds the startup draft and saved IDs on the same browser and origin. No accounts, Auth0, Supabase, hosted database, or model API key. Role 2 can replace demo records and extend the deterministic matcher; Role 3 can replace the UI while retaining the API contracts.

**Important:** All included opportunities are illustrative demo records, NOT actual open opportunities. Source URLs provide contextual navigation only and do not verify the fictional listings. Replace with sourced, checked records before claiming real discovery.

## Deployment

Run `node src/server.js` on a Node-compatible host with the `PORT` environment variable supplied by the host. No secret configuration is required. Deployment is not yet configured or live.
