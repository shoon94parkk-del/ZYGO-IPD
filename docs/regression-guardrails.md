# ZYGO-IPD regression guardrails

Last updated: 2026-09-22

## Local UI / company usage
- `run_local.bat` serves the existing `web/` browser UI on `127.0.0.1:8501`.
- Do not replace the approved local launcher with Streamlit.
- Preserve `.xyz` and reference-file inputs in the original browser UI.
- Real company metrology files stay local; remote upload is not the approved real-data path.
- UI changes must not silently redesign the user's established analysis workspace.

## Physical scaling
- ZYGO connected-phase values remain microns.
- `CameraRes` remains meters/pixel and is converted to mm/pixel.
- Physical derivatives never silently use pixel index spacing of 1.
- Missing pitch is surfaced with warning/manual/fallback provenance.
- 300 mm is nominal geometry, not permission to distort valid measured scale.

## IPD/scientific integrity
- Preserve `IPD_x = C_x*dZ/dx`, `IPD_y = C_y*dZ/dy`.
- Do not label uncalibrated slope output as nm IPD.
- Cx/Cy calibration provenance must remain explicit.
- Research polynomial/Zernike decomposition is not a vendor scanner model.
- Parser, derivative, masking, calibration, correction fitting, coordinate orientation, and units need regression tests when changed.

## Privacy
- Do not commit real `*.xyz`.
- Browser-local analysis keeps `connect-src 'none'` unless explicitly approved.
- Do not add analytics/telemetry/server logging of measurement content.
- Exports stay local by default.

## UX/geometry
- Equal mm scale is preserved.
- Rectangular/partial grids are centered without X/Y stretching.
- +Y-down grid convention and labels stay internally consistent.
- Large data processing should stay off the main UI thread where applicable.
