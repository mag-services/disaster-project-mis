# VBoS Management Information System (MIS)

A geospatial Management Information System for climate change and natural disaster data in Vanuatu. The system provides a web-based interface for visualizing, querying, and exporting baseline, hazard damage, response resources, and financial damage datasets—including raster imagery, vector layers, PMTiles basemaps, and tabular statistics.

**Contributing?** See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and PR process. **Tasks?** See [TASKS.md](TASKS.md) to track and tick off work.

---

## Architecture

| Component | Stack |
|-----------|-------|
| **Backend** | Django 5.2, Django REST Framework, PostGIS |
| **Frontend** | React 19, Vite 7, TypeScript, Tailwind CSS, shadcn/ui (Radix) |
| **Database** | PostgreSQL with PostGIS extension |
| **Raster tiles** | TiTiler (COG/GeoTIFF), PMTiles |
| **Maps** | Leaflet, react-leaflet, protomaps-leaflet |
| **State** | Zustand, TanStack React Query |

The backend exposes a REST API with token authentication. The frontend is a single-page application (SPA) that consumes the API and renders interactive maps with layer switching, filtering, and data export.

### Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Client (Browser)"]
        SPA["React SPA<br/>(Vite, Tailwind, shadcn)"]
    end

    subgraph Backend["vbos-backend"]
        API["Django REST API<br/>(port 8000)"]
        DB[(PostgreSQL<br/>PostGIS)]
        API --> DB
    end

    subgraph External["External Services"]
        TiTiler["TiTiler<br/>(port 8002)<br/>COG/GeoTIFF tiles"]
        PMTiles["PMTiles URLs<br/>(remote)"]
        S3["S3/Spaces<br/>(optional storage)"]
    end

    SPA -->|"REST (auth, datasets, vector, tabular)"| API
    SPA -->|"Tile requests"| TiTiler
    SPA -->|"PMTiles"| PMTiles
    API -.->|"File storage"| S3
```

---

## Project Structure

```
vcdmis/
├── vbos-backend/          # Django API
│   ├── vbos/              # Django project
│   │   ├── config/        # Settings (local, production)
│   │   ├── datasets/      # Raster, vector, tabular, PMTiles models & views
│   │   ├── users/         # Custom user model, auth
│   │   └── urls.py
│   ├── deploy/            # Production deploy configs (Caddy, docker-compose)
│   ├── docs/              # MkDocs documentation
│   ├── docker-compose.yml # Local dev stack (PostgreSQL, web, docs, TiTiler)
│   ├── Dockerfile
│   ├── manage.py
│   └── wait_for_postgres.py
└── vbos-frontend/         # React SPA
    ├── src/
    │   ├── api/           # HTTP client, auth, dataset fetchers
    │   ├── components/    # Map, sidebars, charts, login
    │   ├── hooks/         # useAuth, useClusters, useDataset, useUrlSync
    │   ├── store/         # Auth store (Zustand)
    │   └── utils/
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## Backend (vbos-backend)

### Data Models

- **Cluster** – Dataset grouping (e.g. `transportation`, `administrative`, `environment`, `statistics`).
- **Province** / **AreaCouncil** – Admin boundaries with PostGIS geometries.
- **RasterDataset** – Raster metadata; references files via `filename_id` (VRT pattern: `{MEDIA_URL}/{filename_id}_{year}.vrt`). Optional `titiler_url_params` for rescale, etc. Optional `precomputed_tile_url` for heavy raster+tabular joins (see [precomputed_tiles](vbos-backend/docs/precomputed_tiles.md)).
- **VectorDataset** / **VectorItem** – Vector layers with GeoJSON geometries; supports `province`, `area_council`, `attribute`, `metadata` filters and `in_bbox`.
- **TabularDataset** / **TabularItem** – Time-series/statistical data; filters: `province`, `area_council`, `attribute`, `date_after`, `date_before`. Export to XLSX.
- **PMTilesDataset** – Remote PMTiles sources with `url` and `source_layer`.

Dataset types: `baseline`, `estimated_damage`, `aid_resources_needed`, `estimate_financial_damage`.

### API Endpoints

Base URL: `/api/v1/`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `api-token-auth/` | POST | Obtain auth token (username, password) |
| `api/v1/users/` | GET, POST | User list/create |
| `api/v1/users/me/` | GET | Current user |
| `api/v1/cluster/` | GET | List clusters |
| `api/v1/provinces/` | GET | List provinces (GeoJSON) |
| `api/v1/provinces/<province>/area-councils/` | GET | Area councils by province |
| `api/v1/raster/` | GET | List raster datasets |
| `api/v1/raster/<id>/` | GET | Raster detail |
| `api/v1/pmtiles/` | GET | List PMTiles datasets |
| `api/v1/pmtiles/<id>/` | GET | PMTiles detail |
| `api/v1/vector/` | GET | List vector datasets |
| `api/v1/vector/<id>/` | GET | Vector detail |
| `api/v1/vector/<id>/data/` | GET | Vector items (GeoJSON) with filters |
| `api/v1/tabular/` | GET | List tabular datasets |
| `api/v1/tabular/<id>/` | GET | Tabular detail |
| `api/v1/tabular/<id>/data/` | GET | Tabular items with filters |
| `api/v1/tabular/<id>/aggregate/` | GET | Aggregated by province/area_council (`group_by`, `year`, `attribute`, `agg`, `province`) |
| `api/v1/tabular/<id>/data-xlsx/` | GET | Export to XLSX |
| `api/v1/schema/` | GET | OpenAPI schema |
| `api/v1/docs/` | GET | Swagger UI |
| `admin/` | - | Django admin |

