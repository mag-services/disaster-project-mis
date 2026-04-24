# Annex: NSDP Environment pillar — thematic crosswalk (DRMIS **not** M&E)

**Word version** ([`NSDP_ENV_DRMIS_ANNEX.docx`](NSDP_ENV_DRMIS_ANNEX.docx)): five columns — Code, Indicator, DRMIS role, **What is needed (summary)**, and **How to accomplish — detail for P & S** (numbered operational steps for every **P** and **S** row; an em dash for other roles). Regenerate with `python docs/build_NSDP_ENV_DRMIS_ANNEX_docx.py` after `pip install python-docx`. Source strings: [`build_NSDP_ENV_DRMIS_ANNEX_docx.py`](build_NSDP_ENV_DRMIS_ANNEX_docx.py).

**Purpose.** Optional **planning / narrative** map between Environment pillar **indicator codes** and **DRMIS capabilities**. **Official NSDP monitoring and evaluation**—baselines, targets, current values, and verification—lives on the **national NSDP platform** with designated data owners. **DRMIS does not inform, feed, or substitute** for that platform unless government explicitly decides a future integration.

**Legend.** **P** = primary / strong · **S** = secondary / contributory · **W** = weak / conditional · **—** = out of scope unless datasets are explicitly added.

**Indicators with full “how to accomplish” detail in the Word annex (P & S only):**

| Role | Codes |
|------|--------|
| **P** | ENV 3.3.1, ENV 3.3.2, ENV 3.3.3 |
| **S** | ENV 3.1.1, ENV 3.1.2, ENV 3.1.3, ENV 3.2.1, ENV 3.2.2, ENV 3.2.3, ENV 4.1.1, ENV 4.1.2, ENV 4.2.1, ENV 4.2.2, ENV 4.4.2, ENV 4.5.3, ENV 5.6.1 |

*(The Markdown tables below stay high-level; open the `.docx` or Python source for the long fifth-column text.)*

---

## Sources (use together)

| Document | Role |
|----------|------|
| **NSDP M&E Framework** (July 2017), DSPPAC — Environment pillar tables | Official **wording** of policy objectives, SMART indicators, targets, SDG alignment. |
| **Environment Pillar: Full NSDP Indicator Progress Factsheet** (*Environment Pillar All objectives.pdf*) | **63** environment indicators across **five goals**; **baseline / target / current / status**; national portal reporting snapshot; **critical observations** on data gaps. |

**Crosswalk — goal titles differ between documents.** Use **indicator IDs** (e.g. `3.3.3`, `4.2.2`) as the stable key. The factsheet groups goals under short names (e.g. ENV 3 *Climate Change & Disaster Risk Reduction*, ENV 4 *Environmental Protection & Restoration*). The 2017 framework uses longer chapter titles for ENV 1–5. *Note: the factsheet PDF’s heading for “ENV 5” may not match its printed indicator rows—resolve ambiguities against the 2017 framework or the live portal.*

**Factsheet headline (context only).** Many indicators show **no data** or **stale baselines** on the national portal; **~40%** reported online vs **~60%** “exploring data sources.” **Addressing portal gaps and verification** is a matter for the **NSDP M&E process** and line ministries—not a role assigned to DRMIS in this annex.

**ENV 3.3.3 (factsheet row).** Multi-hazard / risk maps for PDNA — **official progress** is whatever the **NSDP platform** records. DRMIS may still hold **operational** map layers if NDMO/MoCCA publish them there; that does **not** make DRMIS the indicator reporting system.

---

## RAP Vanuatu — tabulation outputs *(may inform line ministries; not NSDP reporting via DRMIS)*

The **Vanuatu RAP** (Rapid Assessment Protocol) Quarto project — sibling repo **`RAP/vanuatu`** under the Disaster Project — generates **cyclone damage, resource, and financial** tabulations from **baseline** inputs and **hazard intensity** per Area Council. These are **PDNA-style model outputs** for preparedness and response; **any** use toward NSDP Environment (or other pillar) indicators is through **line ministries and the NSDP platform**, not through DRMIS as an M&E system.

