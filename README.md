# DRMIS Development Roadmap

> **Progress key:** `[ ]` not started · `[~]` in progress · `[x]` done · `%` = estimated completion

### In progress vs production migration

| | |
|---|---|
| **In progress** | Features **actively developed in this repository** (local dev, staging VM, Docker). They can ship incrementally with PRs and migrations. |
| **After production migration** | Features that realistically need DRMIS running on an **official production environment** (government-approved hosting, NDMO operations, production domain/TLS, ministry SLAs, live identity integration, ops runbooks). They are **not blocked by code alone**—they depend on **deployment, policy, and handover** that come only after go-live. Examples: production-only SSO cutover, CDN in front of live traffic, PgBouncer against the real DB pool, formal backup/restore drills on the NDMO VM. |

Use this distinction when prioritising: build governance and app features **now**; defer “production-only” hardening until the target stack exists.

---

## Recent completions

- [x] **Data governance (datasets)** — `publication_status` (Draft / Published / Archived), `published_by` / `published_at`, `created_by` / `updated_by` on all four dataset models; API defaults to published only (staff: `?publication=all`); bulk Publish/Archive admin actions with audit log entries; **`DisasterDatasetTag`** model + admin replaces hardcoded disaster overlay names (seeded + extensible, e.g. “Storm Surge”)

- [x] **RAP CSV import pipeline (MVP)** — Django app `vbos.rap_import`: `RAPImportBatch` / `RAPImportFile` models, filename→sector detection, `validate_rap_csv` against RAP schemas, Unfold admin (batch list, inline files, validate/import actions), staff multi-file upload at `/admin/rap-import/upload/`, Celery task stub; `import_rap_batch_to_tabular` mapping to TabularDataset **TBD**
- [x] **DRMIS app shell — light/dark theme** — `--drmis-*` CSS variables in `index.css` (main content toggles; **sidebar stays dark** in both modes), `tokens/colors.ts` uses `var(--drmis-…)` for surfaces/text/borders, Command Centre (KPI cards, incidents table, live alerts, risk exposure), topbar, and map workspace respond to `next-themes` (`class` on `<html>`); fixed hardcoded `html`/`body` backgrounds that blocked light mode
- [x] **Admin/operator boundary refresh** — `/admin/` redesigned for operator pipeline ownership (RAP queue, pending approvals, MFA gap, backup age, system status, recent audit activity) and incident-focused widgets removed from backend dashboard
- [x] **Cross-linking between `/admin/` and `/app/`** — admin change forms now include `Open in Live Map →` deep links; frontend now exposes `Edit ↗` and `Manage dataset ↗` links to admin plus a staff-only `Admin Panel ↗` entry in sidebar
- [x] **Staff-only pipeline status API** — added `GET /api/v1/admin/pipeline-status/` returning RAP pending, approvals pending, users missing MFA, backup age/status, celery status, and recent audit payload for operator dashboards
- [x] **Command Centre shell pages** — Datasets, Exports, Audit Log, and Settings pages fully implemented and routed; nav items no longer show "Coming soon" toasts
- [x] **Live Alerts panel — external feeds** — new `vbos.alerts` Django app; `GET /api/v1/alerts/live/` merges USGS (M4.0+ earthquakes, Vanuatu bbox), VMGD (active warnings + volcano alert levels scraped from public pages), GDACS, and internal DRMIS alerts; `LiveAlertsPanel.tsx` rewritten to use real data with source attribution footer, severity dots, type badges, time-ago labels, and graceful empty/error states; polls every 2 minutes
- [x] **Incidents table connected to real API** — `IncidentsTable.tsx` replaced placeholder rows with live `AreaDataSubmission` data via `useRecentSubmissions` hook; Edit ↗ links use real database IDs; loading skeletons and empty states added
- [x] **Command Centre KPI cards partially live** — "Pending submissions" and "Live alerts" cards now show real counts from API; "Field teams" and "System uptime" remain as stubs pending future models
- [x] **System name corrected everywhere** — "Disaster Risk Management Information System" (capital S on System) applied consistently across `Topbar.tsx`, `index.html`, `vite.config.ts` PWA manifest, and all other occurrences
- [x] **Audit Log page** — `GET /api/v1/audit/` endpoint scoped to `datasets` app only; accessible to any authenticated user (not just staff); `AuditLogPage.tsx` with search, action-type filter, date range, paginated table, human-readable model names
- [x] **Exports page** — multi-format download UI: XLSX, GeoJSON, GeoTIFF, VRT, PMTiles; cluster selector, dataset picker with format checkboxes, export queue with job status; Download Data removed from Live Map sidebar
- [x] **Settings page** — full-page Settings replacing the ProfilePage overlay; 3 tabs: Profile (avatar, name, email), Security (password, 2FA, session PIN), Appearance (light/dark/system theme picker); "Profile & security" removed from Live Map header dropdown
- [x] **Version string visible** — `v1.0.0 · Build 2026.03.21` shown as tooltip on DRMIS logo (frontend topbar) and in admin footer (replacing "Powered by Django")
- [x] **VMGD live volcano + warning alerts** — HTML scraper replaces broken RSS approach; parses `/warnings` (active advisories with date + body) and `/geohazards/volcanoes` (Level 2+ volcano alert levels); 6 real VMGD alerts confirmed live (Ambae Level 3, Yasur/Lopevi/Ambrym/Gaua Level 2)
- [x] **Vector marker pins + consistent legend icons** — vector category icons wrapped in location-pin SVGs; corrected Leaflet `iconSize`/`iconAnchor` for accurate marker placement
- [x] **Configurable vector popup properties (admin + frontend)** — `VectorDataset.popup_properties` JSON whitelist/order is configurable in Django admin, with drag-and-drop reordering and ordered tooltips/popups
- [x] **Professional vector tooltips (opaque + auto-sizing)** — tooltip cards are fully opaque, single-line labels expand by content, and empty/`N/A` rows are filtered for clarity
- [x] **Raster rendering reliability (TiTiler + precomputed tiles)** — raster availability probing updated to request a concrete `WebMercatorQuad/0/0/0.png` tile; `tms` handling fixed for gdal2tiles (TMS) vs TiTiler (XYZ)
- [x] **Local SMTP trial + Docker port conflict fixes** — added `mailhog` for OTP/email testing and adjusted local `documentation`/`titiler` host ports (8015/8043) with corresponding frontend env updates

