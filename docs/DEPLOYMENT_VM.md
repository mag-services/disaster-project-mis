# VM Server Deployment Guide

This guide covers deploying the Disaster Project MIS (VBoS) to your VM server (e.g. `vbosadmin@10.252.0.158`) using **Docker Compose**.

For a **manual setup without Docker** (PostgreSQL, Python, Node.js installed directly), see [DEPLOYMENT_MANUAL.md](DEPLOYMENT_MANUAL.md).

---

## Migrate from Manual to Docker

If you previously ran the manual setup and want to switch to Docker:

1. **Stop manual processes** on the VM:
   ```bash
   # Kill Django (port 8000)
   fuser -k 8000/tcp
   # Kill frontend serve (port 5173)
   fuser -k 5173/tcp
   ```

2. **Optional – migrate existing data** (manual used `disaster` DB, Docker uses fresh `vbos` DB):
   ```bash
   # On VM, if you need data from the old disaster DB:
   pg_dump -U disaster -h localhost disaster > backup.sql
   # After Docker is running, restore into vbos (see Troubleshooting)
   ```

3. Proceed with [Prerequisites](#prerequisites-on-the-vm) and [Configure Environment](#3-configure-environment) below.

---

## Prerequisites on the VM

- Ubuntu 24.04 LTS (or similar)
- Docker Engine
- Docker Compose v2
- Git

## 1. Prepare the VM

### Install Docker (if not already installed)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Add Docker's GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod 644 /etc/apt/keyrings/docker.gpg

# Add Docker repository (Ubuntu 24.04 = noble)
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Important: update apt cache before installing
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

If you get "no installation candidate", remove conflicting packages first:
```bash
sudo apt-get remove -y docker.io docker-doc podman-docker 2>/dev/null || true
sudo apt-get update
# Then retry the install
```

### Add your user to the docker group

```bash
sudo usermod -aG docker $USER
# Log out and back in for the group change to take effect
```

## 2. Transfer the Project to the VM

### Option A: Clone from Git (if using a repo)

```bash
ssh vbosadmin@10.252.0.158
sudo mkdir -p /var/www && sudo chown $USER:$USER /var/www
cd /var/www
git clone <YOUR_REPO_URL> disaster-project-mis
cd disaster-project-mis
```

### Option B: Copy from your local machine with rsync

From your **local** machine (where the project lives):

```bash
# Include media so PMTiles (roads.pmtiles) and uploads are available on VM
rsync -avz --exclude 'node_modules' --exclude '.git' \
  "/home/htevilili/Documents/Work/Disaster Project/disaster-project-mis/" \
  vbosadmin@10.252.0.158:/var/www/disaster-project-mis/
```

Then on the VM:

```bash
ssh vbosadmin@10.252.0.158
cd /var/www/disaster-project-mis
```

> Use `/var/www/disaster-project-mis` or `~/disaster-project-mis` – replace paths in the steps below accordingly.

## 3. Configure Environment

### Backend (.env)

```bash
cd ~/disaster-project-mis/vbos-backend
cp .env.example .env
```

Edit `.env` and set at minimum:

```bash
# Required – use a strong random string in production
DJANGO_SECRET_KEY="your-very-long-random-secret-key-here"

# Disable debug in production
DJANGO_DEBUG=false

# Database (default works with docker-compose)
DJANGO_DB_URL="postgis://postgres:postgres@postgres:5432/vbos"
```

Generate a secret key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### Frontend (for build)

Create `vbos-frontend/.env.production.local` before running `pnpm build`.

**If using the VM docker-compose** (nginx on port 80, API proxied) – **recommended for LAN access** (tablet, phone on same WiFi):

Use **empty** `VITE_API_HOST` so API requests use the same origin. Login and all API calls will work when you access the app from any device (e.g. `http://192.168.1.81/`):

```bash
cd ~/disaster-project-mis/vbos-frontend
cp .env.production.local.example .env.production.local
# Or manually:
echo 'VITE_API_HOST=' > .env.production.local
echo 'VITE_TITILER_API=/titiler' >> .env.production.local
```

**If you need a fixed URL** (e.g. for a specific VM hostname):

```bash
# Replace with your VM IP or hostname
echo 'VITE_API_HOST=http://192.168.1.81' > .env.production.local
echo 'VITE_TITILER_API=http://192.168.1.81/titiler' >> .env.production.local
```

**If using backend-only** (no nginx, direct ports):

```bash
echo 'VITE_API_HOST=http://192.168.1.81:8000' > .env.production.local
echo 'VITE_TITILER_API=http://192.168.1.81:8002' >> .env.production.local
```

## 4. Build and Run

### Option A: Full stack with nginx (recommended)

This serves the app on port 80 and proxies API/admin to the backend.

1. **Create `.env`** in the project root (for docker-compose):

```bash
cd ~/disaster-project-mis
cp vbos-backend/.env.example vbos-backend/.env
# Edit vbos-backend/.env: set DJANGO_SECRET_KEY, DJANGO_DEBUG=false
```

2. **Build the frontend** (required before starting nginx):

```bash
# Install Node 20+ and pnpm if needed
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm

cd ~/disaster-project-mis/vbos-frontend
pnpm install
# Create .env.production.local (see above) first
pnpm build
```

3. **Start all services**:

```bash
cd ~/disaster-project-mis
# Ensure vbos-backend/.env has DJANGO_SECRET_KEY (compose reads from env_file)
# TiTiler is now built locally from vbos-backend/titiler-local
sudo docker compose -f deploy/vm/docker-compose.yml up -d --build
```

Access at **http://10.252.0.158/**.

### Option B: Backend only (dev-style)

```bash
cd ~/disaster-project-mis/vbos-backend
cp .env.example .env
# Edit .env
docker compose up -d
```

Then build and serve frontend separately:

```bash
cd ~/disaster-project-mis/vbos-frontend
pnpm install && pnpm build
npx serve dist -l 5173
# App at http://10.252.0.158:5173, API at :8000, Titiler at :8002
```

## 5. Create a Django Superuser

**Option A (VM compose):**

```bash
cd /var/www/disaster-project-mis   # or ~/disaster-project-mis
docker compose -f deploy/vm/docker-compose.yml exec web ./manage.py createsuperuser
```

**Option B (backend compose):**

```bash
cd ~/disaster-project-mis/vbos-backend
docker compose exec web ./manage.py createsuperuser
```

## 6. Verify Deployment

**Option A (nginx):** App + API at http://10.252.0.158/, Titiler at :8002  
**Option B:** API at :8000, Frontend at :5173, Titiler at :8002

## Ports Summary

| Service   | Port | Description                    |
|----------|------|--------------------------------|
| Nginx    | 80   | App + API proxy (Option A)     |
| Django   | 8000 | API + Admin                    |
| Titiler  | 8002 | Raster tile service            |
| Postgres | 5432 | Database (internal to Docker)  |

## Troubleshooting

### "Connection refused" on admin or API

- Ensure the web container is running: `docker compose ps`
- Check logs: `docker compose logs web`
- Confirm firewall allows 8000, 8002, 5173 (if used)

### Database connection errors

- Wait for Postgres to be ready before starting web
- Verify `.env` has correct `DJANGO_DB_URL`

### "Could not save workspace" / Internal Server Error when saving the map layout

The Live Map **Save workspace** feature needs the `MapSavedWorkspace` table from Django migration **`0046_map_saved_workspace`** (and later `datasets` migrations). If the backend was updated but migrations were not applied, the API can return 500 or 503.

**Fix:** run migrations inside the web container, then retry:

```bash
docker compose -f deploy/vm/docker-compose.yml exec web ./manage.py migrate datasets
# or, from vbos-backend with local compose:
docker compose exec web ./manage.py migrate datasets
```

### Frontend shows blank or API errors

- Confirm `VITE_API_HOST` and `VITE_TITILER_API` match your VM URL
- Rebuild frontend after changing env: `pnpm build`
- Check browser console for CORS or network errors

### Bulk delete fails in admin

`DATA_UPLOAD_MAX_NUMBER_FIELDS` is set to 50000. If you need more, increase it in `vbos/config/common.py`.

### PMTiles (roads.pmtiles) returns 404

The map requests `roads.pmtiles` via `/api/v1/pmtiles-serve/roads.pmtiles`. If you get 404:

1. **Verify the file exists** on the VM:
   ```bash
   ls -la /var/www/disaster-project-mis/vbos-backend/media/roads.pmtiles
   ```

2. **Verify the Docker volume mount** – the web container must see the file:
   ```bash
   cd /var/www/disaster-project-mis
   docker compose -f deploy/vm/docker-compose.yml exec web ls -la /app/media/
   ```
   You should see `roads.pmtiles`. If not, ensure you run `docker compose` from the project root so the volume path `../../vbos-backend/media` resolves correctly.

3. **Include media in rsync** when copying to the VM:
   ```bash
   rsync -avz --exclude 'node_modules' --exclude '.git' \
     "disaster-project-mis/" vbosadmin@10.252.0.158:/var/www/disaster-project-mis/
   ```

### Two-factor authentication: "Invalid or expired code"

TOTP (Microsoft Authenticator) is time-based. If the server clock is wrong, codes will fail even when correct.

1. **Check container time:**
   ```bash
   docker compose -f deploy/vm/docker-compose.yml exec web date
   ```

2. **Sync the VM host clock** (containers use the host clock):
   ```bash
   sudo timedatectl set-ntp true
   timedatectl status
   ```

3. **Set timezone** (optional, for display): add `TZ=Pacific/Fiji` to `deploy/vm/.env` or export before `docker compose up`.

---

## Path vs Subdomain Routing

The default nginx config uses **path-based** routing (`/api/`, `/titiler/`). Development Seed recommends **subdomains** (`api.drmis.ndmo.gov.vu`, `titiler.drmis.ndmo.gov.vu`) for easier maintenance and independent updates. See [DEPLOYMENT_ROUTING.md](DEPLOYMENT_ROUTING.md) for details and `deploy/vm/nginx-https-subdomains.conf.example` for subdomain config.

---

## HTTPS Deployment (NDMO / Production Domain)

When deploying to the NDMO server with a purchased domain (e.g. `mis.ndmo.gov.vu`) for MoCCA and stakeholders, **HTTPS is required** for several features:

| Feature | Why HTTPS is required |
|---------|------------------------|
| **Geolocation** | `navigator.geolocation` is restricted to secure contexts |
| **Screen/camera capture** | `getDisplayMedia` / `getUserMedia` require HTTPS |
| **Service Worker (PWA)** | Offline support and caching require secure origin |
| **Clipboard API** | `navigator.clipboard` requires HTTPS in most browsers |
| **Cookies / sessions** | Secure cookies (`Secure` flag) are best practice over HTTPS |

### 1. Prerequisites

- Domain purchased and DNS A record pointing to the NDMO server IP
- Port 80 and 443 open on the server firewall
- Certbot (Let's Encrypt) installed on the host

### 2. Obtain SSL certificate (Let's Encrypt)

On the **host** (not inside Docker). For the first run, port 80 must be free:

```bash
# Stop nginx if running
docker compose -f deploy/vm/docker-compose.yml stop nginx

sudo apt-get install -y certbot
sudo certbot certonly --standalone -d mis.ndmo.gov.vu
# Certificates in /etc/letsencrypt/live/mis.ndmo.gov.vu/

# Start nginx with HTTPS config
docker compose -f deploy/vm/docker-compose.yml up -d
```

For renewal, use `certbot renew` (cron or systemd timer). With `--webroot` you can avoid stopping nginx; see [certbot docs](https://certbot.eff.org/instructions).

### 3. Nginx HTTPS configuration

Use the example config `deploy/vm/nginx-https.conf.example`:

```bash
cp deploy/vm/nginx-https.conf.example deploy/vm/nginx-https.conf
# Edit nginx-https.conf: replace mis.ndmo.gov.vu with your domain
```

Update `deploy/vm/docker-compose.yml` nginx service to use HTTPS:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx-https.conf:/etc/nginx/conf.d/default.conf:ro
    - ../../vbos-frontend/dist:/usr/share/nginx/html:ro
    - static_volume:/static:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro   # Mount certs
  # ... rest unchanged
```

Restart: `docker compose -f deploy/vm/docker-compose.yml up -d`.

### 4. Django settings for HTTPS

Django auto-detects HTTPS when `DJANGO_VM_HOST` starts with `https://`. Set in `vbos-backend/.env` or `deploy/vm/.env`:

```bash
DJANGO_VM_HOST=https://mis.ndmo.gov.vu
```

This enables secure cookies and `SECURE_PROXY_SSL_HEADER` automatically (see `vbos/config/vm.py`).

### 5. Frontend build

Ensure `VITE_API_HOST` and `VITE_TITILER_API` use `https://`:

```bash
echo 'VITE_API_HOST=https://mis.ndmo.gov.vu' > vbos-frontend/.env.production.local
echo 'VITE_TITILER_API=https://mis.ndmo.gov.vu/titiler' >> vbos-frontend/.env.production.local
pnpm build
```

### 6. Sharing the link

After deployment, share the MIS link with MoCCA and stakeholders, e.g.:

- **https://mis.ndmo.gov.vu**

Users can log in and use the feedback form for feature requests and changes.

---

## NDMO Subdomain Migration (drmis.ndmo.gov.vu + SSL)

To deploy with subdomains `drmis.ndmo.gov.vu`, `api.drmis.ndmo.gov.vu`, and `titiler.drmis.ndmo.gov.vu`:

### 1. DNS

Point all three (or use CNAME) to the server IP:

- `drmis.ndmo.gov.vu` → server IP
- `api.drmis.ndmo.gov.vu` → server IP
- `titiler.drmis.ndmo.gov.vu` → server IP

### 2. SSL certificate

```bash
# Stop nginx first
docker compose -f deploy/vm/docker-compose.yml stop nginx

sudo certbot certonly --standalone \
  -d drmis.ndmo.gov.vu -d api.drmis.ndmo.gov.vu -d titiler.drmis.ndmo.gov.vu
```

### 3. Nginx subdomain config

```bash
cp deploy/vm/nginx-https-subdomains.conf.example deploy/vm/nginx-https.conf
```

Update `deploy/vm/docker-compose.yml` nginx to use HTTPS config and mount certs (see [HTTPS Deployment](#https-deployment-ndmo--production-domain) above).

### 4. Frontend build (subdomain URLs)

```bash
echo 'VITE_API_HOST=https://api.drmis.ndmo.gov.vu' > vbos-frontend/.env.production.local
echo 'VITE_TITILER_API=https://titiler.drmis.ndmo.gov.vu' >> vbos-frontend/.env.production.local
cd vbos-frontend && pnpm build
```

### 5. Django

Set `DJANGO_VM_HOST=https://drmis.ndmo.gov.vu` and add all domains to `CSRF_TRUSTED_ORIGINS` if needed.
