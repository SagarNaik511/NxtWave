# AI Sprint — Project Context

## Current status

The initial workspace inspection on 2026-10-28 found no source files, configuration files, tests, database migrations, or Git metadata. Sections 1–7 have since established the application foundation, public registration/referral flow, authenticated growth dashboard, campaign operations, and production hardening.

The application will be built incrementally for the NxtWave Growth Intern recruitment challenge. The working product name is **AI Sprint — Workshop Registration & Growth Platform**.

## Product context

The product supports a free online workshop:

> Build Your First AI Project in 60 Minutes

The simulated campaign target is 500 genuine registrations in 7 days with a total marketing budget of ₹2,000. The application must never present that target as an achieved result unless persisted campaign data proves it.

Primary users:

- Students who discover the workshop, register, receive a referral code, and share it.
- Administrators who authenticate and monitor registrations, referrals, channels, ambassadors, and campaign exports.

## Planned architecture

Keep the frontend and backend in separate top-level directories:

- `frontend/`: React, Vite, TypeScript, React Router, Lucide React, Recharts, and plain CSS with CSS variables.
- `backend/`: Python, Django, Django REST Framework, and PostgreSQL integration.
- `docs/`: setup, API, business rules, testing, and deployment documentation as needed.

The frontend communicates with the backend only through REST APIs. PostgreSQL is the source of truth for registrations, referrals, campaign configuration, and metrics. Browser `localStorage` must not be used as a permanent database. Secrets and environment-specific configuration must be supplied through environment variables.

Django's built-in authentication system will protect administrator access. Public endpoints must not expose student personal information. The frontend, backend, and database should remain independently deployable.

## Core business rules

- A registration is counted only after it has been validly persisted.
- Duplicate registration attempts must be rejected deterministically using appropriate database constraints and validation.
- A referral is successful only when the referred student completes a valid registration.
- Referral attribution policy must be documented and deterministic; the initial planned policy is first valid referral attribution captured on the registration flow, subject to implementation review.
- Public metrics and dashboard metrics must be derived from persisted records, never hard-coded.
- Any seed or sample records must be clearly labeled as demo data and must not be presented as live campaign performance.
- Administrative endpoints require authentication and authorization.

## Coding conventions

- Work in numbered sections and keep each section independently reviewable.
- Inspect existing code before editing; preserve unrelated working changes.
- Prefer small, typed, modular components and services over monolithic files.
- Keep API contracts explicit and validate input at both the API and database boundaries.
- Use accessible semantic HTML, keyboard-operable controls, readable contrast, responsive layouts, and clear loading/error/empty states.
- Do not leave controls that appear functional without an implemented action or an explicit disabled state.
- Avoid fake API responses in production paths.
- Keep visual styling in maintainable CSS with shared variables and restrained animation.
- Add tests alongside meaningful backend and frontend behavior.
- Use environment examples rather than committing secrets.

## Recommended implementation sequence

1. **Section 1 — Repository and development foundation**: create the frontend/backend directory structure, initialize tooling, define environment examples, add a local development mode, and document commands.
2. **Section 2 — Backend domain model and persistence**: configure Django, PostgreSQL settings, models, constraints, migrations, admin authentication, and business-rule tests.
3. **Section 3 — Public registration APIs**: implement validated registration, duplicate protection, referral creation/attribution, safe public responses, and API tests.
4. **Section 4 — Public workshop experience**: build the responsive landing page, registration form, validation/error states, confirmation, referral-link presentation, and WhatsApp share action.
5. **Section 5 – Authenticated growth analytics**: implement secure administrator token access, campaign configuration, protected dashboard APIs, target progress, daily registrations, and the ambassador leaderboard.
6. **Section 6 – Campaign operations**: add controlled campaign management and registration export functionality without weakening authorization or data-integrity rules.
7. **Section 7 – Hardening and quality**: complete accessibility review, responsive QA, security checks, error handling, test coverage, linting, production builds, and deployment documentation.

Each section should end with relevant tests, lint checks, and builds where applicable. Fix regressions before moving to the next section.

## Initial checklist

- [x] Inspect the supplied workspace.
- [x] Confirm whether an existing application is present.
- [x] Create root-level project context and implementation plan.
- [x] Establish frontend and backend scaffolding.
- [x] Define the first API contract (`GET /api/health/`).
- [x] Implement the public workshop landing page and temporary `/register` route.
- [x] Implement the backend registration model and persistence foundation.
- [x] Implement the student registration workflow (without referral attribution).
- [x] Implement student ambassador referral tracking and code validation.
- [x] Implement the authenticated growth dashboard and live aggregate analytics APIs.
- [x] Add persisted campaign management, reporting controls, and aggregate CSV export.
- [x] Complete production hardening, deployment preparation, and automated QA.
- [ ] Complete browser-based manual QA before launch.

## Section 2 progress

The public workshop experience is now implemented in the frontend. It includes responsive navigation, the landing-page content sections, an illustrative non-specific workspace visual, accessible FAQ expansion, CTA routing, and a clearly labeled registration placeholder. The existing API client remains intact; no registration backend or database behavior was added in this section.

