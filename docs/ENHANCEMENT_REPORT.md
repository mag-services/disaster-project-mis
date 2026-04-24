# DRMIS Enhancement Report
Generated: 21 March 2026  
Auditor: Cursor AI code review  
Codebase: VBoS-Social-Section/disaster-project-mis  
Version: v1.0.0 · Build 2026.03.21

---

## Executive Summary

The DRMIS geospatial data pipeline is production-ready: dataset upload, admin management, multi-format map rendering (tabular/vector/raster/PMTiles), MFA authentication, area-data submission workflows, and export functions all work end-to-end against real API data. The top three gaps are: **(1)** the Command Centre dashboard — the primary screen for duty officers — is 100% hardcoded placeholder data with no backend Incident model, no live alert feed, and no real risk scoring; **(2)** there is no Ministry/Department organisational model, so data cannot be filtered, governed, or reported by the institution that owns it; **(3)** security hardening is incomplete — no rate limiting on auth endpoints, tokens never expire, SMTP credentials are stored in plaintext, and all dataset APIs are fully open to any authenticated user regardless of role. Recommended priority order: (1) Command Centre backend + Incident model, (2) ministry/RBAC model, (3) security hardening, (4) enterprise notification and reporting.

---

## System Inventory

### Backend models (16 total across 5 apps)

| App | Model | Key Fields | Missing Enterprise Fields | Admin Registered |
|---|---|---|---|---|
| datasets | Cluster | id, name, order | ministry FK, soft_delete | ✅ |
| datasets | Province | id, name, geometry | — | ✅ |
| datasets | AreaCouncil | id, name, province FK, geometry | — | ✅ |
| datasets | RasterFile | id, name, created, file | created_by, ministry | ✅ |
| datasets | RasterDataset | id, name, description, created, updated, cluster FK, type, source, filename_id, is_land_cover, precomputed_tile_url | created_by, ministry FK, status, soft_delete, version | ✅ |
| datasets | VectorDataset | id, name, description, created, updated, cluster FK, type, source, icon, color, cyclone_name, climate_modules | created_by, ministry FK, status, soft_delete | ✅ |
| datasets | VectorItem | id, dataset FK, name, ref, attribute, province FK, area_council FK, geometry, metadata | — | ✅ (inline only) |
| datasets | PMTilesDataset | id, name, description, created, updated, cluster FK, type, source, url, source_layer, cyclone_name, intensity_data, climate_modules | created_by, ministry FK, status, soft_delete | ✅ |
| datasets | TabularDataset | id, name, description, created, updated, cluster FK, type, source, unit, rap_batch FK | created_by, ministry FK, status, soft_delete | ✅ |
| datasets | TabularItem | id, dataset FK, date, attribute, value, province FK, area_council FK, metadata, intensity | — | ✅ (inline) |
| users | User | id (UUID), username, email, first_name, last_name, avatar, mfa_enabled, mfa_method, is_staff, is_superuser | ministry FK, role, phone, last_login_ip, failed_login_count | ✅ |
| users | SMTPSettings | backend, host, port, use_tls, username, **password (plaintext)**, from_email, otp_required_for_all_logins | — | ✅ |
| area_submissions | AreaAdministrator | user OneToOne, area_councils M2M, provinces M2M | — | ✅ |
| area_submissions | AreaDataSubmission | submitted_by FK, dataset FK, province FK, area_council FK, year, items JSON, status, reviewed_by FK, rejection_reason | — | ✅ |
| rap_import | RAPImportBatch | batch_ref, cyclone_name, event_year, imported_by FK, status, provinces_affected | — | ✅ |
| rap_import | RAPImportFile | batch FK, sector_family, file, row_count, columns_detected, parse_errors, status | — | ✅ |
| maintenance | BackupLog | created_at, backup_type, size_bytes, filename, created_by FK, file_path | — | ✅ |

