"""
Sync tabular data from external systems into Disaster MIS.
Run via: ./manage.py sync_external_data [--source ID]
Schedule via cron: 0 */6 * * * docker-compose exec web ./manage.py sync_external_data
"""
import base64
import json
import urllib.request
from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.dateparse import parse_date

from vbos.datasets.models import TabularDataset, TabularItem, Province, AreaCouncil

from vbos.integrations.models import ExternalDataSource


class Command(BaseCommand):
    help = "Fetch data from external APIs and sync into tabular datasets."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            type=int,
            help="Sync only this ExternalDataSource ID. Omit to sync all active sources.",
        )

    def handle(self, *args, **options):
        source_id = options.get("source")
        qs = ExternalDataSource.objects.filter(is_active=True)
        if source_id:
            qs = qs.filter(pk=source_id)
        sources = list(qs.select_related("target_dataset"))
        if not sources:
            self.stdout.write("No active external data sources to sync.")
            return
        for src in sources:
            self._sync_source(src)

    def _sync_source(self, src: ExternalDataSource):
        self.stdout.write(f"Syncing {src.name} from {src.url}...")
        try:
            req = self._build_request(src)
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode())
            if not isinstance(data, list):
                if isinstance(data, dict) and "data" in data:
                    data = data["data"]
                elif isinstance(data, dict) and "results" in data:
                    data = data["results"]
                else:
                    data = [data] if isinstance(data, dict) else []
            mapping = src.field_mapping or {}
            default_map = {
                "province": ["province", "Province", "Pname"],
                "area_council": ["area_council", "Area Council", "acname"],
                "attribute": ["attribute", "Attribute", "Metric", "indicator"],
                "date": ["date", "Date", "year", "Year"],
                "value": ["value", "Value", "VALUE"],
            }
            provinces = {p.name.lower(): p for p in Province.objects.all()}
            ac_by_province = {}
            for ac in AreaCouncil.objects.select_related("province"):
                key = (ac.province.name.lower(), ac.name.lower())
                ac_by_province[key] = ac
            created = 0
            updated = 0
            errors = []
            for idx, row in enumerate(data):
                if not isinstance(row, dict):
                    errors.append(f"Row {idx}: not an object")
                    continue
                item = self._map_row(row, mapping, default_map)
                if not item:
                    errors.append(f"Row {idx}: missing required fields")
                    continue
                province = provinces.get((item.get("province") or "").strip().lower()) if item.get("province") else None
                if not province:
                    errors.append(f"Row {idx}: province '{item.get('province')}' not found")
                    continue
                ac_name = (item.get("area_council") or "").strip()
                ac_key = (province.name.lower(), ac_name.lower())
                area_council = ac_by_province.get(ac_key)
                if not area_council:
                    errors.append(f"Row {idx}: area_council '{ac_name}' not in {province.name}")
                    continue
                date_val = parse_date(str(item.get("date", ""))) if item.get("date") else None
                if not date_val:
                    try:
                        y = int(item.get("year") or item.get("date") or 0)
                        if y:
                            date_val = datetime(y, 1, 1).date()
                    except (TypeError, ValueError):
                        pass
                if not date_val:
                    errors.append(f"Row {idx}: invalid date")
                    continue
                try:
                    value_float = float(item.get("value", 0))
                except (TypeError, ValueError):
                    errors.append(f"Row {idx}: invalid value")
                    continue
                attribute = (item.get("attribute") or "unknown").strip()
                metadata = {"external_source": src.name, "synced_at": timezone.now().isoformat()}
                existing = TabularItem.objects.filter(
                    dataset=src.target_dataset,
                    province=province,
                    area_council=area_council,
                    attribute=attribute,
                    date=date_val,
                ).first()
                if existing:
                    existing.value = value_float
                    existing.metadata = {**existing.metadata, **metadata}
                    existing.save()
                    updated += 1
                else:
                    TabularItem.objects.create(
                        dataset=src.target_dataset,
                        province=province,
                        area_council=area_council,
                        attribute=attribute,
                        date=date_val,
                        value=value_float,
                        metadata=metadata,
                    )
                    created += 1
            src.last_sync = timezone.now()
            src.last_sync_status = "success"
            src.last_sync_error = ""
            if errors:
                src.last_sync_error = "; ".join(errors[:5]) + ("..." if len(errors) > 5 else "")
            src.save()
            self.stdout.write(self.style.SUCCESS(f"  {src.name}: created={created}, updated={updated}, errors={len(errors)}"))
        except Exception as e:
            src.last_sync = timezone.now()
            src.last_sync_status = "error"
            src.last_sync_error = str(e)
            src.save()
            self.stdout.write(self.style.ERROR(f"  {src.name}: {e}"))

    def _map_row(self, row, mapping, default_map):
        out = {}
        for our_key, ext_keys in default_map.items():
            val = None
            if our_key in mapping:
                val = row.get(mapping[our_key])
            if val is None:
                for k in ext_keys:
                    if k in row:
                        val = row[k]
                        break
            if val is not None:
                out[our_key] = val
        # Also copy "year" to out for date fallback
        if "year" in row and "date" not in out:
            out["year"] = row["year"]
        has_date = out.get("date") or out.get("year")
        return out if all([out.get("province"), out.get("area_council"), out.get("attribute"), out.get("value") is not None, has_date]) else None

    def _build_request(self, src: ExternalDataSource):
        req = urllib.request.Request(src.url, method="GET")
        req.add_header("Accept", "application/json")
        cfg = src.auth_config or {}
        if src.auth_type == ExternalDataSource.AUTH_BEARER:
            token = cfg.get("token", "")
            req.add_header("Authorization", f"Bearer {token}")
        elif src.auth_type == ExternalDataSource.AUTH_APIKEY:
            key = cfg.get("api_key", "")
            req.add_header("X-API-Key", key)
        elif src.auth_type == ExternalDataSource.AUTH_BASIC:
            user = cfg.get("username", "")
            pw = cfg.get("password", "")
            creds = base64.b64encode(f"{user}:{pw}".encode()).decode()
            req.add_header("Authorization", f"Basic {creds}")
        return req
