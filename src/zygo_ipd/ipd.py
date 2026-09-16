from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.ndimage import gaussian_filter


@dataclass(frozen=True)
class IPDResult:
    z_used: np.ndarray
    dz_dx: np.ndarray
    dz_dy: np.ndarray
    ipd_x: np.ndarray
    ipd_y: np.ndarray
    magnitude: np.ndarray
    valid_mask: np.ndarray


def _nan_gaussian(arr: np.ndarray, sigma: float) -> np.ndarray:
    if sigma <= 0:
        return arr.copy()
    valid = np.isfinite(arr)
    values = np.where(valid, arr, 0.0)
    weights = valid.astype(float)
    smooth_values = gaussian_filter(values, sigma=sigma, mode="nearest")
    smooth_weights = gaussian_filter(weights, sigma=sigma, mode="nearest")
    out = np.divide(
        smooth_values,
        smooth_weights,
        out=np.full_like(arr, np.nan, dtype=float),
        where=smooth_weights > 1e-12,
    )
    out[~valid] = np.nan
    return out


def compute_ipd(
    z: np.ndarray,
    *,
    dx: float = 1.0,
    dy: float = 1.0,
    coeff_x: float = 1.0,
    coeff_y: float = 1.0,
    smoothing_sigma: float = 0.0,
    reference_z: np.ndarray | None = None,
) -> IPDResult:
    """Convert wafer shape Z(x,y) to IPD using the slope model.

    Base equations:
        IPD_x = C_x * dZ/dx
        IPD_y = C_y * dZ/dy

    If ``reference_z`` is supplied, the gradient is evaluated on
    ``z - reference_z`` so reference-shape subtraction can be studied.
    """
    z = np.asarray(z, dtype=float)
    if z.ndim != 2:
        raise ValueError("z must be a 2-D array")
    if dx <= 0 or dy <= 0:
        raise ValueError("dx and dy must be positive")

    working = z.copy()
    valid = np.isfinite(working)
    if reference_z is not None:
        reference_z = np.asarray(reference_z, dtype=float)
        if reference_z.shape != z.shape:
            raise ValueError("reference_z must have the same shape as z")
        ref_valid = np.isfinite(reference_z)
        valid &= ref_valid
        working = np.where(valid, working - reference_z, np.nan)

    smoothed = _nan_gaussian(working, smoothing_sigma)
    fill_value = float(np.nanmedian(smoothed)) if np.isfinite(smoothed).any() else 0.0
    filled = np.where(np.isfinite(smoothed), smoothed, fill_value)
    dz_dy, dz_dx = np.gradient(filled, dy, dx, edge_order=1)

    dz_dx = np.where(valid, dz_dx, np.nan)
    dz_dy = np.where(valid, dz_dy, np.nan)
    ipd_x = coeff_x * dz_dx
    ipd_y = coeff_y * dz_dy
    magnitude = np.hypot(ipd_x, ipd_y)

    return IPDResult(
        z_used=np.where(valid, smoothed, np.nan),
        dz_dx=dz_dx,
        dz_dy=dz_dy,
        ipd_x=ipd_x,
        ipd_y=ipd_y,
        magnitude=magnitude,
        valid_mask=valid,
    )
