### Task 2: Data schema + TH/SG seed

**Files:**
- Create: `lib/types.ts`, `lib/countries.ts`, `data/countries/TH.json`, `data/countries/SG.json`
- Modify: `package.json` (add zod)
- Test: `tests/data.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `getCountry(code: string): CountryData`, `listCountries(): { code: string; name: string }[]`; `CountryData` type used by Task 3-5

- [ ] **Step 1: Write the failing test**

```typescript
// tests/data.test.ts
import { describe, it, expect } from "vitest";
import { getCountry, listCountries } from "@/lib/countries";

describe("countries data", () => {
  it("lists TH and SG", () => {
    const codes = listCountries().map((c) => c.code);
    expect(codes).toContain("TH");
    expect(codes).toContain("SG");
  });
  it("TH regulation entries all have sources", () => {
    const th = getCountry("TH");
    expect(th.name).toBe("Thailand");
    for (const r of th.regulation) {
      expect(r.sourceUrl.startsWith("https://")).toBe(true);
      expect(r.sourceName.length).toBeGreaterThan(1);
      expect(/^\d{4}-\d{2}-\d{2}$/.test(r.lastVerified)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm dlx vitest run tests/data.test.ts`
Expected: FAIL with "Cannot find module '@/lib/countries'"

- [ ] **Step 3: Write types + loader + seed JSON (minimal)**

```bash
pnpm add zod
```

```typescript
// lib/types.ts
export interface RegulationItem {
  topic: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  lastVerified: string;
}
export interface CountryData {
  code: string;
  name: string;
  basics: { capital: string; currency: string; languages: string[] };
  regulation: RegulationItem[];
  market: { worldBankCodes: string[]; notes: string };
  competitors: { howTo: string; sampleQueries: string[] };
  industryTemplates: Record<string, { regulationFocus: string[]; marketMetrics: string[]; competitorAngles: string[] }>;
}
```

```typescript
// lib/countries.ts
import fs from "node:fs";
import path from "node:path";
import type { CountryData } from "./types";

const DIR = path.join(process.cwd(), "data", "countries");

export function listCountries(): { code: string; name: string }[] {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as CountryData;
      return { code: j.code, name: j.name };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function getCountry(code: string): CountryData {
  const file = path.join(DIR, `${code.toUpperCase()}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8")) as CountryData;
}
```

```json
// data/countries/TH.json
{
  "code": "TH",
  "name": "Thailand",
  "basics": { "capital": "Bangkok", "currency": "THB", "languages": ["th"] },
  "regulation": [
    {
      "topic": "Foreign ownership",
      "summary": "Foreign Business Act restricts foreign majority in most services; BOI promotion can allow majority with approval.",
      "sourceUrl": "https://www.boi.go.th/",
      "sourceName": "BOI Thailand",
      "lastVerified": "2026-10-01"
    },
    {
      "topic": "Data protection",
      "summary": "PDPA requires consent and cross-border transfer safeguards.",
      "sourceUrl": "https://www.mdes.go.th/",
      "sourceName": "MDES Thailand",
      "lastVerified": "2026-10-01"
    }
  ],
  "market": {
    "worldBankCodes": ["SP.POP.TOTL", "NY.GDP.MKTP.CD", "NY.GDP.PCAP.CD"],
    "notes": "Values fetched live from World Bank; static file stores IDs only."
  },
  "competitors": {
    "howTo": "Add 3 rivals locally; news below is context only, not a ranking.",
    "sampleQueries": ["Thailand fintech funding", "Thailand retail expansion"]
  },
  "industryTemplates": {
    "_default": { "regulationFocus": ["Foreign ownership"], "marketMetrics": ["NY.GDP.PCAP.CD"], "competitorAngles": ["Local pricing"] },
    "saas": { "regulationFocus": ["Data protection", "Foreign ownership"], "marketMetrics": ["NY.GDP.PCAP.CD", "IT.NET.USER.ZS"], "competitorAngles": ["Pricing in THB", "Local payment rails"] }
  }
}
```

```json
// data/countries/SG.json
{
  "code": "SG",
  "name": "Singapore",
  "basics": { "capital": "Singapore", "currency": "SGD", "languages": ["en", "ms", "ta", "zh"] },
  "regulation": [
    {
      "topic": "Business registration",
      "summary": "Register with ACRA; foreign companies need local agent.",
      "sourceUrl": "https://www.acra.gov.sg/",
      "sourceName": "ACRA",
      "lastVerified": "2026-10-01"
    }
  ],
  "market": {
    "worldBankCodes": ["SP.POP.TOTL", "NY.GDP.MKTP.CD", "NY.GDP.PCAP.CD"],
    "notes": "Values fetched live from World Bank; static file stores IDs only."
  },
  "competitors": {
    "howTo": "Add 3 rivals locally; news below is context only.",
    "sampleQueries": ["Singapore startup funding"]
  },
  "industryTemplates": {
    "_default": { "regulationFocus": ["Business registration"], "marketMetrics": ["NY.GDP.PCAP.CD"], "competitorAngles": ["Local pricing"] },
    "saas": { "regulationFocus": ["Data protection"], "marketMetrics": ["NY.GDP.PCAP.CD"], "competitorAngles": ["Pricing in SGD"] }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm dlx vitest run tests/data.test.ts`
Expected: PASS 2 tests

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts lib/countries.ts data/countries/TH.json data/countries/SG.json tests/data.test.ts package.json pnpm-lock.yaml
git commit -m "feat: country data schema plus TH SG seed"
```

---
