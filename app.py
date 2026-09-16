from __future__ import annotations

import io

import numpy as np
import plotly.graph_objects as go
import streamlit as st

from zygo_ipd.correction import fit_scanner_like_correction
from zygo_ipd.ipd import compute_ipd
from zygo_ipd.metrics import field_metrics, improvement
from zygo_ipd.parser import load_zygo_xyz

st.set_page_config(page_title="ZYGO IPD Analyzer", layout="wide")
st.title("ZYGO → IPD Analyzer")
st.caption("Wafer shape Z(x,y) → slope-based IPD → low-order correction residual")

uploaded = st.file_uploader("ZYGO .xyz 파일", type=["xyz"])
if uploaded is None:
    st.info(".xyz 파일을 업로드하세요. 저장소의 examples/synthetic_plane.xyz로 먼저 시험할 수 있습니다.")
    st.stop()

try:
    data = load_zygo_xyz(io.BytesIO(uploaded.getvalue()))
except Exception as exc:
    st.error(f"파일 파싱 실패: {exc}")
    st.stop()

with st.sidebar:
    st.header("IPD 파라미터")
    dx = st.number_input("dx (grid spacing)", min_value=1e-12, value=1.0, format="%.6g")
    dy = st.number_input("dy (grid spacing)", min_value=1e-12, value=1.0, format="%.6g")
    cx = st.number_input("C_x", value=1.0, format="%.6g")
    cy = st.number_input("C_y", value=1.0, format="%.6g")
    sigma = st.number_input("Gaussian smoothing σ (pixel)", min_value=0.0, value=0.0, step=0.25)
    order = st.slider("Scanner-like correction polynomial order", 0, 5, 2)

ipd = compute_ipd(data.z, dx=dx, dy=dy, coeff_x=cx, coeff_y=cy, smoothing_sigma=sigma)
corr = fit_scanner_like_correction(ipd.ipd_x, ipd.ipd_y, order=order)
before = field_metrics(ipd.ipd_x, ipd.ipd_y)
after = field_metrics(corr.residual_x, corr.residual_y)
gain = improvement(before, after)

m1, m2, m3, m4 = st.columns(4)
m1.metric("Valid points", f"{int(np.isfinite(data.z).sum()):,}")
m2.metric("IPD RMS", f"{before['rms_vector']:.6g}")
m3.metric("Residual RMS", f"{after['rms_vector']:.6g}")
m4.metric("RMS reduction", f"{gain['rms_vector_reduction_pct']:.2f}%")


def heatmap(arr: np.ndarray, title: str, colorscale: str = "Viridis") -> go.Figure:
    fig = go.Figure(go.Heatmap(z=arr, x=data.x, y=data.y, colorscale=colorscale, colorbar={"title": title}))
    fig.update_layout(title=title, xaxis_title="X index", yaxis_title="Y index", height=650)
    fig.update_yaxes(scaleanchor="x", scaleratio=1)
    return fig

surface_tab, ipd_tab, corr_tab, section_tab, header_tab = st.tabs(
    ["Z Surface", "IPD", "Correction residual", "Cross-sections", "Header"]
)

with surface_tab:
    st.plotly_chart(heatmap(data.z, "ZYGO Z surface"), use_container_width=True)

with ipd_tab:
    c1, c2 = st.columns(2)
    with c1:
        st.plotly_chart(heatmap(ipd.ipd_x, "IPD X", "RdBu"), use_container_width=True)
    with c2:
        st.plotly_chart(heatmap(ipd.ipd_y, "IPD Y", "RdBu"), use_container_width=True)
    st.plotly_chart(heatmap(ipd.magnitude, "IPD magnitude"), use_container_width=True)

with corr_tab:
    c1, c2 = st.columns(2)
    with c1:
        st.plotly_chart(heatmap(corr.residual_x, "Residual X", "RdBu"), use_container_width=True)
    with c2:
        st.plotly_chart(heatmap(corr.residual_y, "Residual Y", "RdBu"), use_container_width=True)
    st.plotly_chart(heatmap(corr.residual_magnitude, "Residual magnitude"), use_container_width=True)
    st.dataframe({"metric": list(before.keys()), "before": list(before.values()), "after": list(after.values())})

with section_tab:
    row = st.slider("Y row", 0, data.z.shape[0] - 1, data.z.shape[0] // 2)
    col = st.slider("X column", 0, data.z.shape[1] - 1, data.z.shape[1] // 2)
    fig_row = go.Figure()
    fig_row.add_scatter(x=data.x, y=data.z[row, :], mode="lines", name="Z")
    fig_row.update_layout(title=f"Z cross-section at Y={data.y[row]:g}", xaxis_title="X", yaxis_title="Z")
    st.plotly_chart(fig_row, use_container_width=True)
    fig_col = go.Figure()
    fig_col.add_scatter(x=data.y, y=data.z[:, col], mode="lines", name="Z")
    fig_col.update_layout(title=f"Z cross-section at X={data.x[col]:g}", xaxis_title="Y", yaxis_title="Z")
    st.plotly_chart(fig_col, use_container_width=True)

with header_tab:
    st.code("\n".join(data.header_lines), language="text")

st.warning("단위는 장비 export 설정과 Cx/Cy 보정계수 정의에 따라 달라집니다. 상용 scanner의 실제 보정 모델을 재현하는 도구가 아니라 연구용 저차 보정 가능성 분석입니다.")