## Section 3 progress

The registration workflow is now implemented end-to-end:

- `POST /api/registrations/` accepts `full_name`, `email`, `college_name`, `branch`, `graduation_year`, and optional `referral_code`.
- Emails are trimmed and case-normalized before persistence, with a database-level unique constraint.
- Duplicate normalized emails return `409 Conflict`; invalid fields return `400 Bad Request` with field-specific errors.
- The endpoint is POST-only and has no unauthenticated registration listing.
- Before Section 4, `referral_code` was accepted only for request compatibility; it is now resolved against active ambassadors and stored through the authoritative foreign key.
- The frontend registration form includes client/server validation, loading, success, duplicate, and network-error states.

## Section 4 progress

Student ambassador referral tracking is now implemented without analytics or ambassador authentication:

- `Ambassador` lives in `apps.referrals` with normalized uppercase unique codes, active/inactive status, timestamps, ordering, and readable string output.
- `Registration.ambassador` is nullable, uses `SET_NULL`, and is the only authoritative attribution record.
- `POST /api/registrations/` rejects unknown or inactive codes and safely handles duplicate emails.
- `GET /api/referrals/validate/<referral_code>/` returns `200` with either minimal active ambassador details or `valid: false` for unknown/inactive codes.
- `seed_demo_ambassadors` is repeatable and creates only three clearly labeled fictional ambassadors; it does not create student registrations or metrics.
- The registration form keeps referral codes editable, validates them on blur or explicit action, invalidates stale responses, and allows registration without a code.

## Section 5 progress

The authenticated growth analytics dashboard is now implemented:

- Staff-only Django authentication uses DRF token authentication; login issues a token and logout deletes it. The frontend keeps the token in memory and never uses browser storage as a database.
- `GET /api/analytics/overview/`, `/daily/`, and `/ambassadors/` calculate live aggregate metrics from persisted registrations and ambassador attribution records.
- Campaign target, duration, budget, timezone, and optional start date use environment values as first-run defaults and are now persisted through the campaign settings singleton. The default start date is unset, so the product reports all-time totals and explicitly avoids fabricating a daily campaign history.
- The dashboard includes loading, authorization, partial-failure, and empty states; daily registrations use Recharts; ambassador shares use all persisted registrations as the documented denominator.
- Analytics responses omit student personal data. Active zero-registration ambassadors are shown, while inactive historical attribution is disclosed separately and not ranked.
- Backend coverage includes authentication, authorization, target progress, date-window aggregation, empty states, leaderboard behavior, privacy, and login-token issuance.

## Section 6 progress

Campaign operations are now implemented without changing public registration behavior:

- `CampaignSettings` is a database-backed singleton. Environment variables provide first-run defaults; administrator edits persist in PostgreSQL or the local SQLite fallback.
- Staff administrators can read or partially update campaign name, target, duration, budget, optional start date, and IANA reporting timezone through the protected campaign endpoint.
- Overview, daily, and ambassador endpoints accept `period=all_time`, `period=campaign`, or `period=custom&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`. Campaign periods remain unavailable when no start date is configured; no date is silently invented.
- Daily reporting uses inclusive start / inclusive end dates converted to an exclusive next-day boundary in the configured timezone and includes zero-count dates. Custom ranges are limited to 366 days.
- Authenticated CSV export contains summary, daily, and ambassador aggregate rows only. It never includes student-level registration fields or tokens.
- The dashboard now provides settings editing, a period selector, custom date controls, save/cancel states, and a real CSV download action.

## Known issues and blockers

- The workspace is not currently a Git repository; repository initialization and the first baseline commit are still outstanding.
- Node.js 24.18.0, npm 11.6.1, Python 3.13.7, and pip 26.0.1 were validated for Section 1. PostgreSQL and Docker availability have not been validated yet.
- No deployment target, domain, email provider, or production hosting choices have been supplied. PostgreSQL and deployment are not validated in this workspace; SQLite remains the documented local fallback.

## Section 7 progress

The Section 7 hardening work is complete, and the dashboard one-shot follow-up is now applied. The older historical status sentence above refers to the state before Section 7 and is retained as context.

Production-readiness work is implemented and documented:

- Production settings fail safely when `DJANGO_DEBUG=False` lacks a real secret, allowed hosts, CORS origins, or PostgreSQL; local development remains HTTP/SQLite-compatible.
- Secure headers, HTTPS proxy/redirect settings, secure cookie defaults, CSRF trusted origins, request-size limits, CORS restrictions, and dedicated administrator-login throttling are configured.
- Administrator login rotates older DRF tokens; analytics, campaign settings, and CSV export remain staff-only. No frontend token persistence, unsafe HTML injection, console secret logging, or student-level export path was found.
- The dashboard is lazy-loaded to split Recharts out of the initial bundle. The production frontend fails fast when `VITE_API_BASE_URL` is missing.
- `README.md` now includes production variables, Render/Vercel deployment preparation, migration/start commands, SPA fallback requirements, security limitations, and a manual QA checklist.
- Backend regression coverage now includes administrative endpoint protection and security defaults. Browser automation and a production PostgreSQL deployment remain untested.
- Verified locally: `manage.py check` passed, `makemigrations --check --dry-run` reported no changes, `manage.py test` passed with 39 tests, `collectstatic --noinput` copied 154 files, `npm run typecheck` passed, and `npm run build` passed with a split dashboard chunk. A representative production environment passed `manage.py check --deploy`; missing production secret validation was also confirmed.

