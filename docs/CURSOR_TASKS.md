# DRMIS Cursor Implementation Tasks
Priority order based on ENHANCEMENT_REPORT.md.
Each task is self-contained and safe to implement independently.
Generated: 21 March 2026

---

## BATCH 1 — Critical (implement first, 1–2 days)

### 1. Add IsAuthenticated to task status endpoint
**File:** `vbos-backend/vbos/maintenance/task_status_views.py`  
**What to do:** Add `permission_classes = [IsAuthenticated]` to the `TaskStatusView`. Import `IsAuthenticated` from `rest_framework.permissions`.  
**Acceptance criteria:** `GET /api/v1/tasks/<id>/status/` returns 401 for unauthenticated requests.

---

### 2. Replace hardcoded alert count badge with 0 placeholder
**File:** `vbos-frontend/src/App.tsx` (line ~169), `vbos-frontend/src/components/shell/Sidebar.tsx` (line ~62)  
**What to do:** Change `alertCount={2}` in App.tsx to `alertCount={0}`. Change `badge={2}` in Sidebar.tsx to remove the badge prop entirely until a real alerts API exists.  
**Acceptance criteria:** No red "2" badge appears anywhere in the UI. No hardcoded badge values exist in any component.

---

### 3. Add "placeholder data" banner to Command Centre
**File:** `vbos-frontend/src/pages/CommandCentre.tsx`  
**What to do:** Add a dismissible amber warning banner at the top of the page: "Dashboard data is illustrative — live incident data connection is in progress." Use the existing `sonner` toast or an inline banner component. Store dismissed state in `localStorage` so it only shows once per user.  
**Acceptance criteria:** Banner appears on first visit, does not reappear after dismissal. Text is clear and non-alarming.

---

### 4. Add `status` field to all dataset models
**File:** `vbos-backend/vbos/datasets/models.py`, new migration file  
**What to do:**
- Add `STATUS_CHOICES = [('draft', 'Draft'), ('published', 'Published'), ('archived', 'Archived')]` to `TabularDataset`, `VectorDataset`, `RasterDataset`, and `PMTilesDataset`.
- Add `status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')` — default to `'published'` so existing data is not hidden.
- Generate and apply migration: `python manage.py makemigrations datasets && python manage.py migrate`.
- Add `status` to `list_display`, `list_filter`, and a bulk `publish` / `archive` admin action in `admin.py`.  
**Acceptance criteria:** All four dataset admin views show a `Status` column. Filtering by status works. Bulk "Publish selected" and "Archive selected" actions appear in the admin action dropdown.

---

### 5. Add rate limiting to authentication endpoints
**File:** `vbos-backend/requirements.txt`, `vbos-backend/vbos/users/auth_views.py` or `urls.py`  
**What to do:**
- Add `django-ratelimit==4.1.0` to `requirements.txt`.
- In the auth view that handles `POST /api-token-auth/`: apply `@ratelimit(key='ip', rate='10/m', method='POST', block=True)`.
- In `verify-2fa`, `resend-email-otp` views: apply `@ratelimit(key='user_or_ip', rate='5/m', method='POST', block=True)`.
- In `settings.py` (`common.py`), add `django_ratelimit` to `INSTALLED_APPS`.  
**Acceptance criteria:** More than 10 login attempts from the same IP within 1 minute results in a 429 response. More than 5 OTP attempts within 1 minute results in a 429 response.

---

### 6. Encrypt SMTP password in SMTPSettings
**File:** `vbos-backend/requirements.txt`, `vbos-backend/vbos/users/models.py`  
**What to do:**
- Add `django-encrypted-fields==0.2.4` (or latest) to `requirements.txt`.
- In `SMTPSettings`, change `password = models.CharField(max_length=255, ...)` to `password = EncryptedCharField(max_length=255, ...)`.
- Import from `encrypted_fields.fields`.
- Set `FIELD_ENCRYPTION_KEY` in `common.py` to read from environment variable `DJANGO_FIELD_ENCRYPTION_KEY`.
- Generate migration.  
**Acceptance criteria:** The password column in the database is no longer stored in plaintext. Existing SMTP passwords need to be re-entered via admin after this migration.

