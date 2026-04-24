"""
Lightweight, synchronous fetchers for external hazard feeds.
Each function returns a list of dicts matching the LiveAlert schema.
All network calls use a short timeout (8 s); failures return [] with an error status.
"""
import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import json
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

log = logging.getLogger(__name__)

# Vanuatu bounding box (lon_min, lat_min, lon_max, lat_max)
VU_BBOX = (165.0, -22.0, 172.0, -12.0)

TIMEOUT = 8  # seconds


def _fetch_json(url: str) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "DRMIS/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read().decode())


def _fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "DRMIS/1.0"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return resp.read().decode(errors="replace")


def _iso(dt_str: str) -> str:
    """Normalise an ISO-ish string to UTC ISO-8601."""
    try:
        dt_str = dt_str.strip().replace("Z", "+00:00")
        return datetime.fromisoformat(dt_str).astimezone(timezone.utc).isoformat()
    except Exception:
        return dt_str


# ────────────────────────────────────────────────
# USGS Earthquake Feed
# M4.0+ past 7 days, filtered to Vanuatu bbox
# ────────────────────────────────────────────────

USGS_URL = (
    "https://earthquake.usgs.gov/fdsnws/event/1/query"
    "?format=geojson&minmagnitude=4.0&orderby=time"
    f"&minlongitude={VU_BBOX[0]}&minlatitude={VU_BBOX[1]}"
    f"&maxlongitude={VU_BBOX[2]}&maxlatitude={VU_BBOX[3]}"
    "&limit=20"
)


def _usgs_severity(mag: float) -> str:
    if mag >= 7.0:
        return "critical"
    if mag >= 6.0:
        return "high"
    if mag >= 5.0:
        return "medium"
    return "low"


def fetch_usgs() -> tuple[list[dict], str]:
    """Returns (alerts, status) where status is 'ok' or an error string."""
    try:
        data = _fetch_json(USGS_URL)
        alerts = []
        for feat in data.get("features", []):
            props = feat.get("properties", {})
            mag = props.get("mag") or 0.0
            place = props.get("place") or "Vanuatu region"
            ts_ms = props.get("time") or 0
            issued = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat()
            eq_id = feat.get("id", "")
            alerts.append(
                {
                    "id": f"usgs-{eq_id}",
                    "source": "USGS",
                    "title": f"M{mag:.1f} — {place}",
                    "summary": props.get("title", ""),
                    "issued_at": issued,
                    "type": "earthquake",
                    "severity": _usgs_severity(mag),
                    "url": props.get("url", ""),
                    "magnitude": mag,
                }
            )
        return alerts, "ok"
    except Exception as exc:
        log.warning("USGS fetch failed: %s", exc)
        return [], str(exc)


# ────────────────────────────────────────────────
# VMGD — Vanuatu Meteorological & Geo-hazards Dept
#
# Scrapes two public HTML pages (no RSS/JSON API available):
#   1. https://www.vmgd.gov.vu/warnings
#      Active warnings (e.g. Ambae Level 3 eruption, TC advisories)
#   2. https://www.vmgd.gov.vu/geohazards/volcanoes
#      Current volcanic alert levels for all Vanuatu volcanoes
#
# HTML structure (React SSR static HTML):
#   Warnings:
#     <p class="text-xs text-gray-400 ...">Issued on <!-- -->DATE<!-- --> ...</p>
#     <h2 class="...">TITLE</h2>
#     <p class="text-gray-900 ...">BODY TEXT</p>
#   Volcanoes:
#     <h3 class="font-semibold">NAME</h3>  ... <span class="font-bold mt-0.5">LEVEL</span>
# ────────────────────────────────────────────────

VMGD_WARNINGS_URL = "https://www.vmgd.gov.vu/warnings"
VMGD_VOLCANOES_URL = "https://www.vmgd.gov.vu/geohazards/volcanoes"


def _vmgd_severity(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ("level 4", "level 5", "emergency")):
        return "critical"
    if any(w in t for w in ("level 3", "warning", "eruption")):
        return "high"
    if any(w in t for w in ("level 2", "watch", "advisory")):
        return "medium"
    if any(w in t for w in ("level 1", "unrest", "outlook")):
        return "low"
    return "info"


