# Deploying vbos-backend

This app is currently deployed on a Digital Ocean Droplet using docker-caddy reverse proxy.
All deploy related configuration are in the `deploy/` directory.

1. `deploy/caddy/docker-compose.yml` — starts the caddy reverse proxy which will watch any new containers with the caddy label.
2. `deploy/vbos/docker-compose.yml` — pulls the latest vbos-backend image and runs the application, with `.env` as the environment.

To update or redeploy:
1. First ssh into the server. Keys are in 1PW
2. Fetch code and run migrations.
  * Activate venv. `. ~/vbos-env/bin/activate`
  * `cd ~/vbos-backend && git pull`. `python manage.py migrate`
3. Then run `docker compose -f deploy/vbos/docker-compose.yml pull` to pull the new image. By default the image tag is `main`
4. Then run `docker compose -f deploy/vbos/docker-compose.yml --env-file /home/devseed/vbos-backend/.env up --force-recreate -d --no-deps vbos-backend titiler` — this will start a new container and kill the older one for deploys with no downtime
