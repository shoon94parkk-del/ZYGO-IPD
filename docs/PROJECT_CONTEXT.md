# Project context / handoff

## 목적

1. ZYGO 장비로 척에 흡착된 wafer의 형상 `Z=f(x,y)`를 계측한다.
2. 형상의 국부 기울기로부터 IPD를 추정한다.
3. 보정 전 IPD와 scanner-like correctable component를 분리한다.
4. 보정 후 residual을 RMS / max / map으로 정량화한다.
5. 향후 hybrid wafer bonding 후 distortion과 최신 노광기 보정 가능량을 연결한다.

## 과거 논의에서 확정된 기본식

```text
IPD_x = C_x * dZ/dx
IPD_y = C_y * dZ/dy
```

과거 구현 방향은 다음 순서였다.

1. 기존 계산 재현
2. 공통/shot별 CPE 성분 분석
3. 계수, smoothing, 미분간격 민감도 분석
4. 보정 전/후 RMS와 최대 잔류량을 map/UI로 비교

초기 모듈명 아이디어:

- `zygo_loader`
- `ipd_calc`
- `kparam_model`
- `fit_residual`

현재 repository에서는 이를 각각 `parser.py`, `ipd.py`, `correction.py`, `metrics.py` 중심으로 정리했다.

## 중요한 해석 주의사항

- `.xyz`의 X/Y index를 실제 거리로 바꾸는 scale은 장비 export 조건을 확인해야 한다.
- Z 값의 단위 역시 header/export setting 확인이 필요하다.
- Cx/Cy는 실제 IPD 단위로 환산하는 calibration 계수이며 임의로 고정하면 안 된다.
- reference shape subtraction은 API에는 들어가 있지만 실제 reference 정의/registration 절차는 추가 검증이 필요하다.
- 상용 scanner correction의 실제 parameter set과 제약 조건은 별도 장비 specification에 맞춰야 한다.
