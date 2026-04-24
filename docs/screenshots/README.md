# DRMIS user manual — screenshots

Place PNG (or JPEG) screenshots in this folder, then re-render the manual:

```bash
quarto render docs/user-manual.qmd
```

## Recommended capture settings

- **Resolution:** at least **1280×720** for full-page views; **1440×900** or higher is better for readability.
- **Format:** PNG for UI (sharp text); avoid heavy compression.
- **Browser:** Use a clean window (no personal bookmarks bar if possible), **100% zoom**.
- **Theme:** Capture **light mode** unless you maintain a parallel dark-mode set (optional).

## File inventory

### Included in the manual today

| File | Section | What to show |
|------|---------|----------------|
| `01-login_.png` | Signing in | Full login screen with logo and fields. |
| `02-dashboard_.png` | Command Centre | Dashboard with KPIs, tables, and widgets. |
| `03-left-sidebar_.png` | Live Map — layers | Left sidebar with clusters and layer toggles. |
| `04-right-sidebar_.png` | Live Map — context | Right sidebar: province, year, data view, stats. |
| `05-expanded-full width-right-sidebar_.png` | Expanded panel | Right panel full-width over map. *(Consider renaming to `05-expanded-right-sidebar.png` — no spaces.)* |
| `06-download-dialog_.png` | Download | “Download active datasets” dialog open. |

### Placeholder slots (add when ready)

| File | Section | What to show |
|------|---------|----------------|
| `07-shell-overview.png` | Application layout | Full window: top bar + left nav + main area (Dashboard). |
| `08-map-floating-toolbar.png` | Live Map | Top map strip: Simulate, layers, legend. |
| `09-map-query-chat.png` | Ask the map | “Ask the map” panel expanded with example query. |
| `10-header-mode-tabs.png` | Scenarios | Map header: Disaster / Climate / Compare (and other modes if visible). |
| `11-compare-split-map.png` | Compare mode | Split map with two years. |
| `12-simulation-panel.png` | Simulation | Simulation panel open with controls. |
| `13-datasets-page.png` | Datasets | Datasets browser with cluster and list. |
| `14-exports-queue.png` | Exports | Exports page with jobs or format options. |
| `15-audit-log.png` | Audit log | Audit table with filters. |
| `16-settings-profile.png` | Settings | Settings page (e.g. Profile tab). |
| `17-data-entry.png` | Data Entry | Data entry workflow (role-dependent). |
| `18-mobile-or-narrow.png` | Mobile (optional) | Narrow width / bottom sheet if documenting mobile. |

After adding a file, update `user-manual.qmd`: replace the corresponding **screenshot slot** block with a normal figure, for example:

```markdown
![Datasets browser](screenshots/13-datasets-page.png){fig-align="center" fig-alt="Datasets page showing cluster list"}
```
