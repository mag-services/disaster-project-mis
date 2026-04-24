# API/SQL Integration with Departmental MIS

This document describes how the Disaster MIS integrates with other government departmental MIS systems. Integration is **bidirectional**:

- **Other systems read from Disaster MIS** – External systems can query tabular data via API
- **Other systems push to Disaster MIS** – External systems can ingest data via API
- **Disaster MIS pulls from other systems** – Disaster MIS can sync/copy data from external APIs

## Overview

| Direction | Purpose |
|-----------|---------|
| **Read** (external → Disaster MIS) | Reporting, ETL, dashboards in other systems |
| **Push** (external → Disaster MIS) | Departmental systems send data for enrichment |
| **Pull** (Disaster MIS → external) | Disaster MIS fetches and syncs data from departmental APIs |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Departmental MIS Systems (External)                        │
│  Health MIS │ Education MIS │ Agriculture MIS │ Infrastructure MIS │ ...    │
└─────────────────────────────────────────────────────────────────────────────┘
         │                                    │                                    │
         │ READ (GET)                         │ PUSH (POST)                        │ PULL (Disaster MIS fetches)
         │ X-API-Key                          │ X-API-Key                          │
         ▼                                    ▼                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Disaster MIS (This System)                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Integration API (api/v1/integrations/)                                  ││
│  │  READ:  GET /tabular/  GET /tabular/<id>/data/  GET /tabular/<id>/aggregate/ │
│  │  PUSH:  POST /tabular/ingest/                                            ││
│  │  Auth:  X-API-Key or Authorization: ApiKey <key>                          ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Sync job: ./manage.py sync_external_data                                ││
│  │  Pulls from External Data Sources (Admin-configured URLs)                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  Data Layer: TabularDataset, TabularItem, Province, AreaCouncil           ││
│  │  metadata.external_source tracks origin system                            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Authentication

External systems authenticate using **API keys** (separate from user tokens):

| Header | Example |
|--------|---------|
| `X-API-Key` | `X-API-Key: your-secret-api-key` |
| `Authorization` | `Authorization: ApiKey your-secret-api-key` |

API keys are created in Django Admin: **Admin → Integrations → Integration API Keys**.

---

## Read Endpoints (Other Systems Read from Disaster MIS)

External systems can query tabular data using API keys. All endpoints require `X-API-Key` or `Authorization: ApiKey <key>`.

### List Tabular Datasets

**GET** `api/v1/integrations/tabular/`

Returns paginated list of tabular datasets. Supports `cluster`, `type` filters.

### Get Tabular Dataset Detail

**GET** `api/v1/integrations/tabular/<id>/`

Returns a single dataset metadata.

### Get Tabular Data

**GET** `api/v1/integrations/tabular/<id>/data/`

Returns paginated tabular records. Supports `province`, `area_council`, `attribute`, `date` filters.

### Get Aggregated Data

**GET** `api/v1/integrations/tabular/<id>/aggregate/?group_by=province&year=2024&attribute=population`

| Param | Description |
|-------|--------------|
| `group_by` | `province` or `area_council` |
| `year` | Filter by date year |
| `attribute` | Filter by attribute name |
| `agg` | `sum`, `count`, or `avg` |
| `province` | Required when `group_by=area_council` |

**Example – read data from Disaster MIS:**

```bash
curl -H "X-API-Key: your-api-key" \
  "https://api.drmis.ndmo.gov.vu/api/v1/integrations/tabular/5/data/"
```

---

## Push Endpoint (Other Systems Push to Disaster MIS)

### Bulk Tabular Data Ingest

**POST** `api/v1/integrations/tabular/ingest/`

Push tabular data into an existing dataset. Province and Area Council names must match existing records.

**Request body:**

