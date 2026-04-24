# Contributing to VBoS MIS

Thank you for your interest in contributing to the Vanuatu Bureau of Statistics Management Information System. This guide covers setup, conventions, and how to submit changes.

---

## Development Setup

### Prerequisites

- **Docker & Docker Compose** – for backend, PostGIS, TiTiler
- **Node.js 20+** and **pnpm** – for frontend
- **Git** – for version control

### Backend (Django)

```bash
cd vbos-backend
cp .env.example .env
# Edit .env – at minimum set DJANGO_SECRET_KEY
docker-compose up
```

- API: http://localhost:8000
- Docs: http://localhost:8015
- TiTiler (Compose): http://localhost:8043

### Frontend (React)

```bash
cd vbos-frontend
cp .env.example .env.local
# Edit .env.local – set VITE_API_HOST and VITE_TITILER_API
pnpm install
pnpm dev
```

- App: http://localhost:5173

### First-time Setup

- Create an admin user: `docker-compose exec web python manage.py createsuperuser`
- Log in with the frontend to obtain a token for API exploration

---

## Code Conventions

- **Backend**: Follow Django/PEP 8 style. Use `black` and `ruff` (if configured).
- **Frontend**: ESLint and Prettier (if configured). Use TypeScript types.
- **Commits**: Use clear, imperative messages. Prefer prefixes: `feat:`, `fix:`, `docs:`, `perf:`, `refactor:`.
- **Files**: Match existing project structure and naming (e.g. `kebab-case` for components, `PascalCase` for React components).

---

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make changes** – keep commits focused and logical.

3. **Run checks**:
   - Backend: `docker-compose run --rm web pytest` (and `./scripts/check-deploy.sh` for deploy readiness)
   - Frontend: `pnpm lint`, `pnpm test`, `pnpm build`

4. **Update docs** – If you add env vars, endpoints, or change behaviour, update README, CHANGELOG, or `.env.example` as needed.

5. **Open a PR** against `main`:
   - Describe what changed and why
   - Link any related issues
   - Ensure CI (if configured) passes

6. **Review** – Address feedback; maintainers will merge when approved.

---

## Environment Variables

See `.env.example` in `vbos-backend/` and `vbos-frontend/` for all supported variables. Copy to `.env` or `.env.local` and fill in values. Never commit secrets.

---

## Changelog

Add notable changes to `CHANGELOG.md` under `[Unreleased]` when submitting fixes or features. Follow the existing format (Backend / Frontend sections, subsections).

---

## Questions?

Open an issue for bugs, feature requests, or clarifications.