**Missing models (no backend model exists):**
- `Incident` / `DisasterEvent` — no model at all; Command Centre is pure stub
- `Alert` / `Notification` — no model; Live Alerts panel is hardcoded
- `Ministry` / `Organisation` — no registry; data source is freetext only
- `Role` / `DRMISPermission` — no DRMIS-specific RBAC model

### Frontend routes (8 shell nav destinations)

| Nav ID | Component | Status | API Endpoint | Notes |
|---|---|---|---|---|
| dashboard | CommandCentre | **STUB — all hardcoded** | None | All 4 KPIs, 4 incidents, 6 alerts, 6 risk scores are static constants |
| live-map | Map + Header + RightSidebar | **Working** | /api/v1/datasets/, /api/v1/vector/, /api/v1/tabular/ | Full dataset map pipeline functional |
| datasets | DatasetsPage | **Working** | /api/v1/cluster/, /api/v1/datasets/ | Real data, search + filter |
| exports | ExportsPage | **Working** | /api/v1/datasets/, xlsx/geojson/tif endpoints | Multi-format download functional |
| audit | AuditLogPage | **Working** | /api/v1/audit/ | Scoped to datasets app, paginated |
| settings | SettingsPage | **Working** | /api/v1/users/me, /api/v1/auth/* | Profile, Security, Appearance tabs |
| _(overlay)_ | ProfilePage | **Working** (accessible via App.tsx only) | /api/v1/users/me | Full-screen overlay, no shell nav |
| _(overlay)_ | AreaDataEntryPage | **Working** | /api/v1/area_submissions/ | Approval workflow complete |

### API endpoints (34 total)

| Method | Path | Auth | Filters | Paginated | Documented |
|---|---|---|---|---|---|
| POST | /api-token-auth/ | None | — | No | No |
| POST | /api/v1/auth/verify-2fa/ | Token | — | No | No |
| POST | /api/v1/auth/resend-email-otp/ | Token | — | No | No |
| POST | /api/v1/auth/setup-totp/ | Token | — | No | No |
| POST | /api/v1/auth/setup-totp-verify/ | Token | — | No | No |
| POST | /api/v1/auth/setup-email-otp/ | Token | — | No | No |
| POST | /api/v1/auth/disable-2fa/ | Token | — | No | No |
| GET | /api/v1/users/ | Token | — | No | No |
| GET/PATCH | /api/v1/users/me/ | Token | — | No | No |
| POST | /api/v1/users/me/change-password/ | Token | — | No | No |
| POST | /api/v1/users/me/avatar/ | Token | — | No | No |
| GET | /api/v1/cluster/ | Token | — | Yes (100) | No |
| GET | /api/v1/datasets/ | Token | cluster, scenario | No | No |
| GET | /api/v1/provinces/ | Token | — | No | No |
| GET | /api/v1/provinces/<name>/area-councils/ | Token | — | No | No |
| GET | /api/v1/raster/ | Token | — | Yes | No |
| GET | /api/v1/raster/<id>/ | Token | — | No | No |
| GET | /api/v1/pmtiles/ | Token | — | Yes | No |
| GET | /api/v1/pmtiles/<id>/ | Token | — | No | No |
| GET | /api/v1/pmtiles/<id>/intensity/ | Token | province, area_council | No | No |
| GET | /api/v1/vector/ | Token | — | Yes | No |
| GET | /api/v1/vector/<id>/ | Token | — | No | No |
| GET | /api/v1/vector/<id>/data/ | Token | bbox, province, area_council | Yes (5000) | No |
| GET | /api/v1/exposure/ | Token | lat, lng, vector_layer_ids | No | No |
| GET | /api/v1/tabular/ | Token | — | Yes | No |
| GET | /api/v1/tabular/<id>/ | Token | — | No | No |
| GET | /api/v1/tabular/<id>/data/ | Token | province, area_council, date_after, date_before, attribute | Yes (5000) | No |
| GET | /api/v1/tabular/<id>/aggregate/ | Token | group_by, year, attribute, agg, province | No | No |
| GET | /api/v1/tabular/<id>/data-xlsx/ | Token | province, area_council, date_after, date_before | No | No |
| GET/serve | /api/v1/pmtiles-serve/<path> | Token | — | No | No |
| GET | /api/v1/audit/ | Token | search, action, user, model, date_from, date_to | Yes (50) | No |
| GET | /api/v1/admin/pipeline-status/ | Token + IsAdminUser | — | No | No |
| GET | /api/v1/tasks/<task_id>/status/ | None | — | No | No |
| GET | /api/v1/schema/ | None | — | No | Auto (drf_spectacular) |

---

## Critical Fixes (do immediately — system correctness)

### 1. Command Centre dashboard — all data is hardcoded
**Where:** `vbos-frontend/src/pages/CommandCentre.tsx`, `src/components/dashboard/IncidentsTable.tsx`, `src/components/dashboard/LiveAlertsPanel.tsx`, `src/components/dashboard/RiskExposurePanel.tsx`  
**Problem:** Every metric (Active incidents: 12, Field teams: 28, Assessment confidence: 87%, System uptime: 99.94%), every incident row (4 placeholder rows with IDs 1–4), every live alert (6 hardcoded strings), and every risk bar (6 province scores) are static JavaScript constants. The "Edit ↗" links in IncidentsTable use hardcoded IDs 1–4 — they will link to wrong or non-existent admin records in production. No backend model for Incident exists.  
**Fix:** (a) Create `Incident` / `DisasterEvent` model in Django with fields: `title`, `type` (cyclone/flood/etc.), `severity`, `province` FK, `status` (active/monitoring/resolved), `created_by`, `created_at`, `updated_at`. (b) Create REST endpoint `GET /api/v1/incidents/`. (c) Replace hardcoded constants in all four dashboard components with `useQuery` calls. (d) Replace `alertCount={2}` in `App.tsx` and `badge={2}` in `Sidebar.tsx` with real counts from the API.  
**Impact:** [NDMO] Primary duty-officer screen shows fictional data. Any official reading the dashboard is seeing invented numbers.

### 2. [SECURITY] No rate limiting on authentication endpoints
**Where:** `vbos-backend/vbos/urls.py`, `vbos-backend/vbos/users/auth_2fa.py`  
**Problem:** `/api-token-auth/` (login), `/api/v1/auth/verify-2fa/`, and `/api/v1/auth/resend-email-otp/` have no rate limiting. An attacker can brute-force passwords and exhaust OTP codes with unlimited requests.  
**Fix:** Add `django-ratelimit` or configure nginx rate limiting. For the auth view, apply `@ratelimit(key='ip', rate='10/m', block=True)`. For OTP endpoints, apply `@ratelimit(key='user_or_ip', rate='5/m', block=True)`.  
**Impact:** [SECURITY] All user accounts are vulnerable to brute-force attack.

### 3. [SECURITY] SMTP password stored in plaintext
**Where:** `vbos-backend/vbos/users/models.py` — `SMTPSettings.password = CharField(max_length=255)`  
**Problem:** The SMTP server password used for 2FA OTP emails is stored in plaintext in the database. Any database dump or admin with DB access can read it.  
**Fix:** Encrypt at rest using `django-encrypted-fields` or store in environment variable and reference it in the model rather than persisting it: `password = EncryptedCharField(max_length=255, blank=True)`.  
**Impact:** [SECURITY] SMTP credentials (potentially shared with other government systems) are exposed in any database backup or breach.

### 4. [SECURITY] Authentication tokens never expire
**Where:** `vbos-backend/vbos/users/models.py` — `create_auth_token` signal creates a `Token` with no expiry  
**Problem:** DRF's `Token` model has no expiry field. Once issued at user creation, a token is valid forever unless manually deleted. A stolen token from a former employee or a device compromise grants permanent access.  
**Fix:** Replace DRF `Token` with `knox` (`django-rest-knox`) which supports token expiry, per-device tokens, and token rotation. Set expiry to 8 hours for standard sessions, 30 days for "remember me".  
**Impact:** [SECURITY] Former staff tokens remain valid indefinitely.

### 5. Alert count badge is hardcoded
**Where:** `vbos-frontend/src/App.tsx` line 169: `alertCount={2}`, `src/components/shell/Sidebar.tsx` line 62: `badge={2}`  
**Problem:** The red "2" badge on the Live Map nav item and the alert count in the topbar are hardcoded constants. Users cannot trust these counts.  
**Fix:** Create `GET /api/v1/alerts/count/` endpoint or include active alert count in the pipeline-status API response. Consume via a `useQuery` hook and pass the live count to `AppShell` and `Sidebar`.  
**Impact:** [NDMO] Duty officers cannot trust the alert indicator in the navigation.

### 6. "Edit ↗" links in IncidentsTable use hardcoded IDs
**Where:** `vbos-frontend/src/components/dashboard/IncidentsTable.tsx`  
**Problem:** The incidents table has 4 static rows with `id: 1, 2, 3, 4`. The "Edit ↗" link constructs `/admin/area_submissions/areadatasubmission/{row.id}/change/`. In a real database these IDs will not exist or will point to wrong records.  
**Fix:** This is resolved by fixing Critical Issue #1 — replacing the hardcoded rows with real API data where each record has its actual database ID.  
**Impact:** [NDMO] Admin cross-links are broken and misleading.

### 7. /api/v1/tasks/<task_id>/status/ has no authentication
**Where:** `vbos-backend/vbos/maintenance/task_status_views.py`  
**Problem:** The Celery task status endpoint is listed in `urls.py` with no authentication decorator. Any unauthenticated request can poll task status, potentially leaking internal system operation details.  
**Fix:** Add `@api_view(['GET'])` with `permission_classes = [IsAuthenticated]`.  
**Impact:** [SECURITY] Minor information disclosure.

---

## High Priority Enhancements (do next sprint)

### 1. Ministry/Organisation model and user assignment [NDMO] [MoCCA] [CLUSTER]
**Where:** New `vbos/organisations/` Django app  
**Problem:** There is no Ministry or Organisation model. Users have no organisational affiliation. Datasets have only a freetext `source` field. This makes ministry-level reporting, data governance, and access control impossible.  
**Fix:** Create `Organisation(id, name, type[ministry/un_agency/ngo/government], country)` model. Add `organisation FK` to `User`. Add `organisation FK` to all four dataset models. Wire into admin and API serializers.  
**Impact:** Enables ministry-level data filtering, reporting, and the entire multi-tenancy model.

### 2. Dataset status/approval workflow for main datasets [NDMO]
**Where:** `vbos-backend/vbos/datasets/models.py` — all four dataset models  
**Problem:** All datasets go live immediately on creation/upload with no review step. The `AreaDataSubmission` workflow has proper draft/submitted/approved/rejected states, but the primary dataset models (`TabularDataset`, `VectorDataset`, `RasterDataset`, `PMTilesDataset`) have no status field. A data manager can publish erroneous data accidentally.  
**Fix:** Add `status = CharField(choices=[draft/published/archived], default='draft')` to all dataset models. Add `published_by FK`, `published_at` fields. Add status filter and bulk-publish admin action.  
**Impact:** [NDMO] Data governance — prevents accidental publication of incomplete datasets.

### 3. Command Centre export and new incident actions [NDMO]
**Where:** `vbos-frontend/src/pages/CommandCentre.tsx`  
**Problem:** "Export Report" and "+ New Incident" buttons fire info toasts. These are the two most important actions for a duty officer.  
**Fix:** After Critical Fix #1 (Incident model): (a) Wire "+ New Incident" to a dialog/page that creates an `Incident` record via POST. (b) Wire "Export Report" to a PDF generation endpoint using WeasyPrint or a pre-built template.  
**Impact:** [NDMO] Core operational workflow is non-functional.

### 4. Real-time/polling alerts from a real source [NDMO] [CLUSTER]
**Where:** `vbos-frontend/src/components/dashboard/LiveAlertsPanel.tsx`  
**Problem:** 6 hardcoded static alerts. No backend model. No polling.  
**Fix:** Create `Alert(id, type, message, severity, province FK, created_at, is_read, created_by)` model and `GET /api/v1/alerts/?unread=true` endpoint. Replace the panel with a `useQuery` that polls every 30 seconds.  
**Impact:** [NDMO] The primary situation-awareness feed shows fictional data.

### 5. Add `created_by`/`updated_by` to all dataset models [NDMO]
**Where:** `vbos-backend/vbos/datasets/models.py`  
**Problem:** None of the dataset models track which user created or last modified them. The Django admin `LogEntry` captures admin-side changes, but API-side changes (e.g. from import scripts) leave no user trail.  
**Fix:** Add `created_by = ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=SET_NULL, related_name='+')` and `updated_by` to all four dataset models. Wire into serializers and admin as readonly.  
**Impact:** Data provenance and accountability.

### 6. Object-level read permissions on dataset APIs [SECURITY]
**Where:** `vbos-backend/vbos/datasets/views.py`  
**Problem:** All dataset API views use only `IsAuthenticated`. A user from the Health cluster can read Water/Sanitation cluster data and vice versa. Provincial coordinators can read data from all provinces.  
**Fix:** Implement cluster-scoped and province-scoped permissions. Add `ClusterPermission` that checks whether `request.user` is assigned to the requested cluster. For province-scoped data, enforce `AreaAdministrator.provinces` or `AreaAdministrator.area_councils` membership.  
**Impact:** [SECURITY] [PARTNER] Data confidentiality between clusters and provinces.

### 7. Password reset by email [NDMO] [CLUSTER]
**Where:** `vbos-backend/vbos/users/` — no password reset views exist  
**Problem:** There is no "Forgot password" flow. Users who lose their password require a superuser to reset it via the admin panel. In a field deployment with dozens of provincial coordinators, this is a critical operations bottleneck.  
**Fix:** Implement Django's built-in `PasswordResetView` / `PasswordResetConfirmView` and wire them to email templates. Add a "Forgot password?" link on the login screen.  
**Impact:** [NDMO] [CLUSTER] User self-service — reduces admin overhead.

### 8. OpenAPI documentation for all endpoints [PARTNER]
**Where:** All views in `vbos-backend/vbos/datasets/views.py`, `users/`, `area_submissions/`  
**Problem:** Only the `drf_spectacular` schema generation is wired (`/api/v1/docs/`), but none of the views have `@extend_schema` decorators, descriptions, or response type annotations. Development partners and integration engineers have no machine-readable contract.  
**Fix:** Add `@extend_schema(summary=..., description=..., parameters=[...])` to every view. Add response serializers with `responses={200: MySerializer}`.  
**Impact:** [PARTNER] API consumers (SPC, World Bank, UN agencies) need documented endpoints.

---

## Enterprise Feature Gaps (phased implementation)

### Phase A — Foundation (complete these first)

| Feature | Effort | Tag |
|---|---|---|
| Incident / DisasterEvent model + CRUD API + admin | XL | [NDMO] |
| Alert model + API + Command Centre live feed | L | [NDMO] |
| Ministry / Organisation model + user assignment | L | [NDMO] [MoCCA] |
| Risk scoring engine (province × hazard type formula) | L | [NDMO] [CABINET] |
| Password reset by email flow | S | [ALL] |
| Rate limiting on auth endpoints | S | [SECURITY] |
| Token expiry (replace DRF Token with Knox) | M | [SECURITY] |
| Dataset status field (draft/published/archived) | S | [NDMO] |
| created_by / updated_by on all dataset models | S | [NDMO] |
| Alert count badge connected to real API | S | [NDMO] |
| "New Incident" dialog wired to real API | M | [NDMO] |
| "Export Report" generating real PDF | M | [NDMO] [CABINET] |

### Phase B — Hardening

| Feature | Effort | Tag |
|---|---|---|
| Object-level read permissions by cluster/province | L | [SECURITY] |
| DRMIS role model (Analyst/FieldOfficer/Minister/Admin) | M | [NDMO] |
| Email notifications on dataset approval/rejection | M | [NDMO] [MoCCA] |
| In-app notification system (bell icon, unread count) | L | [ALL] |
| Field-level audit logging (before/after on model changes) | L | [NDMO] |
| Dataset versioning | XL | [NDMO] |
| User invitation flow (invite by email, not just superuser) | M | [NDMO] |
| Concurrent session limits + device management | M | [SECURITY] |
| Province-level summary report (PDF) | M | [NDMO] [CABINET] |
| Scheduled report delivery by email (Celery Beat) | L | [CABINET] |
| Offline data entry with sync (PWA enhancement) | XL | [CLUSTER] |
| Low-bandwidth/text-only mode for field use | M | [CLUSTER] |

### Phase C — Advanced

| Feature | Effort | Tag |
|---|---|---|
| OGC WMS/WCS endpoints for QGIS/ArcGIS users | L | [PARTNER] |
| Webhook subscriptions for downstream systems | L | [PARTNER] |
| API key management for partner system access | M | [PARTNER] |
| Shapefile export format | M | [PARTNER] |
| VMGD (Met Office) live data feed integration | XL | [NDMO] |
| Pacific Data Hub integration | XL | [PARTNER] |
| Bislama / French language support (i18n) | XL | [ALL] |
| High contrast / accessibility mode | M | [ALL] |
| Executive one-page situation report (Cabinet PDF) | L | [CABINET] |
| Dataset duplicate detection on import | M | [NDMO] |
| Malware scan hook on file uploads | M | [SECURITY] |
| GDPR / data retention policy enforcement | L | [SECURITY] |
| Escalation rules for unanswered alerts | L | [NDMO] |

---

## Ministry-Specific Recommendations

### NDMO (primary operators)
The entire Command Centre dashboard is a stub. NDMO duty officers open the system and see invented data. **Priority 1:** Build the `Incident` model and wire the dashboard to real data. **Priority 2:** Build a real-time alert feed from NDMO's own alert creation workflow. **Priority 3:** Add a situation report PDF export from the Command Centre. The existing dataset pipeline (map layers, RAP import, area submissions) is solid and serves NDMO well — do not touch it, just expose it properly through the Command Centre context.

### MoCCA / Climate ministries
The Climate mode in the Live Map is the most complete feature in the system. Land-cover change analysis, coastal change data, and the comparison overlay all work. What is missing: (a) dataset ownership — there is no way to mark a raster/vector dataset as "owned by MoCCA" vs "owned by MOET"; (b) dataset status — MoCCA staff cannot review a dataset before it goes live; (c) ministry-level reporting — no way to generate a climate-data summary report for MoCCA. Short-term fix: add `organisation` FK to all dataset models and filter by it in the admin. Medium-term: add publication workflow.

### Cluster heads (Education, Health, Shelter, WASH, etc.)
Cluster heads use the area data submission workflow, which is properly implemented. The gap is visibility: cluster heads cannot see a summary of submissions across their cluster, cannot see which area councils have submitted vs not submitted, and cannot export a cluster-level summary. Recommendations: (a) add a cluster-level submission dashboard widget to the Command Centre; (b) add a per-cluster submission completeness report; (c) add email notifications when a submission is approved/rejected so cluster data entry teams are notified without checking the app.

### Development partners (SPC, World Bank, UN agencies)
Partners need read-only API access with documented endpoints. Currently: (a) all API endpoints require a Django user account — no API key / service account mechanism exists; (b) no OpenAPI documentation annotations on any endpoint beyond the auto-generated schema; (c) no GeoPackage or Shapefile export format. Recommendations: (a) implement API key model with scoped read-only access; (b) add `@extend_schema` to all public endpoints; (c) add Shapefile export in the Exports page.

### Cabinet / Senior officials
Cabinet needs a one-page situation overview: current active incidents, affected provinces, deployed resources, and key trends. The Command Centre *should* serve this, but it's all stub data. After fixing the Incident model, create a printable/PDF-exportable "Situation Summary" that can be emailed daily. Consider a separate public-facing read-only dashboard that does not require login for cabinet members who do not maintain regular accounts.

---

## Quick Wins (< 1 day each, high visibility)

| Item | File | Change | Impact |
|---|---|---|---|
| Remove hardcoded alertCount=2 | `src/App.tsx:169`, `src/components/shell/Sidebar.tsx:62` | Replace with `0` or a computed zero until real alerts API exists | Stops misleading badge from confusing operators |
| Add "Forgot password?" link on login screen | `src/components/Login.tsx` | Add link to a `/password-reset/` Django view | Unblocks locked-out field staff without admin intervention |
| Add auth to /api/v1/tasks/<task_id>/status/ | `vbos-backend/vbos/maintenance/task_status_views.py` | Add `permission_classes = [IsAuthenticated]` | Closes minor info-disclosure |
| Mark CommandCentre data as placeholder | `src/pages/CommandCentre.tsx` | Add a `<div>` banner: "Dashboard data is illustrative — live data connection in progress" | Sets correct expectations for early deployments |
| Add `status` field to all dataset models | `datasets/models.py` | `status = CharField(choices=[...], default='draft')` + migration | Enables data governance without breaking anything |
| Fix "New Incident" and "Export Report" buttons | `src/pages/CommandCentre.tsx` | Change from `toast.info` stubs to navigation: New Incident → form dialog, Export → downloads page | Removes obviously broken UI |
| Add password reset URLs to Django | `vbos-backend/vbos/urls.py` | Add Django's built-in `password_reset/` views | Self-service password recovery |
| Fix DISASTER_DATASET_NAMES to be admin-configurable | `vbos-backend/vbos/datasets/views.py:59-68` | Move hardcoded list to a `DisasterDatasetName` model registered in admin | Admins can add new disaster layer types without code changes |
| Add `ALLOWED_HOSTS` env override documentation | `vbos-backend/vbos/config/common.py` | Document in `.env.example` that ALLOWED_HOSTS must be set in production | Prevents accidental open host deployment |
| Encrypt SMTP password field | `vbos-backend/vbos/users/models.py` | Use `django-encrypted-fields` for `SMTPSettings.password` | Protects SMTP credentials in DB backups |

---

## Technical Debt

1. **`climate_module` field (deprecated)** — `VectorDataset` and `PMTilesDataset` both have a deprecated `climate_module` CharField alongside the newer `climate_modules` JSONField. Two migration cleanups needed: remove the old field and update all queries.

2. **`admin_pipeline_status_api.py` dead import** — The `try: from core.models import AuditLog` block always fails (no `core` app exists). The `audit_logging_active` flag is always `False`. The dashboard shows "Audit log is being set up." forever. Either remove this block or wire it to the real `LogEntry`-backed audit view.

3. **No test suite found** — No `tests.py` files were found in any Django app. No `*.test.ts` or `*.spec.ts` files found in the frontend beyond `downloadHelpers.test.ts`. An enterprise government system with no test coverage is extremely high risk during future development.

4. **Cesium/Resium bundle size** — The frontend includes CesiumJS (`cesium: ^1.139.1`, `resium: ^1.20.0`) for the 3D globe map mode. CesiumJS is a very large library (~10 MB+). It appears to be lazy-loaded via `Map3D` component, but the Cesium assets (terrain, imagery providers) need to be explicitly excluded from the main bundle.

5. **Two map libraries** — Both Leaflet and MapLibre GL are bundled. The system appears to use Leaflet for the primary 2D map (with PMTiles/Protomaps) and MapLibre for vector tiles. This is a significant bundle size concern and maintenance overhead.

6. **`DRIVER_DATASET_NAMES` and `DISASTER_DATASET_NAMES` hardcoded** — Governance of which datasets appear in each mode is hardcoded in `views.py`. Adding a new disaster overlay (e.g. "Storm Surge") requires a code change and deployment, not an admin action.

7. **No structured logging** — Django's default logging is not configured for structured (JSON) output. In a production environment with log aggregation (CloudWatch, Datadog), unstructured logs are very difficult to query and alert on.

8. **`useLandCoverRaster` hook complexity** — The climate mode auto-activation of land cover rasters involves multiple hooks, effects, and store interactions. The logic is spread across `useClimateModuleAutoLayers.ts`, `useClimateModeEffect.ts`, `useLandCoverRaster.ts`, and `layer-store.ts`. This is a prime candidate for refactoring into a single clear state machine.

9. **Zustand persist partializer is incomplete** — `ui-store.ts` persists only `leftSidebarIconMode`, `rightSidebarIconMode`, `rightSidebarExpanded`, `selectedClimateModule`. `shellNavId` is not persisted, so refreshing the browser always returns to the Command Centre regardless of which page the user was on.

---

## Appendix: Full Audit Findings

### A1. Command Centre — detailed breakdown

**`MetricCard.tsx`** — Pure presentational component. Well-built with design tokens. No stubs.  
**`IncidentsTable.tsx`** — Full static mock. `MOCK_INCIDENTS` array has 4 rows with `id: 1–4`. The component accepts `onViewAll` and exports a no-op because `onViewAll` is never passed from `CommandCentre.tsx`. The "View all" link would navigate... nowhere.  
**`LiveAlertsPanel.tsx`** — `MOCK_ALERTS` array with 6 items. `onSilence` prop is never passed. Renders a `.map()` of static strings.  
**`RiskExposurePanel.tsx`** — `PLACEHOLDER_SCORES` object: `{ Tafea: 82, Malampa: 55, Shefa: 71, Penama: 38, Sanma: 44, Torba: 22 }`. These are not computed from any data. A comment in the component reads "TODO: replace with real province risk scoring". `onByProvince` is never passed.

### A2. Authentication flow

Login → `POST /api-token-auth/` → if 2FA required, returns `{mfa_required: true}` → UI shows OTP input → `POST /api/v1/auth/verify-2fa/` → returns token → stored in `authStore`. The `useAuth` hook returns `isAuthenticated: !!token`. The token is stored in `localStorage` via Zustand persist. No session expiry check is performed on app load — a stale/invalid token renders the user as "authenticated" until the first 401 response triggers a logout.

### A3. Admin navigation

The Unfold admin sidebar has these groups: Operations, Data, Integrations, Audit & Logs, Settings. All links appear to point to real admin URLs. The Climate section has custom admin views (`/admin/climate/`) that bypass standard Django admin changeform patterns — these are custom HTML forms built with `admin.site.admin_view()` wrappers.

### A4. .env.example findings

The `vbos-frontend/.env.example` documents: `VITE_API_HOST`, `VITE_TITILER_API`, `VITE_APP_VERSION`, `VITE_ROADMAP_URL`. Missing from documentation: any backend environment variables for `DATABASE_URL`, `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, `REDIS_URL`, `AWS_ACCESS_KEY_ID`, `DIGITALOCEAN_SPACES_*`, `EMAIL_HOST_PASSWORD`, etc. Backend configuration documentation is absent.

### A5. Area Submissions workflow

This is the most complete data-governance workflow in the system. `AreaDataSubmission` has proper status state machine (draft → submitted → approved/rejected), reviewer tracking, rejection reason, and timestamps. The `AreaAdministrator` model correctly links users to their area_councils/provinces. The `AreaDataEntryPage` frontend component is functional. This workflow is a good template for the dataset publication workflow gap identified above.
