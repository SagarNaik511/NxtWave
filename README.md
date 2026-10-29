# AI Sprint — Workshop Registration & Growth Platform

AI Sprint is a full-stack foundation for the NxtWave Growth Intern recruitment challenge. It will support a workshop registration and referral campaign for **Build Your First AI Project in 60 Minutes**.

This repository currently contains Sections 1–8: the React/Vite frontend foundation, public workshop experience, persisted registration workflow, student ambassador referral tracking and management, authenticated growth analytics, campaign operations, and production hardening.

## Project structure

Sections 1-8 are implemented: the React/Vite frontend foundation, public workshop experience, persisted registration workflow, student ambassador referrals and management, authenticated analytics, campaign operations, and production hardening. Dashboard API smoke checks are documented in the quality section below; no dashboard 500 was reproducible in the current local checkout.

```text
AGENTS.md
frontend/     React + Vite + TypeScript application
backend/      Django + Django REST Framework API
```

## Prerequisites

- Node.js 24.x and npm 11.x (or a compatible current LTS release)
- Python 3.13+
- PostgreSQL for the production-like local workflow

SQLite is an explicitly supported local fallback. It is useful when PostgreSQL is not installed, but PostgreSQL remains the intended application database for deployed environments.

## Configuration

Copy the examples before starting either application:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

The frontend reads `VITE_API_BASE_URL`. The backend reads its Django, CORS, timezone, and database settings from environment variables. Never commit real `.env` files or secrets.

## Production configuration and deployment preparation

Production mode is explicit and fail-safe. Set `DJANGO_ENV=production` and `DJANGO_DEBUG=False`; startup then requires a non-placeholder `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, and a PostgreSQL `DATABASE_URL`. It also enables HTTPS redirect, secure cookies, HSTS, content-type sniffing protection, restrictive framing/referrer policies, request-size limits, and the configured CSRF trusted origins. Local development keeps HTTP, SQLite, and the documented localhost origins available.

Required backend production variables:

```text
DJANGO_ENV=production
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<generate-a-long-random-secret>
DJANGO_ALLOWED_HOSTS=api.example.com
DJANGO_CORS_ALLOWED_ORIGINS=https://app.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://app.example.com
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>
DJANGO_TIME_ZONE=Asia/Kolkata
DJANGO_BEHIND_PROXY=True
CAMPAIGN_NAME=AI Sprint - Build Your First AI Project in 60 Minutes
CAMPAIGN_TARGET=500
CAMPAIGN_DURATION_DAYS=7
CAMPAIGN_BUDGET_INR=2000
CAMPAIGN_TIME_ZONE=Asia/Kolkata
```

The optional `CAMPAIGN_START_DATE` must be set deliberately; omitting it does not invent a campaign history. `DJANGO_MAX_REQUEST_BYTES` defaults to 1 MiB. Never put Django secrets, database credentials, or administrator credentials in `VITE_*` variables because Vite exposes those values to the browser.

Recommended deployment shape:

1. Create a managed PostgreSQL database and a Django web service on a host such as Render. Set the production variables above in the service secret manager.
2. From `backend`, install dependencies and collect static assets with `python -m pip install -r requirements.txt` and `python manage.py collectstatic --noinput`. WhiteNoise serves the collected Django admin/static assets through the WSGI process.
3. Run migrations as a release step with `python manage.py migrate --noinput`, then create the first administrator through a one-off `python manage.py createsuperuser` command.
4. Start the backend with `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`. The repository includes Gunicorn for this purpose; no remote deployment or production migration is performed from this workspace.
5. Deploy `frontend` to Vercel with `npm run build`, set `VITE_API_BASE_URL=https://api.example.com/api`, publish the `dist` directory, and configure an SPA rewrite so `/register` and `/dashboard` serve `index.html`.

The current token authentication keeps tokens in frontend memory and rotates the administrator's existing token on a new login; logout deletes the active token. Use HTTPS in production and rotate/delete a token if it may have been exposed. DRF tokens do not expire automatically, so stronger expiry/revocation policy remains a future security enhancement.

## Deploy to Render

The repository includes `render.yaml`, which defines a Django web service and a Render static site for the Vite frontend. The Blueprint intentionally reuses an existing Render PostgreSQL database through a prompted `DATABASE_URL`, because a Render workspace can have only one active free-tier database. The backend automatically accepts Render's `RENDER_EXTERNAL_HOSTNAME`; custom domains must still be added to `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ALLOWED_ORIGINS`, and `DJANGO_CSRF_TRUSTED_ORIGINS`.

### First deployment from the beginning