---

### 7. Add `DISASTER_DATASET_NAMES` admin configuration model
**File:** `vbos-backend/vbos/datasets/models.py`, `admin.py`, `views.py`  
**What to do:**
- Create `DisasterDatasetTag(name: CharField unique, created: auto)` model.
- Register in admin with simple `list_display = ['name']`.
- In `views.py`, replace `DISASTER_DATASET_NAMES = [...]` with `DisasterDatasetTag.objects.values_list('name', flat=True)`.
- Create a data migration that populates the new model with the current hardcoded values (`["Cyclone Intensity", "Volcano", "Flood", "Earthquake", "Tsunami", "Landslide", "Drought", "Wildfire"]`).  
**Acceptance criteria:** Admin users can add new disaster layer types (e.g. "Storm Surge") via the admin panel without any code changes. Existing disaster layers continue to appear on the map.

---

## BATCH 2 — High Priority (next sprint, 3–5 days)

### 8. Incident model and CRUD API
**Files:** New `vbos-backend/vbos/incidents/` Django app  
**What to do:**
- Create `vbos/incidents/` app with `models.py`, `admin.py`, `serializers.py`, `views.py`, `urls.py`.
- `Incident` model: `id (UUID)`, `title`, `type (choices: cyclone/flood/earthquake/tsunami/landslide/drought/volcano/wildfire)`, `severity (choices: watch/advisory/warning/emergency)`, `province FK nullable`, `status (choices: active/monitoring/resolved)`, `created_by FK`, `created_at auto`, `updated_at auto`, `notes TextField blank`.
- Serializer: all fields, `created_by` is read-only and set from `request.user`.
- View: `ModelViewSet` with `IsAuthenticated` permission. Filter by `status`, `type`, `province`, `severity`. Order by `-created_at` default.
- Register URL at `/api/v1/incidents/`.
- Admin: `list_display = ['title', 'type', 'severity', 'province', 'status', 'created_at']`, searchable by title, filterable by type/status/severity/province.  
**Acceptance criteria:** `GET /api/v1/incidents/` returns paginated list. `POST /api/v1/incidents/` creates a record and sets `created_by`. Admin shows all incidents with correct columns and filters.

---

