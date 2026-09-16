import numpy as np

from zygo_ipd.ipd import compute_ipd
from zygo_ipd.correction import fit_scanner_like_correction
from zygo_ipd.metrics import field_metrics


def test_plane_gradient_is_constant():
    y, x = np.mgrid[0:20, 0:30]
    z = 2.0 * x + 3.0 * y + 7.0
    result = compute_ipd(z, dx=1.0, dy=1.0, coeff_x=10.0, coeff_y=20.0)
    assert np.allclose(result.ipd_x, 20.0)
    assert np.allclose(result.ipd_y, 60.0)


def test_polynomial_correction_removes_linear_field():
    y, x = np.mgrid[-1:1:20j, -1:1:30j]
    ipd_x = 1 + 2 * x + 0.5 * y
    ipd_y = -3 + 0.2 * x - 1.5 * y
    corr = fit_scanner_like_correction(ipd_x, ipd_y, order=1)
    metrics = field_metrics(corr.residual_x, corr.residual_y)
    assert metrics["rms_vector"] < 1e-10
