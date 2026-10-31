### Task 1: Scaffold + remote + fast baseline

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Modify: none (empty repo except `docs/`)
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `pnpm dev` runnable app; `app/layout.tsx` exports `metadata`; `next.config.mjs` exports images remotePatterns for flagcdn

- [ ] **Step 1: Verify toolchain**

```bash
node -v
pnpm -v
```

Run: `node -v && pnpm -v`
Expected: PASS with `v20+` and `9+` (any 20+/9+ is fine, record versions in commit message body)

- [ ] **Step 2: Scaffold Next.js (do not overwrite docs/)**

```bash
pnpm dlx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-pnpm --skip-install
pnpm install
```

Run: `ls app/page.tsx next.config.mjs`
Expected: PASS both files exist; `ls docs/superpowers/specs` still shows spec file (scaffold must not delete docs)

- [ ] **Step 3: Write failing smoke test**

```typescript
// tests/smoke.test.ts
import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("scaffold", () => {
  it("has app layout and fast config", () => {
    expect(fs.existsSync("app/layout.tsx")).toBe(true);
    const cfg = fs.readFileSync("next.config.mjs", "utf8");
    expect(cfg).toContain("flagcdn");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm dlx vitest run tests/smoke.test.ts`
Expected: FAIL with "Cannot find module" or "flagcdn" assertion (config not yet tuned)

- [ ] **Step 5: Write minimal fast config + layout**

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "flagcdn.com" }],
  },
  experimental: { optimizePackageImports: ["zod"] },
};
export default nextConfig;
```

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "B2R ASEAN Intelligence",
  description: "Regulation, market and competitor views grouped by ASEAN country.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

```bash
pnpm add -D vitest
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm dlx vitest run tests/smoke.test.ts`
Expected: PASS 1 test

- [ ] **Step 7: Wire remote + commit + push**

```bash
git remote get-url origin || git remote add origin https://github.com/liamkee/b2r.git
git add -A
git commit -m "feat: scaffold Next.js fast baseline"
git push -u origin main
```

Run: `git remote -v && git log --oneline -1`
Expected: PASS origin points to `liamkee/b2r.git`; if push fails on auth, stop and ask user to auth (do not proceed without push)

---
