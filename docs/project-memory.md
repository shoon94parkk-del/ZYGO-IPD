# ZYGO-IPD project memory

Last updated: 2026-09-22

## Purpose
ZYGO-IPD turns ZYGO XYZ wafer-shape data into IPD-oriented diagnostics for nominal 300 mm wafers while preserving physical scaling, scientific caveats, and local handling of sensitive metrology data.

## Approved real-data path
For real/company XYZ files, use `run_local.bat`.

- It serves the existing `web/` UI unchanged on `http://127.0.0.1:8501`.
- It uses Python's local `http.server`, not Streamlit.
- The browser UI reads `.xyz` through local file inputs.
- The CSP keeps analysis network-isolated with `connect-src 'none'`.
- Raw files and exports remain local.

This path was restored after a redesigned/remote flow caused company upload restrictions and unwanted UI changes. Future changes must preserve the original browser UI unless explicitly requested.

## Streamlit/Render status
A Streamlit entrypoint and Render configuration still exist for compatibility/demo testing. Do **not** treat the remote Streamlit uploader as the approved path for proprietary company metrology data. Real sensitive files should stay on the localhost browser-local path.

## Physical data model
For ZYGO XYZ Format 1:
- connected phase Z values are microns
- `CameraRes` is meters/pixel
- physical pitch = `CameraRes * 1000` mm/pixel
- derivative denominators must use physical pitch, never silently `dx=dy=1`

Baseline:
- `IPD_x = C_x * dZ/dx`
- `IPD_y = C_y * dZ/dy`

With C=1, slope is µm/mm. Final engineering/nm interpretation requires validated calibration; do not invent units from Cx/Cy.

## Wafer geometry
- Nominal target wafer is 300 mm.
- Display a physical span sanity check.
- Do not stretch a valid rectangular/partial grid to exactly 300 mm.
- Preserve equal physical X/Y scale and center valid partial grids in the nominal frame.
- Missing `CameraRes` must produce a surfaced warning/fallback/manual override, not a silent unit assumption.

## Analysis already implemented
- local XYZ + optional reference file
- metadata/pitch/span validation
- NaN-aware smoothing
- Cx/Cy and manual pitch
- Z / IPD X / IPD Y / magnitude / radial / tangential / residual maps
- vector inspection and cross-sections
- 0th–5th order polynomial vector-field fit/residual
- radial-band metrics
- low-order Zernike shape signature
- robust statistics (median/MAD/IQR/P90/P95/P99/RMS/min/max/PV/outliers)
- optional measured overlay CSV with translation, ppm magnification/shear, µrad rotation and affine residuals
- local JSON/CSV export

## Scientific boundaries
- Polynomial/scanner-like correction is a vendor-neutral research approximation.
- Do not claim it reproduces proprietary scanner/CPE behavior.
- Do not infer calibrated nm displacement until Cx/Cy/model are verified against matched internal overlay/metrology.
- Front/back registration, wafer flipping, bonding mechanics, thermal/material behavior and uncertainty remain separate validation work.

## Security
- Raw real `*.xyz` files are proprietary and must not be committed.
- No analytics/telemetry for browser-local analysis.
- No new server upload/API logging path for real metrology without explicit owner approval.
- Keep local exports local.

## Verification
- `pytest -q`
- `node --test tests_js/*.test.mjs`
- `tests/test_local_launcher.py` protects the localhost 8501/original-browser-UI path
- parser/scaling/calibration changes require dedicated scientific regression tests