```json
{
  "dataset_id": 5,
  "items": [
    {
      "province": "Shefa",
      "area_council": "Port Vila",
      "attribute": "population",
      "date": "2024-01-01",
      "value": 12500,
      "metadata": {
        "external_source": "health_mis",
        "external_id": "rec-123"
      }
    }
  ],
  "upsert": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dataset_id` | int | Yes | ID of the TabularDataset to ingest into |
| `items` | array | Yes | List of tabular records |
| `upsert` | bool | No | If true, update existing items. Default: false (append only) |

**Item fields:** `province`, `area_council`, `attribute`, `date`, `value`, optional `metadata`

**Example – push data to Disaster MIS:**

```bash
curl -X POST https://api.drmis.ndmo.gov.vu/api/v1/integrations/tabular/ingest/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"dataset_id": 5, "items": [{"province": "Shefa", "area_council": "Port Vila", "attribute": "population", "date": "2024-01-01", "value": 12500}], "upsert": true}'
```

---

## Pull (Disaster MIS Syncs from Other Systems)

Disaster MIS can **pull** data from external APIs and sync it into tabular datasets. Configure in Admin: **Integrations → External Data Sources**.

### Configuration

| Field | Description |
|-------|--------------|
| **URL** | API endpoint returning JSON array of records |
| **Auth type** | None, Bearer Token, API Key, HTTP Basic |
| **Auth config** | JSON: `{"token": "..."}`, `{"api_key": "..."}`, or `{"username": "...", "password": "..."}` |
| **Target dataset** | Tabular dataset to sync into |
| **Field mapping** | Map external field names to ours: `{"province": "Province", "area_council": "AreaCouncil", "attribute": "Metric", "date": "Date", "value": "Value"}` |

### Expected External API Format

The external API should return JSON in one of these forms:

- Array: `[{...}, {...}]`
- Object with `data`: `{"data": [{...}]}`
- Object with `results`: `{"results": [{...}]}`

Each record must have (or be mappable to): `province`, `area_council`, `attribute`, `date` (or `year`), `value`.

### Sync Command

Run manually or via cron:

```bash
# Sync all active external sources
./manage.py sync_external_data

# Sync a specific source
./manage.py sync_external_data --source 1
```

**Cron example (every 6 hours):**

```
0 */6 * * * docker-compose exec web ./manage.py sync_external_data
```

---

## SQL Integration (Read-Only)

For systems that need direct database access (e.g., ETL, reporting), create a read-only PostgreSQL user and grant `SELECT` on:

- `datasets_tabulardataset`
- `datasets_tabularitem`
- `datasets_province`
- `datasets_areacouncil`

Example view:

```sql
CREATE VIEW integrations_tabular_export AS
SELECT
  td.id AS dataset_id,
  td.name AS dataset_name,
  c.name AS cluster_name,
  ti.attribute,
  ti.date,
  ti.value,
  p.name AS province,
  ac.name AS area_council,
  ti.metadata
FROM datasets_tabularitem ti
JOIN datasets_tabulardataset td ON ti.dataset_id = td.id
JOIN datasets_cluster c ON td.cluster_id = c.id
LEFT JOIN datasets_province p ON ti.province_id = p.id
LEFT JOIN datasets_areacouncil ac ON ti.area_council_id = ac.id;
```

---

## Security

- **API keys** – Stored hashed; only the prefix is shown in admin
- **HTTPS** – All integration traffic must use HTTPS in production
- **Auth config** – Stored in DB; restrict admin access appropriately

---

## Setup Summary

| Role | Steps |
|------|-------|
| **External system reading from Disaster MIS** | 1. Request API key. 2. Use `GET api/v1/integrations/tabular/...` with `X-API-Key` |
| **External system pushing to Disaster MIS** | 1. Request API key. 2. Use `POST api/v1/integrations/tabular/ingest/` with `X-API-Key` |
| **Disaster MIS pulling from external system** | 1. Add External Data Source in Admin. 2. Configure URL, auth, field mapping. 3. Run `sync_external_data` (manual or cron) |
