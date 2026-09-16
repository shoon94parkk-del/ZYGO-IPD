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

    @property
    def valid_mask(self) -> np.ndarray:
        return np.isfinite(self.z)


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
    """Load a ZYGO 'XYZ Data File - Format 1' style file.

    Rows after '#' are treated as ``x y z`` samples and ``No Data`` samples
    are converted to NaN. Grid geometry is inferred from actual coordinates.
    """
    lines, name = _read_lines(source)
    try:
        marker = lines.index("#")
    except ValueError as exc:
        raise ValueError("ZYGO data marker '#' was not found") from exc

    rows: list[tuple[int, int, float]] = []
    for line in lines[marker + 1 :]:
        parts = line.split()
        if len(parts) < 3:
            continue
        try:
            xi = int(float(parts[0]))
            yi = int(float(parts[1]))
        except ValueError:
            continue
        if len(parts) >= 4 and parts[2].lower() == "no" and parts[3].lower() == "data":
            zi = np.nan
        else:
            try:
                zi = float(parts[2])
            except ValueError:
                zi = np.nan
        rows.append((xi, yi, zi))

    if not rows:
        raise ValueError("No XYZ samples were found after '#' marker")

    xs = np.array(sorted({r[0] for r in rows}), dtype=float)
    ys = np.array(sorted({r[1] for r in rows}), dtype=float)
    x_index = {int(v): i for i, v in enumerate(xs)}
    y_index = {int(v): i for i, v in enumerate(ys)}
    z = np.full((len(ys), len(xs)), np.nan, dtype=float)

    for xi, yi, zi in rows:
        z[y_index[yi], x_index[xi]] = zi

    return ZygoData(
        z=z,
        x=xs,
        y=ys,
        header_lines=tuple(lines[: marker + 1]),
        source_name=name,
    )