---

## Phase A — Foundation *(3–6 months, low cost, do now)*

### Security & Access Control

- [~] **MFA everywhere** `40%` — TOTP + email OTP implemented; needs enforcement policy
  - [x] TOTP (authenticator app) support via `django-otp`
  - [x] Email OTP support
  - [x] `OTP_REQUIRED_FOR_ALL_LOGINS` setting in config
  - [x] Admin UI for 2FA setup/disable
  - [ ] Make MFA mandatory on first login (redirect to setup if not enrolled)
  - [ ] Enforce MFA for all staff roles; block login if not set up
  - [ ] Grace period warning banner: "Set up MFA by [date] or access will be restricted"
  - [x] Admin report: users without MFA enrolled (dashboard/API pipeline status)

- [ ] **RBAC per dataset/module** `0%` — e.g. MoCCA edits climate only, NDMO views all, field officers edit field-check only
  - [ ] Audit current Role model and permission scope
  - [ ] Add `can_edit_climate`, `can_edit_disaster`, `can_edit_field_check` permissions
  - [ ] Restrict dataset admin views by role (queryset filtering)
  - [ ] Restrict API endpoints by role (`IsAuthenticated` + custom permission class)
  - [ ] Add role assignment UI in admin (Users → Roles)
  - [ ] Test with MoCCA, MOET, NDMO sample user accounts
  - [ ] Document permission matrix per role

