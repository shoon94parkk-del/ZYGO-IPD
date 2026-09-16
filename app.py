from __future__ import annotations

import io
import json

import numpy as np
import plotly.graph_objects as go
import streamlit as st

from zygo_ipd.correction import fit_scanner_like_correction
from zygo_ipd.ipd import compute_ipd
from zygo_ipd.metrics import field_metrics, improvement
from zygo_ipd.parser import load_zygo_xyz


st.set_page_config(page_title="ZYGO IPD Lab", layout="wide")
st.markdown(
    """
    <style>
    .stApp { background: #071017; color: #eef4fb; }
    [data-testid="stSidebar"] { background: #0b151d; }
    div[data-testid="stMetric"] { background:#0e1922; border:1px solid #22323f; padding:12px; border-radius:10px; }
    </style>
    """,
    unsafe_allow_html=True,
)

st.title("ZYGO IPD Lab")
st.caption("회사 환경 호환 Streamlit 업로드 · ZYGO XYZ → wafer shape → IPD → low-order correction")

uploaded = st.file_uploader("ZYGO .xyz 파일", type=["xyz"], accept_multiple_files=False)
if uploaded is None:
    st.info(".xyz 파일을 선택하세요. 파일 입력은 Streamlit file_uploader 경로를 사용합니다.")
    st.stop()

try:
    data = load_zygo_xyz(io.BytesIO(uploaded.getvalue()))
except Exception as exc:
    st.error(f"파일 파싱 실패: {exc}")
    st.stop()

fallback_pitch = 300.0 / max(max(data.z.shape) - 1, 1)
auto_pitch = data.pitch_mm or fallback_pitch

with st.sidebar:
    st.header("분석 조건")
    pitch_mode = st.selectbox("물리 pitch", ["CameraRes 자동", "수동 입력"], index=0)
    pitch_mm = auto_pitch
    if pitch_mode == "수동 입력":
        pitch_mm = st.number_input("Pitch (mm/pixel)", min_value=1e-9, value=float(auto_pitch), format="%.8f")
    else:
        st.caption(f"{auto_pitch*1000:.3f} µm/pixel" + (" · CameraRes" if data.pitch_mm else " · 300 mm fallback"))

    coeff_x = st.number_input("Cₓ", value=1.0, format="%.6g")
    coeff_y = st.number_input("Cᵧ", value=1.0, format="%.6g")
    sigma = st.number_input("Gaussian smoothing σ (pixel)", min_value=0.0, value=0.0, step=0.25)
    order = st.slider("Polynomial correction order", 0, 5, 2)
    reference = st.file_uploader("Reference .xyz (선택)", type=["xyz"], accept_multiple_files=False, key="reference")

reference_z = None
if reference is not None:
    try:
        ref_data = load_zygo_xyz(io.BytesIO(reference.getvalue()))
        if ref_data.z.shape != data.z.shape:
            raise ValueError(f"reference grid {ref_data.z.shape} != measurement grid {data.z.shape}")
        reference_z = ref_data.z
    except Exception as exc:
        st.error(f"Reference 파싱 실패: {exc}")
        st.stop()

ipd = compute_ipd(
    data.z,
    dx=float(pitch_mm),
    dy=float(pitch_mm),
    coeff_x=float(coeff_x),
    coeff_y=float(coeff_y),
    smoothing_sigma=float(sigma),
    reference_z=reference_z,
)
corr = fit_scanner_like_correction(ipd.ipd_x, ipd.ipd_y, order=int(order))
before = field_metrics(ipd.ipd_x, ipd.ipd_y)
after = field_metrics(corr.residual_x, corr.residual_y)
gain = improvement(before, after)

valid_count = int(np.isfinite(data.z).sum())
span_x = (data.z.shape[1] - 1) * pitch_mm
span_y = (data.z.shape[0] - 1) * pitch_mm

m1, m2, m3, m4, m5 = st.columns(5)
m1.metric("Valid points", f"{valid_count:,}")
m2.metric("Pitch", f"{pitch_mm*1000:.2f} µm/px")
m3.metric("IPD RMS", f"{before['rms_vector']:.6g}")
m4.metric("Residual RMS", f"{after['rms_vector']:.6g}")
m5.metric("RMS reduction", f"{gain['rms_vector_reduction_pct']:.2f}%")
st.caption(f"Grid {data.z.shape[1]} × {data.z.shape[0]} · span {span_x:.2f} × {span_y:.2f} mm · source {uploaded.name}")


def heatmap(arr: np.ndarray, title: str, colorscale: str = "Viridis", signed: bool = False) -> go.Figure:
    ny, nx = arr.shape
    x = (np.arange(nx) - (nx - 1) / 2) * pitch_mm
    y = (np.arange(ny) - (ny - 1) / 2) * pitch_mm
    kwargs = {}
    if signed:
        finite = np.abs(arr[np.isfinite(arr)])
        vmax = float(np.percentile(finite, 99)) if finite.size else 1.0
        kwargs.update(zmin=-vmax, zmax=vmax, zmid=0)
    fig = go.Figure(go.Heatmap(z=arr, x=x, y=y, colorscale=colorscale, colorbar={"title": title}, **kwargs))
    fig.update_layout(title=title, xaxis_title="X (mm)", yaxis_title="Y (mm)", height=650, margin=dict(l=40, r=30, t=60, b=40))
    fig.update_yaxes(scaleanchor="x", scaleratio=1)
    return fig


