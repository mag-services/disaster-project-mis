# Deployment Routing: Path vs Subdomain

This document explains the two approaches for routing traffic to the MIS services (frontend, API, TiTiler) and why **subdomains are recommended** (per Development Seed guidance).

**NDMO domain:** `drmis.ndmo.gov.vu` (frontend), `api.drmis.ndmo.gov.vu` (API), `titiler.drmis.ndmo.gov.vu` (TiTiler).

## Two Approaches

| Approach | Example | Config |
|----------|---------|--------|
| **Path-based** | `drmis.ndmo.gov.vu/`, `drmis.ndmo.gov.vu/api/`, `drmis.ndmo.gov.vu/titiler/` | Single domain, nginx routes by path |
| **Subdomain-based** | `drmis.ndmo.gov.vu`, `api.drmis.ndmo.gov.vu`, `titiler.drmis.ndmo.gov.vu` | Three subdomains, each points to a service |

## Current VM Deployment (Path-based)

The default `deploy/vm/nginx.conf` and `nginx-https.conf.example` use **path-based** routing:

- `/` → Frontend SPA
- `/api/` → Django
- `/titiler/` → TiTiler

**Why it was used:** Simpler for single-server deployments; one domain, one SSL cert, one nginx config.

## Recommended: Subdomain-based (per Sajjad, Development Seed)

**Why subdomains are preferred:**

1. **Separate projects** – Frontend, backend, and TiTiler are maintained as separate codebases. Subdomains reflect that separation.
2. **No path conflicts** – Avoids clashes if a service uses a path that overlaps (e.g. `/api/` vs frontend routes).
3. **Independent updates** – Easier to manage downtimes and deploy one service without affecting others.
4. **Clearer architecture** – Each service has its own hostname; easier to debug and monitor.

**NDMO subdomains:**

| Subdomain | Service | Purpose |
|-----------|---------|---------|
| `drmis.ndmo.gov.vu` | Frontend | Web app (React SPA) |
| `api.drmis.ndmo.gov.vu` | Backend | Django REST API, admin |
| `titiler.drmis.ndmo.gov.vu` | TiTiler | Map raster tiles |

**Note:** Subdomains are a recommendation, not a hard requirement. Path-based routing works and is documented. Choose based on your deployment needs.

## SSL for Subdomains

For subdomains, you need a certificate that covers all three. Options:

1. **Wildcard cert** – `*.ndmo.gov.vu` (requires DNS challenge with Let's Encrypt; may need DCDT approval)
2. **Multi-domain cert** – List all three in one cert: `certbot certonly -d drmis.ndmo.gov.vu -d api.drmis.ndmo.gov.vu -d titiler.drmis.ndmo.gov.vu`

## Config Files

| File | Routing | Use case |
|------|---------|----------|
| `deploy/vm/nginx.conf` | Path | HTTP, LAN/dev |
| `deploy/vm/nginx-https.conf.example` | Path | HTTPS, single domain |
| `deploy/vm/nginx-https-subdomains.conf.example` | Subdomain | HTTPS, drmis.ndmo.gov.vu |