| Location (under `RAP/vanuatu`) | What it is | Possible thematic link to ENV rows *(illustrative only)* |
|-------------------------------|------------|------------------------------------------------------------|
| **`data/1c_input_baseline.csv`** | Pre-disaster indicators by sector, council, year (feeds all modelled tables) | **ENV 1** food/ag baselines; **ENV 3.3.x** exposure context; sector baselines for education, health, shelter, WASH, energy, logistics |
| **`data/Ex_hazard_areas.csv`** (+ template) | Cyclone intensity (2–5) per Area Council from VMGD track interpretation | **ENV 3.2.x** / **3.3.3** — hazard footprint context for maps and scenario analysis |
| **`data/Ex_hazard_areas_MIS_import.csv`** *(from `scripts/export_hazard_for_mis.R`)* | Same hazard as MIS tabular import (Disaster cluster, estimated damage type) | Operational **DRMIS** load — still **not** an NSDP indicator return |
| **`output/*_01*_baseline*.csv`** | Aggregated baseline (national → province → council as applicable): e.g. `Education_01_baseline_education.csv`, `FoodSecurity_01a/b` staple & cash crops, `Health_01_baseline.csv`, `Shelter_01_baseline.csv`, `WASH_01_baseline.csv`, `Logistics_01a/b` infrastructure & road surface, `Energy_01_baseline.csv`, `Telecom_01_baseline_towers.csv`, `GenderProtection_01a–d` population / marital / employment / functional difficulties | **ENV 1.4.x / 1.5.x** ag and DRR-in-agriculture narratives; **ENV 3.4.x** schools; health/shelter/WASH/energy/logistics as **sector context** — **VNSO / ministries** own official stats |
| **`output/*_02*`** *estimated damage* | Modelled physical damage by intensity multipliers | **ENV 3.3.x** durable solutions / recovery — **evidence class** for PDNA-style dialogue only |
| **`output/*_03*`** *immediate response resources* | Modelled tents, water, food, transport needs, etc. | Response planning; not a direct ENV indicator table |
| **`output/*_04*`** *financial damage* | Unit-cost valuations by sector | Economic loss; **not** substitute for national fiscal or NSDP finance indicators |
| **`output/QC_baseline_coverage.csv`** | Row counts per sector × Area Council (coverage QA) | Data-quality tracking for modellers |
| **`output/area_councils_intensity.geojson`** (+ `.prj`) | AC polygons with intensity for GIS / MIS | **ENV 3.3.3**-style **map** inputs; publish to DRMIS only as operational layer |
| **`scripts/export_hazard_for_mis.R`**, **`export_intensity_geojson.R`** | Bridges RAP → DRMIS import formats | Integration tooling only |

**README sector matrix** (RAP): Education, Emergency telecom, Energy, Food security, Gender & Protection, Health, Logistics, Shelter, WASH — each with baseline → damage → resources → financial columns as per sector.

**DRMIS:** RAP CSV batches can be ingested via **RAP import** into tabular datasets (`rap_batch` linkage on `TabularDataset`); that supports **operational** NDMO workflows — **not** automatic NSDP indicator updates.

---

## Environment 1 — Food & nutrition security

| Code      | Indicator / policy (abbrev.) | DRMIS |
|-----------|------------------------------|-------|
| ENV 1.1.x | Household food production; primary production data; food poverty | — / VNSO–led |
| ENV 1.2.x | Aelan kaikai; national food guidelines | — |
| ENV 1.3.x | Import substitution; food prices; inflation | — |
| ENV 1.4.x | FADs; training; **land use capability mapping** | **W** — only if land-capability / ag spatial layers are loaded |
| ENV 1.5.x | **DRR & CC adaptation** in agriculture (Agro-Met, crop diversity, integrated farming) | **W** — if ag / climate-risk tabular or vector data are maintained in MIS |

---

## Environment 2 — Sustainable growth, low-impact industry *(2017 framework)*

| Code      | Indicator / policy (abbrev.) | DRMIS |
|-----------|------------------------------|-------|
| ENV 2.1–2.6 | Blue-green policies; EIA compliance; energy; waste; institutions; env funding | **—** (other systems / DEPC, DSPPAC, budgets) |

*Factsheet “ENV 2” is titled **Natural Resource Management** (conservation / development projects / EIA / energy / waste / NEP / treaties / funding)—overlap with 2017 ENV 2 + parts of 2017 ENV 5 themes; still map each **2.x.x** id to DRMIS as **—** unless project databases are integrated.*

---

