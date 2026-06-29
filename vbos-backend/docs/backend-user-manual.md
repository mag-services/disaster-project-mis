# DRMIS Backend User Manual

This manual is for backend users who manage the DRMIS system, upload and validate datasets, perform backups/restores, and administer the Django backend.

## Who should use this manual

- Data managers and dataset administrators
- NDMO system operators and IT staff
- Staff responsible for data uploads, dataset publication, and backend maintenance
- Users with access to the Django admin interface (`/admin/`)

## How to use this manual

- Follow the sections in order for a safe backend workflow.
- Use the commands under **Helpful commands** when you need CLI access.
- Verify data after upload by opening the frontend Live Map or Datasets pages.

## Quick start

This is a simple workflow for uploading new datasets into DRMIS:

1. Log in to the backend admin at `https://drmis.vu/admin/`.
2. Use the existing **Clusters** already created.
3. Create the matching **Vector Dataset** and **Tabular Dataset** entries.
4. Upload the vector data via **Vector Items → Import File**.
5. Upload the tabular data via **Tabular Items → Import File**.
6. Confirm the uploaded datasets in the frontend Live Map and Datasets pages.

> Use this page as your first reference. If a step is unclear, return here and follow the full section for that task.

---

## 1. Accessing the backend admin

### Log in

1. Open the DRMIS backend admin at `https://drmis.vu/admin/`.
2. Enter your staff or superuser credentials.
3. Click **Log in**.

### Permissions

- Only staff users can access the admin interface.
- Some sections are available only to superusers or users with elevated roles.
- If you see `You don’t have permission`, contact your administrator.

### Admin home and dashboard

The admin home screen is organised into logical groups such as:

- **Dashboard / operator pipeline status**
- **Disaster / Data / Climate / RAP Pipeline / Maintenance**
- **Backup & Restore**

The backend dashboard shows key operational indicators:

- pending RAP import batches
- backup recency and status
- audit activity and recent log entries

---

## 2. Preparing data before upload

### Create clusters first

A `Cluster` is a dataset grouping used across DRMIS.

1. In the admin, click **Clusters**.
2. Click **Add Cluster**.
3. Enter a meaningful name.
4. Save.

To edit or delete a cluster, open it from the cluster list and use the action menu.

### Create dataset entries

Create one dataset entry before uploading data for it.

- **Raster datasets**: add metadata and file references.
- **Vector datasets**: add metadata, set popup properties, and choose a cluster.
- **Tabular datasets**: add metadata and select the appropriate cluster.

Important dataset fields may include publication status, year, cluster, descriptive title, and tags.

### Use `Data` vs `Climate`

- Use the **Data** submenu when your dataset is part of the main DRMIS dataset registry:
  - `Clusters`
  - `Vector Datasets` / `Vector Items`
  - `Raster Datasets`
  - `Tabular Datasets` / `Tabular Items`
- Use the **Climate** submenu only when the dataset is explicitly a climate dataset managed by the climate module:
  - `Climate Raster Datasets`
  - `Climate Vector Datasets`
  - `Climate Vector Items`
  - `Climate Dashboard`

If the data is intended for the climate module or is labelled as climate data, use the `Climate` menu. Otherwise, use the `Data` menu.

If you are unsure, choose `Data` for normal uploads, especially for tabular and vector data that are not clearly climate-specific.

---

## 3. Uploading tabular data (CSV)

### Where to upload

1. In the admin, click **Tabular Items**.
2. Click **Import File**.

### Upload workflow

- Drag and drop one or more CSV files.
- The system will auto-match each file to a dataset by filename where possible.
- Select the correct dataset for each file if the match is not correct.
- Choose the CSV format:
  - **Long format**: Year, Attribute, Value per row.
  - **Wide format**: Region per row, metrics as columns.
- If the CSV has no `Year` column, supply the year manually.
- Click **Import Files**.

### Recommended CSV columns for long format

