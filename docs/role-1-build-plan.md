# ASEAN ONE — Role 1 build plan

Owner: Rafa — fullstack / technical lead

Updated: 31 October 2026, Malaysia time

Status: revised planning document; application implementation has not started in this branch.

## 1. Confirmed direction and mission

ASEAN ONE is an open web app. Anyone can open it and use its core features immediately. Auth0, Supabase, registration, sign-in, accounts, authentication middleware, and account-based storage are excluded from this plan.

Rafa owns the application foundation, shared data contracts, public catalogue and matching interfaces, browser persistence utilities, integration, deployment, and release readiness. His output is one working, deployed app that brings the other three teammates' work together.

The earlier ASEAN ONE proposal addresses Startup ASEAN Problem Statement 2: ecosystem fragmentation and a single gateway for discovering opportunities across ASEAN. The initial proof is this founder journey:

1. Open the app and browse without registering.
2. Enter a startup description and target markets when personalized matching is wanted.
3. Retrieve relevant opportunities from a sourced catalogue.
4. Understand match reasons, known eligibility conditions, and missing information.
5. Inspect the original opportunity source.
6. Save an opportunity and find it again after refresh in the same browser.

For the first prototype, this plan uses a versioned catalogue in the repository and browser-local profiles/saved opportunities. That is the proposed implementation default for an open app, not a claim that open access requires browser-only storage. Cross-device persistence and a shared writable backend would be separate future requirements.

Confirmed: Rafa is Role 1; the app is open and excludes Auth0 and Supabase. Unresolved: actual submission deadline, pitch duration, final frontend/hosting choices, and existing teammate work. The earlier 48-hour schedule was a planning assumption, not a confirmed deadline.

Before this revision, the working branch contained the project licence and this plan. No application dependencies, database, or authentication code had been installed or implemented.

## 2. Proposed technical baseline

| Area | Proposed choice | Rafa's responsibility |
| --- | --- | --- |
| Application | Next.js App Router, React, TypeScript | One app scaffold and shared server/application structure |
| UI foundation | Tailwind and shadcn/ui | Basic wiring; Role 3 owns design and screen implementation |
| Public catalogue | Validated, versioned JSON records in the repository | Data contract, import/validation tooling, list/detail reads |
| Startup profile and shortlist | Browser localStorage with an in-memory fallback | Versioned state format, validated reads/writes, honest persistence feedback |
| Matching | Stateless deterministic service supplied by Role 2 | Validate submitted profile, load canonical catalogue, integrate results |
| Explanations | Optional server-side model integration supplied by Role 2 | Server-only credentials, bounded public requests, deterministic fallback |
| Hosting | One agreed public deployment; Vercel remains the proposed host | Preview/release configuration and public-access checks |
| Source control | This GitHub repository and small feature branches | Shared-file coordination and integration |

Use one package manager and commit its lockfile. Pin the chosen runtime and dependencies when scaffolding. Check for teammates' unpushed work before creating the canonical app. No hosted database or identity service is required for this initial architecture.

The app must browse, match deterministically, and save locally without a model API key. Optional explanations can improve wording when the server integration is configured.

## 3. Ordered backlog

### R1-01 — Establish the shared starting point

**Deliver:** agree the app structure, package manager, shared contracts, integration branch, hosting owner, and demo scenario. Record the open-access requirement so teammates and their coding tools use the same architecture.

**Acceptance:** Role 2 and Role 3 can point to the same types, example objects, catalogue file, application directory, and target deployment.

**Dependencies:** brief input from all teammates; no completed feature is required.

### R1-02 — Scaffold the open app and deploy a running preview

**Deliver:** minimal app, one lockfile, basic public routes, shared types, labelled fixtures, configuration template, setup README, and run/build/lint/typecheck commands. Keep UI work to the functional shell so Role 3 can take it over.

**Acceptance:** another developer can install and start the app using the README. The production build succeeds. The deployed URL is usable while signed out of hosting/developer accounts, with no app login gate.

**First implementation commit, after stack alignment:** `chore: bootstrap open ASEAN ONE app and shared contracts`.

### R1-03 — Implement the public catalogue and data pipeline

