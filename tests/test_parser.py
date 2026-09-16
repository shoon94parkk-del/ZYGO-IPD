from pathlib import Path

import numpy as np

from zygo_ipd.parser import load_zygo_xyz


def test_parse_synthetic():
    path = Path("examples/synthetic_plane.xyz")
    data = load_zygo_xyz(path)
    assert data.z.shape == (5, 6)
    assert np.isfinite(data.z).sum() == 28
    assert np.isnan(data.z[0, 0])