## One-shot dashboard fix follow-up

- Reproduced the current local API behavior against the existing SQLite records instead of masking errors: `/api/health/` returned `200`, anonymous protected analytics/campaign requests returned `401`, and an authenticated staff token returned `200` for overview, daily, ambassador, and campaign settings endpoints. No dashboard `500` exception is reproducible in this checkout; the active server emitted no error traceback during the checks.
- Added a visible secondary `Admin Dashboard` link to the public header for desktop and mobile navigation, plus `Back to website` links in the dashboard sign-in and authenticated footer states.
- Added explicit dashboard Retry actions for full-load and panel-level failures, preserved empty states for zero/no-data cases, fixed `aria-labelledby` targets for chart and leaderboard panels, and contained accidental horizontal overflow without hiding the leaderboard's intentional table scroll.
- The current local database contains persisted records used by the checks (2 registrations and 3 demo ambassadors). These are not campaign-result claims; dashboard metrics remain database-derived.
- Browser-based visual QA is still a manual handoff because no browser automation or visual regression runner is configured in the repository.

## Render deployment foundation

- Added root `render.yaml` defining the Render Postgres database, Django API web service, and Vite static site. The API uses Gunicorn, WhiteNoise, `/api/health/`, PostgreSQL, and environment-backed production settings; the frontend uses a client-side route rewrite to `/index.html`.
- `backend/config/settings.py` now includes Render's injected `RENDER_EXTERNAL_HOSTNAME` in `ALLOWED_HOSTS` when present. Custom domains still require explicit production host, CORS, and CSRF configuration.
- The Blueprint leaves `VITE_API_BASE_URL` unsynced intentionally because the frontend build needs the actual public API URL. Render setup instructions and free-plan persistence limitations are documented in `README.md`.

## Purple editorial visual direction

- The public product theme now follows the supplied community-site direction: dark near-black surfaces, numbered utility navigation, oversized condensed editorial headlines, thin grid borders, status metadata, module/event cards, and a strong closing CTA.
- Purple is the primary accent system, with lavender highlights, violet surfaces, restrained pink/blue supporting accents, and high-contrast text. The reference is treated as visual direction rather than copied content or artwork.
- The public landing page now presents AI Sprint as a student build session with workshop modules, a three-step build path, FAQ, and registration CTAs. Registration, referral, dashboard, and API-backed behavior remain unchanged.
- The same purple system is applied to the registration and authenticated growth surfaces for a coherent product experience.
- Browser-host visual QA was not available in the current environment; type-check and production build verification were completed.

The project is tracked in Git on the `main` branch. PostgreSQL/cloud deployment and browser-based QA remain to be performed before a real launch.

## Section 8 progress — Ambassador management

- Added staff-only referral management endpoints: `GET/POST /api/referrals/ambassadors/`, `PATCH /api/referrals/ambassadors/<id>/`, and explicit `POST /activate/` and `POST /deactivate/` actions.
- Management endpoints use the existing DRF token authentication and `IsAdminUser` authorization. Responses contain ambassador fields and aggregate attributed-registration counts only; no student personal data is returned.
- Custom codes are normalized to uppercase and validated against the existing letters/numbers/hyphens convention. Missing codes are generated as unique `AMB-<NAME>-<SUFFIX>` values. Duplicate codes and invalid input return field-specific errors.
- Deactivation only changes `is_active`; historical `Registration.ambassador` foreign keys remain intact, while inactive codes cannot receive new registrations and inactive ambassadors stay out of the active leaderboard.
- Registered `Ambassador` in Django admin and added the dashboard Manage Ambassadors panel with live list, status, counts, creation, editing, activation, and deactivation controls. Creating or changing an ambassador refreshes the existing leaderboard from persisted records.
- Added `backend/tests/test_ambassador_management.py`. Verified `manage.py check`, `makemigrations --check --dry-run`, full backend tests (44 tests), `npm run typecheck`, and `npm run build`.

## Cloudwave visual direction

- The live public, registration, and dashboard surfaces now use a sky-blue editorial theme inspired by the latest visual reference: soft blue gradients, peach cloud-like accents, navy structure, white display headlines, and lime action controls.
- The reference is used only for visual language. AI Sprint content, registration/referral behavior, dashboard metrics, and API contracts remain unchanged.
- The theme is implemented as a final CSS variable and selector layer so older palette rules cannot override the active public shell.