ny, nx = data.z.shape
yy, xx = np.mgrid[0:ny, 0:nx]
xmm = (xx - (nx - 1) / 2) * pitch_mm
ymm = (yy - (ny - 1) / 2) * pitch_mm
radius = np.hypot(xmm, ymm)
with np.errstate(divide="ignore", invalid="ignore"):
    ux = np.divide(xmm, radius, out=np.zeros_like(xmm, dtype=float), where=radius > 0)
    uy = np.divide(ymm, radius, out=np.zeros_like(ymm, dtype=float), where=radius > 0)
radial = ipd.ipd_x * ux + ipd.ipd_y * uy
tangential = -ipd.ipd_x * uy + ipd.ipd_y * ux

surface_tab, ipd_tab, corr_tab, diag_tab, section_tab, header_tab = st.tabs(
    ["Z Surface", "IPD", "Correction residual", "Diagnostics", "Cross-sections", "Header"]
)

with surface_tab:
    st.plotly_chart(heatmap(ipd.z_used, "Z surface / Z-reference"), use_container_width=True)

with ipd_tab:
    c1, c2 = st.columns(2)
    with c1:
        st.plotly_chart(heatmap(ipd.ipd_x, "IPD X", "RdBu", signed=True), use_container_width=True)
    with c2:
        st.plotly_chart(heatmap(ipd.ipd_y, "IPD Y", "RdBu", signed=True), use_container_width=True)
    st.plotly_chart(heatmap(ipd.magnitude, "IPD magnitude"), use_container_width=True)

with corr_tab:
    c1, c2 = st.columns(2)
    with c1:
        st.plotly_chart(heatmap(corr.residual_x, "Residual X", "RdBu", signed=True), use_container_width=True)
    with c2:
        st.plotly_chart(heatmap(corr.residual_y, "Residual Y", "RdBu", signed=True), use_container_width=True)
    st.plotly_chart(heatmap(corr.residual_magnitude, "Residual magnitude"), use_container_width=True)
    st.dataframe({"metric": list(before.keys()), "before": list(before.values()), "after": list(after.values())}, use_container_width=True)

with diag_tab:
    c1, c2 = st.columns(2)
    with c1:
        st.plotly_chart(heatmap(radial, "Radial IPD", "RdBu", signed=True), use_container_width=True)
    with c2:
        st.plotly_chart(heatmap(tangential, "Tangential IPD", "RdBu", signed=True), use_container_width=True)

    wafer_r = max(float(np.nanmax(radius)), 1e-12)
    rn = radius / wafer_r
    rows = []
    for name, lo, hi in [("Center", 0.0, 0.60), ("Mid", 0.60, 0.85), ("Edge", 0.85, 1.01)]:
        mask = (rn >= lo) & (rn < hi) & np.isfinite(ipd.magnitude)
        vals = ipd.magnitude[mask]
        rows.append({
            "band": name,
            "count": int(vals.size),
            "RMS": float(np.sqrt(np.mean(vals**2))) if vals.size else float("nan"),
            "P95": float(np.percentile(vals, 95)) if vals.size else float("nan"),
            "Max": float(np.max(vals)) if vals.size else float("nan"),
        })
    st.dataframe(rows, use_container_width=True)

with section_tab:
    row = st.slider("Y row", 0, data.z.shape[0] - 1, data.z.shape[0] // 2)
    col = st.slider("X column", 0, data.z.shape[1] - 1, data.z.shape[1] // 2)
    x_axis = (np.arange(nx) - (nx - 1) / 2) * pitch_mm
    y_axis = (np.arange(ny) - (ny - 1) / 2) * pitch_mm
    fig_row = go.Figure()
    fig_row.add_scatter(x=x_axis, y=ipd.z_used[row, :], mode="lines", name="Z")
    fig_row.update_layout(title=f"Z cross-section at Y={y_axis[row]:.3f} mm", xaxis_title="X (mm)", yaxis_title="Z")
    st.plotly_chart(fig_row, use_container_width=True)
    fig_col = go.Figure()
    fig_col.add_scatter(x=y_axis, y=ipd.z_used[:, col], mode="lines", name="Z")
    fig_col.update_layout(title=f"Z cross-section at X={x_axis[col]:.3f} mm", xaxis_title="Y (mm)", yaxis_title="Z")
    st.plotly_chart(fig_col, use_container_width=True)

with header_tab:
    st.code("\n".join(data.header_lines), language="text")

summary = {
    "file": uploaded.name,
    "grid": [int(nx), int(ny)],
    "valid_points": valid_count,
    "pitch_mm_per_pixel": float(pitch_mm),
    "span_mm": [float(span_x), float(span_y)],
    "correction_order": int(order),
    "before": before,
    "after": after,
    "improvement": gain,
}
st.download_button(
    "요약 JSON 다운로드",
    data=json.dumps(summary, ensure_ascii=False, indent=2),
    file_name=f"{uploaded.name.rsplit('.', 1)[0]}_summary.json",
    mime="application/json",
)

st.warning("현재 배포판은 회사 환경의 .XYZ 파일 선택 호환성을 위해 Streamlit uploader를 사용합니다. 기존 browser-local 정적 UI 소스는 web/에 그대로 보존됩니다.")
