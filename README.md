# ZYGO-IPD

ZYGO wafer-shape `.xyz` 데이터를 읽어 **Z(x,y) 형상 → slope 기반 IPD → 보정 가능 성분/잔류 IPD**를 계산하고 시각화하는 연구용 프로젝트입니다.

## 핵심 모델

현재 기본 IPD 모델은 과거 논의에서 정한 다음 관계를 그대로 구현합니다.

```text
IPD_x = C_x · ∂Z/∂x
IPD_y = C_y · ∂Z/∂y
```

기존 방식의 핵심은 흡착 웨이퍼의 Z 형상 기울기를 IPD로 환산하는 것입니다. `reference_z`를 넣으면 기준 형상과의 차이 `Z - Z_ref`에 대해 동일 계산을 수행할 수 있도록 확장했습니다.

## 현재 구현

- ZYGO `XYZ Data File - Format 1` 파싱
- `No Data` → `NaN` 마스킹
- 실제 X/Y 좌표 범위 기반 2-D grid 복원
- Gaussian smoothing 옵션
- `∂Z/∂x`, `∂Z/∂y` 및 `IPD_x`, `IPD_y`, magnitude 계산
- 기준 형상 subtraction API
- 저차 2-D polynomial vector field fit
- 보정 전/후 RMS, 최대값, P95 비교
- Streamlit 기반 Z surface / IPD / residual / cross-section 시각화
- CLI `.npz` export
- synthetic parser / gradient / correction tests

> `fit_scanner_like_correction()`은 특정 노광기 vendor의 proprietary correction을 재현하는 것이 아니라, 저주파 왜곡 중 저차 polynomial field로 표현 가능한 부분을 정량화하는 연구용 모델입니다.

## 실행

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
pip install -e .[dev]
streamlit run app.py
```

CLI:

```bash
zygo-ipd input.xyz --dx 1 --dy 1 --cx 1 --cy 1 --sigma 0.5 --correction-order 2
```

테스트:

```bash
pytest -q
```

## 실측 데이터 보안

이 저장소는 Public입니다. 실측 `.xyz`에는 공정/장비/wafer 형상 정보가 포함될 수 있으므로 기본 `.gitignore`에서 제외합니다. `examples/synthetic_plane.xyz`만 예외적으로 포함합니다.

## 다음 고도화

`docs/ROADMAP.md`를 참고하세요. 핵심은 실제 Cx/Cy calibration, 기준 형상 model, shot/CPE 단위 분해, scanner correction term mapping, spatial-frequency 분석, wafer-edge/valid-mask 안정화입니다.
