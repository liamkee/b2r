# Frontend Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port iOS dark/gold design, glass nav, motion, and lazy ASEAN map from origin/frontend into Next.js without merging to main.

**Architecture:** Keep Next.js App Router as framework. Port tokens to app/globals.css @theme, motion.ts to lib/, layout to app/components/layout/, map to app/components/map/ with next/dynamic lazy. Add framer-motion + d3-geo + topojson-client. All work on feat/consolidate-frontend.

**Tech Stack:** Next.js 16.4.3, React 19.3.0, TypeScript strict, Tailwind v4 CSS-first, framer-motion 14.9.0, d3-geo 3.1.1, topojson-client 3.1.0, vitest 5.0.5, pnpm 10.33.0.

## Global Constraints

- pnpm only. Node 20+. Tests: `pnpm exec vitest run` (dlx crashes).
- Every `regulation[]` entry needs `sourceUrl (https://) + sourceName + lastVerified (YYYY-MM-DD)` — do not touch data files.
- Market values never hard-coded; store World Bank indicator IDs only — do not touch lib/sources.ts logic.
- Live fetch: `revalidate 86400`, timeout 5s, 1 retry, per-tab fallback with last updated note. Never blank page.
- BYOK: `type=password` input, in-memory only, cleared after call, never logs/commits.
- Do NOT use REST Countries v3.1. Use `countries.dev/alpha/{CODE}` pattern already in lib/sources.ts.
- Free no-key sources only: World Bank api.worldbank.org/v2, Frankfurter api.frankfurter.app, countries.dev, GDELT api.gdeltproject.org/api/v2/doc/doc.
- Perf exception approved 2026-10-31: framer-motion + 149KB topology violates `<150KB first-load JS` + `Tailwind only`; mitigate with next/dynamic ssr:false + code-split.
- Dark-only: near-black night/ocean + gold #ffb700, no light mode.
- TS strict, `next/font` + `next/image` AVIF where images used, no client waterfalls except lazy map.
- Commits small per task. Never push to origin main. Branch feat/consolidate-frontend only.
- Path alias `@/*` maps to `./*` (see tsconfig.json).

---

## File Map