**Deliver:** the opportunity contract below, a validated versioned dataset, repeatable import/validation tooling, and catalogue list/detail reads. Role 2 supplies and verifies the curated records; Rafa integrates them.

**Acceptance:** data validation catches duplicate IDs and malformed required fields. Catalogue records and source links appear on the deployment. Re-importing records is repeatable. Public visitors cannot rewrite the catalogue.

**Data sequence:** integrate 12–20 complete records supporting the demo, then expand toward the earlier 50–100-record target as time allows. Clearly separate illustrative fixtures from verified real opportunities.

### R1-04 — Implement browser-local profiles and saves

**Deliver:** client utilities for loading/updating/resetting a startup draft and saving/removing opportunity IDs. Use a versioned local state schema and a consistent interface that Role 3 can consume.

**Acceptance:** a profile and shortlist survive refresh in the same browser and origin when storage is available. Repeated saves do not duplicate entries; unsave works. Missing, malformed, or inaccessible storage does not break browsing or matching.

**User-facing behaviour:** indicate that information is saved in this browser. If persistence is unavailable, continue in memory and explain that current changes will not survive refresh. Provide a deliberate clear/reset action for this app's stored data.

### R1-05 — Integrate the public matching endpoint

**Deliver:** accept the submitted startup profile, validate its shape and size, load the canonical catalogue, and call Role 2's matcher. Return ranked opportunity IDs, reasons, eligibility status, and missing information. This is a stateless request; do not introduce account IDs or a server-side profile store.

**Acceptance:** a visitor gets useful results without credentials. Invalid input receives a useful error. Optional explanation timeouts, absent model configuration, and provider failures still leave deterministic matches and reasons.

**Public-service controls:** bound request sizes and execution time. Limit optional paid explanation usage with controls suitable for the deployment, including an operational budget/disable option. Client-side button disabling and a per-process counter alone are not a deployment-wide limit.

### R1-06 — Connect the frontend and complete the journey

**Deliver:** replace Role 3's fixtures with real catalogue/matching calls and connect the browser-state utilities. Keep catalogue facts canonical; explanation output must not overwrite deadlines, amounts, sources, or eligibility facts.

**Acceptance:** browse → enter startup details → ranked opportunities → source/eligibility detail → save → refresh works on the public deployment. Unknown eligibility stays visible. UI messages accurately describe local storage and explanation availability.

**Ownership:** Role 2 owns ranking rules, curation, source verification, and explanation quality. Rafa owns integration and verifies the agreed behaviour across the whole app.

### R1-07 — Verify and release the demo

**Deliver:** the focused checks in section 8, a known public deployment/commit, resettable demo instructions, and a rehearsal with Role 4.

**Acceptance:** the complete journey works on desktop and mobile. Role 4 can open it without an account, repeat the journey from a clean browser state, show same-browser persistence, and record a backup.

## 4. Data and persistence model

| Data | Where it lives | Essential contents and behaviour |
| --- | --- | --- |
| Public opportunity catalogue | Versioned repository dataset served by the app | Stable IDs, title/provider/type, markets served, applicant-country rules where stated, sector/stage fit, eligibility, deadline/status, original source URL, source-check date |
| Startup draft | Browser-local state | Description, home country, target markets, sectors, stage, needs; no account/user ID |
| Saved opportunities | Browser-local state | Deduplicated opportunity IDs and optional later pipeline status; resolve current details from the canonical catalogue |
| Match response | Request/UI state | Opportunity IDs, scores, reasons, eligibility state, missing information, and explanation availability |

### Browser persistence contract

Use namespaced, versioned storage, for example `asean-one:workspace:v1`, with a schema version, optional startup draft, and saved opportunity IDs.

Implement storage access only on the client. Read and validate existing state before persisting defaults so hydration does not erase a previous shortlist. Catch access, parse, and write failures. Treat stored JSON as untrusted input and bound field/list sizes.

Deduplicate IDs. Handle saved IDs that no longer exist in the catalogue without crashing or inventing a replacement record. Reset only this app's keys, not all storage for the origin. If multiple tabs are supported, refresh UI state on external storage changes and use a documented conflict rule.

The persistence promise is limited to the same browser profile and site origin while its data remains available. It is not cross-device synchronization or private separation between people sharing that browser. Clearing site data removes it; private browsing generally removes it when the private session ends. Distinct preview domains can have different stored state.

