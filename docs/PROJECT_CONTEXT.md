# Project context / handoff

## Objective

1. Measure a chucked 300 mm wafer with ZYGO and obtain `Z=f(x,y)`.
2. Parse the ZYGO physical pixel resolution (`CameraRes`) and convert the grid to real mm coordinates.
3. Estimate IPD from local wafer-shape slope.
4. Separate low-order scanner-like correctable content from residual IPD.
5. Quantify before/after RMS, P95, max and spatial maps.
6. Extend later to hybrid bonding before/after delta, shot/CPE decomposition and scanner compensation studies.

## Confirmed ZYGO XYZ Format 1 interpretation

Header line 4: `PhaseOriginX PhaseOriginY PhaseWidth PhaseHeight`.

Header line 8 includes: `Source IntfScaleFactor WavelengthIn NumericAperture ObliquityFactor Magnification CameraRes TimeStamp`.

`CameraRes` is meters/pixel. Connected phase XYZ values are microns.

Validated sample:

```text
PhaseOrigin = (220, 179)
Phase grid = 752 × 753
CameraRes = 0.00039535 m/pixel
Physical pitch = 0.39535 mm/pixel
Grid center-to-center span = 296.90785 × 297.30320 mm
Valid points = 444,969
```

This is consistent with a nominal 300 mm wafer while leaving room for edge No-Data / ROI effects.

## Baseline IPD model

`IPD_x = C_x * dZ/dx`, `IPD_y = C_y * dZ/dy`.

The derivative denominator is the real pitch in mm. With C=1, the raw slope is µm/mm. Cx/Cy remain explicit calibration factors.

## Browser-only architecture

The deployed product is a static browser app. Raw XYZ is read by `File.text()` and sent only to a local Web Worker. A Content Security Policy disables browser network connections during analysis (`connect-src 'none'`). There is no application backend and no analytics.

The old Streamlit upload UI is not part of the production architecture because server-side upload would violate the local-only data requirement.

## Current analysis surfaces

- drag/drop local XYZ
- metadata and pitch/span validation
- manual pitch override
- Cx/Cy
- NaN-aware Gaussian smoothing
- optional local reference file
- Z / IPD X / IPD Y / magnitude / residual maps
- click-to-inspect physical coordinates and cross-sections
- low-order polynomial correction (0–3)
- before/after RMS, P95, max
- local JSON/CSV export

## Next scientific work

- validate Cx/Cy against existing internal IPD results
- improve wafer-edge derivative treatment and configurable edge exclusion
- implement wafer-global vs shot-local/CPE decomposition
- add vector-arrow maps and shot grid overlays
- add PSD / radial PSD and correctable spatial-frequency bands
- register bonding pre/post datasets and generate delta maps
- map verified scanner correction terms only when vendor/engineering definitions are available
