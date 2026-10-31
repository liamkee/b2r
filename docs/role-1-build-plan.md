# ASEAN ONE — Role 1 build plan

Owner: Rafa — fullstack / technical lead

Prepared: 31 October 2026, Malaysia time

Status: planning document; application implementation has not started in this branch.

## 1. Mission and confirmed scope

Rafa owns the application foundation, database, authentication, shared interfaces, integration, deployment, and release readiness. His output is one working, deployed app that brings the other three teammates' work together.

The earlier ASEAN ONE proposal addresses Startup ASEAN Problem Statement 2: ecosystem fragmentation and a single gateway for discovering opportunities across ASEAN. The initial proof is this founder journey:

1. Describe a startup and its target markets.
2. Retrieve relevant opportunities from a sourced catalogue.
3. Understand match reasons, known eligibility conditions, and missing information.
4. Inspect the original opportunity source.
5. Save an opportunity and find it again after refresh or sign-in.

The repository was checked before preparing this plan. Remote `main` contained only `LICENSE`, at commit `b1a3d0e7c51c17060ac65510acb7b2178412126c`; no open pull requests were returned. This does not establish whether teammates have unpushed work.

Confirmed: Rafa is Role 1. Unresolved: actual submission deadline, pitch duration, final stack, existing teammate work, and database/hosting project ownership. The earlier 48-hour schedule was a planning assumption, not a confirmed deadline.

## 2. Proposed technical baseline

Retain the earlier proposal unless the team has already committed to another setup:

| Area | Proposed choice | Rafa's responsibility |
| --- | --- | --- |
| Application | Next.js App Router, React, TypeScript | One app scaffold and shared server/application structure |
| UI foundation | Tailwind and shadcn/ui | Basic wiring; Role 3 owns design and screen implementation |
| Database and identity | Supabase Postgres and Auth | Schema, migrations, policies, session handling, configuration |
| Matching | Deterministic service supplied by Role 2 | Validated inputs, transport, integration, service configuration |
| Explanations | OpenAI API through server code, supplied by Role 2 | Keep secrets on the server; integrate the fallback contract |
| Hosting | One agreed Vercel project | Preview/release setup and deployment checks |
| Source control | This GitHub repository and small feature branches | Shared-file coordination and integration |

Use one package manager and commit its lockfile. Pin the chosen runtime and dependencies when scaffolding. Do not create a second application, database, or deployment if a teammate already has the canonical one.

Next.js provides an official TypeScript/App Router scaffold. Supabase documents its Next.js integration, cookie-based server/client setup, and access policies. Vercel documents GitHub-triggered deployments. Follow the documentation matching the installed versions; the resources are listed at the end of this plan.

## 3. Ordered backlog

### R1-01 — Establish the shared starting point

**Deliver:** agree the stack, app directory, package manager, shared contracts, integration branch, deployment owner, and demo scenario. Check whether teammates have unpushed code before creating the scaffold.

**Acceptance:** Role 2 and Role 3 can point to the same types, example objects, application directory, and target deployment. Each person knows the next integration milestone.

**Dependencies:** brief input from all teammates; no completed feature is required.

### R1-02 — Scaffold the app and publish a running preview

**Deliver:** minimal app, one lockfile, basic routes, shared types, labelled fixtures, configuration template, setup README, and run/build/lint/typecheck commands. Keep UI work to the functional shell so Role 3 can take it over.

**Acceptance:** another developer can install and start the app using the README. The production build succeeds. A running deployment is reachable and tied to the relevant commit.

**First implementation commit, after stack alignment:** `chore: bootstrap ASEAN ONE app and shared contracts`.

### R1-03 — Create the data model and reproducible migrations

**Deliver:** the three application tables proposed below, ownership policies, constraints, and a repeatable seed/import path. Role 2 supplies the curated catalogue records.

**Acceptance:** a fresh database can be initialized from repository instructions. Re-running the seed process does not duplicate catalogue records. Required source fields and private-record ownership are enforced.

### R1-04 — Implement authentication and per-user access

**Deliver:** one agreed login flow, verified server-side identity, appropriate session handling, and access policies for profiles and saves. Proposed MVP behaviour: public opportunity browsing; sign-in for a saved profile and persistent shortlist.

**Acceptance:** sign-in works on the deployed app; account A cannot read, create, update, or delete account B's private records. Ownership comes from authenticated identity, never an arbitrary submitted user ID.

**Demo:** prepare a repeatable test account/session without committing credentials. A second account is needed for isolation verification. Avoid relying on email delivery during the live presentation.

### R1-05 — Implement the non-AI application backbone

**Deliver:** catalogue list/detail reads, profile read/update, save/unsave, and saved-opportunity reads. Add runtime validation and consistent error responses. Agree filters and pagination with Role 3.

**Acceptance:** real catalogue records and source links appear in the app. A profile and shortlist survive refresh. Repeated saves do not create duplicates. Unsave works. Invalid inputs and unauthenticated requests are handled clearly.