- [~] **Audit logging** `75%` — dataset change history accessible to all authenticated users
  - [x] Django `LogEntry` registered in admin (basic action log)
  - [x] `GET /api/v1/audit/` endpoint scoped to `datasets` app, accessible to all users
  - [x] `AuditLogPage.tsx` — searchable, filterable by action/date, paginated, human-readable model names
  - [x] Custom `AuditLog` model: model, pk, field, old_value, new_value, user, timestamp (field-level diff)
  - [x] Signal or mixin to capture field-level diffs on save
  - [~] Cover key models: TabularItem, VectorItem, FieldCheckRecord (Dataset not yet wired)
  - [~] Export as CSV and PDF (PDF export requires `reportlab`, not in requirements)
  - [~] Retention policy: auto-archive audit logs older than 2 years (command exists, not scheduled/automatic yet)

- [ ] **Security headers** `0%` — CSP, HSTS, Permissions-Policy currently missing
  - [ ] Add `django-csp` and configure Content-Security-Policy
  - [ ] Enable HSTS (`SECURE_HSTS_SECONDS`) in VM/production config
  - [ ] Add `Permissions-Policy` header via middleware
  - [ ] Run `django-check-deploy` and fix all warnings
  - [ ] Test with securityheaders.com / OWASP ZAP

- [ ] **Rate limiting on auth endpoints** `0%` — brute-force and OTP exhaustion currently unprotected
  - [ ] Add `django-ratelimit` to `requirements.txt`
  - [ ] Apply `@ratelimit(key='ip', rate='10/m', block=True)` to `/api-token-auth/`
  - [ ] Apply `@ratelimit(key='user_or_ip', rate='5/m', block=True)` to verify-2fa, resend-email-otp
  - [ ] Return 429 with clear error message

- [ ] **Encrypt SMTP password at rest** `0%` — `SMTPSettings.password` is plaintext in DB
  - [ ] Add `django-encrypted-fields` to `requirements.txt`
  - [ ] Change `password` to `EncryptedCharField`; set `FIELD_ENCRYPTION_KEY` from env
  - [ ] Generate and apply migration

- [ ] **Token expiry** `0%` — DRF tokens currently never expire
  - [ ] Replace DRF `Token` with `django-rest-knox` (per-device tokens, configurable expiry)
  - [ ] Set 8-hour expiry for standard sessions; 30-day for "remember me"
  - [ ] Frontend: handle 401 → clear token → redirect to login with "session expired" message

---

### Background Tasks

- [x] **Celery + Redis** `100%` — async/background processing fully operational
  - [x] `celery`, `redis`, `django-celery-beat`, `django-celery-results` in `requirements.txt`
  - [x] Celery app configured in `vbos/celery.py`
  - [x] `celery` and `celery-beat` services in `docker-compose.yml`
  - [x] Redis service in `docker-compose.yml`
  - [ ] Move large raster ingestion to async task
  - [ ] Move XLSX/PDF exports to async task
  - [ ] Move departmental data sync (`sync_external_data`) to scheduled task
  - [ ] Add task retry logic and dead-letter queue

- [~] **Job status in UI** `60%`
  - [x] `/api/v1/tasks/<task_id>/status/` endpoint exists
  - [x] Add `IsAuthenticated` to task status endpoint
  - [x] Frontend: polling hook `useTaskStatus(taskId)`
  - [ ] Show progress bar for long-running tasks (backup, import)
  - [ ] Toast notification on completion or failure

---

### Backup *(extend what's built)*

- [x] **Backup & Restore UI** `100%` — admin page with selective categories, ZIP format, history table
- [ ] **Scheduled backups** (Celery beat) `0%` — daily/weekly with configurable retention
  - [ ] Define `backup_task` Celery task calling existing `create_backup_zip`
  - [ ] Add `PeriodicTask` config (daily at 02:00 UTC)
  - [ ] Save backup file to `MEDIA_ROOT/backups/` and log to `BackupLog`
  - [ ] Email notification to admins on success/failure
  - [ ] Configurable retention: auto-delete backups older than N days
- [ ] **Off-site backup to S3** `0%`
  - [ ] Add `boto3` upload step after local backup is written
  - [ ] Configurable bucket/prefix via env vars
  - [ ] S3 lifecycle rule: move to Glacier after 30 days
  - [ ] Test restore from S3 object
