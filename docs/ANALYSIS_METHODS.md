# Analysis methods

## 1. Gradient IPD proxy

The production baseline remains:

```text
IPD_x = Cx · dZ/dx
IPD_y = Cy · dZ/dy
```

Derivatives use the physical pitch derived from ZYGO `CameraRes`. With
`Cx = Cy = 1`, the displayed quantity is a slope proxy in µm/mm, not a
calibrated overlay value in nm.

## 2. Radial and tangential decomposition

At each valid location the IPD vector is projected onto the radial unit vector
and its orthogonal tangential vector. This makes expansion/contraction and
rotation-like signatures easier to distinguish.

## 3. Polynomial vector correction

Independent 2-D polynomial fields are fitted to IPD X and Y in normalized wafer
coordinates. Orders 0 through 5 are available. The fitted field is a generic
correctability study; it is not a scanner-vendor correction implementation.

## 4. Radius-band metrics

RMS and maximum vector magnitude are summarized over center (0–60%), mid
(60–85%), and edge (85–100%) radius bands of a 300 mm wafer.

## 5. Zernike shape signature

The smoothed Z surface is decomposed into low-order real-valued shape modes:
piston, X/Y tilt, defocus, two astigmatisms, two comas, two trefoils, spherical,
and two quadrafoils. These coefficients are intended for shape classification
and root-cause exploration.

## Scientific boundary

Published work supports a useful relationship between wafer-shape change,
corrected local slope, and process-induced overlay for some geometries.
However, recent analytical work also shows that a conventional gradient model
can be insufficient for non-axisymmetric stress fields. Consequently, all
gradient, polynomial, and Zernike outputs in this project are explicitly
labelled as research diagnostics until calibrated against internal overlay
metrology.

References:

- Brunner et al., “Characterization of wafer geometry and overlay error on
  silicon wafers with nonuniform stress,” J. Micro/Nanolith. MEMS MOEMS 12(4),
  043002 (2013), DOI 10.1117/1.JMM.12.4.043002.
- Turner et al., “Monitoring process-induced overlay errors through
  high-resolution wafer geometry measurements,” Proc. SPIE 9050, 905013
  (2014), DOI 10.1117/12.2046340.
- Jiang, Yang, and Zhu, “A wafer-shape based model for predicting in-plane
  distortion,” European Journal of Mechanics - A/Solids 114, 105757 (2025),
  DOI 10.1016/j.euromechsol.2025.105757.
- “Application of overlay modeling and control with Zernike polynomials in an
  HVM environment,” Proc. SPIE 9778, 977825 (2016),
  DOI 10.1117/12.2219739.
