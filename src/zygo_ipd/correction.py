from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class CorrectionResult:
    fitted_x: np.ndarray
    fitted_y: np.ndarray
    residual_x: np.ndarray
    residual_y: np.ndarray
    residual_magnitude: np.ndarray
    coeffs_x: np.ndarray
    coeffs_y: np.ndarray
    order: int


def _poly_terms(x: np.ndarray, y: np.ndarray, order: int) -> np.ndarray:
    cols = []
    for total_degree in range(order + 1):
        for px in range(total_degree + 1):
            py = total_degree - px
            cols.append((x ** px) * (y ** py))
    return np.column_stack(cols)


def fit_scanner_like_correction(
    ipd_x: np.ndarray,
    ipd_y: np.ndarray,
    *,
    order: int = 2,
) -> CorrectionResult:
    """Fit a low-order 2-D vector field and return residual IPD.

    This is a generic scanner-like correction study, not a model of a
    specific exposure-tool vendor's proprietary correction algorithm.
    """
    if order < 0 or order > 5:
        raise ValueError("order must be between 0 and 5")
    if ipd_x.shape != ipd_y.shape or ipd_x.ndim != 2:
        raise ValueError("ipd_x and ipd_y must be same-shape 2-D arrays")

    ny, nx = ipd_x.shape
    yy, xx = np.mgrid[-1:1:complex(ny), -1:1:complex(nx)]
    valid = np.isfinite(ipd_x) & np.isfinite(ipd_y)
    if valid.sum() < 3:
        raise ValueError("Not enough valid IPD samples for correction fit")

    A = _poly_terms(xx[valid], yy[valid], order)
    coeffs_x, *_ = np.linalg.lstsq(A, ipd_x[valid], rcond=None)
    coeffs_y, *_ = np.linalg.lstsq(A, ipd_y[valid], rcond=None)

    A_full = _poly_terms(xx.ravel(), yy.ravel(), order)
    fitted_x = (A_full @ coeffs_x).reshape(ipd_x.shape)
    fitted_y = (A_full @ coeffs_y).reshape(ipd_y.shape)
    fitted_x = np.where(valid, fitted_x, np.nan)
    fitted_y = np.where(valid, fitted_y, np.nan)
    residual_x = np.where(valid, ipd_x - fitted_x, np.nan)
    residual_y = np.where(valid, ipd_y - fitted_y, np.nan)

    return CorrectionResult(
        fitted_x=fitted_x,
        fitted_y=fitted_y,
        residual_x=residual_x,
        residual_y=residual_y,
        residual_magnitude=np.hypot(residual_x, residual_y),
        coeffs_x=coeffs_x,
        coeffs_y=coeffs_y,
        order=order,
    )