- [ ] **Encrypted backups (AES-256)** `0%`
  - [ ] Add `pyzipper` to `requirements.txt`
  - [ ] Replace `zipfile.ZipFile` with `pyzipper.AESZipFile` when password set
  - [ ] Password field in backup UI (already designed, needs backend wiring)
  - [ ] Document key management procedure
- [ ] **Restore drills** `0%`
  - [ ] Write runbook: "Restore from backup on a fresh VM"
  - [ ] Schedule quarterly drill; log results in `docs/`

---

### Performance

- [~] **Redis caching** `30%` — LocMemCache in use; Redis needed for multi-worker
  - [x] `CACHES` configurable via env (`DJANGO_CACHE_BACKEND`)
  - [x] `cache_page` on cluster, province, area council list endpoints
  - [x] Cache invalidation on dataset save/delete
  - [ ] Set `DJANGO_CACHE_BACKEND=django.core.cache.backends.redis.RedisCache` in production
  - [ ] Cache tabular aggregation endpoint
  - [ ] Cache tile metadata responses

- [ ] **PgBouncer** `0%` — connection pooling
  - [ ] Add `pgbouncer` service to `docker-compose.yml`
  - [ ] Configure pool size (transaction mode, 20 connections)
  - [ ] Update `DJANGO_DB_URL` to point to PgBouncer port
  - [ ] Load test before/after

---

### CI/CD

- [ ] **CI/CD pipelines** `0%`
  - [ ] Pipeline: `lint` — ruff, black (backend), eslint, tsc (frontend)
  - [ ] Pipeline: `test` — pytest with PostGIS, Jest for frontend
  - [ ] Pipeline: `security` — bandit (Python), Trivy (Docker image)
  - [ ] Pipeline: `deploy-staging` — build + push image, deploy on merge to `main`
  - [ ] Add branch protection: require CI pass before merge
  - [ ] Add a pull-request template for contributors

---

### Data Governance

- [x] **Dataset status / publication workflow** `100%`
  - [x] `publication_status` on `TabularDataset`, `VectorDataset`, `RasterDataset`, `PMTilesDataset` (Draft / Published / Archived)
  - [x] `published_by` FK and `published_at` DateTimeField
  - [x] Default new datasets to `draft`; migration sets existing rows to `published`
  - [x] Bulk "Publish selected" and "Archive selected" admin actions
  - [x] Filter API to only return `published` datasets by default (staff: `?publication=all`)
  - [x] Admin actions create `AuditLog` entries on status change

- [x] **`created_by` / `updated_by` on all dataset models** `100%`
  - [x] FKs to `AUTH_USER_MODEL` on all four dataset models
  - [x] Set on admin `save_model` (`created_by` on add; `updated_by` on every save); readonly in admin
  - [x] `created_by_id` / `updated_by_id` on dataset serializers (`read_only`)

- [x] **Disaster overlay tags (replaces `DISASTER_DATASET_NAMES`)** `100%`
  - [x] `DisasterDatasetTag` model (`name` unique, `order`); registered in admin
  - [x] `views.py` uses `get_disaster_dataset_tag_names()` (DB-backed)
  - [x] Data migration seeds prior hardcoded values; admins can add tags (e.g. "Storm Surge")

- [ ] **Password reset by email** `0%`
  - [ ] Wire Django's built-in `password_reset/` views in `urls.py`
  - [ ] Create branded email + confirmation templates in `templates/registration/`
  - [ ] Add "Forgot password?" link to `Login.tsx`

---

## Phase B — Hardening *(6–12 months)*

### Authentication

- [ ] **OAuth2 / OpenID Connect** `0%` — SSO for multi-ministry use
  - [ ] Add `django-oauth-toolkit` to requirements
  - [ ] Deploy Keycloak (or use Auth0) as identity provider
  - [ ] Configure realms for MoCCA, MOET, Health, MIPU, NDMO
  - [ ] Map OIDC claims to Django roles
  - [ ] Test SSO login from each ministry's domain
  - [ ] Fallback: username/password for accounts without SSO

- [ ] **Auto-provision roles from AD/LDAP** `0%`
  - [ ] Connect Keycloak to existing AD/LDAP if available
  - [ ] Map AD group → Django role on first login
  - [ ] Sync role changes nightly

---