1. Push this repository to GitHub, GitLab, or Bitbucket. The current project is published at `https://github.com/SagarNaik511/NxtWave` on the `main` branch; Render deploys from a connected Git repository.
2. In Render, choose **New → Blueprint**, connect the repository, and select the branch containing `render.yaml`.
3. The Blueprint now wires `VITE_API_BASE_URL` to the API service URL automatically. If the frontend service was created before this wiring was added, set `VITE_API_BASE_URL` manually to the public backend URL followed by `/api`, for example `https://ai-sprint-api.onrender.com/api`. The frontend also normalizes a backend URL without `/api`, but using the explicit `/api` value is recommended.
4. When Render asks for `DATABASE_URL`, open your existing Render PostgreSQL database, copy its **Internal Database URL**, and paste it into the Blueprint field. Use the internal URL, not the external URL. This avoids trying to create a second free-tier database.
5. Apply the Blueprint. The backend installs Python dependencies, collects Django static files, and applies migrations; the service starts with Gunicorn and exposes `/api/health/` as its health check. The frontend installs its locked dependencies including Vite's build dependencies, uses Node `24.18.0`, builds from `frontend/`, and rewrites client-side routes to `index.html`.
6. Create the administrator. On a paid Render web service, use its Render Shell:

   ```bash
   python manage.py createsuperuser
   ```

   Free web services do not provide Render Shell or one-off jobs. For a free demo, copy the database's external connection string into a temporary local `DATABASE_URL`, set the production Django variables in your local terminal, and run `backend/.venv/Scripts/python.exe backend/manage.py createsuperuser`; never commit that URL or password. Then remove the temporary variables.

7. Open the frontend's `onrender.com` URL, test registration, then visit `/dashboard` and sign in with that staff account.

### Values configured automatically

The Blueprint prompts for `DATABASE_URL`, generates `DJANGO_SECRET_KEY`, derives the API allowed host from `RENDER_EXTERNAL_HOSTNAME`, derives CORS and CSRF origins from the frontend `RENDER_EXTERNAL_URL`, and sets the campaign defaults. Do not put database credentials, Django secrets, or administrator passwords in `VITE_*` variables.

If you deploy an existing Render service instead of creating the Blueprint, set the frontend service variable `VITE_API_BASE_URL` manually to the API URL plus `/api`, such as `https://ai-sprint-api.onrender.com/api`, then redeploy the frontend. For a custom domain, set the API variables to the exact deployed values:

```text
DJANGO_ALLOWED_HOSTS=api.example.com
DJANGO_CORS_ALLOWED_ORIGINS=https://app.example.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://app.example.com
```

After deployment, verify these URLs and flows in order:

```text
https://<api-host>/api/health/
https://<frontend-host>/
https://<frontend-host>/register
https://<frontend-host>/dashboard
```

The backend build runs `pip install -r requirements.txt`, `python manage.py collectstatic --no-input`, and `python manage.py migrate --no-input`. The backend starts with `python -m gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`. The frontend publishes `frontend/dist` and rewrites all client-side routes to `/index.html`.

The Blueprint defaults to the Singapore region so the database and API are colocated. The free plan is suitable for a demo, but Render documents that free web services can spin down and free Postgres expires after 30 days; use a paid Postgres plan for a real campaign or any data that must persist beyond the trial period. See Render's [Django deployment guide](https://render.com/docs/deploy-django), [Blueprint reference](https://render.com/docs/blueprint-spec), and [static-site rewrite documentation](https://render.com/docs/redirects-rewrites).

## Start the backend

From the repository root:

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

The API health check is available at `http://127.0.0.1:8000/api/health/`.

## Administrator dashboard

The protected dashboard is available at `http://localhost:5173/dashboard`. Create a Django staff user before signing in:

```powershell
Set-Location backend
python manage.py createsuperuser
```

The dashboard obtains a DRF token through `POST /api/auth/login/`, then uses that token for the protected analytics endpoints:

- `GET /api/analytics/overview/` — total registrations, target progress, attribution split, latest registration, and campaign configuration.
- `GET /api/analytics/daily/` — one point per configured campaign day, including zero-registration days.
- `GET /api/analytics/ambassadors/` — active ambassador counts and shares, plus an inactive historical attribution note.
- `GET/PATCH /api/analytics/campaign/` — read or update persisted campaign settings.
- `GET /api/analytics/export.csv` — download an aggregate CSV using the selected reporting period.
- `POST /api/auth/logout/` — deletes the current token.

Response shapes (the following values are illustrative shapes, not campaign results):

```json
{
  "data_status": "live_database",
  "performance": {
    "total_registrations": 0,
    "registrations_remaining": 500,
    "target_reached_percentage": 0,
    "attributed_registrations": 0,
    "unattributed_registrations": 0,
    "most_recent_registration_at": null
  },
  "campaign": { "target_registrations": 500, "duration_days": 7, "budget_inr": 2000 },
  "reporting_period": {
    "configured": false,
    "start_date": null,
    "end_date": null,
    "timezone": "Asia/Kolkata",
    "label": "All-time registrations; campaign start date is not configured."
  }
}
```

