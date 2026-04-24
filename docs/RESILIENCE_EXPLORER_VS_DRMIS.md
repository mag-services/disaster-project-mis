# Resilience Explorer vs DRMIS – Feature Comparison

**DRMIS** (Disaster Risk Management Information System) is Vanuatu’s custom platform for NDMO and MoCCA. It is built with **Django** (backend) and **React** (frontend).

**VBoS role:** In regard to this project, VBoS expertise is in displaying and communicating statistics. NDMO, MoCCA with expertise in disaster and climate context, and all other stakeholders with specific expertise in education (MOET), health, MIPU, etc. are needed to suggest and provide what to display. Domain experts drive the indicators and content; VBoS provides the platform.

**Centralisation:** Let’s work together to centralise every system into DRMIS, in line with DCDT’s mandate as Vanuatu’s central ICT authority and the Vanuatu Digital Transformation Masterplan—which promotes a whole-of-government approach and moving away from siloed systems toward interoperable architecture ([digital.gov.vu](https://digital.gov.vu/), [Vanuatu Digital Transformation Masterplan](https://www.gov.vu/index.php/resources/vanuatu-digital-transformation-masterplan)).

**Resilience Explorer** is a commercial platform (resilience-explorer.org) by Urban Intelligence for disaster and climate risk.

---

## Cost Comparison

| | **DRMIS** | **Resilience Explorer** |
|---|-----------|--------------------------|
| **Software license** | No license fee (open-source stack: Django, React, PostGIS, Leaflet, TiTiler) | Commercial license – pricing not published; contact Urban Intelligence for quote |
| **Typical cost model** | Infrastructure + development + maintenance | Per-user, annual subscription, or enterprise custom pricing (varies by scope) |
| **Infrastructure** | Self-hosted (e.g. NDMO Dell server); one-time setup | Hosted by provider (included in license) or on-premise (may incur extra) |
| **Development** | In-house or contracted - Initial phase development: Development Seed, Ongoing enhancements: VBoS | Included in license; customisation may incur extra |
| **Data updates** | Own data; RAP outputs; departmental MIS integration | Provider may offer data updates as part of service |
| **Ongoing** | Server, maintenance, support | Annual or multi-year license renewal |

**DRMIS cost drivers:** Server hardware (NDMO already has Dell server), hosting/electricity, development and maintenance effort, data acquisition. No per-user or annual software license.

**Resilience Explorer:** Pricing is tailored per organisation (see [contact form](https://resilience-explorer.org/contact-resilience-explorer/)). Commercial platforms often charge per user, per year, or custom enterprise fees – can be expensive for government budgets.

---

## Customization

### Resilience Explorer – What Can and Cannot Be Customized

| Can be customized | Cannot be customized |
|--------------------|----------------------|
| Data, scenarios, and hazard inputs (FAQ: "Can I update and add new information, data, or scenarios?") | Core platform source code (proprietary) |
| Reports, dashboards, and branding (provider may offer) | Database schema and backend logic |
| Workflow integration (via APIs if offered) | Risk models and algorithms (provider-owned) |
| Scope tailored per organisation (contact provider) | UI components and user experience (unless provider builds it) |

As a commercial product, Resilience Explorer is configured and tailored by the provider. You work within the platform; you do not modify its skeleton.

### DRMIS – Customizable to the Skeleton

**DRMIS is fully customizable to the skeleton.** Because it is open source (Django + React), every layer can be modified:

| Layer | Customizable |
|-------|--------------|
| **Database** | Add tables, fields, indexes; change schema as needed |
| **API** | Add endpoints, change logic, integrate external systems |
| **Frontend** | Modify UI, add views, change workflows, rebrand |
| **Maps** | Swap or add map libraries, layers, controls |
| **Workflows** | Adapt to NDMO/MoCCA processes, add data entry forms, field checks |
| **Risk models** | Implement or replace methodologies; calibrate to Vanuatu data |

VBoS, NDMO, or contracted developers can change any part of the system. No vendor lock-in; no need to request features from a commercial provider.

---

## Feature Comparison

Statuses reflect the **disaster-project-mis** codebase (2026). “Partial” means usable capability exists but not full Resilience Explorer parity.

| Resilience Explorer feature              | DRMIS today                                                                 | Feasible to add?                                             |
| ---------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Geospatial mapping**                   | ✅ Yes (Leaflet 2D + optional MapLibre 3D)                                     | —                                                            |
| **Layer visualization (raster, vector)** | ✅ Yes (TiTiler / precomputed rasters, vectors, PMTiles)                      | —                                                            |
| **Area-level statistics**                | ✅ Yes (province, area council; tabular aggregates, Command Centre exposure) | —                                                            |
| **Damage estimates**                     | ✅ Yes (RAP-style tabular datasets; cluster/type filters on Exports)         | —                                                            |
| **PDF / XLSX export**                    | ✅ Yes (XLSX from Exports; PDF where wired in reporting)                     | —                                                            |
| **Multi-hazard layers**                  | ✅ Yes (cyclone, flood, tagged disaster overlays, climate modules)           | —                                                            |
| **Offline / field data entry**           | ✅ Yes (PWA, offline area sync, area data entry)                             | —                                                            |
| **Scenario comparison**                  | ⚠️ Partial — Compare mode: year swipe, raster curtain, tabular delta; not RE multi-hazard scenario builder | ✅ Extend with saved scenarios / extra hazard dimensions     |
| **Time-based scenarios**                 | ⚠️ Partial — global year + Compare left/right years; not full RE timeline UX | ✅ Richer time controls, presets                               |
| **3D scenario viewer**                   | ⚠️ Partial — **3D** toggle: MapLibre GL + terrain (global DEM); not RE “scenario studio” | ✅ Vanuatu DEM, authored 3D layers, Cesium if needed          |
| **Isolation risk (road disruption)**     | ❌ No (Command Centre notes data needs)                                      | ✅ OSM roads + OSRM/pgRouting                                 |
| **Cascading outages & recovery**         | ❌ No                                                                        | ✅ Network graph + failure logic                              |
| **Asset-level direct risk**              | ⚠️ Partial — vectors + hazard rasters; hint when both on; exposure API on dashboard | ✅ Pixel/sample exposure per asset                            |
| **Intervention testing**                 | ⚠️ Partial — **Simulate** panel (sliders, estimated cost readout; not engineering-grade loss) | ✅ Tie to backend scenarios + validation                      |
| **Custom risk registers**                | ⚠️ Partial — Exports by cluster + **dataset category** (RAP types) + formats | ✅ Saved templates, PDF register layouts                        |

---

## DRMIS Tech Stack


| Layer            | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| **Backend**      | Django 5.2, Django REST Framework, PostGIS            |
| **Frontend**     | React 19, Vite 7, TypeScript, Tailwind CSS, shadcn/ui |
| **Maps**         | Leaflet, react-leaflet, protomaps-leaflet; **MapLibre GL** for 3D mode |
| **Raster tiles** | TiTiler (COG/GeoTIFF), PMTiles                        |
| **Database**     | PostgreSQL with PostGIS                               |


3D mode uses MapLibre GL in-app; optional Vanuatu DEM / TiTiler endpoints can replace generic terrain when deployed.

---

## What DRMIS Can Realistically Replicate

1. **Scenario comparison** – Extend existing Compare mode (already: swipe, tabular delta, raster comparison) with saved workspaces and multi-hazard presets.
2. **Time-based scenarios** – Build on year left/right and map date store (scenario timelines, presets).
3. **Asset-level risk** – Build on vector + raster overlays and dashboard exposure; add per-asset sampling or join API.
4. **Custom reporting** – Exports already support category filters; add PDF templates and named register bundles.
5. **Area statistics** – Strengthen aggregation and summaries by province/area council.

---

## What Would Be Difficult (But Implementable)

DRMIS is an ongoing project. All of these can be implemented with sufficient time, data, and effort:

| Feature | What's needed | Feasibility |
|---------|---------------|-------------|
| **3D scenario viewer (RE parity)** | MapLibre is in-app; upgrade path: Vanuatu DEM via TiTiler or terrain tiles, optional Cesium for full scene authoring. | Implementable |
| **Isolation risk** | Road network data (OpenStreetMap or NDMO data), routing engine (e.g. pgRouting, OSRM), connectivity analysis. | Implementable |
| **Cascading outages** | Infrastructure network model (power, water, telecom), failure propagation logic, recovery time assumptions. | Implementable |
| **Resilience Explorer’s risk models** | Equivalent risk methodology (hazard x exposure x vulnerability), research or adoption of open models (e.g. from academia, UNDRR). | Implementable |

**Summary:** None of these are impossible. They are difficult because they need additional data (roads, DEM, infrastructure networks), new frontend components (3D map) or backend logic (routing, network analysis), and risk methodology and calibration. As an ongoing project, DRMIS can phase these in as priorities and data become available.

---

## Recommendation

- **Yes** – Core features can be built or extended in DRMIS (Django + React).
- **Yes** – Advanced features (3D, isolation risk, cascading outages, risk models) are also implementable; they require more effort, data, and possibly research.
- **Cost** – DRMIS avoids ongoing license fees; Resilience Explorer requires commercial licensing (pricing on request).
- **Customization** – DRMIS is customizable to the skeleton; Resilience Explorer is configured within provider limits.
- **Pragmatic approach** – Prioritise by NDMO/MoCCA needs and data availability. Phase in advanced features as the project evolves.

