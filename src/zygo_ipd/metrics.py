from __future__ import annotations

import numpy as np


def field_metrics(x: np.ndarray, y: np.ndarray) -> dict[str, float]:
    valid = np.isfinite(x) & np.isfinite(y)
    if not valid.any():
        return {"rms_vector": float("nan"), "max_vector": float("nan"), "p95_vector": float("nan")}
    mag = np.hypot(x[valid], y[valid])
    return {
        "rms_vector": float(np.sqrt(np.mean(mag ** 2))),
        "max_vector": float(np.max(mag)),
        "p95_vector": float(np.percentile(mag, 95)),
    }


def improvement(before: dict[str, float], after: dict[str, float]) -> dict[str, float]:
    out: dict[str, float] = {}
    for key in ("rms_vector", "max_vector", "p95_vector"):
        b, a = before[key], after[key]
        out[f"{key}_reduction_pct"] = float((1 - a / b) * 100) if np.isfinite(b) and b != 0 else float("nan")
    return out
