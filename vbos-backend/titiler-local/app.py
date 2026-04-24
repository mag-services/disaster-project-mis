"""
Local TiTiler for development: reads VRT files from /data mount.
Use when raster files are in vbos-backend/raster_data/ (mounted as /data).
Mirrors vbos-titiler but uses local path instead of DigitalOcean Spaces.
"""
import json
from pathlib import Path as libPath
from typing import Annotated, Literal, Optional

import jinja2
import rasterio
from fastapi import FastAPI, HTTPException, Path, Query
from rio_tiler.io import Reader
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.templating import Jinja2Templates
from starlette_cramjam.middleware import CompressionMiddleware
from titiler.application import __version__ as titiler_version
from titiler.application.settings import ApiSettings
from titiler.core.errors import DEFAULT_STATUS_CODES, add_exception_handlers
from titiler.core.factory import (
    AlgorithmFactory,
    ColorMapFactory,
    TilerFactory,
    TMSFactory,
)
from titiler.core.middleware import (
    CacheControlMiddleware,
    LoggerMiddleware,
    TotalTimeMiddleware,
)
from titiler.core.models.OGC import Conformance, Landing
from titiler.core.resources.enums import MediaType
from titiler.core.utils import accept_media_type, create_html_response, update_openapi

api_settings = ApiSettings()
DATA_ROOT = libPath("/data")

templates_location = [
    jinja2.PackageLoader("titiler.application", "templates"),
    jinja2.PackageLoader("titiler.core", "templates"),
]
jinja2_env = jinja2.Environment(
    autoescape=jinja2.select_autoescape(["html", "xml"]),
    loader=jinja2.ChoiceLoader(templates_location),
)
titiler_templates = Jinja2Templates(env=jinja2_env)


def DatasetPathParams(
    dataset_id: Annotated[str, Path(description="Dataset")],
    year: Annotated[int, Path(description="Year")],
) -> str:
    """Return local file path for dataset/year. Tries .vrt then .tif. Files at /data/{dataset_id}_{year}.vrt or .tif"""
    base = DATA_ROOT / f"{dataset_id}_{year}"
    for ext in (".vrt", ".tif"):
        p = base.with_suffix(ext)
        if p.exists():
            return str(p)
    raise HTTPException(
        status_code=404,
        detail=f"Raster not found: {dataset_id}_{year}.vrt or .tif in /data",
    )


app = FastAPI(
    title=api_settings.name,
    openapi_url="/api",
    docs_url="/api.html",
    description=api_settings.description,
    version=titiler_version,
    root_path="/titiler",
)
update_openapi(app)

TITILER_CONFORMS_TO = {
    "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/core",
    "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/landing-page",
    "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/oas30",
    "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/html",
    "http://www.opengis.net/spec/ogcapi-common-1/1.0/conf/json",
}

tiler = TilerFactory(
    reader=Reader,
    path_dependency=DatasetPathParams,
    add_ogc_maps=True,
    templates=titiler_templates,
    router_prefix="/dataset/{dataset_id}/years/{year}",
)
app.include_router(tiler.router, prefix="/dataset/{dataset_id}/years/{year}")
TITILER_CONFORMS_TO.update(tiler.conforms_to)

tms = TMSFactory(templates=titiler_templates)
app.include_router(tms.router, tags=["Tiling Schemes"])
TITILER_CONFORMS_TO.update(tms.conforms_to)

algorithms = AlgorithmFactory(templates=titiler_templates)
app.include_router(algorithms.router, tags=["Algorithms"])
TITILER_CONFORMS_TO.update(algorithms.conforms_to)

cmaps = ColorMapFactory(templates=titiler_templates)
app.include_router(cmaps.router, tags=["ColorMaps"])
TITILER_CONFORMS_TO.update(cmaps.conforms_to)

add_exception_handlers(app, DEFAULT_STATUS_CODES)

if api_settings.cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=api_settings.cors_origins,
        allow_credentials=True,
        allow_methods=api_settings.cors_allow_methods,
        allow_headers=["*"],
    )

app.add_middleware(
    CompressionMiddleware,
    minimum_size=0,
    exclude_mediatype={
        "image/jpeg", "image/jpg", "image/png", "image/jp2", "image/webp",
    },
    compression_level=6,
)
app.add_middleware(
    CacheControlMiddleware,
    cachecontrol=api_settings.cachecontrol,
    exclude_path={r"/healthz"},
)


@app.get("/healthz")
def application_health_check():
    return {
        "versions": {
            "titiler": titiler_version,
            "rasterio": rasterio.__version__,
            "gdal": rasterio.__gdal_version__,
            "proj": rasterio.__proj_version__,
            "geos": rasterio.__geos_version__,
        },
    }
