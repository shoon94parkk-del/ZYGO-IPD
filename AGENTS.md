# AI development notes

## Non-negotiable requirements

- Preserve `IPD_x = C_x*dZ/dx`, `IPD_y = C_y*dZ/dy`.
- Physical derivatives must use real pitch from ZYGO `CameraRes` (m/pixel → mm/pixel) or an explicitly surfaced fallback/manual override. Never silently use dx=dy=1 for real measurements.
- Treat the target wafer as nominally 300 mm and display a span sanity check; do not force a valid measured grid to exactly 300 mm when valid `CameraRes` exists.
- ZYGO XYZ Format 1 measurement values are handled as microns.
- Raw `.xyz` metrology files are potentially proprietary and must not be committed to this public repo.

## Privacy architecture

- Production UX must remain static/browser-local.
- Do not add server-side file upload, cloud parsing, analytics, telemetry, or API logging of measurement data.
- Keep Content Security Policy `connect-src 'none'` unless the product owner explicitly changes the privacy requirement.
- Calculations should run in Web Workers when large datasets could block UI.
- Exports must be generated locally.

## Scientific integrity

- Any scanner correction implementation must distinguish generic research approximation from verified vendor behavior.
- Do not infer final IPD physical units from Cx/Cy without a validated calibration definition.
- Add tests whenever parser conventions, physical scaling, derivative logic, masking, calibration behavior, or correction fitting changes.
