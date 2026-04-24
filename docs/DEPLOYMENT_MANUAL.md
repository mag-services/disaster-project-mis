# Manual Setup (Without Docker)

This guide covers running the Disaster Project MIS without Docker. You install and run each component yourself.

---

## 0. Tear Down Docker (Start from Scratch)

If you previously ran with Docker, stop and remove everything:

```bash
cd /path/to/disaster-project-mis

# Stop and remove containers, networks, volumes
sudo docker compose -f deploy/vm/docker-compose.yml --profile raster down -v
# Or if using backend compose:
sudo docker compose -f vbos-backend/docker-compose.yml down -v

# Remove project images (optional, frees disk space)
sudo docker compose -f deploy/vm/docker-compose.yml down --rmi all

# Verify nothing is left
sudo docker ps -a
sudo docker volume ls
```

Then proceed with the manual setup below.

---

## Prerequisites

- **PostgreSQL 14+** with **PostGIS** extension
- **Python 3.11+** (3.13 recommended)
- **Node.js 20+** and **pnpm**
- **Titiler** (optional, for raster layers): Python environment with GDAL, FastAPI, uvicorn

---

## 1. PostgreSQL + PostGIS

### Install (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis
```

### Create database and user

```bash
sudo -u postgres psql
```

```sql
CREATE USER disaster WITH PASSWORD 'your_password';
CREATE DATABASE disaster OWNER disaster;
\c disaster
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

### Connection URL

```
postgis://disaster:your_password@localhost:5432/disaster
```

---

## 2. Backend (Django)

### Create virtual environment

```bash
cd vbos-backend
python3 -m venv .venv
source .venv/bin/activate   # Linux/macOS
# or: .venv\Scripts\activate  # Windows
```

### Install dependencies

```bash
pip install -r requirements.txt
```

If GDAL/geos fail, install system packages first:
```bash
sudo apt-get install libgdal-dev gdal-bin libgeos-dev  # Ubuntu/Debian
```

### Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
DJANGO_SECRET_KEY=your-long-random-secret
DJANGO_CONFIGURATION=Local
DJANGO_DEBUG=true
DJANGO_DB_URL=postgis://disaster:your_password@localhost:5432/disaster
```

### Migrate and run

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### Development server

```bash
python manage.py runserver 0.0.0.0:8000
```

### Production (Gunicorn)

```bash
gunicorn --bind 0.0.0.0:8000 vbos.wsgi:application
```

Backend runs at `http://localhost:8000` (or `http://<VM-IP>:8000` from other machines, e.g. `http://10.252.0.158:8000`).

---

## 3. Frontend

### Build

```bash
cd vbos-frontend

# Create .env.local (use your server IP when deploying to VM)
# For VM at 10.252.0.158:
echo "VITE_API_HOST=http://10.252.0.158:8000" > .env.local
echo "VITE_TITILER_API=http://10.252.0.158:8002" >> .env.local
# For local dev: use http://localhost:8000 and http://localhost:8002

pnpm install
pnpm build
```

### Serve static files

**Option A: Django serves frontend** (add to Django URLs and `STATICFILES_DIRS` or `whitenoise` for `dist/`).

**Option B: Separate static server**

```bash
npx serve dist -l 5173
# App at http://localhost:5173
```

**Option C: Nginx** – Point document root to `vbos-frontend/dist` and proxy `/api`, `/admin`, `/media`, `/static` to Django on port 8000.

---

## 4. Titiler (Optional, for raster layers)

Titiler is a FastAPI app. The project uses `ghcr.io/developmentseed/vbos-titiler` (a custom image). To run manually you would need the Titiler source and to replicate its setup.

**Simpler approach:** Run only the Titiler Docker image if you need raster support:

```bash
docker run -p 8002:8000 \
  -v $(pwd)/vbos-backend/data:/data \
  ghcr.io/developmentseed/vbos-titiler:main
```

Without Titiler, tabular and vector layers work; raster layers will not.

---

## 5. Summary: What runs where

| Component | Port | Command |
|-----------|------|---------|
| PostgreSQL | 5432 | `sudo systemctl start postgresql` |
| Django | 8000 | `gunicorn --bind 0.0.0.0:8000 vbos.wsgi:application` |
| Frontend | 5173 | `npx serve dist -l 5173` |
| Titiler | 8002 | Docker or manual (see above) |

### Minimal setup (no Titiler)

1. Start PostgreSQL
2. In `vbos-backend`: `python manage.py runserver 0.0.0.0:8000`
3. In `vbos-frontend`: `pnpm build && npx serve dist -l 5173`
4. Open the app (e.g. `http://localhost:5173` or `http://10.252.0.158:5173`), ensure `VITE_API_HOST` matches your backend URL

---

## Troubleshooting

- **collectstatic Permission denied**: Fix ownership: `sudo chown -R $USER:$USER /path/to/static` (static dir is often `vbos-backend/static` or one level up)
- **PostGIS not found**: Install `postgresql-16-postgis-3`, then `CREATE EXTENSION postgis;`
- **GDAL/geos errors**: Install `libgdal-dev`, `libgeos-dev` and Python dev headers
- **CORS errors**: Use `Vm` or `Local` config; they allow relaxed CORS
- **Static files 404**: Run `python manage.py collectstatic`