## Environment 3 — **Climate change & disaster resilience** (core alignment)

| Code        | Indicator / policy (abbrev.) | DRMIS |
|-------------|------------------------------|-------|
| ENV 3.1.x   | CC & DRM in ministries; NAB/DoCC capacity; stakeholder alignment | **S** — governance *support* (shared risk/damage catalogue, audit); not legal/budget metrics |
| ENV 3.2.x   | Multi-hazard warning systems; population access to warning tech; atmospheric/earth sciences | **S** — situational layers + feeds; **not** replacement for national warning infrastructure or access % |
| ENV 3.3.x   | Post-disaster plans; **durable solutions** for affected communities | **P** — damage / needs / financial-estimate datasets; province–area council views; exposure endpoints |
| **ENV 3.3.3** | **Multi-hazard & risk maps for PDNA** (target: 1 national map) | **P** — DRMIS may **host operational** map layers if agencies publish them; **indicator reporting stays on the NSDP platform** |
| ENV 3.4.x   | Schools’ CC/DRR curriculum; awareness coverage | **W** — indirect (official use of maps/data); not enrollment/curriculum statistics |
| ENV 3.5.x   | CCA/DRM spend; climate funds accreditation; community finance | **—** / **W** (project traceability only if designed) |

*RAP Vanuatu* **`output/`** sector tabulations (damage, resources, financial) are **modelled PDNA-style** outputs; they may **support ministry evidence** for **ENV 3.3.x** themes when validated — see **§ RAP Vanuatu** above. **Official** indicator values remain on the **NSDP platform**.

**SDGs (framework):** 13.1, 13.3, 13.a, 13.b — DRMIS strongest on **risk information for decisions** (13.1/13.3), not finance or treaty compliance.

---

## Environment 4 — Land, water, natural resources *(aligns with factsheet ENV 4 — protection & restoration)*

| Code      | Indicator / policy (abbrev.) | DRMIS |
|-----------|------------------------------|-------|
| ENV 4.1.x | Physical plans; national land-use policy directives | **S** — evidence layer if land-use / zoning-related spatial data live in MIS |
| ENV 4.2.x | Water protection zones; **GIS for forest management** | **S** — land cover, forest-relevant GIS if curated here (factsheet: integrate with land use capability) |
| ENV 4.3.x | Mineral extraction & EIA | **—** |
| ENV 4.4–4.5 | Fisheries; coastal / ICM; foreshore geo-data | **S** — coastal module / exposure where aligned to national coastal datasets |
| ENV 4.6–4.7 | Reforestation; forestry compliance; DEPC outreach | **W** / **—** |

---

## Environment 5 — Biodiversity & ecosystems *(2017 framework)*

| Code      | Indicator / policy (abbrev.) | DRMIS |
|-----------|------------------------------|-------|
| ENV 5.1–5.5 | NBSAP/NISSAP; CCAs; species; biosecurity; model schools | **—** unless biodiversity layers are ingested |
| **ENV 5.6.1** | **Central information sharing for environment data** | **S** — MIS as **component** or **feeder** to a future central hub; factsheet notes **no** central system yet / UNDP–GEF work commenced |

*If using the factsheet PDF only, confirm which **5.x.x** rows map to waste vs biodiversity—the annex follows **2017** numbering for 5.x.x.*

---

## DRMIS capabilities (operational reference only)

| DRMIS capability | Thematic overlap (not NSDP reporting) |
|------------------|--------------------------------------|
| Clusters (e.g. disaster, climate, logistics) + disaster overlay tags | **Operational** hazard / exposure groupings for DRM users |
| Province & area council geometries + tabular/vector attributes | **Subnational** views for risk, damage, needs **inside DRMIS** |
| Dataset types: baseline, estimated damage, aid resources, financial damage | **PDNA-style** operational datasets; **not** official ENV indicator returns |
| Raster / PMTiles / vector (land cover, coastal, drivers) | Spatial products that may **parallel** ENV 3 / 4 themes in policy discussion only |
| API + integration keys | **Internal / partner** access to **published** DRMIS data |
| Publication status + audit | **DRMIS-internal** traceability—not NSDP verification |

---

*Annex — `docs/NSDP_ENV_DRMIS_ANNEX.md`. Update when NSDP indicators, portal schema, or MIS scope change.*
