# DRMIS data partnership — NDMO → Ministry of Climate Change  
**Audience:** Director, National Disaster Management Office (presenting to Director General, Ministry of Climate Change)  
**Purpose:** Align **Disaster Risk Management Information System (DRMIS)** with **MoCCA** priorities, **policy themes** that overlap the NSDP Environment pillar (especially **ENV 3** climate & disaster resilience), and close critical **data gaps**—including **raster climate products** (e.g. rainfall) that MoCCA already holds or should steward.

**M&E boundary.** **Official NSDP monitoring and evaluation**—including **indicators**, **baseline / target / current**, and **verification**—is the responsibility of the **national NSDP platform** and designated data owners. **DRMIS does not inform, replace, or substitute** for that platform. References to ENV codes and factsheet figures below are **contextual alignment** for a MoCCA conversation only.

---

## 1. Executive summary

1. **DRMIS** is the government’s **operational** platform for **published** hazard, exposure, damage, and climate-context **map and tabular** layers (provinces / area councils, APIs for NDMO and partners). It is **not** the system of record for NSDP indicator reporting.  
2. **NSDP Environment** themes (e.g. multi-hazard maps, recovery-related spatial evidence, land/coastal GIS) help **explain why** shared national layers matter for **DRM and operations**; **authoritative** figures for M&E remain on the **NSDP platform**.  
3. **MoCCA / Department of Climate Change** is the **natural provider** for **gridded climate and hazard-context rasters** (rainfall, temperature, drought indices, seasonal outlooks). Those products are **still largely missing** from DRMIS today; this note lists **what** is needed, **who** should provide it, and **what conditions** enable safe publication.

*Companion (optional thematic crosswalk, not M&E):* [`NSDP_ENV_DRMIS_ANNEX.md`](NSDP_ENV_DRMIS_ANNEX.md) and Word [`NSDP_ENV_DRMIS_ANNEX.docx`](NSDP_ENV_DRMIS_ANNEX.docx).

---

## 2. What DRMIS already supports (technical)

| Modality | Role in DRMIS |
|----------|----------------|
| **Raster** | GeoTIFF/VRT/cog-style paths; TiTiler or precomputed tiles; climate “Land cover” and other rasters in **Climate** mode. |
| **Vector** | GeoJSON features (hazards, exposure, admin boundaries, infrastructure). |
| **Tabular** | Province / area council statistics, damage estimates, needs, financial damage types. |
| **PMTiles** | Fast basemap-style hazard or exposure layers from URLs. |

**Gap:** The *pipeline* exists; many **MoCCA-owned or climate-relevant** datasets are **not yet ingested, published, or governed** under a single agreement.

---

## 3. Priority data gaps — what’s missing, who provides, what’s needed

Below: **representative** national datasets. Focal **persons** and **exact file names** should be filled in bilaterally (NDMO–MoCCA data working group).

**Columns Baseline (H), Target (I), Current (J)** are **copied for context** from the Environment Pillar factsheet PDF [*Environment Pillar All objectives*](Environment_Pillar_All_objectives.pdf)—the **same indicator text** as used on the **national NSDP platform**. They are **not** DRMIS outputs and **do not** mean DRMIS reports those indicators. Each row names the **closest** Environment Pillar indicator for read-across only. **What DRMIS needs** is in “What is needed” and governance.

