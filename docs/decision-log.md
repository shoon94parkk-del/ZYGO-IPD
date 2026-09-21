# ZYGO-IPD decision log

Append-only high-risk decisions.

## 2026-09-22 — Durable project memory
Added project memory, guardrails, and explicit local-vs-remote usage rules so future scientific/UI work does not reintroduce the upload/UI regressions already encountered.

## 2026-09-17 — Restore original browser UI for localhost
The redesigned UI was rolled back for local company use. `run_local.bat` now serves the existing `web/` UI directly on `127.0.0.1:8501`. This preserves the familiar UI and browser-local XYZ file selection.

## 2026-09-17 — Local file access is the company path
The company environment allowed local browser file selection while remote/upload flows were restricted. Localhost serving was chosen instead of forcing the remote architecture through company controls.

## 2026-09-16 — Real physical pitch is mandatory
ZYGO `CameraRes` is interpreted as m/pixel and converted to mm/pixel. IPD gradients use that physical pitch. A silent `dx=dy=1` assumption is scientifically unacceptable.

## 2026-09-16 — Units stay uncalibrated until validated
With Cx/Cy=1 the output is a slope proxy (µm/mm). The app must not relabel it as calibrated nm displacement without matched internal calibration data.

## 2026-09-16 — Browser-local privacy
The browser UI was designed so raw XYZ analysis occurs locally, with no telemetry and CSP `connect-src 'none'`. Proprietary measurement files are excluded from the public repository.

## 2026-09-16 — Correction remains vendor-neutral
Polynomial vector-field/Zernike decomposition quantifies low-order correctable content for research. It must not be presented as a verified proprietary scanner correction model.