Local persistence does not mean the profile never leaves the device: submitting a matching request sends the relevant fields to the server, and optional explanations may send a necessary subset to the configured model service. Avoid storing raw profile payloads in application logs.

### Catalogue facts

Keep unknown values explicit. Separate the market where a programme operates from the countries whose applicants it accepts. Preserve original funding currency and amount where provided. A missing deadline does not establish that an opportunity is open indefinitely. Preserve a date-only or uncertain-timezone deadline without inventing an exact closing timestamp.

Catalogue updates happen through the team's reviewed data/import process and deployment. The public app has no catalogue-write endpoint.

Save/unsave is required for the first journey. Pipeline statuses are optional after that works. Saving a record is not evidence of an application, investment, or commercial outcome.

## 5. Shared contracts and interfaces

Rafa coordinates canonical types and validation. Agree these before frontend and matching implementations diverge.

| Contract | Required information |
| --- | --- |
| `StartupProfile` | Home country, target markets, sectors, stage, needs, description; no user identity |
| `Opportunity` | Stable ID, catalogue facts, source/freshness fields, explicit unknowns |
| `MatchResult` | Opportunity ID, score, reasons, eligibility state, missing information |
| `LocalWorkspace` | Schema version, startup draft, deduplicated saved opportunity IDs |
| Error response | Stable code, readable message, optional field errors |
| Persistence status | Whether the current change was persisted or is available only in memory |

Proposed public server routes:

| Operation | Interface | Owner |
| --- | --- | --- |
| Catalogue with agreed filters/pagination | `GET /api/opportunities` | Rafa |
| Opportunity detail | `GET /api/opportunities/:id` | Rafa |
| Ranked opportunities for a submitted profile | `POST /api/matches` | Rafa: validation/transport; Role 2: ranking/explanations |

Proposed browser-side operations:

| Operation | Interface concept | Owner |
| --- | --- | --- |
| Read/update/reset startup draft | `loadWorkspace`, `updateProfile`, `resetWorkspace` | Rafa's utility; Role 3's UI |
| Read/save/remove shortlist items | `getSavedIds`, `saveOpportunity`, `removeSavedOpportunity` | Rafa's utility; Role 3's UI |

Profile and saved-item operations do not need server endpoints in this prototype. The matching endpoint uses the submitted profile and server-loaded canonical records, not client-supplied claims about opportunity eligibility or benefits.

Use stable IDs across the dataset, matcher, local saves, and UI. Agree canonical country, sector, stage, and need values. A match score measures fit under the selected rules, not funding-success probability.

Keep optional model credentials in server-only configuration/modules. Do not place them in browser storage, `NEXT_PUBLIC_` variables, client props, API responses, or logs. Validate explanation output against the selected catalogue records.

## 6. Handoffs and boundaries

| Teammate | Rafa provides | Rafa needs back | Teammate owns |
| --- | --- | --- | --- |
| Role 2: AI/data | Catalogue/import contract, shared types, public endpoint integration, server configuration interface | Sourced dataset; matcher; grounded reasons; fallback; eligible/ineligible/unknown examples | Curation, source checking, eligibility/ranking rules, explanation quality |
| Role 3: frontend | Open app shell, contracts/fixtures, browser-state utilities, catalogue/matching operations, preview URL | Screens using the contracts; responsive states; local-save feedback; integration feedback | Design, screen implementation, interaction and accessibility |
| Role 4: filmmaker | Public release URL, clean-browser/reset procedure, truthful capability list | Founder scenario, pitch length, recording cutoff, submission requirements | Story, deck, video, speaking script and submission packaging |

Rafa coordinates shared types, local-state versioning, data-loader interfaces, dependencies, configuration, and deployment. Role 2 owns the factual dataset and matcher; Role 3 owns the interface; Role 4 owns the presentation.

## 7. Proposed repository layout and collaboration

Keep one application at the root unless existing teammate work requires another arrangement.