The daily response includes `reporting_period` for the configured campaign window, `selected_period` for the requested filter, a `daily` array, `total_in_period`, and an optional `message`. A campaign-period request without a start date returns `selected_period.available: false` and an empty `daily` array; it does not substitute all-time data. A configured period returns one `{ "date": "YYYY-MM-DD", "registrations": 0 }` point per day. The ambassador response includes `total_registrations`, `attributed_registrations`, `unattributed_registrations`, a documented `share_denominator`, `inactive_historical_attributed_registrations`, and an `ambassadors` array containing `rank`, `name`, `referral_code`, `registration_count`, and `share_of_total_registrations`.

Analytics endpoints require a `Token <token>` authorization header and a Django user with `is_staff=True`. Unauthenticated users receive `401`; authenticated non-staff users receive `403`. The frontend keeps the token in memory only, so a page refresh requires another sign-in. Analytics responses contain aggregate data and ambassador display names/codes, never student names, emails, colleges, or other registration details.

Campaign values are configuration, not claims of campaign performance:

```text
CAMPAIGN_NAME=AI Sprint - Build Your First AI Project in 60 Minutes
CAMPAIGN_TARGET=500
CAMPAIGN_DURATION_DAYS=7
CAMPAIGN_BUDGET_INR=2000
# CAMPAIGN_START_DATE=YYYY-MM-DD
CAMPAIGN_TIME_ZONE=Asia/Kolkata
```

`CAMPAIGN_START_DATE` is intentionally commented out in the example environment. Without it, the overview still reports the all-time persisted registration total, while the campaign-period option returns an explicit unavailable state instead of inventing a campaign history. When configured, the daily series uses the full duration, counts persisted registrations in the campaign's configured timezone, and excludes records outside the inclusive start / exclusive end window. The ambassador share denominator is all persisted registrations for all-time views and selected-period registrations for date-scoped views. Active ambassadors with zero registrations remain visible; inactive ambassadors are excluded from the active leaderboard while their historical attributions remain disclosed.

## Campaign management and reporting controls

Campaign settings are persisted in the `CampaignSettings` singleton. The first authenticated read creates that record from the environment defaults; later administrator edits are database-backed and take precedence over environment values. The settings endpoint is protected and accepts `GET` and `PATCH` at `http://127.0.0.1:8000/api/analytics/campaign/`.

The editable fields are `name`, `target_registrations` (positive), `duration_days` (1–365), `budget_inr` (non-negative), optional `start_date`, and a valid IANA `timezone`. A missing start date remains missing; administrators must explicitly configure one before the campaign period becomes available.

Analytics and export endpoints accept these query parameters:

```text
period=all_time
period=campaign
period=custom&start_date=2026-11-01&end_date=2026-11-07
```

All-time totals use every persisted registration. Campaign and custom periods use inclusive calendar dates and an exclusive next-day database boundary in the configured timezone. Daily responses include zero-registration dates. The overview keeps its all-time goal progress in `performance` and returns date-scoped counts separately in `selected_performance`; daily and ambassador charts use the selected period. A campaign period without a start date returns an explicit unavailable state rather than falling back to all time. Custom ranges must have both dates, an end date on or after the start date, and no more than 366 days.

Aggregate CSV export is available at `GET /api/analytics/export.csv` with the same period parameters. It requires the administrator token and downloads a safe `ai-sprint-<period>-report-YYYY-MM-DD.csv` filename. Columns are `report_type`, `report_date`, `ambassador_name`, `referral_code`, `registrations`, `share_of_selected_registrations`, `unattributed_registrations`, `report_start_date`, `report_end_date`, and `generated_at`. Rows contain only a summary, daily totals, and ambassador totals; student names, emails, colleges, and individual registration records are never exported.

The public registration endpoint is `POST http://127.0.0.1:8000/api/registrations/`. It accepts JSON with `full_name`, `email`, `college_name`, `branch`, `graduation_year`, and an optional `referral_code`. A supplied code must belong to an active ambassador; attribution is stored through the registration's nullable `ambassador` foreign key.

Example request:

```json
{
  "full_name": "Asha Rao",
  "email": "asha.rao@example.com",
  "college_name": "Example Institute of Technology",
  "branch": "CSE",
  "graduation_year": 2027,
  "referral_code": "AMB102"
}
```

Successful creation returns `201 Created` with only the confirmation fields needed by the frontend:

```json
{
  "id": 1,
  "full_name": "Asha Rao",
  "created_at": "2026-10-28T12:00:00+05:30"
}
```

Emails are trimmed and case-normalized before persistence. A duplicate normalized email returns `409 Conflict` and cannot create a second record. Invalid input returns `400 Bad Request` with field-specific errors. There is intentionally no unauthenticated registration listing endpoint.

