from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np

from .correction import fit_scanner_like_correction
from .ipd import compute_ipd
from .metrics import field_metrics
from .parser import load_zygo_xyz


def main() -> None:
    p = argparse.ArgumentParser(description="Convert ZYGO XYZ wafer shape to IPD")
    p.add_argument("input", type=Path)
    p.add_argument("--out", type=Path, default=Path("outputs/ipd_result.npz"))
    p.add_argument("--dx", type=float, default=1.0)
    p.add_argument("--dy", type=float, default=1.0)
    p.add_argument("--cx", type=float, default=1.0)
    p.add_argument("--cy", type=float, default=1.0)
    p.add_argument("--sigma", type=float, default=0.0)
    p.add_argument("--correction-order", type=int, default=2)
    args = p.parse_args()

    data = load_zygo_xyz(args.input)
    ipd = compute_ipd(data.z, dx=args.dx, dy=args.dy, coeff_x=args.cx, coeff_y=args.cy, smoothing_sigma=args.sigma)
    corr = fit_scanner_like_correction(ipd.ipd_x, ipd.ipd_y, order=args.correction_order)
    before = field_metrics(ipd.ipd_x, ipd.ipd_y)
    after = field_metrics(corr.residual_x, corr.residual_y)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        args.out,
        z=data.z,
        ipd_x=ipd.ipd_x,
        ipd_y=ipd.ipd_y,
        ipd_magnitude=ipd.magnitude,
        fitted_x=corr.fitted_x,
        fitted_y=corr.fitted_y,
        residual_x=corr.residual_x,
        residual_y=corr.residual_y,
        residual_magnitude=corr.residual_magnitude,
        x=data.x,
        y=data.y,
    )
    print(f"Saved: {args.out}")
    print("Before correction:", before)
    print("After correction:", after)


if __name__ == "__main__":
    main()