- `Year`
- `Month` (optional)
- `Province` (optional)
- `Area Council` (optional)
- `Attribute`
- `Value`

The import accepts column names in lowercase, UPPERCASE, or CamelCase. Extra columns are preserved.

### What to expect

- A progress modal shows upload percentage and bytes.
- If upload fails, review the error message and correct the CSV.

---

## 4. Uploading vector data (GeoJSON)

### Where to upload

1. In the admin, click **Vector Items**.
2. Click **Import File**.

For climate datasets, use the climate section instead:
- **Climate > Vector Items**
- or the climate import URL `/admin/climate/import-geojson/`

### Upload workflow

- Drag and drop GeoJSON or JSON files.
- The system will auto-match each file to a vector dataset by filename where possible.
- Select the correct vector dataset for each file.
- Optionally choose an icon and marker color.
- Click **Import Files**.

### GeoJSON data format

Your GeoJSON may include properties such as:

- `name` (optional)
- `ref` (optional)
- `province` (optional)
- `area_council` (optional)
- `attribute` (optional)

If you are not sure how to create GeoJSON, convert the source data using QGIS, ArcGIS, or another GIS tool.

---

## 5. RAP import workflow

### Upload RAP CSVs

1. In the admin, click **Upload RAP CSVs** or visit `/admin/rap-import/upload/`.
2. Upload your CSV files.
3. The system validates the files and creates RAP import batches.

### Track RAP status

- Pending batches appear in the admin dashboard.
- Completed batches can be compared and reviewed.
- Use the RAP pipeline admin views to see batch status and validation issues.

---

## 6. Backup and restore

### Backup

1. In the admin, click **Backup & Restore** or visit `/admin/maintenance/`.
2. Select one or more backup categories.
3. Set a filename and compression level.
4. Create the backup and download the ZIP file.

### Restore

1. In the same screen, upload a backup file (`.zip` or `.json`).
2. Choose from these options:
   - **Dry run**: preview what will be restored without saving.
   - **Overwrite**: replace existing data.
   - **Merge**: keep existing data and add new items.
3. Submit the restore.

### Best practice

- Always perform a dry run first if you are unsure.
- Keep backup files in a safe, secure location.
- Review the backup history table on the maintenance page.

---

## 7. Audit logs and change history

### Changelog

- The admin registers Django action logs in the admin changelog view.
- Use this to review who changed what and when.

### Use cases

- Compliance checks
- Handover and documentation
- Troubleshooting dataset history

---

## 8. User and account management

### Creating and updating users

- Manage accounts in **Users**.
- Assign staff status and roles as required.
- Update user details and permissions from the user change form.

### CLI commands

From `vbos-backend`:

```bash
docker compose run --rm web ./manage.py createsuperuser
docker compose run --rm web ./manage.py changepassword <username>
```

If you need to create an account outside the admin UI, use `createsuperuser`.

---

## 9. Helpful backend commands

Run these commands from the `vbos-backend` directory.

```bash
# Start the backend and services in development
docker compose up

# Create a superuser for the admin
docker compose run --rm web ./manage.py createsuperuser

# Change a user password
docker compose run --rm web ./manage.py changepassword <username>

# Clear admin / frontend cache after dataset changes
docker compose run --rm web ./manage.py clear_cache
```

### Environment setup

- Copy `.env.example` to `.env` and fill in required values.
- Ensure `DJANGO_SECRET_KEY` and database settings are configured.
- Never commit secrets to version control.

---

## 10. Verify your changes

After data upload or dataset updates:

- Open the frontend Live Map and confirm datasets appear.
- Use filters and dataset metadata search.
- Check exports and audit logs if applicable.

---

## 11. Additional references

- `vbos-backend/docs/data.md` — detailed data import instructions
- `vbos-backend/docs/index.md` — backend project documentation index
- `docs/README-user-manual.md` — frontend user manual build instructions
- `README.md` — overall project overview
- `CHANGELOG.md` — backend and admin feature notes