Referral validation is available at `GET http://127.0.0.1:8000/api/referrals/validate/<referral_code>/`. Active codes return `200 OK` with the ambassador's display name:

```json
{
  "valid": true,
  "referral_code": "AMB102",
  "ambassador_name": "Demo Ambassador 2"
}
```

Unknown or inactive codes also return `200 OK`, with no personal registration data exposed:

```json
{
  "valid": false,
  "referral_code": "UNKNOWN"
}
```

The endpoint normalizes codes to uppercase. Inactive ambassadors cannot receive new attributions. Staff can manage ambassadors from the protected dashboard, or through the staff-only management endpoints below.

### Staff ambassador management

All management requests require `Authorization: Token <token>` from a Django user with `is_staff=True`:

- `GET /api/referrals/ambassadors/` — list ambassadors with status, referral code, and aggregate attributed-registration count.
- `POST /api/referrals/ambassadors/` — create an ambassador with a required `name` and optional `referral_code`. If omitted, the API generates a unique uppercase `AMB-…` code.
- `PATCH /api/referrals/ambassadors/<id>/` — update the ambassador name or referral code without deleting historical attribution.
- `POST /api/referrals/ambassadors/<id>/activate/` and `/deactivate/` — change availability for new registrations while preserving historical registrations.

The management response contains no student names, emails, colleges, or individual registration records. The attributed count increases only after a valid registration is persisted through the public registration endpoint. Duplicate codes and invalid values return a `400` response with an `errors` object.

For a controlled local deactivation:

```powershell
python manage.py shell -c "from apps.referrals.models import Ambassador; Ambassador.objects.filter(referral_code='AMB102').update(is_active=False)"
```

After running the demo seed command, request `.../validate/AMB102/` to see a valid response. After deactivation, the same request returns `{"valid": false, "referral_code": "AMB102"}`. An unknown code such as `UNKNOWN` returns the same invalid shape.

Demo ambassadors can be created or updated repeatably with:

```powershell
python manage.py seed_demo_ambassadors
```

This creates only three clearly labeled fictional ambassadors (`AMB101`, `AMB102`, and `AMB103`). It never creates registrations or campaign metrics. Referral migrations are applied through the normal `python manage.py migrate` command.

If PowerShell execution policy prevents activation, run the virtual-environment interpreter directly:

```powershell
backend\.venv\Scripts\python.exe backend\manage.py migrate
backend\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
```

## Start the frontend

In a second terminal from the repository root:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Quality checks

Frontend:

```powershell
Set-Location frontend
npm run typecheck
npm run build
```

Backend:

```powershell
Set-Location backend
python manage.py check
python manage.py check --deploy  # run with production environment variables
python manage.py test
```

The backend test suite includes authentication/authorization checks, empty-state behavior, target clamping, date-window aggregation, ambassador ranking, privacy checks, admin login, campaign settings validation, reporting controls, and aggregate CSV privacy/escaping checks. Use `python manage.py migrate` after enabling PostgreSQL or changing the database URL.

The dashboard's live API behavior was also smoke-tested against the current local SQLite database: health returned `200`, anonymous protected requests returned `401`, and an authenticated staff token returned `200` for overview, daily, ambassador, and campaign settings endpoints. A dashboard `500` could not be reproduced in the current checkout, so no exception was suppressed or replaced with fake data.

The configured database is selected through `DATABASE_URL`. PostgreSQL is intended for deployed environments; local development can use the documented SQLite fallback (`sqlite:///db.sqlite3`). Check the Django startup output and environment configuration rather than assuming which database is active.

## Manual QA checklist

Before launch, verify in a browser at desktop and narrow mobile widths:

- Landing page navigation, FAQ keyboard interaction, CTA links, and reduced-motion behavior.
- Registration success, duplicate email, invalid fields, unavailable API, and referral validation/error states.
- Dashboard rejection for anonymous/non-staff users, administrator login/logout, refresh, loading, empty, and partial-failure states.
- Campaign settings save/cancel, invalid target/duration/budget/date/timezone feedback, and missing-start-date messaging.
- All-time, campaign, and custom reporting filters; zero-count days; invalid custom ranges; and CSV download contents/filename.
- Keyboard focus visibility, labels, error announcements, chart summaries, table overflow, and SPA refreshes at `/register` and `/dashboard`.

No browser automation or visual regression runner is configured in this repository, so this checklist remains manual.

## Development principles

- Persisted database records will be the source of truth for all live metrics.
- Demo data, when introduced, will be labeled clearly and will never be presented as campaign results.
- Public API responses must not expose student personal information.
- Administrative endpoints will require authentication and authorization.
- Referral attribution is authoritative only through `Registration.ambassador`; arbitrary referral strings are never counted as successful referrals.
- `localStorage` is not a permanent database.