### Storage

- [~] **Full S3 migration** `40%` — rasters, PMTiles, media
  - [x] `django-storages` and `boto3` installed
  - [x] S3 backend configurable via env
  - [ ] Migrate all raster files to S3
  - [ ] Migrate PMTiles files to S3; update `serve_pmtiles` to stream from S3
  - [ ] Migrate media uploads to S3
  - [ ] Remove filesystem mounts from production `docker-compose.yml`
  - [ ] Test with DigitalOcean Spaces (S3-compatible)

- [ ] **CDN for PMTiles and TiTiler** `0%`
  - [ ] Configure Cloudflare in front of API domain
  - [ ] Set `Cache-Control` headers on PMTiles and tile responses
  - [ ] Purge CDN cache on dataset update
  - [ ] Measure tile load times before/after

---

### Observability

- [ ] **Prometheus + Grafana** `0%`
  - [ ] Add `django-prometheus` to backend; expose `/metrics/`
  - [ ] Add `prometheus` + `grafana` services to `docker-compose.yml`
  - [ ] Import Django dashboard (grafana.com/dashboards/17658)
  - [ ] Alert rules: p95 latency > 2s, error rate > 1%, disk > 80%
  - [ ] Node exporter for CPU/memory/disk on VM

- [ ] **Sentry** `0%` — frontend + backend error tracking
  - [ ] Add `sentry-sdk` to backend; configure DSN
  - [ ] Add `@sentry/react` to frontend
  - [ ] Set up alerts for new issues
  - [ ] Tag errors with user, ministry, environment

- [ ] **Structured JSON logs** `0%`
  - [ ] Add `python-json-logger` to backend
  - [ ] Update `LOGGING` config to JSON formatter
  - [ ] Ship logs to Loki (add Loki + Promtail to Docker Compose)
  - [ ] Grafana dashboard for log search and error rates

- [ ] **`/health/` endpoint** `0%`
  - [ ] `GET /health/` → check DB, Redis, TiTiler, S3 connectivity
  - [ ] Return JSON: `{"status": "ok", "db": "ok", "redis": "ok", ...}`
  - [ ] Wire to Docker `HEALTHCHECK` and uptime monitor (e.g. Uptime Kuma)

- [ ] **Log rotation + retention** `0%`
  - [ ] Add `logrotate` config or Docker log driver limits
  - [ ] Set `max-size` and `max-file` on all Docker services

---

### API & Integrations

- [~] **Rate limiting + API keys per department** `50%`
  - [x] `IntegrationAPIKey` model and auth backend
  - [x] Per-source API keys in admin
  - [ ] Add `django-ratelimit` or DRF throttling per key
  - [ ] Set per-key rate limits (e.g. 1000 req/day per department)
  - [ ] Return `429 Too Many Requests` with `Retry-After` header
  - [ ] Log rate-limit hits in audit log

- [x] **VMGD live hazard alerts** `100%`
  - [x] HTML scraper for `/warnings` (active advisories with date, title, body)
  - [x] HTML scraper for `/geohazards/volcanoes` (Level 2+ volcano alert levels)
  - [x] USGS earthquake feed (M4.0+, Vanuatu bbox, GeoJSON API)
  - [x] GDACS disaster feed (Vanuatu-filtered RSS)
  - [x] `GET /api/v1/alerts/live/` — merged feed with concurrent fetching
  - [x] Individual endpoints: `/earthquakes/`, `/vmgd/`, `/gdacs/`
  - [x] Internal `Alert` model for DRMIS-authored operational alerts
  - [x] `vbos.alerts` app registered in admin with `Alert` CRUD

- [ ] **Webhooks** `0%`
  - [ ] `WebhookSubscription` model: URL, event types, secret
  - [ ] Event types: `dataset.created`, `dataset.updated`, `fieldcheck.approved`
  - [ ] Celery task: POST payload to subscriber URL with HMAC signature
  - [ ] Admin UI to manage subscriptions
  - [ ] Retry logic with exponential backoff

