# Resilience Explorer → DRMIS — data inventory & layer manifest

This document is the **primary scoping input** before heavy build work. Fill it while you have access to Resilience Explorer (RE), then use it to create admin entries, migrations, and UI tasks in this repository.

**Owners:** VBoS (coordination), MoCCA / GGGI (source truth for RE layers and licences).

---

## 1. How to use this manifest

1. For **each layer** exposed in RE (map, dashboard, chart, or download), add **one row** to the [layer inventory](#3-layer-inventory-full-column-template).
2. Capture **RE layer IDs/names** exactly as in RE (including API or config ids if exposed).
3. Propose **DRMIS** `cluster`, dataset model (`VectorDataset` / `RasterDataset` / `TabularDataset` / `PMTilesDataset`), **display name**, and for rasters **`filename_id`** (TiTiler / `{filename_id}_{year}.tif|.vrt`).
4. Classify **RE exposure** (map-only vs dashboard vs chart vs download) and complete the [gap analysis](#4-gap-analysis-re-view-type-vs-drmis) for each row or group.

**Definition of done (inventory phase):** every GGGI-funded layer named in stakeholder comms (e.g. acidification, fluvial flood, contextual census) has at least one row with **Format**, **Owner**, and **Licence** filled or explicitly marked *unknown pending Urban Intelligence / GGGI*.

**Working copy:** `docs/data/resilience_explorer_layer_manifest.template.csv` (all columns; import into Excel/Sheets).

---

## 2. DRMIS naming & technical conventions (reference)

### 2.1 Clusters (`datasets.Cluster`)

- Disaster map groupings use **clusters** (e.g. baseline, hazard overlays).
- **Climate** rasters may use `cluster=NULL` or a dedicated cluster; see admin.

**Rule:** Map each RE group to one DRMIS `Cluster.name` (create in admin if missing) or document “Climate / GGGI” style grouping.

### 2.2 Dataset types

| DRMIS model | Use when |
|-------------|----------|
| `RasterDataset` | GeoTIFF/COG via **TiTiler** or **precomputed tiles**. |
| `VectorDataset` + `VectorItem` | GeoJSON / vector features (admin import). |
| `TabularDataset` + `TabularItem` | Census-style tables, CSV indicators, RAP-style stats. |
| `PMTilesDataset` | PMTiles baselines / overlays. |

### 2.3 Organisation scoping (`owning_organisation`)

When multi-ministry access matters (e.g. GGGI vs MoCCA):

- **`User.organisation`** — optional FK to `Organisation`; links a login to a ministry/partner profile.
- **`RasterDataset` / `VectorDataset` / `TabularDataset` / `PMTilesDataset.owning_organisation`** — optional owner of the catalog row; `NULL` = national / platform dataset.
- **`DatasetOrganisationShare`** — grant another org view/edit/publish on a specific dataset (generic FK).
- **`OrganisationClusterAccess`** — optional per-org whitelist of clusters (when `VBOS_ORGANISATION_SCOPING` is on and rows exist).

Enable API-side catalog filtering with env **`VBOS_ORGANISATION_SCOPING=true`** (see `vbos/config/common.py`, `vbos/organisations/`). Default **off** preserves legacy “all published datasets for every authenticated user” until orgs and rules are populated.

**Publication** remains **`publication_status`** (draft / published / archived) independent of org; combine both for go-live.

### 2.4 Raster / TiTiler (`filename_id`)

- **`RasterDataset.filename_id`** → tiles and files: `{filename_id}_{year}.vrt` or `.tif` under the TiTiler data mount (`vbos-backend/titiler-local/` uses `/data`).
- **`titiler_url_params`:** rescale, colormap query fragments as needed.
- **`precomputed_tile_url`:** `{z}`, `{x}`, `{y}`, `{year}` if not using TiTiler.

### 2.5 Vectors & tabular

- Vectors: admin import; `VectorDataset.popup_properties` for map popups.
- Tabular: align province / area council columns with DRMIS `Province` / `AreaCouncil` (case-insensitive on import). Document **grain** (national, province, AC, ward) in `drmis_notes`.

---

## 3. Layer inventory (full column template)

### 3.1 Column glossary

| Column | Description |
|--------|-------------|
| `re_group` | RE UI group (*Risk sources*, *Contextual / census*, …). |
| `re_layer_id` | RE internal or API id (`n/a` if not visible). |
| `re_layer_name` | Label as shown in RE. |
| `data_format` | `GeoTIFF` / `COG` / `vector` / `tabular` / `mixed` / `unknown`. |
| `crs` | EPSG or description. |
| `resolution_or_scale` | Raster cell size or vector scale / generalisation. |
| `extent` | Vanuatu EEZ, national land, bbox, or *global clip*. |
| `update_cadence` | static / annual / ad hoc / live + source. |
| `licence` | Text, URL, *open* / *restricted* / *TBD*. |
| `data_owner` | `GGGI` / `MoCCA` / `VBoS` / `SPC` / other + contact. |
| `drmis_cluster` | Target `Cluster.name`. |
| `drmis_dataset_kind` | `RasterDataset` / `VectorDataset` / `TabularDataset` / `PMTilesDataset`. |
| `drmis_dataset_name` | Catalog name in DRMIS admin/API. |
| `drmis_filename_id` | Rasters: snake_case; others: `n/a`. |
| `drmis_year_default` | Default year for multi-year rasters/tabular. |
| `drmis_notes` | Legend, units, TiTiler hints, PII flags, grain. |
| `re_exposure` | `map` / `dashboard` / `chart` / `download` / `report` (comma-separated). |
| `drmis_today` | Short status vs current DRMIS build. |
| `gap_category` | `none` / `etl_only` / `api_only` / `new_ui` / `new_ui+api` / `policy`. |
| `gap_notes` | What to build; see §4. |

### 3.2 Starter rows — Risk sources

*One row per RE hazard layer. Replace **TBD** from RE and custodians. `filename_id` values are proposals only.*

| re_group | re_layer_id | re_layer_name | data_format | crs | resolution_or_scale | extent | update_cadence | licence | data_owner | drmis_cluster | drmis_dataset_kind | drmis_dataset_name | drmis_filename_id | drmis_year_default | drmis_notes | re_exposure | drmis_today | gap_category | gap_notes |
|----------|-------------|---------------|-------------|-----|---------------------|--------|----------------|---------|------------|---------------|-------------------|---------------------|-------------------|-------------------|-------------|-------------|-------------|--------------|-----------|
| Risk sources | TBD | Acidification | TBD | TBD | TBD | TBD | TBD | TBD | GGGI / MoCCA | TBD (e.g. Climate / GGGI) | RasterDataset | GGGI ocean acidification (TBD) | `gggi_acidification` | TBD | Units, legend, colormap TBD | map, TBD | not ingested | etl_only | TiTiler + publish; set `owning_organisation` if required |
| Risk sources | TBD | Fluvial flood | TBD | TBD | TBD | TBD | TBD | TBD | GGGI / MoCCA | TBD | RasterDataset | GGGI fluvial flood (TBD) | `gggi_fluvial_flood` | TBD | Flood depth / hazard class TBD | map, TBD | not ingested | etl_only | Same as acidification row |
| Risk sources | `RE_ID_N` | *(pattern: heat, drought, landslide, storm surge, …)* | TBD | TBD | TBD | TBD | TBD | TBD | GGGI / MoCCA | TBD | RasterDataset or VectorDataset | *(DRMIS display name)* | `gggi_<hazard_snake>` or `n/a` | TBD | Per-layer metadata | map, … | not ingested | etl_only | Duplicate row pattern for every RE risk source from Urban Intelligence |

### 3.3 Starter rows — Contextual / census

| re_group | re_layer_id | re_layer_name | data_format | crs | resolution_or_scale | extent | update_cadence | licence | data_owner | drmis_cluster | drmis_dataset_kind | drmis_dataset_name | drmis_filename_id | drmis_year_default | drmis_notes | re_exposure | drmis_today | gap_category | gap_notes |
|----------|-------------|---------------|-------------|-----|---------------------|--------|----------------|---------|------------|---------------|-------------------|---------------------|-------------------|-------------------|-------------|-------------|-------------|--------------|-----------|
| Contextual / census | TBD | Census / demographic context | tabular (TBD) | n/a | n/a (or admin level) | TBD | TBD | TBD | VBoS / MoCCA | TBD | TabularDataset | Census context (TBD) | n/a | TBD | Province/AC columns; grain TBD; PII TBD | dashboard, chart, map, download | partial — tabular API + Exports | new_ui | Prefer tabular ingest + **Exports**/`api_only` first; **new_ui** if RE needs a dedicated census dashboard beyond Command Centre |
| Contextual / census | TBD | *(pattern: admin boundaries, population grid, socio-economic index, …)* | vector / raster / tabular | TBD | TBD | TBD | TBD | TBD | VBoS / MoCCA / GGGI | TBD | TBD | *(DRMIS name)* | `n/a` or id | TBD | | map, dashboard, … | TBD | TBD | Set `re_exposure` then use §4.1 matrix |

---

## 4. Gap analysis: RE view type vs DRMIS

### 4.0 What DRMIS already covers

| Surface | Role |
|---------|------|
| **Live Map** | Raster (TiTiler / precomputed), vector, PMTiles, tabular overlays; legend; Compare (two years / swipe); 3D toggle; year selection for many layers. |
| **Command Centre** | KPI cards, live alerts (USGS/VMGD/GDACS/internal), incidents/submissions table, risk exposure summary, link into **Exports** — not a full RE “one dashboard per indicator”. |
| **Exports** | Cluster + dataset picker; XLSX, GeoJSON, GeoTIFF, VRT, PMTiles; area/year filters for tabular/vector. |
| **API** | Authenticated catalog list/detail/data; `?publication=all` for staff; organisation-scoped visibility when `VBOS_ORGANISATION_SCOPING=true`. |

### 4.1 RE behaviour → DRMIS coverage → gap category

| RE exposure pattern | Live Map | Command Centre | Exports | API | Typical `gap_category` | Notes |
|--------------------|:--------:|:--------------:|:-------:|:---:|------------------------|-------|
| **Map-only** | ● primary | ○ | ○ | ● | `etl_only` (+ optional `new_ui`) | ETL + publish; map consumes dataset. |
| **Map + time** | ● | ○ | ○ | ● | `etl_only` or `new_ui` | Align `drmis_year_default` / Compare with RE timeline UX. |
| **Dashboard / KPI** | ○ / partial | ● partial | ○ | ● | `new_ui`, `new_ui+api`, or `api_only` | Extend CC or new page; or Externals use API/Exports. |
| **Chart-only** | ○ | ○ | ○ | ● tabular | `new_ui` or `api_only` | No per-indicator chart gallery today. |
| **Download / export** | ○ | link | ● | ● | `none` or `etl_only` | After ingest, often **Exports** + API suffice (`api_only` / `none`). |
| **Report / PDF** | ○ | ○ | partial | ● | `new_ui+api` or `policy` | No RE-style report builder; licence may block auto reports. |

Legend: **●** = primary fit; **○** = not primary; **partial** = some overlap.

### 4.2 Decision guide — new UI vs API-only

| Question | If **yes** → | If **no** → |
|----------|--------------|-------------|
| Is the need satisfied by **showing data on the Live Map** (with legend/year)? | `etl_only` (and maybe small map UX tweaks) | Continue |
| Is **Command Centre + Exports** enough for stakeholders (download + high-level KPIs)? | `api_only` / `none` | Continue |
| Does RE need a **new screen** (dashboard page, chart gallery, wizard)? | `new_ui` or `new_ui+api` | `api_only` may be enough |
| Are **licence / PII / MOU** blocking hosting or automation? | `policy` + document in `gap_notes` | — |

### 4.3 `gap_category` legend (CSV + manifest)

| Value | Meaning |
|-------|---------|
| `none` | Ingest + publish; Live Map and/or Exports already match RE. |
| `etl_only` | Data pipeline + admin metadata + TiTiler / vector / tabular import only. |
| `api_only` | Backend serves data; no mandatory new DRMIS page (Exports or external consumer). |
| `new_ui` | New or extended React (Command Centre, map chrome, or dedicated page). |
| `new_ui+api` | New aggregations or endpoints **and** UI. |
| `policy` | Blocked or gated by licence / governance — record in `gap_notes`. |

---

## 5. Next steps after the manifest is filled

1. **Prioritise** rows: visibility, licence, MoCCA sign-off, `VBOS_ORGANISATION_SCOPING` + `owning_organisation`.
2. **Create** clusters and datasets in **draft** in admin; reference this doc commit/date.
3. **Ingest** per row; add **`docs/data/resilience_explorer_layer_manifest_as_built.csv`** with real IDs and paths.
4. **Roadmap:** see `README.md` for DRMIS phases.

---

## 6. Revision history

| Date | Author | Change |
|------|--------|--------|
| 2026-03-30 | DRMIS team | Initial manifest template and DRMIS conventions. |
| 2026-03-30 | DRMIS team | Expanded gap analysis; starter tables; org governance note. |
| 2026-03-30 | DRMIS team | §2.3 organisation scoping; §3 glossary + full-column risk/census starter rows; §4.0–4.1 DRMIS surfaces + coverage matrix; §4.2 decision table; `gap_category` legend §4.3. |