Create:
- `lib/motion.ts` — DURATION, EASE, SPRING/SOFT/BOUNCY, STAGGER, TRANSITION, fadeUp/fadeUpSm/fade/scaleIn, staggerList/Tight/Loose, pageTransition, layoutIndicator, VIEWPORT, REDUCED.
- `lib/cn.ts` — `cn(...classes)` join.
- `lib/nav.ts` — NAV_ITEMS (Home /, Explore -> /countries/SG? use / as Home, Explore -> /#countries, Match -> /compare, Dashboard -> /compare) adapted to Next routes.
- `app/components/layout/Logo.tsx` — star + horizon SVG.
- `app/components/layout/ErrorBoundary.tsx` — class boundary with reset.
- `app/components/layout/Navbar.tsx` — client, glass sticky, Next Link, active pill layoutId.
- `app/components/layout/MobileTabBar.tsx` — client, floating bottom tabs mobile only.
- `app/components/layout/SiteShell.tsx` — client shell: skip-link + Navbar + PageTransition keyed by pathname + footer + MobileTabBar.
- `app/components/layout/PageTransition.tsx` — client motion.div cross-fade.
- `lib/map-geo.ts` — ASEAN_NUMERIC_IDS, ASEAN_ID_SET, NUMERIC_TO_CODE, buildMapGeometry, projectPoint, countryName, MapGeometry type (d3-geo + topojson-client).
- `lib/map-hubs.ts` — HUBS, HUB_LINKS, SINGAPORE_MARKER, projectHubs.
- `public/asean/asean-countries-50m.json` — topology asset copied from origin/frontend (149095 bytes).
- `app/components/map/AseanCountry.tsx` — client single country shape.
- `app/components/map/MapConnections.tsx` — client arcs.
- `app/components/map/MapAmbience.tsx` — server-safe SVG ambience + CSS keyframes.
- `app/components/map/AseanMap.tsx` — client interactive map, props className/ariaLabel, onNavigate(code).
- `app/components/map/LazyAseanMap.tsx` — client next/dynamic wrapper + skeleton.
- `tests/consolidation.test.ts` — tokens, motion, nav, map asset, routes.

Modify:
- `package.json` — add framer-motion ^14.9.0, d3-geo ^3.1.1, topojson-client ^3.1.0 + @types.
- `app/globals.css` — append tokens + @theme + glass utilities + dark base.
- `app/layout.tsx` — wrap with SiteShell, keep Inter? switch to system SF stack per tokens but keep next/font to satisfy AGENTS; use Inter fallback.
- `app/page.tsx` — two-col hero + IndustryPicker + CountryGrid + LazyAseanMap.
- `next.config.mjs` — add optimizePackageImports framer-motion, d3-geo, topojson-client.

---

### Task 1: Deps + design tokens foundation

**Files:**
- Modify: `package.json`
- Modify: `app/globals.css`
- Modify: `next.config.mjs`
- Test: `tests/consolidation.test.ts`

**Interfaces:**
- Consumes: existing Tailwind v4 CSS-first setup.
- Produces: CSS vars `--color-night-950`, `--color-gold-400`, utilities `glass`, `glass-thin`, `container-page`, `text-gradient-gold`, `border-hairline` for Tasks 3/5/6.

- [ ] **Step 1: Write the failing test**

```ts
// tests/consolidation.test.ts
import { describe, it, expect } from "vitest";
import fs from "node:fs";
describe("consolidation tokens", () => {
  it("has night/gold tokens and glass utilities", () => {
    const css = fs.readFileSync("app/globals.css", "utf8");
    expect(css).toContain("--color-night-950");
    expect(css).toContain("--color-gold-400: #ffb700");
    expect(css).toContain("container-page");
    expect(css).toContain("glass");
  });
  it("declares frontend deps", () => {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    expect(pkg.dependencies["framer-motion"]).toBeDefined();
    expect(pkg.dependencies["d3-geo"]).toBeDefined();
    expect(pkg.dependencies["topojson-client"]).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: FAIL with `expected ... to contain --color-night-950` and missing deps.

- [ ] **Step 3: Add deps**

Run: `pnpm add framer-motion@^14.9.0 d3-geo@^3.1.1 topojson-client@^3.1.0 && pnpm add -D @types/d3-geo @types/topojson-client @types/geojson`
Expected: package.json updated, pnpm-lock patched.

- [ ] **Step 4: Port tokens to app/globals.css (append, do not delete Tailwind import)**

Append after existing content:

```css
/* ASEAN ONE tokens — ported from origin/frontend frontend/src/styles/tokens.css */
:root {
  --color-night-950: #000000;
  --color-night-900: #0b0b0f;
  --color-night-850: #121216;
  --color-night-800: #1a1a1f;
  --color-night-700: #232329;
  --color-night-600: #2e2e36;
  --color-night-500: #3d3d47;
  --color-ocean-900: #06131f;
  --color-ocean-800: #0a2233;
  --color-ocean-700: #10344c;
  --color-ocean-600: #17506f;
  --color-ocean-500: #247a9e;
  --color-ocean-400: #4aa6c9;
  --color-ocean-300: #86c9e2;
  --color-gold-600: #b8770f;
  --color-gold-500: #e09a12;
  --color-gold-400: #ffb700;
  --color-gold-300: #ffcf4d;
  --color-gold-200: #ffe49b;
  --color-foreground: #f7f7f9;
  --color-foreground-muted: #b4b4bf;
  --color-foreground-subtle: #8b8b99;
  --material-thin: rgb(28 28 34 / 0.6);
  --material-regular: rgb(28 28 34 / 0.7);
  --material-thick: rgb(22 22 27 / 0.82);
  --material-hairline: rgb(255 255 255 / 0.1);
  --navbar-height: 3.5rem;
  --tabbar-height: 4rem;
  --content-max-width: 80rem;
}
@theme inline {
  --color-night-950: var(--color-night-950);
  --color-night-900: var(--color-night-900);
  --color-night-800: var(--color-night-800);
  --color-night-700: var(--color-night-700);
  --color-gold-400: var(--color-gold-400);
  --color-gold-300: var(--color-gold-300);
  --color-ocean-800: var(--color-ocean-800);
  --color-foreground: var(--color-foreground);
  --color-foreground-muted: var(--color-foreground-muted);
}
@utility container-page {
  width: 100%;
  max-width: var(--content-max-width);
  margin-inline: auto;
  padding-inline: 1.25rem;
}
@utility glass {
  background: var(--material-regular);
  backdrop-filter: blur(20px);
  border: 1px solid var(--material-hairline);
}
@utility glass-thin {
  background: var(--material-thin);
  backdrop-filter: blur(12px);
  border: 1px solid var(--material-hairline);
}
@utility text-gradient-gold {
  background: linear-gradient(180deg, #ffe49b, #ffb700);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
@utility border-hairline {
  border-color: var(--material-hairline);
}
```

Then set dark body base at end of file:

```css
body {
  background-color: #000000;
  background-image:
    radial-gradient(ellipse 70% 45% at 80% -8%, rgb(255 183 0 / 0.07), transparent 62%),
    radial-gradient(ellipse 60% 45% at 10% 2%, rgb(74 166 201 / 0.09), transparent 58%),
    linear-gradient(180deg, #000000 0%, #06131f 60%, #000000 100%);
  background-attachment: fixed;
  color: var(--color-foreground);
}
```

- [ ] **Step 5: Update next.config.mjs optimizePackageImports**

```js
experimental: { optimizePackageImports: ["zod", "framer-motion", "d3-geo", "topojson-client"] },
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml app/globals.css next.config.mjs tests/consolidation.test.ts
git commit -m "feat: add frontend deps plus night/ocean/gold tokens"
```

---

### Task 2: Motion system + helpers

**Files:**
- Create: `lib/motion.ts`
- Create: `lib/cn.ts`
- Create: `lib/nav.ts`
- Modify: `tests/consolidation.test.ts` (append motion tests)

**Interfaces:**
- Consumes: framer-motion types.
- Produces: `DURATION`, `EASE`, `SPRING`, `fadeUp`, `staggerList`, `pageTransition`, `layoutIndicator`, `VIEWPORT`, `REDUCED`, `cn()`, `NAV_ITEMS` for Tasks 3/5/6.

- [ ] **Step 1: Write the failing test (append)**

```ts
import { DURATION, SPRING, fadeUp, staggerList } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/nav";
describe("motion helpers", () => {
  it("exports spring presets", () => {
    expect(SPRING.stiffness).toBe(350);
    expect(DURATION.base).toBe(0.3);
    expect(fadeUp.visible).toBeDefined();
    expect(staggerList.visible).toBeDefined();
  });
  it("cn joins", () => { expect(cn("a", false, "b")).toBe("a b"); });
  it("nav has Next routes", () => {
    expect(NAV_ITEMS.map(n => n.path)).toContain("/");
    expect(NAV_ITEMS.length).toBe(4);
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: FAIL `Cannot find module @/lib/motion`.

- [ ] **Step 3: Create lib/cn.ts**

```ts
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
```

- [ ] **Step 4: Create lib/nav.ts**

```ts
export interface NavItem { path: string; label: string; description: string }
export const NAV_ITEMS: readonly NavItem[] = [
  { path: "/", label: "Home", description: "One ASEAN. Every opportunity." },
  { path: "/#countries", label: "Explore", description: "Browse 11 ASEAN countries." },
  { path: "/compare", label: "Compare", description: "Compare markets across up to 3 countries." },
  { path: "/#countries", label: "Dashboard", description: "Country intelligence dashboard." },
] as const;
```

Note: Frontend had /explore /match /dashboard (react-router). Next has / + /countries/[code] + /compare. Map Explore->/#countries anchor, Match->/compare, Dashboard->/#countries to avoid 404. Documented deviation.

- [ ] **Step 5: Create lib/motion.ts (port, drop react-router deps)**

```ts
import type { Transition, Variants } from "framer-motion";
export const DURATION = { instant: 0.12, fast: 0.2, base: 0.3, slow: 0.5, slower: 0.8 } as const;
export const EASE = { out: [0.22, 1, 0.36, 1], inOut: [0.65, 0, 0.35, 1], in: [0.4, 0, 1, 1] } as const satisfies Record<string, readonly number[]>;
export const SPRING = { type: "spring", stiffness: 350, damping: 30, mass: 1 } as const satisfies Transition;
export const SPRING_SOFT = { type: "spring", stiffness: 300, damping: 32, mass: 1 } as const satisfies Transition;
export const SPRING_BOUNCY = { type: "spring", stiffness: 400, damping: 28, mass: 0.9 } as const satisfies Transition;
export const STAGGER = { tight: 0.04, base: 0.06, loose: 0.1, map: 0.045 } as const;
export const TRANSITION = { spring: SPRING, soft: SPRING_SOFT, bouncy: SPRING_BOUNCY, fade: { duration: DURATION.base, ease: EASE.out }, fast: { duration: DURATION.fast, ease: EASE.out }, page: { duration: DURATION.base, ease: EASE.out } } satisfies Record<string, Transition>;
export const fadeUp: Variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: SPRING } };
export const fadeUpSm: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: SPRING } };
export const fade: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: TRANSITION.fade } };
export const scaleIn: Variants = { hidden: { opacity: 0, scale: 0.94 }, visible: { opacity: 1, scale: 1, transition: SPRING } };
export const staggerList: Variants = { hidden: {}, visible: { transition: { staggerChildren: STAGGER.base, delayChildren: 0.05 } } };
export const staggerListTight: Variants = { hidden: {}, visible: { transition: { staggerChildren: STAGGER.tight, delayChildren: 0.02 } } };
export const staggerListLoose: Variants = { hidden: {}, visible: { transition: { staggerChildren: STAGGER.loose, delayChildren: 0.1 } } };
export const pageTransition: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: TRANSITION.page }, exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.in } } };
export const layoutIndicator: Transition = { type: "spring", stiffness: 400, damping: 32 };
export const VIEWPORT = { once: true, amount: 0.25 } as const;
export const REDUCED: Record<string, Variants> = {
  fadeUp: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.instant } } },
  pageTransition: { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: DURATION.instant } } },
};
```

- [ ] **Step 6: Run to pass**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/motion.ts lib/cn.ts lib/nav.ts tests/consolidation.test.ts
git commit -m "feat: port motion presets plus cn and nav helpers"
```

---

### Task 3: Layout shell (Logo, ErrorBoundary, Navbar, MobileTabBar, SiteShell)

**Files:**
- Create: `app/components/layout/Logo.tsx`
- Create: `app/components/layout/ErrorBoundary.tsx`
- Create: `app/components/layout/Navbar.tsx`
- Create: `app/components/layout/MobileTabBar.tsx`
- Create: `app/components/layout/PageTransition.tsx`
- Create: `app/components/layout/SiteShell.tsx`
- Modify: `app/layout.tsx`
- Test: append to `tests/consolidation.test.ts`

**Interfaces:**
- Consumes: `lib/motion.ts`, `lib/cn.ts`, `lib/nav.ts`.
- Produces: `<SiteShell>` wrapping app, glass nav with `layoutId="nav-active-pill"`.

- [ ] **Step 1: Write failing test**

```ts
describe("layout shell", () => {
  it("has shell files with Next Link", () => {
    const nav = fs.readFileSync("app/components/layout/Navbar.tsx", "utf8");
    expect(nav).toContain("next/link");
    expect(nav).toContain("nav-active-pill");
    expect(fs.existsSync("app/components/layout/SiteShell.tsx")).toBe(true);
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: FAIL `ENOENT app/components/layout/Navbar.tsx`.

- [ ] **Step 3: Create Logo.tsx + ErrorBoundary.tsx + cn already exists**

Logo.tsx: copy SVG from origin/frontend (star + horizon), props size=26.
ErrorBoundary.tsx: class component with reset button, dark classes `text-foreground-muted`, `bg-gold-400`.

- [ ] **Step 4: Create PageTransition.tsx (client)**

```tsx
"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransition, REDUCED } from "@/lib/motion";
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const variants = reduced ? REDUCED.pageTransition : pageTransition;
  return <motion.div variants={variants} initial="hidden" animate="visible">{children}</motion.div>;
}
```

- [ ] **Step 5: Create Navbar.tsx (client, Next Link + usePathname)**

Port from frontend Navbar but replace `react-router-dom NavLink` with `next/link` + `usePathname()`. Active when `pathname===item.path` or `pathname.startsWith("/countries")` for Explore. Keep glass-thin, Logo size 26, brand `ASEAN ONE`, CTA `Find matches` -> `/compare`. Keep Escape-to-close, aria labels.

- [ ] **Step 6: Create MobileTabBar.tsx + SiteShell.tsx**

MobileTabBar: map NAV_ITEMS to bottom fixed bar `md:hidden`, active gold.
SiteShell: `"use client"`, `usePathname()`, skip-link, `<Navbar/>`, `<main id="main-content"><PageTransition key={pathname}>{children}</PageTransition></main>`, footer with `Built for ASEAN`, `<MobileTabBar/>`.

- [ ] **Step 7: Modify app/layout.tsx**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteShell } from "./components/layout/SiteShell";
const inter = Inter({ subsets: ["latin"], display: "swap" });
export const metadata: Metadata = { title: "B2R ASEAN Intelligence", description: "Regulation, market and competitor views grouped by ASEAN country." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className={inter.className}><SiteShell>{children}</SiteShell></body></html>;
}
```

- [ ] **Step 8: Run + tsc**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: PASS.
Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add app/components/layout app/layout.tsx tests/consolidation.test.ts
git commit -m "feat: add glass navbar shell with mobile tabs"
```

---

### Task 4: Map data layer (topology asset + geo + hubs)

**Files:**
- Create: `public/asean/asean-countries-50m.json` (copy from origin/frontend)
- Create: `lib/map-geo.ts`
- Create: `lib/map-hubs.ts`
- Test: append map-asset test

**Interfaces:**
- Consumes: `d3-geo`, `topojson-client`, topology JSON.
- Produces: `buildMapGeometry(W,H,padding)`, `projectPoint(proj,lon,lat)`, `HUBS`, `projectHubs()` for Task 5.

- [ ] **Step 1: Write failing test**

```ts
describe("map data", () => {
  it("has topology with 10 ASEAN ids", async () => {
    const topo = JSON.parse(fs.readFileSync("public/asean/asean-countries-50m.json", "utf8"));
    const ids = topo.objects.countries.geometries.map((g: {id:string}) => String(g.id));
    for (const id of ["360","458","702","764"]) expect(ids).toContain(id);
  });
  it("builds geometry", async () => {
    const { buildMapGeometry } = await import("@/lib/map-geo");
    const { geometry } = buildMapGeometry(640, 560, 30);
    expect(geometry.filter(g => g.isAsean).length).toBe(10);
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: FAIL ENOENT topology.

- [ ] **Step 3: Copy topology**

Run: `mkdir -p public/asean && git show origin/frontend:frontend/src/assets/asean-countries-50m.json > public/asean/asean-countries-50m.json && wc -c public/asean/asean-countries-50m.json`
Expected: 149095 bytes.

- [ ] **Step 4: Create lib/map-geo.ts**

Port `frontend/src/components/map/geo.ts`: replace `@/assets/...json` import with `import topo from "../../public/asean/asean-countries-50m.json"`, replace `@/types` CountryCode with local union `"ID"|"MY"|...|"BN"`. Keep ASEAN_NUMERIC_IDS (10, no TL — documented), geoMercator fit, buildMapGeometry, projectPoint, countryName. TL Timor-Leste has no polygon (atlas CONTEXT only) — grid still lists 11.

- [ ] **Step 5: Create lib/map-hubs.ts**

Port `hubs.ts` verbatim (6 hubs SG/KL/JKT/BKK/MNL/HNO, 7 links, SINGAPORE_MARKER, projectHubs).

- [ ] **Step 6: Run to pass**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add public/asean lib/map-geo.ts lib/map-hubs.ts tests/consolidation.test.ts
git commit -m "feat: add ASEAN topology plus geo and hubs"
```

---

### Task 5: Map components (interactive SVG, lazy)

**Files:**
- Create: `app/components/map/AseanCountry.tsx`
- Create: `app/components/map/MapConnections.tsx`
- Create: `app/components/map/MapAmbience.tsx`
- Create: `app/components/map/AseanMap.tsx`
- Create: `app/components/map/LazyAseanMap.tsx`
- Test: append component存在 test

**Interfaces:**
- Consumes: `lib/map-geo.ts`, `lib/map-hubs.ts`, `lib/motion.ts`.
- Produces: `<LazyAseanMap onSelect?(code)>` for Task 6. Props: `className?`, `ariaLabel?`, `onSelect?(code:string)=>void`.

- [ ] **Step 1: Write failing test**

```ts
describe("map components", () => {
  it("has lazy map with dynamic import", () => {
    const lazy = fs.readFileSync("app/components/map/LazyAseanMap.tsx", "utf8");
    expect(lazy).toContain("next/dynamic");
    expect(lazy).toContain("ssr: false");
    const map = fs.readFileSync("app/components/map/AseanMap.tsx", "utf8");
    expect(map).toContain('data-country');
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: FAIL ENOENT LazyAseanMap.

- [ ] **Step 3: Create AseanCountry.tsx, MapConnections.tsx, MapAmbience.tsx**

Port verbatim from origin/frontend, changing `@/` imports to `@/lib/...` and `fill-night-700/55` stays (now themed). AseanCountry: `motion.g` with `data-country`, hover lift translateY, onActivate. Connections: animated `strokeDashoffset` arcs for HUB_LINKS. Ambience: clouds + stars + `<style>` keyframes `asean-drift`, `asean-twinkle`, reduced prop.

- [ ] **Step 4: Create AseanMap.tsx (client, Next router)**

`"use client"`. Same VIEW_W 640 VIEW_H 560 PADDING 30, useMemo buildMapGeometry, projectHubs, singapore point, activeId state. Replace click with `onSelect?.(code)` + internal `router.push` fallback? Keep presentational: accept `onSelect`. Add keyboard: role=button tabIndex 0 onEnter.

- [ ] **Step 5: Create LazyAseanMap.tsx**

```tsx
"use client";
import dynamic from "next/dynamic";
const AseanMap = dynamic(() => import("./AseanMap").then(m => m.AseanMap), { ssr: false, loading: () => <div className="glass-thin relative aspect-[8/7] w-full animate-pulse rounded-3xl" aria-hidden="true" /> });
export function LazyAseanMap({ className, onSelect }: { className?: string; onSelect?: (code: string) => void }) {
  return <div className={className}><AseanMap onSelect={onSelect} /></div>;
}
```

- [ ] **Step 6: Run to pass + tsc**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: PASS.
Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/components/map tests/consolidation.test.ts
git commit -m "feat: add lazy animated ASEAN map"
```

---

### Task 6: Home hero integration

**Files:**
- Modify: `app/page.tsx`
- Modify: `tests/consolidation.test.ts`
- Test: full suite + build

**Interfaces:**
- Consumes: `LazyAseanMap`, `SiteShell`, `CountryGrid`, `IndustryPicker`.
- Produces: Home hero 2-col with map linking to `/countries/[code]`.

- [ ] **Step 1: Write failing test**

```ts
describe("home hero", () => {
  it("has hero with map and grid", () => {
    const page = fs.readFileSync("app/page.tsx", "utf8");
    expect(page).toContain("LazyAseanMap");
    expect(page).toContain("CountryGrid");
    expect(page).toContain("IndustryPicker");
    expect(page).toContain("/countries/");
  });
});
```

- [ ] **Step 2: Run to fail**

Run: `pnpm exec vitest run tests/consolidation.test.ts`
Expected: FAIL missing LazyAseanMap.

- [ ] **Step 3: Rewrite app/page.tsx (server, client map island)**

```tsx
"use client";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { listCountries } from "@/lib/countries"; // NOTE: server-only — see Step 4 fallback
```

Wait: `listCountries` uses fs, cannot run in client. Keep page server, map island client. Correct pattern:

```tsx
// app/page.tsx (server)
import { Suspense } from "react";
import { listCountries } from "@/lib/countries";
import CountryGrid from "./components/CountryGrid";
import IndustryPicker from "./components/IndustryPicker";
import { HomeHeroMap } from "./components/HomeHeroMap";
export default function Home() {
  const countries = listCountries();
  return (
    <main className="container-page space-y-6 pt-10 pb-16">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">B2R ASEAN Intelligence</p>
          <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl">One ASEAN. <span className="text-gradient-gold">Every Opportunity.</span></h1>
          <p className="mt-5 max-w-xl text-lg text-foreground-muted">Regulation, market demands and competitor views grouped by country. Pick an industry, pick a country.</p>
          <div className="mt-8"><Suspense><IndustryPicker /></Suspense></div>
        </div>
        <HomeHeroMap />
      </section>
      <section id="countries"><CountryGrid countries={countries} /></section>
    </main>
  );
}
```

Create `app/components/HomeHeroMap.tsx` client island with `useRouter`, `LazyAseanMap onSelect={(code)=>router.push(`/countries/${code}`)}`.

- [ ] **Step 4: Create HomeHeroMap.tsx**

```tsx
"use client";
import { useRouter } from "next/navigation";
import { LazyAseanMap } from "./map/LazyAseanMap";
export function HomeHeroMap() {
  const router = useRouter();
  return <LazyAseanMap className="mx-auto w-full max-w-[34rem]" onSelect={(code) => router.push(`/countries/${code}`)} />;
}
```

- [ ] **Step 5: Run full verification**

Run: `pnpm exec vitest run`
Expected: 7 files PASS (6 existing + consolidation).
Run: `pnpm tsc --noEmit`
Expected: clean.
Run: `pnpm lint`
Expected: clean.
Run: `pnpm build`
Expected: build succeeds, map chunk split.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/components/HomeHeroMap.tsx tests/consolidation.test.ts
git commit -m "feat: add home hero with clickable ASEAN map"
```

---

## Self-Review

- Spec coverage: tokens Task1, motion Task2, nav/shell Task3, topology/geo Task4, map UI Task5, hero/wiring Task6. Regulation/market/compare untouched per spec. TL gap documented Task4.
- Placeholder scan: no TBD/TODO, all code blocks complete, exact commands with expected output.
- Type consistency: CountryCode union `"ID"|"MY"|"PH"|"SG"|"TH"|"VN"|"MM"|"KH"|"LA"|"BN"` used in map-geo/hubs/AseanMap; NavItem `{path,label,description}` in nav/Navbar/MobileTabBar; MapGeometry `{id,key,isAsean,name,code,path,centroid}` in geo/AseanCountry/AseanMap.