### R1-06 — Integrate matching and the frontend

**Deliver:** integrate Role 2's matching service through the shared contract and replace Role 3's fixtures with real data operations. Keep catalogue facts canonical; explanation output must not overwrite facts such as deadlines or amounts.

**Acceptance:** profile → ranked opportunities → explanation/eligibility → source → save works on the deployment. Unknown eligibility remains visible. Explanation-service failure still returns useful deterministic results and reasons.

**Ownership:** Role 2 owns ranking rules, curation, source verification, and explanation quality. Rafa owns integration and checks that the agreed behaviour survives end-to-end.

### R1-07 — Verify and release the demo

**Deliver:** the focused checks in section 8, a known deployment/commit, demo instructions, and a rehearsal with Role 4.

**Acceptance:** the complete journey works on desktop and mobile, with actual saved state. Role 4 can repeat it without developer intervention and record a backup. The presentation describes only functionality present in that release.

## 4. Minimal database design

This is a proposed model for agreement with Role 2, not an applied migration. Assume one startup profile per user for the first version. Team organizations and multiple startups per account can be added later.

| Table | Essential fields | Access and constraints |
| --- | --- | --- |
| `startup_profiles` | `user_id`, startup name/description, home country, target markets, sectors, stage, needs, timestamps | One profile per authenticated user; owner-only reads and writes |
| `opportunities` | Stable `id`, title, provider, type, markets served, applicant-country rules where stated, sector/stage fit, eligibility information, deadline/status, source URL, source-check date | Readable catalogue; ordinary users cannot rewrite it; controlled seed/import writes |
| `saved_opportunities` | `user_id`, `opportunity_id`, timestamps; optional later pipeline status | Owner-only reads and writes; unique `(user_id, opportunity_id)`; valid foreign keys |

Use Supabase's authentication identity rather than a custom password table. Create migrations and access policies together.

For source data, keep unknown values explicit. Separate the market where a programme operates from the countries whose applicants it accepts. Preserve the original funding currency and amount when provided. Do not interpret a missing deadline as permanently open. Where a source gives only a date or an unclear timezone, retain that limitation instead of inventing an exact closing timestamp.

Save/unsave is required for the first journey. Pipeline stages such as reviewing or applied are a later addition if time permits. A saved opportunity is not evidence of a completed application, investment, or commercial outcome.

### Authentication and access requirements

- Enforce private-record ownership in database policies and server-side operations.
- Verify server-side identity through the supported auth flow; do not trust an unverified cookie or client-supplied owner.
- Use a publishable Supabase key with the authenticated user's context and appropriate Row Level Security for ordinary user operations.
- Keep secret/service-role credentials and model API keys on the server. Elevated credentials bypass normal row-level controls and must not become the default path for ordinary user requests.
- Restrict catalogue writes to the controlled seed/admin process.
- Keep configuration values out of committed source; use a template listing names and purpose.

## 5. Shared contracts and proposed API surface

Rafa coordinates canonical types and validation; teammates can propose changes. Agree these before frontend and matching implementations diverge.

| Contract | Required information |
| --- | --- |
| `StartupProfile` | Home country, target markets, sectors, stage, needs, description |
| `Opportunity` | Stable ID, catalogue facts, source and freshness fields, explicit unknown values |
| `MatchResult` | Opportunity ID, score, reasons, eligibility state, missing information |
| Save operation | Opportunity ID; owner derived on the server |
| Error response | Stable error code, readable message, optional field validation errors |

A proposed route-handler interface is below. Choose one consistent application pattern with the team before implementation; equivalent server actions can be used instead of duplicating every operation.

| Operation | Proposed interface | Owner |
| --- | --- | --- |
| Catalogue with agreed filters | `GET /api/opportunities` | Rafa |
| Opportunity detail | `GET /api/opportunities/:id` | Rafa |
| Current startup profile | `GET /api/profile` | Rafa |
| Update current profile | `PUT /api/profile` | Rafa |
| Ranked opportunities | `POST /api/matches` | Rafa: validation/transport; Role 2: ranking/explanations |
| Current user's saved catalogue | `GET /api/saved-opportunities` | Rafa |
| Save an opportunity | `PUT /api/saved-opportunities/:opportunityId` | Rafa |
| Unsave an opportunity | `DELETE /api/saved-opportunities/:opportunityId` | Rafa |

Use stable opportunity IDs across fixtures, seeds, matching results, and UI state. Agree canonical country, sector, stage, and need values. A match score is relative fit under the selected rules, not a funding-success probability.

Fixtures must be labelled as demo data and have the same shape as real responses. Use them to unblock parallel work; the final demonstration must clearly distinguish any illustrative data from verified opportunities.

## 6. Handoffs and boundaries

