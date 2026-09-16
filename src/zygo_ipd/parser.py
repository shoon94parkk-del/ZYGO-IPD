from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import IO

import numpy as np


@dataclass(frozen=True)
class ZygoData:
    z: np.ndarray
    x: np.ndarray
    y: np.ndarray
    header_lines: tuple[str, ...]
    source_name: str = ""
    phase_origin_x: int = 0
    phase_origin_y: int = 0
    camera_res_m_per_pixel: float | None = None
    wavelength_m: float | None = None

    @property
    def valid_mask(self) -> np.ndarray:
        return np.isfinite(self.z)

    @property
    def pitch_mm(self) -> float | None:
        if self.camera_res_m_per_pixel is None or self.camera_res_m_per_pixel <= 0:
            return None
        return self.camera_res_m_per_pixel * 1000.0

    @property
    def span_mm(self) -> tuple[float, float] | None:
        if self.pitch_mm is None:
            return None
        return ((len(self.x) - 1) * self.pitch_mm, (len(self.y) - 1) * self.pitch_mm)


def _read_lines(source: str | Path | IO[bytes] | IO[str]) -> tuple[list[str], str]:
    if hasattr(source, "read"):
        raw = source.read()
        name = getattr(source, "name", "uploaded.xyz")
        if isinstance(raw, bytes):
            text = raw.decode("utf-8", errors="replace")
        else:
            text = raw
        return text.splitlines(), str(name)
    path = Path(source)
    return path.read_text(encoding="utf-8", errors="replace").splitlines(), path.name


def load_zygo_xyz(source: str | Path | IO[bytes] | IO[str]) -> ZygoData:
    """Load ZYGO XYZ Data File Format 1.

    Connected-phase Z values are in microns. CameraRes in header line 8 is
    meters/pixel and is exposed as physical pitch metadata.
    """
    lines, name = _read_lines(source)
    if not lines or not lines[0].startswith("Zygo XYZ Data File"):
        raise ValueError("ZYGO XYZ header was not found")
    try:
        marker = lines.index("#")
    except ValueError as exc:
        raise ValueError("ZYGO data marker '#' was not found") from exc
    if marker < 13:
        raise ValueError("ZYGO header is incomplete")

    phase = lines[3].split()
    if len(phase) < 4:
        raise ValueError("Invalid ZYGO phase geometry")
    origin_x, origin_y, width, height = map(int, phase[:4])

    optical = lines[7].split()
    wavelength_m = float(optical[2]) if len(optical) > 2 else None
    camera_res = float(optical[6]) if len(optical) > 6 else None
    if camera_res is not None and camera_res <= 0:
        camera_res = None

    z = np.full((height, width), np.nan, dtype=float)
    for line in lines[marker + 1 :]:
        parts = line.split()
        if len(parts) < 3:
            continue
        try:
            raw_x = int(float(parts[0]))
            raw_y = int(float(parts[1]))
        except ValueError:
            continue
        x = raw_x - origin_x
        y = raw_y - origin_y
        if not (0 <= x < width and 0 <= y < height):
            continue
        if len(parts) >= 4 and parts[2].lower() == "no" and parts[3].lower() == "data":
            continue
        try:
            z[y, x] = float(parts[2])
        except ValueError:
            pass

    if not np.isfinite(z).any():
        raise ValueError("No valid XYZ samples were found")

    x = np.arange(width, dtype=float) + origin_x
    y = np.arange(height, dtype=float) + origin_y
    return ZygoData(z=z, x=x, y=y, header_lines=tuple(lines[: marker + 1]), source_name=name, phase_origin_x=origin_x, phase_origin_y=origin_y, camera_res_m_per_pixel=camera_res, wavelength_m=wavelength_m)
