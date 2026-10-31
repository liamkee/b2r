# Frontend Consolidation — Design Spec

Date: 2026-10-31
Status: Approved (approach A — faithful port)
Repo: https://github.com/liamkee/b2r.git
Worktree: `.worktrees/consolidate-frontend` on branch `feat/consolidate-frontend` (off `feat/home-grid-country-detail`)
Source: `origin/frontend` (Vite React + TS, commit 2683a42)
Target: Next.js App Router framework (current `feat/home-grid-country-detail`, 5e7daf4)
Constraint: Do NOT merge into `main`. No `git merge` of frontend (would delete `app/`).

## 1. Goal

Port the iOS-inspired design language, motion system, and animated ASEAN map from `origin/frontend` into the Next.js B2R framework, preserving all B2R intelligence functionality (11 countries, 3 pillars, industryTemplates, live sources, BYOK enhance, compare).

## 2. Scope (v1)

Must-port (user approved all):
- Design tokens (`frontend/src/styles/tokens.css`, 321 lines)
- Navigation shell (`Navbar`, `MobileTabBar`, `RootLayout`, `PageTransition`, `Logo`)
- Animated ASEAN map (`AseanMap`, `AseanCountry`, `MapConnections`, `MapAmbience`, `LazyAseanMap`, `geo.ts`, `hubs.ts`, `asean-countries-50m.json` ~756KB, `build-asean-topology.mjs`)
- Motion system (`frontend/src/lib/motion.ts`, `useMotionVariants.ts`)

Out of scope:
- Copying `frontend/` Vite app alongside `app/` (rejected)
- `Explore` / `Match` / `Dashboard` placeholder pages and `MatchSearchBar` backend (no backend exists)
- `react-router-dom` routing (replaced by Next.js App Router)
- Changing `data/countries/*.json`, `lib/sources.ts`, `app/api/enhance`, `app/compare`

## 3. Architecture (Approach A — faithful port)

- Next.js stays the framework. No `frontend/` directory copy. No git merge.
- New / modified paths:
  - `app/globals.css` — append tokens as CSS vars + `@theme` exports (`bg-night-800`, `text-gold-400`), glass utilities, dark-only base.
  - `lib/motion.ts` — direct port of `DURATION`, `EASE`, `SPRING`, `fadeUp`, `stagger` presets.
  - `app/components/layout/Navbar.tsx`, `MobileTabBar.tsx`, `SiteShell.tsx` — Next `Link` + `usePathname`, active pill via `layoutId`, `Find matches` CTA -> `/compare` (no `/match` route yet).
  - `app/components/map/*` — port `AseanMap.tsx`, `AseanCountry.tsx`, `MapConnections.tsx`, `MapAmbience.tsx`, `geo.ts`, `hubs.ts`, topology JSON under `public/asean/` or `app/components/map/assets/`, lazy wrapper via `next/dynamic(ssr:false)`.
  - `app/page.tsx` — two-col hero (copy + `IndustryPicker` left, `LazyAseanMap` right) + `CountryGrid` unchanged below.
  - Deps: add `framer-motion` (user chose over CSS-only).
- AGENTS.md exception (documented): `Tailwind only (no UI/chart libs)` and `<150KB first-load JS` are violated by `framer-motion` (~110KB) + map topology. Mitigation: `next/dynamic` code-split, topology parsed once per mount, map below-the-fold on mobile. Exception approved by user 2026-10-31.
- Branch: all work on `feat/consolidate-frontend`. `main` untouched. `origin/frontend` untouched.

## 4. Components

1. Globals: dark-only (`--color-night-950` page, ocean gradient, gold `#ffb700` accent), glass `rgb(28 28 34 / .6-.82)` + `backdrop-blur-xl` + hairline, radii 10-32 + pill, SF/Inter stack, display 44-88px tight-tracked.
2. Layout: sticky `h-14` glass header, desktop pill nav, mobile hamburger sheet + floating bottom tab bar, skip-link, footer.
3. Home hero: `container-page grid lg:grid-cols-2`, left eyebrow `AI matchmaker for ASEAN founders` -> changed to `B2R ASEAN Intelligence`, H1 `One ASEAN. Every Opportunity.`, body, `IndustryPicker`, CTAs `Explore countries` + `Compare markets`. Right `LazyAseanMap` clickable.
4. CountryGrid: unchanged, below hero.
5. Motion: `fadeUp`, `fadeUpSm`, `fade`, `stagger tight/base/loose/map`, `SPRING/SOFT/BOUNCY`, `PRESS/LIFT`, `PageTransition` cross-fade keyed by pathname. `usePrefersReducedMotion` respected.

## 5. Data flow

- Country JSON unchanged, regulation rules preserved (`sourceUrl https + sourceName + lastVerified`).
- Map: `buildMapGeometry(VIEW_W 640, VIEW_H 560, PADDING 30)` once per mount, `projectHubs` client-side, `data-country` attrs for future zoom, `activeId` tooltip via centroid.
- Click country -> `router.push(/countries/[code])` (replaces react-router `Link`).
- No World Bank / FX / GDELT / BYOK changes. No new APIs.

## 6. Error handling

- `ErrorBoundary` around hero/map (port from frontend).
- Map failure -> fallback static country pill list (never blank).
- `prefers-reduced-motion: reduce` collapses to opacity-only.
- Live-tab fallbacks with `last updated` note unchanged.

## 7. Testing

- `pnpm exec vitest run` (6 files / 10 tests baseline green 2026-10-31)
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build`
- Manual: hero loads dark, map animates, clicks navigate, nav works mobile/desktop, reduced-motion checked.

## 8. Risks

- Perf: framer-motion + 756KB topology exceeds <150KB budget. Accepted by user, mitigated by lazy-load.
- `frontend` has 10 countries (no TL Timor-Leste); B2R has 11. Map shows 10, grid shows 11. Documented, not blocking.
- `CLAUDE.md` (frontend) vs `AGENTS.md` (Next.js) conflict on stack. This spec follows `AGENTS.md` except noted exception.