| Teammate | Rafa provides | Rafa needs back | Teammate owns |
| --- | --- | --- | --- |
| Role 2: AI/data | Database/import contract, shared types, server integration, environment-variable names | Sourced seed records; matching service; evidence-linked reasons; fallback; eligible/ineligible/unknown examples | Curation, eligibility/ranking logic, source checking, explanation quality |
| Role 3: frontend | Functional shell, contracts/fixtures, authentication state, read/write operations, preview URL | Screens using the shared contracts; responsive states; integration feedback | Design, screen implementation, interaction and accessibility |
| Role 4: filmmaker | Stable release, demo account procedure, truthful capability list, technical explanation | Founder scenario, pitch length, recording cutoff, submission requirements | Story, deck, video, speaking script and submission packaging |

Rafa coordinates changes to migrations, shared types, dependencies, configuration, and deployment. This is a coordination responsibility, not a requirement that every change wait for a formal approval process.

## 7. Proposed repository layout and collaboration

Keep one application at the root unless existing teammate work requires another arrangement.

| Path | Purpose |
| --- | --- |
| `src/app/` | Application routes and agreed server operations |
| `src/components/` | Reusable UI owned primarily by Role 3 |
| `src/lib/contracts/` | Shared types and runtime validation |
| `src/lib/supabase/` | Browser/server clients and session helpers |
| `src/lib/services/` | Application operations and matching adapter |
| `src/lib/matching/` | Role 2's deterministic ranking and explanation modules, if this layout is accepted |
| `supabase/migrations/` | Schema and access-policy migrations |
| `scripts/` | Repeatable data import/seed tools |
| `tests/` | Focused behaviour and integration checks |
| `.env.example` | Variable names and comments, without credentials |
| `README.md` | Setup, run/build, migrations/seed, deployment, demo instructions |

Use small branches and integrate completed increments. Coordinate shared-file edits and dependency changes. Do not overwrite another teammate's work or force-push the integration branch. The project can use one shared development database and one agreed hosting project; any additional environments should solve a real team need.

Configuration names for the proposed Supabase setup include `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Explanation credentials are server-only and owned operationally by the agreed project account. Finalize exact required variables as the integrations are implemented.

Vercel's GitHub integration supports branch previews. Configure required variables and auth callback/redirect settings for the actual deployment URLs, and verify sign-in there. A build succeeding locally does not establish that the hosted configuration is correct.

## 8. Definition of done and focused verification

Run checks that cover the actual product risks. This plan itself does not require application tests; application verification begins with implementation.

- [ ] Fresh checkout installs and starts using documented commands.
- [ ] Build, typecheck, and lint checks pass for the chosen setup.
- [ ] Migrations and seed/import instructions work in a clean environment.
- [ ] Catalogue records and source links come from the agreed dataset.
- [ ] A startup profile survives refresh and a new session.
- [ ] Save is idempotent; unsave works; saved items persist.
- [ ] Account A cannot access or mutate account B's profile or saved rows, including direct backend requests.
- [ ] Malformed inputs produce useful errors; private operations reject unauthenticated requests.
- [ ] Matching output respects the shared schema and preserves eligibility uncertainty.
- [ ] An explanation-service failure leaves usable deterministic matches and reasons.
- [ ] The full journey works on the deployed app at desktop and mobile sizes.
- [ ] Role 4 rehearses the exact release and records a backup demonstration.

Role 2 verifies ranking-rule correctness; Role 3 verifies the responsive experience; Rafa verifies that the integrated app preserves those behaviours and access boundaries.

## 9. Scope and milestone sequence

Required first: profile → sourced catalogue → matching → source/eligibility detail → persistent shortlist → deployment.

Add afterwards: map, more catalogue records, simple pipeline statuses, and expansion guidance grounded in the available material.

Defer from the first build: broad live ingestion, real introduction/messaging workflows, a full talent marketplace, complex organization permissions, match-history analytics, or investment-outcome tracking.

Work in this order:

1. Stack and ownership alignment, shared contracts, initial deployment.
2. Schema/auth and non-AI persistence while Roles 2 and 3 build against contracts.
3. End-to-end integration using real catalogue records.
4. Access checks, failure behaviour, and mobile/desktop verification.
5. Demo freeze, rehearsal, recording, and submission.

Schedule the freeze relative to the actual submission and recording deadline once those are known. Do not use the earlier illustrative 48-hour plan as a factual deadline.

## 10. Decisions needed from the team

1. Actual submission date/time in Malaysia time and permitted pitch/demo duration.
2. Whether the proposed Next.js/Supabase/Vercel baseline is accepted, and whether any teammate has already built a different scaffold.
3. Which Supabase and hosting projects to use, who owns them, and who can configure them. Credentials belong in the appropriate environment configuration, not this document or a public issue.

These are implementation inputs. They do not block preparation of the ownership plan, contracts for discussion, or the initial backlog.

## Technical references

Primary documentation checked while preparing this plan:

- [Next.js installation and scaffold](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase with Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase server-side client and session setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase data security and access policies](https://supabase.com/docs/guides/database/secure-data)
- [Supabase API key types](https://supabase.com/docs/guides/getting-started/api-keys)
- [Vercel GitHub deployments](https://vercel.com/docs/git/vercel-for-github)