def _vmgd_type(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ("cyclone", "tropical")):
        return "cyclone"
    if any(w in t for w in (
        "volcano", "volcanic", "eruption", "ambae", "ambrym",
        "yasur", "lopevi", "gaua", "epi",
    )):
        return "volcano"
    if "tsunami" in t:
        return "hazard"
    if "flood" in t:
        return "flood"
    if "drought" in t:
        return "drought"
    return "weather"


def _strip_tags(s: str) -> str:
    """Remove HTML tags and React comment fragments, collapse whitespace."""
    s = re.sub(r"<!--.*?-->", " ", s, flags=re.DOTALL)
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", s).strip()


def _parse_vmgd_date(raw: str) -> str:
    """
    Parse VMGD date: "Issued on  Monday 23rd February, 2026  at  00 :00  Vanuatu Standard Time"
    VST = UTC+11.
    """
    s = re.sub(r"(?i)issued\s+on\s*", "", raw).strip()
    s = re.sub(r"(\d+)\s*(?:st|nd|rd|th)\b", r"\1", s)           # ordinals
    s = re.sub(r"(\d{1,2})\s*:\s*(\d{2})", r"\1:\2", s)           # "00 : 00"
    s = re.sub(r"(?i)\bat\b|Vanuatu Standard Time|VST", "", s)
    s = re.sub(r"(?i)^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    for fmt in ("%d %B, %Y %H:%M", "%d %B %Y %H:%M", "%d %B, %Y", "%d %B %Y"):
        try:
            dt = datetime.strptime(s, fmt).replace(tzinfo=timezone.utc) - timedelta(hours=11)
            return dt.isoformat()
        except ValueError:
            continue
    return datetime.now(timezone.utc).isoformat()


def _scrape_vmgd_warnings(html: str) -> list[dict]:
    """Extract warning cards: date → h2 title → p body."""
    results = []
    # The date <p> has class containing "text-xs" and "text-gray-400"
    date_re = re.compile(
        r'<p[^>]*class="[^"]*text-xs[^"]*text-gray-400[^"]*"[^>]*>(.*?)</p>',
        re.DOTALL,
    )
    h2_re = re.compile(r'<h2[^>]*>(.*?)</h2>', re.DOTALL)
    body_re = re.compile(r'<p[^>]*class="[^"]*text-gray-900[^"]*"[^>]*>(.*?)</p>', re.DOTALL)

    for dm in date_re.finditer(html):
        date_raw = _strip_tags(dm.group(1))
        if "issued" not in date_raw.lower():
            continue
        # h2 title within 2 000 chars after the date
        chunk = html[dm.end(): dm.end() + 2000]
        hm = h2_re.search(chunk)
        if not hm:
            continue
        title = _strip_tags(hm.group(1))
        if len(title) < 5:
            continue
        # Body paragraph after the h2
        after_h2 = dm.end() + hm.end()
        bm = body_re.search(html[after_h2: after_h2 + 1500])
        summary = _strip_tags(bm.group(1))[:400] if bm else ""
        results.append({"title": title, "date_str": date_raw, "summary": summary})
    return results


def _scrape_vmgd_volcanoes(html: str) -> list[dict]:
    """Extract volcano name + alert level from the volcano summary page."""
    results = []
    h3_re = re.compile(r'<h3[^>]*class="[^"]*font-semibold[^"]*"[^>]*>(.*?)</h3>', re.DOTALL)
    level_re = re.compile(r'<span[^>]*class="[^"]*font-bold[^"]*"[^>]*>\s*(\d)\s*</span>', re.DOTALL)

    for hm in h3_re.finditer(html):
        name = _strip_tags(hm.group(1))
        if len(name) < 3:
            continue
        chunk = html[hm.end(): hm.end() + 500]
        lm = level_re.search(chunk)
        if not lm:
            continue
        results.append({"name": name, "level": int(lm.group(1))})
    return results


def fetch_vmgd() -> tuple[list[dict], str]:
    """
    Scrapes VMGD /warnings and /geohazards/volcanoes for live hazard data.
    Warnings are the most authoritative source (direct VMGD advisories).
    Volcano levels supplement the feed with all active volcanoes at Level 2+.
    """
    alerts: list[dict] = []
    errors: list[str] = []

    # ── 1. Active warnings ────────────────────────
    try:
        html = _fetch_text(VMGD_WARNINGS_URL)
        for i, w in enumerate(_scrape_vmgd_warnings(html)):
            title = w["title"]
            combined = f"{title} {w['summary']}"
            alerts.append({
                "id": f"vmgd-warn-{i}-{hash(title) & 0xFFFF:04x}",
                "source": "VMGD",
                "title": title,
                "summary": w["summary"],
                "issued_at": _parse_vmgd_date(w["date_str"]),
                "type": _vmgd_type(combined),
                "severity": _vmgd_severity(combined),
                "url": VMGD_WARNINGS_URL,
                "magnitude": None,
            })
    except Exception as exc:
        log.warning("VMGD warnings scrape failed: %s", exc)
        errors.append(str(exc))

    # ── 2. Volcano alert levels (Level 2+) ───────
    try:
        html = _fetch_text(VMGD_VOLCANOES_URL)
        now_iso = datetime.now(timezone.utc).isoformat()
        for i, v in enumerate(_scrape_vmgd_volcanoes(html)):
            level = v["level"]
            if level < 2:
                continue
            name = v["name"]
            severity = "critical" if level >= 4 else "high" if level == 3 else "medium"
            alerts.append({
                "id": f"vmgd-vol-{i}-{hash(name) & 0xFFFF:04x}",
                "source": "VMGD",
                "title": f"Volcano Alert Level {level} — {name}",
                "summary": f"{name} is at Volcanic Alert Level {level}.",
                "issued_at": now_iso,
                "type": "volcano",
                "severity": severity,
                "url": VMGD_VOLCANOES_URL,
                "magnitude": None,
            })
    except Exception as exc:
        log.warning("VMGD volcanoes scrape failed: %s", exc)
        errors.append(str(exc))

    if not alerts and errors:
        return [], "; ".join(errors)
    return alerts, "ok"


# ────────────────────────────────────────────────
# GDACS — Global Disaster Alert & Coordination System
# GeoRSS feed, filter to Vanuatu region
# ────────────────────────────────────────────────

GDACS_RSS_URL = "https://www.gdacs.org/xml/rss_vanuatu.xml"
GDACS_GLOBAL_URL = "https://www.gdacs.org/xml/rss.xml"

GDACS_NS = {
    "gdacs": "http://www.gdacs.org",
    "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
    "dc": "http://purl.org/dc/elements/1.1/",
}


def _gdacs_severity(alert_level: str) -> str:
    level = (alert_level or "").lower()
    if level == "red":
        return "high"
    if level == "orange":
        return "medium"
    return "low"


def _gdacs_type(event_type: str) -> str:
    mapping = {
        "EQ": "earthquake",
        "TC": "cyclone",
        "FL": "flood",
        "VO": "volcano",
        "WF": "wildfire",
        "DR": "drought",
    }
    return mapping.get((event_type or "").upper(), "hazard")


def fetch_gdacs() -> tuple[list[dict], str]:
    urls_to_try = [GDACS_RSS_URL, GDACS_GLOBAL_URL]
    for url in urls_to_try:
        try:
            text = _fetch_text(url)
            root = ET.fromstring(text)
            channel = root.find("channel")
            if channel is None:
                continue
            alerts = []
            for i, item in enumerate(channel.findall("item")):
                title = (item.findtext("title") or "").strip()
                link = (item.findtext("link") or "").strip()
                pub_date = (item.findtext("pubDate") or "").strip()
                alert_level = item.findtext("gdacs:alertlevel", namespaces=GDACS_NS) or ""
                event_type = item.findtext("gdacs:eventtype", namespaces=GDACS_NS) or ""
                description = (item.findtext("description") or "").strip()
                combined = f"{title} {description}".lower()
                if url == GDACS_GLOBAL_URL and "vanuatu" not in combined and "vut" not in combined:
                    continue
                try:
                    from email.utils import parsedate_to_datetime
                    issued = parsedate_to_datetime(pub_date).astimezone(timezone.utc).isoformat()
                except Exception:
                    issued = datetime.now(timezone.utc).isoformat()
                alerts.append(
                    {
                        "id": f"gdacs-{i}-{hash(title) & 0xFFFF:04x}",
                        "source": "GDACS",
                        "title": title,
                        "summary": description[:200] if description else "",
                        "issued_at": issued,
                        "type": _gdacs_type(event_type),
                        "severity": _gdacs_severity(alert_level),
                        "url": link,
                        "magnitude": None,
                    }
                )
            return alerts[:10], "ok"
        except Exception as exc:
            log.warning("GDACS fetch failed (%s): %s", url, exc)
            continue
    return [], "unavailable"
