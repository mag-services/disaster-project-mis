# Lightweight tile server - uses OSGeo GDAL image (has Python + rasterio deps)
FROM ghcr.io/osgeo/gdal:ubuntu-small-3.8.0

RUN pip install --no-cache-dir fastapi uvicorn rasterio numpy Pillow

WORKDIR /app
COPY app.py .

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
