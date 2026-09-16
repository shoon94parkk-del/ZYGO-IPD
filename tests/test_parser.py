from pathlib import Path

import numpy as np

from zygo_ipd.parser import load_zygo_xyz


def test_parse_synthetic():
    path = Path("examples/synthetic_plane.xyz")
    data = load_zygo_xyz(path)
    assert data.z.shape == (5, 6)
    assert np.isfinite(data.z).sum() == 28
    assert np.isnan(data.z[0, 0])


def test_camera_resolution_is_exposed_as_mm_pitch(tmp_path):
    p = tmp_path / "pitch.xyz"
    p.write_text("\n".join([
        "Zygo XYZ Data File - Format 1", '0 9 2 0 ""', "0 0 0 0 0 0", "10 20 2 2", '""', '""', '""',
        "0 0.5 6.328e-07 0.5 1 0 0.00039535 1", '1200 1200 0 0 1 0 ""', "0 0 1 36 0 1 0 0 0 0",
        "1 1 100 0 0 0 0 0 0", '0 ""', "1 0.01", "#", "10 20 1.0", "11 20 2.0", "10 21 3.0", "11 21 4.0",
    ]), encoding="utf-8")
    data = load_zygo_xyz(p)
    assert np.isclose(data.pitch_mm, 0.39535)
    assert data.phase_origin_x == 10
    assert data.phase_origin_y == 20
    assert np.allclose(data.span_mm, (0.39535, 0.39535))