### 9. Replace hardcoded CommandCentre data with real API calls
**Files:** `vbos-frontend/src/pages/CommandCentre.tsx`, `src/components/dashboard/IncidentsTable.tsx`, `src/components/dashboard/RiskExposurePanel.tsx`, `src/api/getIncidents.ts` (new)  
**What to do:** (Depends on task #8)
- Create `src/api/getIncidents.ts` that calls `GET /api/v1/incidents/`.
- In `CommandCentre.tsx`, replace the 4 hardcoded `MetricCard` values:
  - "Active incidents" → `useQuery(['incidents', {status: 'active'}], getIncidents)` → count.
  - "Field teams deployed" → keep stub with label "Coming soon" for now (no Teams model yet).
  - "Assessment confidence" → keep stub.
  - "System uptime" → keep stub.
- In `IncidentsTable.tsx`, replace `MOCK_INCIDENTS` with real API data. Show loading skeleton during fetch. Show empty state when no incidents.
- Remove `RiskExposurePanel.tsx` `PLACEHOLDER_SCORES`. Either connect to real data or replace with a "Risk analysis coming soon" empty-state card.  
**Acceptance criteria:** Incidents table shows real incidents from the database. Active incidents count on the KPI card matches real count. Loading and empty states render correctly.

---

### 10. New Incident dialog (wire "+ New Incident" button)
**Files:** `vbos-frontend/src/pages/CommandCentre.tsx`, new `src/components/dashboard/NewIncidentDialog.tsx`  
**What to do:** (Depends on tasks #8 and #9)
- Create `NewIncidentDialog` with fields: Title (text), Type (select), Severity (select), Province (select — from `/api/v1/provinces/`), Notes (textarea).
- On submit, `POST /api/v1/incidents/` and invalidate the incidents query.
- Replace the `toast.info("New incident", ...)` stub in CommandCentre with opening this dialog.  
**Acceptance criteria:** Clicking "+ New Incident" opens a dialog. Filling the form and submitting creates a real incident. The incidents table refreshes. Validation errors are shown inline.

---

### 11. Alert model and live alerts panel
**Files:** New `vbos/alerts/` or `vbos/incidents/alerts.py`, `vbos-frontend/src/components/dashboard/LiveAlertsPanel.tsx`  
**What to do:**
- Add `Alert(id UUID, message, severity choices, province FK nullable, created_at auto, created_by FK, is_read bool default=False)` model.
- Create `GET /api/v1/alerts/` endpoint with `is_read` and `severity` filters.
- In `LiveAlertsPanel.tsx`, replace `MOCK_ALERTS` with `useQuery` polling every 30 seconds.
- Show unread count in the topbar via `GET /api/v1/alerts/?is_read=false&page_size=1` (total count from pagination).  
**Acceptance criteria:** Alerts panel shows real alerts from the database. Refreshes every 30 seconds. Unread count shows in topbar. Empty state renders when there are no alerts.

---

### 12. Add `created_by` and `updated_by` to all dataset models
**Files:** `vbos-backend/vbos/datasets/models.py`, `admin.py`, `serializers.py`, migration  
**What to do:**
- Add to `TabularDataset`, `VectorDataset`, `RasterDataset`, `PMTilesDataset`:
  ```python
  created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='+', editable=False)
  ```
- Wire `created_by` in the admin using `save_model(self, request, obj, form, change): if not change: obj.created_by = request.user`.
- Add to admin `readonly_fields`.
- Add to serializers as `read_only=True`.  
**Acceptance criteria:** When a dataset is created via admin, `created_by` is set to the logged-in admin user. The admin detail view shows "Created by: username" as a read-only field.

---

### 13. Password reset by email
**Files:** `vbos-backend/vbos/urls.py`, `vbos-backend/vbos/templates/registration/` (new templates), `vbos-frontend/src/components/Login.tsx`  
**What to do:**
- In `vbos/urls.py`, include Django's auth URL patterns for password reset: `path('password-reset/', include('django.contrib.auth.urls'))`.
- Create email templates: `registration/password_reset_email.html`, `registration/password_reset_subject.txt`, `registration/password_reset_confirm.html`, `registration/password_reset_complete.html`. Style using DRMIS branding.
- Add "Forgot password?" link to the Login component pointing to `/password-reset/`.  
**Acceptance criteria:** User can enter email on password reset page, receive an email with a reset link, and set a new password. The login page has a visible "Forgot password?" link.

---

### 14. Ministry/Organisation model
**Files:** New `vbos-backend/vbos/organisations/` Django app, `vbos-backend/vbos/users/models.py`, `vbos-backend/vbos/datasets/models.py`  
**What to do:**
- Create `Organisation(id, name, short_name, type choices[ministry/un_agency/ngo/provincial_government], country default='VU', created_at auto)` model.
- Add `organisation = ForeignKey(Organisation, null=True, blank=True, on_delete=SET_NULL)` to `User` model.
- Add `organisation = ForeignKey(Organisation, null=True, blank=True, on_delete=SET_NULL)` to `TabularDataset`, `VectorDataset`, `RasterDataset`, `PMTilesDataset`.
- Register `Organisation` in admin. Add to Unfold sidebar under "Settings" group.
- Create data migration with Vanuatu government ministry list: NDMO, MoCCA, MOET, Ministry of Health, MIPU, MFAT, and UN agencies: SPC, UNICEF, WHO, WFP, UNDP.  
**Acceptance criteria:** Admin can assign an organisation to each user and each dataset. Organisation filter appears in dataset admin list. Organisation column shows in user list.

---

### 15. OpenAPI `@extend_schema` annotations on all endpoints
**Files:** All view files in `vbos-backend/vbos/datasets/views.py`, `users/views.py`, `area_submissions/views.py`  
**What to do:**
- Add `from drf_spectacular.utils import extend_schema, OpenApiParameter` to each views file.
- For every view class or function, add `@extend_schema(summary="...", description="...", parameters=[OpenApiParameter(name='...', description='...')])`.
- For list views, annotate filter parameters (province, cluster, date range, etc.).
- Run `python manage.py spectacular --validate` to confirm no schema errors.  
**Acceptance criteria:** `GET /api/v1/docs/` shows descriptions, parameter documentation, and example responses for every endpoint. `python manage.py spectacular --validate` passes with no errors.

---

## BATCH 3 — Enterprise Features (2–4 weeks)

### 16. DRMIS role model (Analyst / FieldOfficer / MinistryOfficial / Administrator)
**Files:** `vbos-backend/vbos/users/models.py`, new `vbos/rbac/` app  
**What to do:**
- Create `DRMISRole` with `name`, `permissions` M2M to Django `Permission`, and `description`.
- Pre-seed with: `SYSTEM_ADMIN`, `DATA_MANAGER`, `ANALYST`, `FIELD_OFFICER`, `MINISTRY_OFFICIAL`, `READ_ONLY_PARTNER`.
- Add `role = FK(DRMISRole)` to `User`.
- Create `DRMISPermission` checks that are used in view `permission_classes` instead of raw `is_staff`.  
**Acceptance criteria:** Admin user management shows a Role dropdown. API views enforce role-based access (e.g. only DATA_MANAGER can create datasets, ANALYST can only read).

---

### 17. Dataset publication workflow
**Files:** `vbos-backend/vbos/datasets/models.py`, `admin.py`, `serializers.py`  
**What to do:** (Depends on task #4 for status field and task #12 for created_by)
- Add `published_by FK (User, null=True)`, `published_at (DateTimeField, null=True)`.
- Change default `status` from `'published'` to `'draft'` for new datasets (keeping existing as `'published'`).
- Create admin action "Publish selected datasets" that sets `status='published'`, `published_by=request.user`, `published_at=now()`.
- Filter API responses to only return `status='published'` datasets by default.
- Add `?include_drafts=true` param accessible only to `DATA_MANAGER` and above.  
**Acceptance criteria:** New datasets are created as drafts and do not appear on the map until published. Admin can bulk-publish datasets. Published datasets show "Published by" info in admin.

---

### 18. Email notifications on dataset approval/rejection
**Files:** `vbos-backend/vbos/area_submissions/views.py`, new `templates/email/`  
**What to do:**
- Create HTML email templates for: `submission_approved.html`, `submission_rejected.html`.
- In the `AreaDataSubmission` admin action that approves/rejects, send email to `submission.submitted_by.email` using Django's `send_mail`.
- Include the submission details (dataset name, province, year) and rejection reason if rejected.  
**Acceptance criteria:** Data entry staff receive an email when their submission is approved or rejected. Email renders correctly in common email clients.

---

### 19. Object-level read permissions (cluster/province scoping)
**Files:** `vbos-backend/vbos/datasets/views.py`, new `vbos/rbac/permissions.py`  
**What to do:**
- Create `ClusterPermission(BasePermission)` that checks whether `request.user` is assigned to the requested cluster (via role or organisation).
- Create `ProvincePermission(BasePermission)` that checks `AreaAdministrator.provinces`.
- Apply to `TabularDataset`, `VectorDataset`, `PMTilesDataset` views.
- For SYSTEM_ADMIN and DATA_MANAGER roles: bypass all scoping.  
**Acceptance criteria:** A Field Officer assigned to Tafea province can only see tabular/vector data for Tafea. A cluster head for Education can only see Education cluster datasets.

---

### 20. PDF situation report from Command Centre
**Files:** `vbos-backend/vbos/reports/` new app, `vbos-frontend/src/pages/CommandCentre.tsx`  
**What to do:**
- Add `weasyprint` to `requirements.txt`.
- Create `GET /api/v1/reports/situation-summary/?date=YYYY-MM-DD` endpoint.
- Report template (`templates/reports/situation_summary.html`) includes: active incidents table, province risk summary, cluster submission status, key statistics.
- In CommandCentre.tsx, replace `toast.info("Export Report", ...)` stub with API call to this endpoint that triggers a browser download.  
**Acceptance criteria:** Clicking "Export Report" downloads a PDF with the current situation summary. PDF is printer-friendly and uses DRMIS/Vanuatu government branding.

---

### 21. In-app notification system
**Files:** New `vbos/notifications/` app, `vbos-frontend/src/components/shell/Topbar.tsx`  
**What to do:**
- Create `Notification(id, user FK, message, type, link nullable, created_at, is_read)` model.
- Create `GET /api/v1/notifications/?is_read=false` and `POST /api/v1/notifications/<id>/read/`.
- Add bell icon to topbar with unread count badge, polling every 60 seconds.
- Dropdown panel showing last 10 notifications with mark-as-read and "View all" link.  
**Acceptance criteria:** Notifications appear in topbar. Unread count badge updates. Clicking a notification marks it read and navigates to the linked resource.

---

### 22. User invitation flow
**Files:** `vbos-backend/vbos/users/` invitation views, `vbos-frontend/src/pages/SettingsPage.tsx` or admin  
**What to do:**
- Create `UserInvitation(token, email, role, invited_by, created_at, expires_at, accepted_at)` model.
- Create `POST /api/v1/invitations/` (admin/data manager only) that sends an invitation email with a secure link.
- Create `GET /api/v1/invitations/<token>/` to verify and `POST` to accept (sets password, activates account).
- Add invitation management UI to admin.  
**Acceptance criteria:** Admin can send invitation to an email address. Recipient receives email, clicks link, sets password, and is logged in with the assigned role.

---

### 23. Persist `shellNavId` in Zustand store
**File:** `vbos-frontend/src/store/ui-store.ts`  
**What to do:**
- Add `shellNavId` to the list of persisted keys in the Zustand `persist` partialize function.
- Ensure that persisting `shellNavId` does not cause stale routing on first load (validate against the list of valid nav IDs on rehydration).  
**Acceptance criteria:** Refreshing the browser returns the user to the same page they were on (e.g. Audit Log stays as Audit Log after refresh, not reverting to Command Centre).

---

### 24. Replace deprecated `climate_module` fields
**File:** `vbos-backend/vbos/datasets/models.py`, migrations, all queries  
**What to do:**
- Search for all usages of `climate_module` (singular CharField) across the codebase.
- Update all queries to use `climate_modules` (JSONField) only.
- Create a data migration that copies `climate_module` values into `climate_modules` for any records that have the old field set.
- Add a migration to remove the `climate_module` field from `VectorDataset` and `PMTilesDataset`.  
**Acceptance criteria:** No code references `climate_module` (singular). The deprecated database column is removed. All climate module filtering continues to work via `climate_modules`.

---

### 25. Fix admin pipeline-status dead `core.AuditLog` import
**File:** `vbos-backend/vbos/admin_pipeline_status_api.py`  
**What to do:**
- Remove the `try: from core.models import AuditLog` block entirely.
- Replace `audit_logging_active` with `True` (the real `LogEntry`-based audit log is working).
- Update the dashboard template snippet that shows "Audit log is being set up." to show actual `LogEntry` stats.  
**Acceptance criteria:** Admin dashboard KPI for audit logging shows "Active" with correct entry count instead of "being set up."

---

## BATCH 4 — Advanced (future sprints)

### 26. Token expiry — replace DRF Token with Knox
**Files:** `requirements.txt`, `users/models.py`, `urls.py`, frontend `auth-store.ts`  
**What to do:** Install `django-rest-knox`. Replace `Token` creation signal with Knox token creation. Set expiry to 8 hours. Update frontend to handle 401 by clearing token and redirecting to login. Add "Remember me" option with 30-day expiry.  
**Acceptance criteria:** Tokens expire after 8 hours of inactivity. Frontend shows "Your session has expired" message and returns to login.

---

### 27. OGC WMS/WFS endpoints for GIS desktop integration
**Files:** New `vbos-backend/vbos/ogc/` app  
**What to do:** Implement WMS `GetCapabilities` and `GetMap` for raster datasets using `mapproxy` or a custom Django view that proxies TiTiler WMS output. Implement WFS `GetFeature` for vector datasets using `geoserver-restconfig` or a custom DRF serializer that produces GML/GeoJSON-WFS format.  
**Acceptance criteria:** QGIS can add DRMIS raster layers via WMS URL. QGIS can add DRMIS vector layers via WFS URL. Layer names match dataset names in the admin.

---

### 28. Bislama / French language support
**Files:** `vbos-backend/vbos/settings/`, `vbos-frontend/src/i18n/` (new)  
**What to do:** Add `django-modeltranslation` for backend model name/description fields. Add `react-i18next` for frontend. Create translation files for Bislama (`bi`) and French (`fr`). Add language selector to the Settings page Appearance tab.  
**Acceptance criteria:** User can switch to Bislama or French in Settings. All UI text, admin labels, and error messages are translated. Map layer names respect the selected language.

---

### 29. Offline data entry with background sync
**Files:** `vbos-frontend/src/hooks/useOfflineAreaSync.ts`, `public/sw.js` (PWA service worker)  
**What to do:** Implement IndexedDB queue for area data submissions when offline. Service worker intercepts failed POST requests and queues them. On reconnect, auto-replay queued submissions. Show sync status indicator in the data entry form.  
**Acceptance criteria:** Field officer can fill and "submit" an area data form without internet. On reconnection, the form data is automatically submitted. A sync indicator shows "3 forms queued" while offline.

---

### 30. VMGD (Vanuatu Meteorological & Geo-hazards Department) data integration
**Files:** New `vbos-backend/vbos/integrations/vmgd.py`, Celery Beat task  
**What to do:** Create a Celery Beat task that polls the VMGD public API (or RSS/GeoRSS feed) for current weather warnings and tropical cyclone bulletins. Parse and create `Alert` records in the database. Configure with environment variable `VMGD_API_URL`.  
**Acceptance criteria:** VMGD weather warnings appear automatically in the Live Alerts panel. A new warning from VMGD creates an `Alert` record within 5 minutes.

---

### 31. Executive one-page situation report (Cabinet PDF)
**Files:** `vbos-backend/vbos/reports/cabinet_summary.py`, new HTML template  
**What to do:** Create a scheduled Celery Beat task that generates a daily "Morning Briefing" PDF at 07:00 local time. PDF contents: title page, active incidents summary, province risk heat map (static image), cluster submission status table, 48-hour weather outlook (from VMGD integration). Deliver by email to a configurable recipient list stored in `SMTPSettings`.  
**Acceptance criteria:** A PDF report is emailed every morning to the configured recipients. Report is 1–2 pages. PDF is accessible offline for cabinet review.

---

### 32. API key management for development partners
**Files:** New `vbos-backend/vbos/api_keys/` app  
**What to do:** Create `APIKey(id, name, owner FK, key_hash, scopes JSON, created_at, last_used_at, expires_at, is_active)` model. Create DRF authentication class `APIKeyAuthentication`. Add key management UI to admin and to Settings page for users with the `READ_ONLY_PARTNER` role.  
**Acceptance criteria:** Partner organisation can generate a read-only API key from the Settings page. Requests authenticated with the key can read all published datasets. Key can be revoked by admin. Key usage is logged.

---

*End of CURSOR_TASKS.md*
