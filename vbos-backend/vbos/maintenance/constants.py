"""Backup categories and options."""

# Category keys for selective backup
CAT_APP_DATA = "app_data"
CAT_RASTERS = "rasters"
CAT_VECTORS = "vectors"
CAT_PMTILES = "pmtiles"
CAT_MEDIA = "media"
CAT_SCHEMA = "schema"

# Human-readable labels and descriptions
BACKUP_CATEGORIES = [
    {
        "key": CAT_APP_DATA,
        "label": "Application Data (JSON)",
        "description": "Users & permissions, Datasets metadata, Climate & Land Accounts, Coastal Changes, Field Checks & Damage Verification, Feedback & Area Submissions, Integrations & API keys",
        "sub_items": [
            "Users & permissions",
            "Datasets metadata",
            "Climate & Land Accounts",
            "Coastal Changes",
            "Field Checks & Damage Verification",
            "Feedback & Area Submissions",
            "Integrations & API keys",
        ],
    },
    {
        "key": CAT_RASTERS,
        "label": "Raster Files (COG / GeoTIFF)",
        "description": "Land cover, flood risk, sea-level rise, etc.",
    },
    {
        "key": CAT_VECTORS,
        "label": "Vector Files (GeoJSON / Shapefile)",
        "description": "Infrastructure, coastal changes, land accounts",
    },
    {
        "key": CAT_PMTILES,
        "label": "PMTiles & Vector Tiles",
        "description": "Roads, shorelines, cyclone intensity",
    },
    {
        "key": CAT_MEDIA,
        "label": "Static Assets & Uploaded Media",
        "description": "PDFs, reports, photos from field checks",
    },
    {
        "key": CAT_SCHEMA,
        "label": "Database Schema & PostGIS dumps (SQL)",
        "description": "Structure only (no data) for reference",
    },
]

COMPRESSION_CHOICES = [
    ("high", "High (slower)"),
    ("medium", "Medium"),
    ("none", "None (fastest)"),
]
