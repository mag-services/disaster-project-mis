# DRMIS Dashboard Ownership Boundaries

## Backend Admin (/admin/)
**Audience:** Data managers, NDMO system administrators, IT staff
**Access:** Staff/superuser only
**Primary jobs:**
- Upload and validate RAP CSV batches
- Approve/reject datasets
- Manage users, RBAC, MFA enforcement
- View audit logs and system health
- Run and monitor backups
- Manage Celery tasks and queue

**Dashboard shows:** Pipeline status (pending imports, approvals, MFA gaps,
backup recency, audit activity)
**Does NOT show:** Live incident feed, live alerts, province maps

## Frontend Dashboard (/app/)
**Audience:** Duty officers, field team coordinators, ministry analysts,
NDMO operations staff, optionally public read-only views
**Access:** Authenticated users (non-staff can access)
**Primary jobs:**
- Monitor active incidents and alerts
- View live geospatial data on the map
- Switch between Disaster / Climate / Compare analysis modes
- Export data for sharing with partners
- Track risk exposure by province

**Dashboard shows:** Command Centre (incidents, alerts, risk), Live Map,
Exports
**Does NOT show:** User management, dataset CRUD, RAP imports, audit logs

## Cross-reference links
- Admin change forms link to frontend map via "Open in Live Map →"
- Frontend incident rows link to admin via "Edit ↗"
- Frontend sidebar has "Admin Panel ↗" link (staff only)
- Both read from the same /api/v1/ endpoints — no data duplication