| # | Data product | Type | Why it matters (operations; policy context) | **Who should provide** | **What is needed** | **Baseline (H)** | **Target (I)** | **Current (J)** |
|---|----------------|------|--------------------------------------|-------------------------|---------------------|------------------|---------------|----------------|
| 1 | **Gridded rainfall** (monthly / seasonal / annual climatology; anomalies) | Raster | Drought monitoring, agriculture stress, **DRR**; **ENV 3**. **H/I/J → ENV 3.2.3** (atmospheric / earth sciences research). | **MoCCA / Dept of Climate Change** (met/climate unit); **VMGD** if maintained there. | COG or GeoTIFF; **EPSG:4326** or documented CRS; **metadata** (period, model, station blend); **update cadence**; **licence** for government-wide use; **filename_id** pattern for DRMIS VRT; MoCCA **focal officer** for refresh. | TBD | Increase in publications or research proposals in atmospheric and earth sciences | - |
| 2 | **Temperature** (mean / min / max surfaces, anomalies) | Raster | Heat stress, health, energy; **ENV 3**. **H/I/J → ENV 3.2.3** (same proxy as row 1). | **MoCCA / VMGD** | Same as row 1; clarity on observation vs reanalysis source. | TBD | Increase in publications or research proposals in atmospheric and earth sciences | - |
| 3 | **Standardised drought index** (e.g. SPI, SPEI) | Raster or tabular-by-province | Early action; **ENV 1.5 / ENV 3**. **H/I/J → ENV 1.5.1** (producers undergone Agro-Met training). | **MoCCA** (with **MALFFB** / **DoW** validation) | Methodology note; monthly refresh where possible; province aggregates for reporting if grids are sensitive. | TBD | Ag Census infor | - |
| 4 | **Seasonal climate outlook** (maps or district/province categories) | Raster or tabular | Preparedness; **ENV 3.2.1** (multi-hazard warning systems). | **VMGD** / **MoCCA** | Official approved layers only; version date on each publish; link to public advisory text. | TBD | 100% of provinces with multi-hazard warning systems | - |
| 5 | **Climate projections** (e.g. rainfall/temp change scenarios, low/high emissions) | Raster (multi-layer) | Long-term adaptation; **ENV 3.4** awareness. **H/I/J → ENV 3.4.2** (awareness / partnership activities). | **MoCCA** (often with **external partner** studies) | Scenario labels; **IPCC** or national study reference; restricted vs public classification agreed. | TBD | 60% of islands covered by awareness programs targeting climate change adaptation and resilience | - |
| 6 | **Tropical cyclone / severe weather hazard footprints** (historical or scenario) | Vector / PMTiles | Exposure; **PDNA**; **ENV 3.3.x**. **H/I/J → ENV 3.2.2** (population with access to technologies that convey early warnings). | **VMGD** / **NDMO** (event-specific) | Event ID, time window; authoritative geometry source. | TBD | 0.8 | 0.6 |
| 7 | **Flood / tsunami / landslide** national reference layers (where national datasets exist) | Vector / Raster | **ENV 3.3.3** multi-hazard maps for PDNA. **H/I/J → ENV 3.3.3**. | **MoCCA**, **NDMO**, **Public Works** / **GeoHazards** (as per GoV mandate) | Clear **ownership** per layer; update after major events or new studies. | TBD | 1 national multi-hazard and risk map | 50 |
| 8 | **Sea-level rise / coastal inundation** scenarios (if available nationally) | Raster | **ENV 4** coastal context. **H/I/J → ENV 4.5.3** (places with detailed geo-scientific information collected)—**proxy**; factsheet has no dedicated SLR indicator. | **MoCCA** / **coastal** technical unit | Vertical datum documented; scenario years; coordination with **Fisheries** ICM. | TBD | 100% | - |
| 9 | **Land cover / land use change** (national mosaic, annual or periodic) | Raster | **ENV 4.2.2** GIS / forest management. **H/I/J → ENV 4.2.2**. | **MoCCA** / **Forestry** / **Lands** (per mandate) | Single **national** authoritative layer per year; legend classes documented. | Creating precise GIS forest maps integrated with Land Use Capability data. | By 2030 100% of forest areas of significance mapped | - |
| 10 | **Post-event damage** (verified building / sector counts by area) | Tabular / vector | **PDNA**, **ENV 3.3.2** durable solutions. **H/I/J → ENV 3.3.2**. | **NDMO** (with **sector** validation) | Survey instruments; **publication** rules (draft vs published in DRMIS). | TBD | 60% of climate change and disaster affected communities with durable solutions | - |
| 11 | **Evacuation centres / safe sites** (points/polygons) | Vector | Operations; **ENV 3.3.1** (support plans for communities). | **NDMO** / **Provincial** authorities | Verified coordinates; refresh after each season. | TBD | 80% of communities have access to support plans | - |
| 12 | **Water stress / hydrological drought** by province or catchment | Tabular / raster | **DoW** + **NDMO** drought response. **H/I/J → ENV 4.2.1** (declared Water Protection Zones). | **Dept of Water** / **MoCCA** | Shared definitions with rainfall/SPI layers. | TBD | 6 Water Protection Zones declared | - |
| 13 | **Food security / agricultural stress** (where not VNSO-only) | Tabular | **ENV 1**. **H/I/J → ENV 1.1.3** (average incidence of household food poverty). | **MALFFB** (with **VNSO** for official stats) | Attribute dictionary; province mapping. | 5.7 | 5.6 | - |
| 14 | **Integrated coastal management** boundaries / zones | Vector | **ENV 4.4.2**. **H/I/J → ENV 4.4.2**. | **Fisheries** / **MoCCA** | Legal status of boundaries; update MOU. | TBD | 40 integrated coastal management plans developed and operational | - |
| 15 | **Physical planning** / declared planning area boundaries | Vector | **ENV 4.1.1**. **H/I/J → ENV 4.1.1**. | **Lands** / **municipalities** | Official GIS export; sync schedule. | TBD | 100% of all physical planning areas declared in or before 2016 have a physical plan in place | - |

---

## 4. Governance — what NDMO and MoCCA should agree

| Topic | Suggested action |
|--------|------------------|
| **Data-sharing protocol** | Short **MOU or exchange of letters**: which layers are **official**, who may **publish** to DRMIS, and **embargo** rules for draft science products. |
| **Focal points** | Named **MoCCA** and **NDMO** data officers; **quarterly** refresh list for raster/tabular owners. |
| **Publication standard** | All national layers: CRS, title, provider, date, licence in admin metadata (optional internal tags only—not NSDP reporting). |
| **Security** | DRMIS already supports **draft / published / archived** datasets; sensitive layers stay **draft** until cleared. |
| **M&E / NSDP indicators** | **National NSDP platform** is the sole channel for official indicator values and verification. DRMIS is **not** positioned to supply or validate NSDP M&E. |

---

## 5. Ask to MoCCA (Director General)

1. **Designate** MoCCA as **provider of record** for **national climate rasters** (rainfall, temperature, drought indices, projections) for DRMIS—or confirm **VMGD** split with written roles.  
2. **Approve** a **pilot**: one rainfall (or SPI) **annual or monthly** stack published to DRMIS **Climate** admin with metadata.  
3. **Assign** a **focal officer** and **update calendar** (e.g. monthly vs seasonal).  
4. **Support** operational use of MoCCA layers in **national multi-hazard / risk mapping** where MoCCA science underpins the hazard layer (policy context may parallel **ENV 3.3.3**; **M&E remains on the NSDP platform**).

---

## 6. Regenerate Word version

```bash
python3 -m venv .venv && .venv/bin/pip install python-docx
.venv/bin/python docs/build_NDMO_MOCCA_briefing_docx.py
```

Output: **`docs/NDMO_MOCCA_DRMIS_Briefing.docx`** (H/I/J match [**Environment_Pillar_All_objectives.pdf**](Environment_Pillar_All_objectives.pdf)).

---

*Internal working document — adjust agency names to match current GoV structure and mandates.*