All API routes (except auth) require `Authorization: Token <token>`.

### Database & Storage

- **Default DB**: `postgis://postgres:postgres@postgres:5432/vbos` (Docker).
- **File storage**: Local `./media/` in dev; production can use S3 (e.g. DigitalOcean Spaces) via `django-storages` and `boto3`.
- **Environment**: `DJANGO_DB_URL`, `DJANGO_AWS_ACCESS_KEY_ID`, `DJANGO_AWS_SECRET_ACCESS_KEY`, `DJANGO_AWS_STORAGE_BUCKET_NAME`.

### Local Development (Docker)

```bash
cd vbos-backend
cp .env.example .env
docker compose up
```

Services:

- **postgres**: PostGIS 17
- **web**: Django on port 8000 (migrates on startup)
- **documentation**: MkDocs on port 8015
- **titiler**: TiTiler on port 8002 (COG/GeoTIFF tile service)

Optional: mount raster data in `./data` for TiTiler.

---

## Frontend (vbos-frontend)

### Tech Stack

- **Build**: Vite 7, TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui (Radix), Lucide React
- **Maps**: Leaflet, react-leaflet, protomaps-leaflet, leaflet-side-by-side
- **Data**: TanStack React Query, Zustand
- **Charts**: Highcharts
- **Geospatial**: @turf/bbox, @turf/helpers, @turf/simplify

### Environment

Create `.env.local`:

```env
VITE_API_HOST=http://localhost:8000
VITE_TITILER_API=http://localhost:8002
```

### Commands

```bash
pnpm install
pnpm dev      # Vite dev server
pnpm build    # tsc && vite build (produces gzip/Brotli assets and dist/stats.html for bundle analysis)
pnpm preview  # Preview production build
pnpm test     # Vitest
pnpm lint     # ESLint
```

Open `dist/stats.html` after `pnpm build` to analyze bundle size (treemap, gzip/Brotli estimates).

### Authentication Flow

1. Login page collects username/password.
2. POST to `/api-token-auth/`; store token in Zustand (`auth-store`) and `localStorage`.
3. API client (`api/http.ts`) adds `Authorization: Token <token>` to requests.
4. On 401, auth is cleared and user is redirected to login.
5. Protected routes: app shows `<Login />` until `isAuthenticated`; `/api/v1/users/me/` validates token.

### Map & Data Flow

- **Left sidebar**: Clusters → datasets; toggle layers (raster, vector, PMTiles, tabular).
- **Right sidebar**: Province/area council selectors, date range, stats table/chart, XLSX download.
- **Map**: Leaflet with vector overlays, raster tiles (via TiTiler), PMTiles.
- **URL sync**: `useUrlSync` keeps layer selections and filters in the URL.

---

## Deployment

Backend is deployable via Docker; a Caddy-based setup lives in `vbos-backend/deploy/`:

- `deploy/caddy/docker-compose.yml` – Reverse proxy (Caddy) watching labels.
- `deploy/vbos/docker-compose.yml` – Application image, TiTiler, DB URL, S3 credentials.

Health check endpoint: `/health` (configured in deploy compose).

**Before production builds**, run Django's deploy checks:

```bash
cd vbos-backend
./scripts/check-deploy.sh
# Or with Docker:
docker-compose run --rm -e DJANGO_DEBUG=false web python manage.py check --deploy
```

Frontend: build with `pnpm build` and serve the `dist/` output via any static host (Nginx, S3, Netlify, etc.).

---

## Testing

**Backend** (`vbos-backend`):

```bash
docker compose run --rm web pytest
```

**Frontend** (`vbos-frontend`):

```bash
pnpm test
```

---

## Configuration Reference

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `DJANGO_SECRET_KEY` | Required |
| `DJANGO_DB_URL` | PostGIS URL (default: postgres in Docker) |
| `DJANGO_AWS_ACCESS_KEY_ID` | S3/Spaces access key |
| `DJANGO_AWS_SECRET_ACCESS_KEY` | S3/Spaces secret key |
| `DJANGO_AWS_STORAGE_BUCKET_NAME` | S3/Spaces bucket |
| `DJANGO_DEBUG` | `true`/`1`/`yes` to enable |
| `DJANGO_PAGINATION_LIMIT` | API page size (default: 20) |
| `POSTGRES_*` | Override DB connection for Docker |

### Frontend (.env.local)

| Variable | Description |
|----------|-------------|
| `VITE_API_HOST` | Backend base URL (e.g. `http://localhost:8000`) |
| `VITE_TITILER_API` | TiTiler base URL (e.g. `http://localhost:8002`) |
| `VITE_ROADMAP_URL` | *(Optional)* URL to a hosted `TASKS.md` / roadmap page for nav toasts. If unset, the roadmap link is hidden. |

---

## License

See individual components for license details.
