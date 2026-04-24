# DRMIS Climate Module – Action Plan

**Context:** While waiting for Phase II funding approval, and with Johnie (Ministry of Climate Change) agreeing to provide data used in Resilience Explorer (flood risk, etc.), this document outlines the action plan for DRMIS development and data acquisition.

**VBoS role:** In regard to this project, VBoS expertise is in displaying and communicating statistics. NDMO, MoCCA with expertise in disaster and climate context, and all other stakeholders with specific expertise in education (MOET), health, MIPU, etc. are needed to suggest and provide what to display. Domain experts drive the indicators and content; VBoS provides the platform.

**Centralisation:** Let’s work together to centralise every system into DRMIS, in line with the Department of Communication and Digital Transformation (DCDT)—not only digital transformation but also centralisation of government information systems.[^1]

[^1]: DCDT is Vanuatu’s central ICT authority (established 2021, COM Decision No. 146). The Vanuatu Digital Transformation Masterplan promotes a whole-of-government approach, moving away from siloed systems toward interoperable architecture across departments. See [digital.gov.vu](https://digital.gov.vu/) and [Vanuatu Digital Transformation Masterplan](https://www.gov.vu/index.php/resources/vanuatu-digital-transformation-masterplan).

---

## 1. Meeting with Johnie (Ministry of Climate Change)

**Objective:** Walk through Resilience Explorer, identify indicators and workflows, and receive data for DRMIS.

| Action | Owner | Notes |
|--------|-------|-------|
| Schedule meeting with Johnie | Herman / VBoS | 1–2 hours; in person or remote |
| Johnie walks through Resilience Explorer | Johnie | Demo of indicators: flood risk, sea level rise, etc. |
| Identify indicators to incorporate into DRMIS | Joint | Prioritise by MoCCA needs and data availability |
| Johnie shares data used in Resilience Explorer | Johnie | Flood risk, historical data, climate indicators |
| Document data formats and sources | Herman | For ingestion into DRMIS (tabular, vector, raster) |
| Follow up: data transfer and ingestion plan | Herman | After meeting |

**Data to request from Johnie:**
- Flood risk layers (raster/vector)
- Sea level rise projections or indicators
- Historical climate data (if applicable)
- Any other indicators MoCCA uses in Resilience Explorer for planning

---

## 2. What to Implement While Waiting for Phase II Funding

**Priority:** Low-cost, high-impact items that prepare DRMIS for climate data and improve usability.

### 2.1 Data readiness (no funding required)

| Task | Description |
|------|--------------|
| Prepare data ingestion pipeline | Ensure CSV/GeoJSON import can handle MoCCA data formats |
| Add Flood as disaster overlay | Flood layer slot exists; add dataset when data received |
| Document data schema | Template for flood, sea level rise, etc. |

### 2.2 Quick wins (minimal effort)

| Task | Description |
|------|-------------|
| Extend scenario comparison | Add year/scenario toggles for time-based comparison |
| Improve climate module filters | Year, attribute filters for land cover, coastal |
| Add climate indicator placeholders | UI slots for flood, sea level rise (populate when data available) |

### 2.3 Prepare for Phase II / Phase III

| Task | Description |
|------|-------------|
| Draft Phase III proposal | Funding for climate module enhancement (flood, sea level rise, etc.) |
| Update RESILIENCE_EXPLORER_VS_DRMIS | Add flood, sea level rise to “to implement” list |
| Document data gaps | List what DRMIS needs vs what Johnie can provide |

### 2.4 Migration to NDMO server

| Task | Description |
|------|-------------|
| Prepare migration checklist | Pre-migration: backups, env vars, SSL, DNS |
| Migrate DRMIS to NDMO server | Deploy Docker stack on NDMO infrastructure (drmis.ndmo.gov.vu) |
| Migrate database and assets | PostGIS, datasets, PMTiles, static files |
| Cutover and go-live | Switch DNS/routing; verify API, TiTiler, frontend |
| Post-migration handover | Document access, admin credentials, runbooks for NDMO |

---

## 3. What Has Already Been Implemented in DRMIS

### 3.1 Core platform

| Feature | Status |
|---------|--------|
| **Web-based geospatial platform** | ✅ Django + React, PostGIS |
| **Disaster and Climate modes** | ✅ Toggle in header |
| **Interactive maps** | ✅ Leaflet, multiple layer types |
| **Authentication** | ✅ Token auth, 2FA (TOTP, email OTP) |
| **PWA / offline support** | ✅ Service worker, offline data entry |
| **Mobile-responsive layout** | ✅ Collapsible sidebars, FAB on mobile |

### 3.2 Data layers

| Type | Status |
|------|--------|
| **Raster** | ✅ COG/GeoTIFF via TiTiler; land cover |
| **Vector** | ✅ GeoJSON; cyclone intensity, infrastructure |
| **PMTiles** | ✅ Roads, coastal shorelines, cyclone intensity |
| **Tabular** | ✅ Province/area council statistics, time series |

### 3.3 Disaster module

| Feature | Status |
|---------|--------|
| **Baseline view** | ✅ Land cover, coastal, infrastructure |
| **Damage estimates** | ✅ RAP outputs (hazard, financial, response) |
| **Disaster overlays** | ✅ Cyclone Intensity, Volcano, Flood, Earthquake, Tsunami, Landslide, Drought, Wildfire (slots; enable when data uploaded) |
| **Cyclone intensity** | ✅ PMTiles + GeoJSON; area councils by category |
| **Field checks** | ✅ Damage verification by area admins; confidence % |

### 3.4 Climate module

| Feature | Status |
|---------|--------|
| **Land cover** | ✅ Raster; year selector; 9 classes |
| **Coastal shorelines** | ✅ PMTiles; rates of change |
| **Coastal changes** | ✅ Vector; admin-managed |
| **Land accounts** | ✅ Vector; admin-managed |
| **Climate module dropdown** | ✅ Select Land cover, Coastal changes, etc. |

### 3.5 Analysis and export

| Feature | Status |
|---------|--------|
| **Area-level statistics** | ✅ Province, area council; stacked/grouped charts |
| **Time series** | ✅ Bottom drawer; annual/monthly |
| **PDF export** | ✅ Map + stats |
| **XLSX export** | ✅ Tabular data |
| **Shareable URLs** | ✅ Map state, layers, filters in URL |

### 3.6 Integration & deployment

| Feature | Status |
|---------|--------|
| **API/SQL integration** | ✅ Read, push, pull with departmental MIS; API key auth |
| **VM deployment** | ✅ Docker Compose, nginx, docs |
| **Subdomain config** | ✅ drmis.ndmo.gov.vu, api, titiler |

### 3.7 Admin

| Feature | Status |
|---------|--------|
| **Dataset management** | ✅ Tabular, raster, vector, PMTiles |
| **CSV import** | ✅ Multi-select, auto-match dataset |
| **Bulk delete** | ✅ Tabular items |
| **Year/dataset filters** | ✅ Admin list views |

---

## 4. Phase II – What Will Be Done

**Scope:** Deployment, migration, training, and rollout once Phase II funding is approved.

| Area | Activities |
|------|------------|
| **Migration to NDMO server** | Deploy DRMIS to NDMO infrastructure (drmis.ndmo.gov.vu); cutover from dev/staging; DNS, SSL, Docker stack |
| **Database and assets** | Migrate PostGIS, datasets, PMTiles, static files; verify API, TiTiler, frontend |
| **Training** | Shefa training; VBoS training of MoCCA staff on DRMIS (Disaster + Climate modes) |
| **User rollout** | Onboard NDMO, provincial administrators, area councils, sector ministries |
| **Handover** | Document access, admin credentials, runbooks for NDMO; capacity building for ongoing maintenance |
| **Feedback loop** | Collect user feedback; prioritise improvements for Phase III |

---

## 5. Timeline (Suggested)

| Phase | When | Actions |
|-------|------|---------|
| **Meeting with Johnie** | As soon as possible | Schedule, conduct, document |
| **Data receipt** | After meeting | Johnie shares flood, historical data |
| **Data ingestion** | 1–2 weeks after data | Ingest into DRMIS; test layers |
| **Phase II approval** | Pending | Continue deployment, training |
| **DRMIS migration to NDMO server** | After Phase II approval / deployment ready | Deploy to drmis.ndmo.gov.vu; cutover from dev/staging |
| **Phase III proposal** | In parallel | Draft funding proposal for climate module enhancement |

---

## 6. Phase III Proposal – Climate Module / Dashboard Enhancement (Draft)

**Title:** DRMIS Climate Module Enhancement – Phase III

**Objective:** Enhance the DRMIS climate module and dashboard to align with Resilience Explorer–style indicators and workflows, using data shared by MoCCA (Johnie).

### 6.1 Goals

- Incorporate flood risk and sea level rise indicators (from Resilience Explorer / MoCCA data)
- Extend the climate dashboard with additional indicators and scenario comparison
- Strengthen DRMIS as a long-term, open-source alternative to commercial tools
- Enable MoCCA to use DRMIS for climate planning and reporting

### 6.2 Activities (aligned with Resilience Explorer)

| Activity | Description |
|----------|-------------|
| **Flood risk layers** | Ingest and visualise flood risk data from MoCCA; raster/vector layers; area-level exposure |
| **Sea level rise** | Add sea level rise projections or indicators; time-based scenarios (e.g. 2030, 2050) |
| **Scenario comparison** | Extend comparison mode: side-by-side or toggle between years/scenarios (e.g. baseline vs 2050) |
| **Time-based scenarios** | Year/scenario selectors; filters for climate indicators by time period |
| **Climate dashboard UI** | Improve climate module layout: KPIs, charts, filters; module-specific context panel |
| **Asset-level exposure** | Overlay infrastructure points on hazard layers; show exposure by asset type |
| **Custom risk registers** | Templates and filters for climate risk reporting; PDF/XLSX export for MoCCA |
| **Training** | MoCCA staff training on enhanced climate features |

### 6.3 Data sources (from Johnie / MoCCA)

- Flood risk layers (raster/vector)
- Sea level rise projections
- Historical climate data
- Any other indicators used in Resilience Explorer for planning

### 6.4 Optional (if scope allows)

| Feature | Notes |
|---------|-------|
| **3D scenario viewer** | MapLibre GL / Cesium; DEM data for Vanuatu |
| **Isolation risk** | Road disruption analysis; pgRouting or OSRM |
| **Intervention testing** | Scenario comparison for proposed interventions |

### 6.5 Partners

VBoS, NDMO, MoCCA, GGGI (as appropriate)

---

## 7. References

- [Resilience Explorer vs DRMIS](RESILIENCE_EXPLORER_VS_DRMIS.md)
- [Integration with Departmental MIS](INTEGRATION_DEPARTMENTAL_MIS.md)
- [Deployment VM](DEPLOYMENT_VM.md)
