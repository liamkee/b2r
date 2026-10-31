### Task 3: Home grid + country detail (static only)

**Files:**
- Create: `app/components/CountryGrid.tsx`, `app/components/IndustryPicker.tsx`, `app/components/RegulationCard.tsx`, `app/countries/[code]/page.tsx`, `app/countries/[code]/loading.tsx`
- Modify: `app/page.tsx`
- Test: `tests/routes.test.ts`

**Interfaces:**
- Consumes: `getCountry`, `listCountries` from Task 2; `CountryData` type
- Produces: `/` and `/countries/[code]` render static tabs; `RegulationCard({ item }: { item: RegulationItem })` used by Task 4 unchanged

- [ ] **Step 1: Write the failing test**

```typescript
// tests/routes.test.ts
import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("routes", () => {
  it("has grid, picker, detail and loading", () => {
    for (const f of [
      "app/page.tsx",
      "app/components/CountryGrid.tsx",
      "app/components/IndustryPicker.tsx",
      "app/countries/[code]/page.tsx",
      "app/countries/[code]/loading.tsx",
    ]) expect(fs.existsSync(f)).toBe(true);
  });
  it("detail page uses generateStaticParams for 11 codes", () => {
    const src = fs.readFileSync("app/countries/[code]/page.tsx", "utf8");
    expect(src).toContain("generateStaticParams");
    expect(src).toContain("Regulation");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm dlx vitest run tests/routes.test.ts`
Expected: FAIL missing files

- [ ] **Step 3: Write minimal implementation**

```typescript
// app/components/IndustryPicker.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = ["saas", "fnb", "retail", "manufacturing"];
export default function IndustryPicker() {
  const router = useRouter();
  const params = useSearchParams();
  const cur = params.get("industry") ?? "saas";
  return (
    <label className="text-sm">
      Industry{" "}
      <select
        value={cur}
        onChange={(e) => router.push(`?industry=${e.target.value}`)}
        className="border rounded px-2 py-1"
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
```

```typescript
// app/components/CountryGrid.tsx
import Link from "next/link";
import Image from "next/image";

export default function CountryGrid({ countries }: { countries: { code: string; name: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {countries.map((c) => (
        <Link key={c.code} href={`/countries/${c.code}`} className="border rounded p-4 hover:shadow">
          <Image src={`https://flagcdn.com/w80/${c.code.toLowerCase()}.png`} alt={c.name} width={80} height={60} />
          <div className="mt-2 font-medium">{c.name}</div>
          <div className="text-xs text-gray-500">{c.code}</div>
        </Link>
      ))}
    </div>
  );
}
```

```typescript
// app/components/RegulationCard.tsx
import type { RegulationItem } from "@/lib/types";

export default function RegulationCard({ item }: { item: RegulationItem }) {
  return (
    <div className="border rounded p-4">
      <div className="font-medium">{item.topic}</div>
      <p className="text-sm mt-1">{item.summary}</p>
      <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs underline mt-2 inline-block">
        {item.sourceName} · verified {item.lastVerified}
      </a>
    </div>
  );
}
```

```typescript
// app/page.tsx
import { listCountries } from "@/lib/countries";
import CountryGrid from "./components/CountryGrid";
import IndustryPicker from "./components/IndustryPicker";

export default function Home() {
  const countries = listCountries();
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">B2R ASEAN Intelligence</h1>
      <IndustryPicker />
      <CountryGrid countries={countries} />
    </main>
  );
}
```

```typescript
// app/countries/[code]/page.tsx
import { getCountry } from "@/lib/countries";
import RegulationCard from "@/app/components/RegulationCard";

export function generateStaticParams() {
  return ["BN","KH","ID","LA","MY","MM","PH","SG","TH","VN","TL"].map((code) => ({ code }));
}

export default function CountryPage({ params, searchParams }: { params: { code: string }; searchParams: { industry?: string } }) {
  const country = getCountry(params.code);
  const industry = searchParams.industry ?? "saas";
  const tpl = country.industryTemplates[industry] ?? country.industryTemplates["_default"];
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{country.name} · {industry}</h1>
      <section>
        <h2 className="font-semibold">Regulation</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          {country.regulation
            .filter((r) => tpl.regulationFocus.length === 0 || tpl.regulationFocus.some((f) => r.topic.includes(f.split(" ")[0]) || true))
            .map((r) => <RegulationCard key={r.topic} item={r} />)}
        </div>
      </section>
      <section><h2 className="font-semibold">Market</h2><p className="text-sm">Live metrics wired in Task 4.</p></section>
      <section><h2 className="font-semibold">Competitors</h2><p className="text-sm">News + BYOK wired in Task 4-5.</p></section>
    </main>
  );
}
```

```typescript
// app/countries/[code]/loading.tsx
export default function Loading() {
  return <main className="max-w-5xl mx-auto p-6">Loading country…</main>;
}
```

- [ ] **Step 4: Run test + typecheck + build**

Run: `pnpm dlx vitest run tests/routes.test.ts && pnpm tsc --noEmit && pnpm build`
Expected: PASS tests, no type errors, build succeeds for TH/SG (other codes fail until Task 6 — wrap `getCountry` in try/catch in this task if build fails, show "Coming soon")

- [ ] **Step 5: Commit**

```bash
git add app tests/routes.test.ts
git commit -m "feat: home grid plus country detail static"
```

---