- [ ] **OGC WMS/WFS** `0%`
  - [ ] Evaluate `django-geojson` (lightweight) vs GeoServer (full OGC)
  - [ ] Expose vector datasets as WFS (GeoJSON over HTTP)
  - [ ] Test in QGIS and ArcGIS
  - [ ] Document endpoint URLs for partner ministries

---

### Ministry / Organisational Model

- [ ] **Ministry/Organisation model** `0%`
  - [ ] Create `Organisation(name, short_name, type, country)` model
  - [ ] Add `organisation FK` to `User` and all four dataset models
  - [ ] Register in admin; add to Unfold sidebar under Settings
  - [ ] Data migration seeds: NDMO, MoCCA, MOET, Health, MIPU, MFAT, SPC, UNICEF, WHO, WFP, UNDP
  - [ ] Add organisation filter to dataset admin lists and API

- [ ] **Dataset versioning** `0%`
  - [ ] Add `DatasetVersion` model: snapshot of dataset + items at a point in time
  - [ ] "Save version" button in admin before bulk edits
  - [ ] Version history list with diff viewer
  - [ ] "Restore to version" action

- [ ] **Email notifications on approval/rejection** `0%`
  - [ ] HTML templates for `submission_approved.html`, `submission_rejected.html`
  - [ ] Send email to submitter on status change in `AreaDataSubmission` workflow
  - [ ] Include dataset name, province, year, and rejection reason if applicable

---

## Phase C — Advanced *(12+ months, seek funding/SPC/World Bank partners)*

### Multi-tenancy & Departmental Views

- [ ] Tenant-aware datasets; each ministry sees their module first by default
  - [ ] Add `tenant` or `ministry` field to datasets and users
  - [ ] Filter querysets by tenant on login
  - [ ] Default map view and visible layers per ministry
- [ ] Custom saveable dashboards per ministry (default layers, map position, charts)
- [ ] Read-only "viewer" tokens for external partners and donors

---

### Incident Management

- [ ] **Incident model and CRUD API** `0%`
  - [ ] Create `vbos.incidents` Django app
  - [ ] `Incident` model: `title`, `type`, `severity`, `province FK`, `status`, `created_by`, `notes`
  - [ ] `GET/POST /api/v1/incidents/` — paginated, filterable by status/type/province/severity
  - [ ] Admin: list display, filters, search
  - [ ] Connect Command Centre "Active incidents" KPI to real count
  - [ ] "+ New Incident" button opens a creation dialog
  - [ ] Risk Exposure panel connected to real province scoring data

---

### Reporting

- [ ] **PDF situation report** `0%`
  - [ ] Add `weasyprint` to `requirements.txt`
  - [ ] `GET /api/v1/reports/situation-summary/` endpoint
  - [ ] Template: active incidents, province risk, cluster submission status, key stats
  - [ ] Wire "Export Report" button in Command Centre to download

- [ ] **Executive morning briefing (Cabinet PDF)** `0%`
  - [ ] Celery Beat task at 07:00 VST daily
  - [ ] Email to configurable recipients list in `SMTPSettings`
  - [ ] 1–2 page PDF: incidents, risk heat map, weather outlook from VMGD

---

### Advanced Analysis

- [ ] **Risk calculator** `0%` — exposure × vulnerability scoring
  - [ ] Define risk formula with NDMO (exposure layers × vulnerability index)
  - [ ] Backend endpoint: `POST /api/v1/analysis/risk/` with province/year params
  - [ ] Frontend: risk score panel in right sidebar
  - [ ] Export risk map as PDF/PNG

- [ ] **Spatial joins/buffers** `0%`
  - [ ] API: population within X km of hazard zone
  - [ ] API: infrastructure (schools, hospitals) within flood extent
  - [ ] Results shown in stats panel and downloadable

---

### Offline & Mobile

- [ ] **Offline-first PWA** `0%`
  - [ ] Extend service worker to cache data entry forms and recent datasets
  - [ ] IndexedDB queue for offline field-check submissions
  - [ ] GPS-tagged photo capture (camera API) attached to field-check records
  - [ ] Sync queue: POST pending records when connectivity restored
  - [ ] Conflict resolution: server wins unless local is newer

