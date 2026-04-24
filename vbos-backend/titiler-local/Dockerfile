# Local TiTiler: reads from /data (raster_data mount) instead of DigitalOcean Spaces
FROM ghcr.io/developmentseed/titiler:latest

COPY app.py app.py

ENV MODULE_NAME=app
ENV VARIABLE_NAME=app
ENV HOST=0.0.0.0
ENV PORT=8000
ENV WEB_CONCURRENCY=1

CMD uvicorn ${MODULE_NAME}:${VARIABLE_NAME} --host ${HOST} --port ${PORT} --workers ${WEB_CONCURRENCY}
