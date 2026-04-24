# vbos-backend

VBOS Django application and data services. See the `docs/` directory for project documentation.

# Prerequisites

- [Docker Engine](https://docs.docker.com/engine/install)
- [Docker Compose](https://docs.docker.com/compose/install)

# Local Development

Start the dev server for local development:

```bash
cd deploy/
docker compose up
```

Run a command inside the docker container:

```bash
docker compose run --rm web [command]
```

# Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. For local development, the defaults in `.env` are sufficient. `DJANGO_SECRET_KEY` is set; AWS variables can stay empty (files are stored locally in `./media/`).

3. For production deployment with DigitalOcean Spaces (S3-compatible storage), fill in the AWS variables in `.env` with your Space's access credentials.
