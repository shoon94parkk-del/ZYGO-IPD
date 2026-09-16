# Work status — 2026-09-16

## Request
Vector values and units; adjustable color limits; robust statistics; contextual
help; Cx/Cy and pitch explanations; hybrid bonding analysis coverage.

## Baseline
876c7b8 is deployed. Raw XYZ remains browser-local; no real metrology data is committed.

## Completed implementation
- Point/vector X/Y/magnitude inspection, arrowheads, density and numeric labels.
- Explicit uncalibrated slope units; no automatic nm relabeling.
- Manual/robust/full color ranges and legend thickness control.
- Median, MAD, IQR, P90/P95/P99, mean/std, RMS, min/max/PV and outlier counts.
- Contextual keyboard-accessible help and Cx/Cy/pitch guidance.
- Measured overlay CSV: nm translation, ppm magnification/shear, µrad rotation,
  affine residual statistics and local JSON export.
- Corrected Y-axis labels to match +Y-down grid convention.
- Reference origin/pitch compatibility and numeric parameter validation.
- Summary JSON includes statistics and unit/coordinate provenance.

## Verification and deployment
- Synthetic XYZ browser test: manual 0–15 color range, vector values,
  square canvas 760×760, help text, and no console errors.
- Synthetic measured overlay recovered X/Y translation 12/-8 nm,
  magnification 2/4 ppm, rotation 3 µrad, zero affine residual.
- All 13 regression tests passed; coverage includes statistics, physical scaling,
  affine recovery and worker export payloads.
- Browser download-event detection timed out; worker export payloads are tested.
- Release `16955c6` pushed to main and manually deployed on Render.
- Render deployment `dep-dal682m7bikc73ehekkg`: Deploy succeeded | Live,
  2026-09-16 18:40 KST, duration 16.7 seconds.
- Production index.html, app.mjs, core.mjs, worker.mjs, statistics.mjs,
  analysis-ui.mjs and analysis-ui.css match the tested local release.
- Site: https://zygo-ipd-lab.onrender.com

## Requires real metrology / not yet validated
- Calibration of shape slope to measured displacement in nm.
- Front/back coordinate registration, wafer flipping and rotation.
- Bonding mechanics, chuck/contact/friction, thermal and material models.
- Die/shot layout and vendor correction limits.
- Process sign-off using repeatability, uncertainty, void and electrical yield.

## Remaining product work
- Calibrated nm model and stored calibration provenance (requires matched real data).
- Overlay spatial map, die/shot aggregation, uncertainty and repeatability study.
- Automatic front/back registration and physically validated bonding prediction.
- Production-sized real-data performance and full mobile interaction verification.

Research: https://www.imec-int.com/en/articles/path-high-density-front-and-backside-wafer-connectivity
and EVG's 2025 EVG40 D2W metrology release.
