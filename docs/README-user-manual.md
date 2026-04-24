# DRMIS User Manual

End-user documentation for the **Disaster Risk Management Information System (DRMIS)** frontend.

## Files

| File | Purpose |
|------|---------|
| **`user-manual.qmd`** | **Source** — single Quarto file; **Inter** (Google Fonts) + placeholder styles are declared in the YAML `include-in-header` (no separate CSS file). |
| **`user-manual.html`** | **Built output** — `embed-resources: true` inlines theme CSS/JS into one HTML file. Regenerate after edits. |
| **`screenshots/`** | PNG/JPEG figures referenced by the manual (ship alongside `user-manual.html` or re-render after adding images). |
| **`screenshots/README.md`** | **Inventory** of required and optional screenshot filenames + capture tips. |

## Build the manual

### Prerequisites

- [Quarto](https://quarto.org/docs/get-started/) **v1.4+** recommended.

```bash
# macOS (Homebrew)
brew install quarto

# Ubuntu/Debian — see https://quarto.org/docs/download/
```

### Render to HTML

From the **repository root**:

```bash
quarto render docs/user-manual.qmd
```

Output: **`docs/user-manual.html`** (single file you can email or host).

From `docs/`:

```bash
cd docs && quarto render user-manual.qmd
```

### Publishing

- **Static host:** upload `user-manual.html` or rename to `index.html` inside a folder and serve it from any static web host.
- **User menu link:** the app may point to an external URL; keep the hosted copy in sync when you ship new features.

## Screenshots

### Existing captures

These files are already wired into `user-manual.qmd`:

| File | Topic |
|------|--------|
| `01-login_.png` | Login |
| `02-dashboard_.png` | Command Centre dashboard |
| `03-left-sidebar_.png` | Live Map — layers |
| `04-right-sidebar_.png` | Live Map — context panel |
| `05-expanded-full width-right-sidebar_.png` | Expanded right panel *(filename contains spaces — consider renaming to `05-expanded-right-sidebar.png` and updating the qmd)* |
| `06-download-dialog_.png` | Download dialog |

### Placeholder slots

The manual includes **dashed placeholder regions** for additional figures. Each lists the **exact path** to create under `docs/screenshots/`. After you add an image, you can either:

1. Leave the placeholder as-is (the HTML still describes what belongs there), or  
2. Replace the corresponding `{=html} … screenshot-slot …` block in `user-manual.qmd` with a normal figure:

```markdown
![Short description](screenshots/13-datasets-page.png){fig-align="center" fig-alt="Accessible description"}
```

Full list and capture guidance: **`screenshots/README.md`**.

## Content overview (manual structure)

The built manual is organised into:

1. **Getting started** — browsers, signing in.  
2. **Application layout** — sidebar, top bar, roles.  
3. **Command Centre** — dashboard, KPIs, incidents.  
4. **Live Map** — layers, filters, compare, simulation, Ask the map, climate, legend.  
5. **Datasets** — metadata browser.  
6. **Exports** — bulk export + quick download from map.  
7. **Audit log** — search and CSV export.  
8. **Settings & account** — profile, security, data entry.  
9. **Reference** — shortcuts, troubleshooting, glossary, quick table.

Section numbers are **automatic** (`number-sections: true` in the YAML header).

## Editing tips

- Use **`##` / `###`** headings — they drive the table of contents (`toc-depth: 4`).  
- Use Quarto **callouts**: `::: {.callout-tip}` … `:::`  
- For a **new major part**, use `# Part title` level-1 headings (unnumbered parts can be marked `{.unnumbered}` if needed).  
- Re-render after any change to **`user-manual.qmd`** (styles live in the document YAML under `include-in-header`).
