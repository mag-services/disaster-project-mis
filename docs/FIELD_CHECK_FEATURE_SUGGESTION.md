# Field Check Feature for VBoS MIS – Research & Suggestion

This document summarizes research on similar systems with field verification features and suggests approaches for implementing **Field Check** in the VBoS MIS, allowing field staff to log in and verify disaster estimations.

---

## Update (March 2026): Mobile App Discontinued – Field Checks via MIS

**Current approach**: The dedicated mobile app (React Native/Flutter) has been **discontinued**. Field checks are now performed **via the MIS** (web app with PWA and offline support). Area administrators use the web interface to verify, adjust, or reject damage estimates; offline submissions sync when back online. Confidence % is tracked in the admin dashboard. See `docs/FIELD_CHECK_CONFIDENCE.md` for details.

The research and options below remain useful for context; the implementation follows the web/PWA path (Option B or D) rather than a separate mobile app.

---

## Decision (Historical): Dedicated Mobile App – Discontinued

**Former chosen approach**: A separate React Native or Flutter mobile app with full offline support, native camera, and GPS. See [Section 9](#9-dedicated-mobile-app--former-approach-discontinued) for details. **This approach has been discontinued.** Field checks are now done via the MIS web app (PWA with offline support).

---

## 1. Current VBoS Context

- **Data types**: Estimated Hazard Damage, Estimated Financial Damage, Immediate Response Resources, Baseline (raster, vector, tabular, PMTiles)
- **Geography**: Provinces, Area Councils
- **Auth**: Users, groups, permissions, 2FA
- **User roles**: Admin/staff vs regular users (no explicit "field officer" role yet)

---

## 2. Similar Systems with Field Check Features

### 2.1 Crisisworks (Australia)

**Field Inspections** – Used by 75+ Australian local governments and 300+ health providers.

| Capability | Description |
|------------|-------------|
| **Field data collection** | Structured forms, photos, videos, audio; geospatial tracking |
| **Offline mode** | Mobile apps work offline; sync when back online |
| **Task assignment** | Assign tasks to officers/contractors; track status |
| **Real-time coordination** | Messaging, mapping, live monitoring |
| **Audit trail** | Compliance and audit logging |

**Reference**: [Crisisworks Field Inspections](https://www.crisisworks.com/editions/fieldinspections.html)

---

### 2.2 SPRINT-Engine (Research / Disaster Management)

Customisable IT tool for on-field assessments across all disaster phases.

| Capability | Description |
|------------|-------------|
| **Rapid form customisation** | Customise survey forms in near real-time during response |
| **Role-based access** | Managers, surveyors, experts, observers |
| **Mobile + offline** | Android surveys online/offline |
| **Photo integration** | Capture and associate with survey items |
| **Validation** | In-field validation + back-office review |
| **Data exchange** | Link to other DMC systems |

**Reference**: [Nature Scientific Reports – SPRINT-Engine](https://www.nature.com/articles/s41598-023-47521-x)

---

### 2.3 FEMA Preliminary Damage Assessment (PDA)

USA standard for damage verification.

| Phase | Description |
|-------|-------------|
| **Local / IDA** | Local governments categorise damage, estimate costs, assess severity |
| **State validation** | State reviews and validates IDA information |
| **Joint PDA** | FEMA + state conduct site visits, assess damage, validate findings |
| **Documentation** | Geotagged photos, GIS, drone imagery, damage type, cost estimates |

**Reference**: [FEMA PDA Guide](https://www.fema.gov/sites/default/files/documents/fema_2021-pda-guide.pdf)

---

### 2.4 DTM Data Kit (IOM)

Displacement Tracking Matrix – standardised tools for field operations.

| Tool | Purpose |
|------|---------|
| **Question Bank** | 1,700+ standardised questions |
| **Form Validator** | Ensure forms meet quality standards |
| **Data Checker** | Real-time monitoring of collection and data quality |
| **Data Uploader** | Verify consistency before upload |

**Reference**: [DTM Data Kit](https://dtm.iom.int/dtm-data-kit)

---

### 2.5 Last Mile Mobile Solutions (LMMS) – World Vision

Used by UNHCR, ICRC, Oxfam, Save the Children across 30+ countries.

| Capability | Description |
|------------|-------------|
| **Beneficiary registration** | Registration and verification |
| **Distribution planning** | Plan and track distributions |
| **Reporting** | Reports and analytics |

**Reference**: [World Vision LMMS](https://www.wvi.org/disaster-management/last-mile-mobile-solution-lmms)

---

### 2.6 iTRACK (Humanitarian)

Integrated system for real-time tracking and coordination.

| Capability | Description |
|------------|-------------|
| **Real-time tracking** | Threat detection, navigation, logistics |
| **Two-way communication** | Field teams ↔ coordination centre |
| **Privacy-conscious** | Designed for personnel protection |

---

## 3. Suggested Field Check Workflow for VBoS

### 3.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  OFFICE (Admin / Analyst)                                            │
│  • Load/create disaster estimations (e.g. cyclone damage)             │
│  • Assign areas/items to field staff for verification                │
│  • Review field check results                                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FIELD (Field Officer)                                               │
│  • Log in (mobile or web)                                            │
│  • View assigned tasks (provinces, area councils, clusters)           │
│  • Compare estimated damage with on-ground reality                   │
│  • Record: verified / not verified / adjusted with notes + photos     │
│  • Submit (online or offline)                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Core Features to Consider

| Feature | Priority | Notes |
|---------|----------|-------|
| **Field Officer role** | High | New group: `field_officer` with limited permissions |
| **Task assignment** | High | Assign provinces/areas to field officers |
| **Field check records** | High | Store verification status (verified / adjusted / rejected) per item |
| **Mobile-friendly UI** | High | Responsive or PWA; works on phones |
| **Offline support** | Medium | Cache tasks and submit when back online |
| **Photo capture** | Medium | Attach photos to verification records |
| **Geolocation** | Medium | Optional GPS capture for verification |
| **Audit trail** | High | Who verified what, when |

---

## 4. Data Model Suggestions (Conceptual)

### 4.1 Field Check Task

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | |
| `assigned_to` | FK User | Field officer |
| `province` | FK Province | Optional |
| `area_council` | FK AreaCouncil | Optional |
| `cluster` | FK Cluster | Optional |
| `dataset` | FK | Optional: specific dataset to verify |
| `status` | Enum | `pending`, `in_progress`, `completed` |
| `created_at`, `updated_at` | DateTime | |

### 4.2 Field Check Record (Verification Result)

| Field | Type | Description |
|-------|------|-------------|
| `id` | PK | |
| `task` | FK | Link to task |
| `item_type` | Char | `tabular_item`, `vector_feature`, etc. |
| `item_id` | Generic | Reference to item |
| `status` | Enum | `verified`, `adjusted`, `rejected` |
| `notes` | Text | Field officer notes |
| `verified_by` | FK User | |
| `verified_at` | DateTime | |
| `photos` | JSON/File | Optional photo URLs |

---

## 5. Implementation Options

### Option A: Web-Only (Simplest)

- Field officers use the same web app with a restricted view:
  - Only assigned tasks
  - Simple “Verify / Adjust / Reject” form
  - Optional photo upload
- No offline support; requires connectivity.

### Option B: PWA + Offline ✓ Current implementation

- Add a PWA layer to the app.
- Cache assigned tasks and allow submission when offline.
- Sync when back online.

### Option C: Dedicated Mobile App – Discontinued

- Separate React Native / Flutter app.
- Full offline support, native camera, GPS.
- Higher effort and maintenance. **Discontinued** – field checks now via MIS (Option B/D).

### Option D: Hybrid (Mobile Web + Offline)

- Use a mobile-first responsive UI.
- Add offline storage (e.g. IndexedDB + background sync).
- Use existing HTML5 APIs for camera and geolocation.

---

## 6. UI/UX Suggestions

- **Field officer dashboard**:
  - List of assigned tasks
  - Map view of affected areas
  - Quick access to estimation layers to compare with ground truth
- **Verification form**:
  - Show estimated value vs. field observation
  - Buttons: Verified / Adjusted / Rejected
  - Notes field
  - Photo capture (optional)
- **Admin view**:
  - Assign tasks to field officers
  - View verification status and coverage
  - Export reports

---

## 7. Implementation Status (March 2026)

Field checks are **implemented via MIS** (web/PWA):

1. **Backend**: `field_check` Django app with `FieldCheckRecord` model, API endpoints for records and coverage.
2. **Web admin**: Coverage dashboard with confidence %, records list.
3. **API**: `/api/v1/field-check/records/`, `/api/v1/field-check/coverage/`, item-level confidence.
4. **Area administrators**: Perform field checks via MIS (verified/adjusted/rejected); offline support via PWA.

---

## 9. Dedicated Mobile App – Former Approach (Discontinued)

### 9.1 Tech Choice: React Native vs Flutter

| Factor | React Native | Flutter |
|--------|--------------|---------|
| **Team familiarity** | Reuse JS/TS, React patterns | Dart (new language) |
| **Offline / storage** | WatermelonDB, MMKV, AsyncStorage | sqflite, Hive |
| **Camera** | react-native-camera, expo-camera | camera plugin |
| **GPS** | react-native-geolocation, expo-location | geolocator |
| **Maps** | react-native-maps | flutter_map, google_maps_flutter |
| **Maintenance** | Large ecosystem, Expo simplifies | Google-backed, single codebase |

**Suggestion**: React Native (with Expo) if the team is strong in React/TypeScript; Flutter if you prefer a single codebase and are open to Dart.

### 9.2 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  VBoS Mobile App (React Native / Flutter)                    │
├─────────────────────────────────────────────────────────────┤
│  • Auth (Token + optional 2FA)                                │
│  • Offline-first: SQLite / WatermelonDB for tasks & records   │
│  • Sync: Background sync when online, conflict resolution     │
│  • Native: Camera (photos), Geolocation (GPS), Push (optional)│
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (same as web)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  VBoS Backend (Django) – existing + new endpoints             │
│  • /api/v1/field-check/tasks/                                │
│  • /api/v1/field-check/records/                              │
│  • /api/v1/field-check/sync/ (batch upload offline records)   │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Core Mobile Features

| Feature | Implementation |
|---------|----------------|
| **Offline login** | Cache token; re-auth when online if expired |
| **Task download** | Fetch assigned tasks when online; store locally |
| **Offline verification** | Save records to local DB; queue for sync |
| **Photo capture** | Native camera; store locally, upload on sync |
| **GPS** | Capture coordinates on verification; attach to record |
| **Map view** | Show task areas; optional offline basemap (MBTiles) |

### 9.4 Effort & Maintenance

- **Initial build**: 2–4 months (1–2 devs) for MVP.
- **Ongoing**: App store releases, OS updates, device testing.
- **Backend**: New Django app `field_check` with models, serializers, views.

### 9.5 Suggested Phases

| Phase | Scope |
|-------|-------|
| **1. Backend** | Field check models, API, field_officer role |
| **2. Web admin** | Task assignment, verification dashboard |
| **3. Mobile MVP** | Login, task list, verification form, photo, offline queue |
| **4. Mobile enhanced** | GPS, map view, sync status, conflict handling |

---

## 10. References

- [Crisisworks Field Inspections](https://www.crisisworks.com/editions/fieldinspections.html)
- [SPRINT-Engine – Nature Scientific Reports](https://www.nature.com/articles/s41598-023-47521-x)
- [FEMA Preliminary Damage Assessment Guide](https://www.fema.gov/sites/default/files/documents/fema_2021-pda-guide.pdf)
- [DTM Data Kit](https://dtm.iom.int/dtm-data-kit)
- [World Vision LMMS](https://www.wvi.org/disaster-management/last-mile-mobile-solution-lmms)
- [iTRACK – ReliefWeb](https://reliefweb.int/report/world/itrack-integrated-system-real-time-tracking-and-collective-intelligence-civilian)