- [ ] **Progressive sync** `0%`
  - [ ] API: `GET /api/v1/sync/?province=<name>&since=<timestamp>`
  - [ ] Download only the field officer's assigned province
  - [ ] Delta sync: only records changed since last sync

---

### Collaboration

- [ ] Comment threads on datasets and records; @mentions; task assignment in admin
  - [ ] `Comment` model linked to any content type
  - [ ] @mention triggers email notification
  - [ ] Admin changelist overlay showing comment count
- [ ] Digital signatures on approved disaster assessments (for official government use)
- [ ] **Multi-language** `0%` — Bislama + French
  - [ ] Add `LocaleMiddleware` and `USE_I18N = True`
  - [ ] Extract strings with `makemessages`
  - [ ] Translate admin labels to Bislama and French
  - [ ] Per-user language preference in profile settings

---

### Compliance Pack *(NDMO/DCDT)*

- [ ] Mandatory field validation before approval
  - [ ] Validation rules configurable per dataset type
  - [ ] Block approval if required fields missing or below threshold
- [ ] Auto-generated compliance reports in NDMO-required format
  - [ ] Report template (PDF) matching NDMO submission format
  - [ ] One-click generate from admin
- [ ] Data retention policies
  - [ ] `retention_days` setting per dataset type
  - [ ] Celery task: auto-archive expired records to cold storage
  - [ ] Admin warning: "X records due for archival in 30 days"
- [ ] Data lineage
  - [ ] Track source system, import file, and operator for every record
  - [ ] Lineage graph view in admin

---

## Consolidated Quick Wins

| Feature | Effort | Impact | Progress | Phase |
|---|---|---|---|---|
| Add `IsAuthenticated` to task status endpoint | XS | High | 100% | A |
| Rate limiting on auth endpoints | Low | Very High | 0% | A |
| Encrypt SMTP password at rest | Low | High | 0% | A |
| Token expiry (Knox) | Low | High | 0% | A |
| Password reset by email | Low | High | 0% | A |
| Dataset publication + disaster tags + authorship | Low | High | 100% | A |
| `created_by` / `updated_by` on all dataset models | Low | Medium | 100% | A |
| Disaster overlay tags (`DisasterDatasetTag`) | Low | Medium | 100% | A |
| Scheduled backups to S3 | Low | Very High | 0% | A |
| Sentry error tracking | Low | High | 0% | A |
| MFA mandatory enforcement | Low | High | 40% | A |
| RBAC per dataset/module | Medium | Very High | 0% | A |
| Redis caching hot paths | Low | High | 30% | A |
| Prometheus + Grafana | Medium | High | 0% | B |
| OAuth2 / SSO (Keycloak) | High | Very High | 0% | B |
| Dataset approval workflow | Medium | Very High | 0% | B |
| OGC WMS/WFS output | Medium | High | 0% | B |
| Ministry/Organisation model | Medium | Very High | 0% | B |
| Full S3 migration | Medium | High | 40% | B |
| Rate limiting per department API key | Low | High | 50% | B |
| Incident model + Command Centre live data | XL | Very High | 0% | C |
| Offline PWA (field teams) | High | Very High | 0% | C |
| Multi-tenancy | High | High | 0% | C |
| Risk calculator | High | Very High | 0% | C |

---

## What to Tackle First

Given the NDMO handover timeline and multi-ministry adoption goals, the highest-leverage sequence is:

1. **Security hardening** — rate limiting on auth, token expiry (Knox), encrypt SMTP password; small effort, high risk if missed
2. **RBAC + Audit log (field-level)** — dataset publication/authorship is in place; tighten role-based access and field-level audit before opening to MoCCA/MOET/MIPU users
3. **Approval workflow** — builds on published/draft datasets; align with NDMO process
4. **Scheduled backups to S3** — non-negotiable before NDMO takes ownership (often **after production migration** when the live VM and bucket policy are fixed)
5. **Incident model** — the Command Centre is the primary screen; it needs real data
6. **Sentry + `/health/` endpoint** — fast to add; production DSN and monitors typically **after production migration**
7. **MFA enforcement** — 40% done; finish the last mile (mandatory on first login)
