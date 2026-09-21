# ZYGO-IPD

Browser-local ZYGO wafer-shape → IPD analysis for 300 mm wafers.

## Development memory

Before changing code or analysis behavior, read `AGENTS.md`, `docs/project-memory.md`, `docs/regression-guardrails.md`, and `docs/decision-log.md`. The localhost 8501/original browser UI path, physical scaling, unit provenance, and privacy rules are protected regression contracts.

## Web app

The deployable product lives under `web/` and performs all `.xyz` parsing and analysis **inside the browser**. Raw measurement files are never uploaded to an API or application server.

Privacy controls:

- no analytics / telemetry
- no external JavaScript dependencies
- no file upload endpoint
- Content Security Policy includes `connect-src 'none'`
- heavy computation runs in a browser Web Worker
- exports are generated locally with browser `Blob` downloads

## Physical coordinate model

For ZYGO XYZ Data File Format 1:

- connected-phase Z values are interpreted as **microns**
- header line 8 `CameraRes` is interpreted as **meters/pixel**
- `CameraRes × 1000` becomes the physical pitch in **mm/pixel**

Validated sample:

```text
CameraRes = 0.00039535 m/pixel
pitch = 0.39535 mm/pixel = 395.35 µm/pixel
phase grid = 752 × 753
center-to-center span = 296.90785 × 297.30320 mm
valid points = 444,969
```

That span is consistent with a nominal 300 mm wafer once edge No-Data / ROI effects are considered.

The app never silently assumes `1 pixel = 1 distance unit`. If `CameraRes` is missing, it explicitly warns and falls back to a 300 mm wafer/grid estimate until a manual pitch is supplied.

## IPD model

```text
IPD_x = C_x · ∂Z/∂x
IPD_y = C_y · ∂Z/∂y
```

The derivatives use the **real physical pitch**. With `C_x = C_y = 1`, the raw slope unit is µm/mm. Cx/Cy remain explicit calibration factors because the final IPD engineering unit depends on the validated internal calibration definition.

Included analysis:

- local drag/drop `.xyz`
- metadata and 300 mm span validation
- manual pitch override
- NaN-aware Gaussian smoothing
- optional local reference-shape subtraction
- Z / IPD X / IPD Y / magnitude / residual maps
- physical mm coordinate inspection and cross-sections
- low-order 2-D polynomial vector-field fitting
- 0th–5th order polynomial vector-field fitting and residual comparison
- radial / tangential IPD decomposition
- optional sparse wafer vector overlay
- center / mid / edge radial-band metrics
- low-order Zernike wafer-shape signature
- before/after RMS, max and P95 metrics
- local JSON / CSV export

The wafer canvas is always square and represents a nominal 300 × 300 mm
coordinate frame. Rectangular or partial measurement grids are centered inside
that frame without stretching their physical X/Y scale.

The low-order correction is a research approximation for quantifying correctable low-spatial-frequency components. It is **not** a proprietary exposure-tool correction model.

## Run locally

No build system is required for the web app.

```bash
python -m http.server 8000
# open http://localhost:8000/web/
```

Tests:

```bash
node --test tests_js/*.test.mjs
pip install -e .[dev]
pytest -q
```

## Data security

The repository is public. Raw metrology data can reveal process and wafer information, so `.gitignore` excludes production `*.xyz`. Do not commit real measurements.

See `docs/PROJECT_CONTEXT.md`, `docs/ROADMAP.md`, and `AGENTS.md` for handoff details.
