# DRMIS Development Roadmap

> **Progress key:** `[ ]` not started · `[~]` in progress · `[x]` done · `%` = estimated completion

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
  - [ ] Admin report: users without MFA enrolled

- [ ] **RBAC per dataset/module** `0%` — e.g. MoCCA edits climate only, NDMO views all, field officers edit field-check only
  - [ ] Audit current Role model and permission scope
  - [ ] Add `can_edit_climate`, `can_edit_disaster`, `can_edit_field_check` permissions
  - [ ] Restrict dataset admin views by role (queryset filtering)
  - [ ] Restrict API endpoints by role (`IsAuthenticated` + custom permission class)
  - [ ] Add role assignment UI in admin (Users → Roles)
  - [ ] Test with MoCCA, MOET, NDMO sample user accounts
  - [ ] Document permission matrix per role

- [ ] **Audit logging (field-level diff)** `10%` — who changed what, from → to; exportable
  - [x] Django `LogEntry` registered in admin (basic action log)
  - [ ] Custom `AuditLog` model: model, pk, field, old_value, new_value, user, timestamp
  - [ ] Signal or mixin to capture field-level diffs on save
  - [ ] Cover key models: TabularItem, VectorItem, FieldCheckRecord, Dataset
  - [ ] Admin view: filterable by user, date, model, field
  - [ ] Export as CSV and PDF
  - [ ] Retention policy: auto-archive audit logs older than 2 years

- [ ] **Security headers** `0%` — CSP, HSTS, Permissions-Policy currently missing
  - [ ] Add `django-csp` and configure Content-Security-Policy
  - [ ] Enable HSTS (`SECURE_HSTS_SECONDS`) in VM/production config
  - [ ] Add `Permissions-Policy` header via middleware
  - [ ] Run `django-check-deploy` and fix all warnings
  - [ ] Test with securityheaders.com / OWASP ZAP

---

### Background Tasks

- [ ] **Celery + Redis** `0%` — async/background processing
  - [ ] Add `celery`, `redis`, `django-celery-beat`, `django-celery-results` to `requirements.txt`
  - [ ] Configure Celery app in `vbos/celery.py`
  - [ ] Add `celery` and `celery-beat` services to `docker-compose.yml`
  - [ ] Add Redis service to `docker-compose.yml` (replace `LocMemCache`)
  - [ ] Move large raster ingestion to async task
  - [ ] Move scheduled backups to Celery beat (daily/weekly)
  - [ ] Move XLSX/PDF exports to async task
  - [ ] Move departmental data sync (`sync_external_data`) to scheduled task
  - [ ] Add task retry logic and dead-letter queue

- [ ] **Job status in UI** `0%` — progress bar + toast when backup/export completes
  - [ ] Expose `/api/v1/tasks/<task_id>/status/` endpoint (Celery result backend)
  - [ ] Frontend: polling hook `useTaskStatus(taskId)`
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
  - [ ] Add Redis service to Docker Compose
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

### Data Governance

- [ ] **Dataset approval workflow** `0%`
  - [ ] Add `status` field to datasets: Draft → Submitted → Under Review → Approved/Rejected
  - [ ] Status transition buttons in admin (with permission check)
  - [ ] Email notification to reviewers on submission
  - [ ] Email notification to submitter on approval/rejection
  - [ ] Field-check confidence % threshold gate (e.g. must be ≥ 70% to approve)
  - [ ] Audit trail for each status change

- [ ] **Versioned datasets** `0%`
  - [ ] Add `DatasetVersion` model: snapshot of dataset + items at a point in time
  - [ ] "Save version" button in admin before bulk edits
  - [ ] Version history list with diff viewer
  - [ ] "Restore to version" action
  - [ ] Auto-version on approval step

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

- [ ] **Scenario comparison** `0%`
  - [ ] Side-by-side map split view (before/after cyclone)
  - [ ] Difference layer: areas where damage increased between events
  - [ ] Compare two datasets across years

- [ ] **Automated hotspot detection** `0%`
  - [ ] Weekly Celery task: flag areas with rising damage estimates over 3+ events
  - [ ] Admin alert panel: "New hotspots detected"
  - [ ] Email digest to NDMO coordinators

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
| Celery + Redis (background tasks) | Medium | Very High | 0% | A |
| Scheduled backups to S3 | Low | Very High | 0% | A |
| Sentry error tracking | Low | High | 0% | A |
| MFA mandatory enforcement | Low | High | 40% | A |
| RBAC per dataset/module | Medium | Very High | 0% | A |
| Audit log (field-level diff) | Medium | High | 10% | A |
| Redis caching hot paths | Low | High | 30% | A |
| Prometheus + Grafana | Medium | High | 0% | B |
| OAuth2 / SSO (Keycloak) | High | Very High | 0% | B |
| Dataset approval workflow | Medium | Very High | 0% | B |
| OGC WMS/WFS output | Medium | High | 0% | B |
| Versioned datasets | Medium | High | 0% | B |
| Full S3 migration | Medium | High | 40% | B |
| Rate limiting per department | Low | High | 50% | B |
| Offline PWA (field teams) | High | Very High | 0% | C |
| Multi-tenancy | High | High | 0% | C |
| Risk calculator | High | Very High | 0% | C |

---

## What to Tackle First

Given the NDMO handover timeline and multi-ministry adoption goals, the highest-leverage sequence is:

1. **Celery + Redis** — unlocks scheduled backups, async imports, email alerts in one go
2. **RBAC + Audit log** — needed before opening to MoCCA/MOET/MIPU users
3. **Scheduled backups to S3** — non-negotiable before NDMO takes ownership
4. **Sentry + `/health/` endpoint** — fast to add, immediately improves operational confidence
5. **MFA enforcement** — 40% done; finish the last mile (mandatory on first login)