| Path | Purpose |
| --- | --- |
| `src/app/` | Public application routes and catalogue/matching endpoints |
| `src/components/` | Reusable UI owned primarily by Role 3 |
| `src/lib/contracts/` | Shared types and runtime validation |
| `src/lib/storage/` | Client-only workspace persistence and in-memory fallback |
| `src/lib/catalogue/` | Validated dataset loader and query functions |
| `src/lib/matching/` | Role 2's ranking/explanation modules and Rafa's adapter |
| `data/opportunities.json` | Versioned, sourced catalogue |
| `scripts/` | Repeatable catalogue import/validation tools |
| `tests/` | Focused behaviour and integration checks |
| `.env.example` | Optional server integration variables and comments; no credentials |
| `README.md` | Setup, run/build, data validation/update, public deployment, demo/reset instructions |

Use small branches and integrate completed increments. Coordinate shared-file edits and dependency changes. Preserve teammates' work and use the agreed integration process.

Keep the basic app runnable without external service credentials. When optional explanations are configured, document the required server variables and failure behaviour. Vercel remains a proposed hosting choice; whichever host is selected must expose the intended demo URL publicly.

Rehearse using the exact deployment URL that will be presented, because browser storage is origin-specific. A successful local build does not establish that the public deployment and server configuration work.

## 8. Definition of done and focused verification

This document is a plan. Application verification begins with implementation.

- [ ] Fresh checkout installs and starts using documented commands, without identity/database service configuration.
- [ ] Build, typecheck, and lint pass for the chosen setup.
- [ ] The deployed URL opens in a clean browser without app or hosting sign-in.
- [ ] Catalogue validation rejects malformed records and duplicate IDs.
- [ ] Real source links and eligibility information appear from the agreed dataset.
- [ ] Profile and saves survive refresh in the same browser/origin when storage is available.
- [ ] Save is idempotent, unsave works, and reset affects only this app's data.
- [ ] Missing, malformed, blocked, or full storage leaves a usable app and accurate persistence feedback.
- [ ] Startup draft hydration does not overwrite previously saved state with defaults.
- [ ] A separate browser profile starts with separate local state; shared-browser behaviour is described accurately.
- [ ] Removed catalogue IDs are handled without crashing the shortlist.
- [ ] Matching accepts public requests, validates input, and preserves eligibility uncertainty.
- [ ] Missing model configuration, timeouts, or provider failures leave deterministic matches and reasons.
- [ ] Optional paid calls have bounded public usage and server-only credentials.
- [ ] The full journey works on the deployed app at desktop and mobile sizes.
- [ ] Role 4 rehearses the exact URL from a clean state and records a backup.

Role 2 verifies ranking-rule correctness; Role 3 verifies the responsive experience; Rafa verifies the integrated behaviour, local persistence, public accessibility, and server integration.

## 9. Scope and milestone sequence

Required first: open app → browse/describe startup → sourced catalogue/matching → source and eligibility detail → browser-local shortlist → public deployment.

Add afterwards: map, more catalogue records, simple local pipeline statuses, and expansion guidance grounded in available material.

Defer from the first build: broad live ingestion, real introduction/messaging workflows, a full talent marketplace, cross-device state synchronization, server-side profile/history storage, and investment-outcome tracking.

Work in this order:

1. Shared contracts, open app scaffold, initial public deployment.
2. Validated catalogue and browser persistence while Roles 2 and 3 build against the contracts.
3. Public matching integration and the complete founder journey.
4. Storage/failure checks and desktop/mobile verification.
5. Demo freeze, clean-state rehearsal, recording, and submission.

Schedule the freeze relative to the actual submission and recording deadline once known. The earlier illustrative 48-hour plan is not a factual deadline.

## 10. Remaining implementation inputs

1. Actual submission date/time in Malaysia time and permitted pitch/demo duration.
2. Whether Next.js/Tailwind remains the team's chosen frontend foundation, and whether anyone has an existing scaffold.
3. Which public hosting project to use and who can configure it.

No authentication-provider or database-project setup is required. Browser-only persistence is the initial implementation default; revisit it only if a concrete shared or cross-device persistence requirement appears.

## Technical references

- [Next.js installation and scaffold](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js environment variables and browser exposure](https://nextjs.org/docs/app/guides/environment-variables)
- [MDN localStorage behaviour and limitations](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Vercel GitHub deployments](https://vercel.com/docs/git/vercel-for-github)
