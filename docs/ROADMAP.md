# Roadmap

## P0 — 실측 재현성 확보

- 실제 장비 header에서 X/Y pitch, Z scale, unit 자동 인식
- raw map orientation / sign convention 검증
- edge mask 및 `No Data` 주변 미분 안정화
- 기존 사내 IPD 결과와 pixel-by-pixel 비교
- Cx/Cy calibration fitting 및 versioned config

## P1 — 기준 형상 / residual

- reference wafer 또는 nominal surface registration
- tilt / piston / low-order shape removal 옵션
- `Z - Z_ref` 기반 IPD와 raw-Z 기반 IPD 동시 비교
- smoothing sigma / derivative spacing sensitivity sweep

## P2 — Scanner / CPE 연구

- wafer-global correction과 shot-local correction 분리
- shot grid / die layout 입력
- CPE-like low-order terms별 기여도
- before / fitted / residual vector map
- RMS / max / P95 및 correction efficiency 비교

## P3 — Spatial-frequency / process insight

- 2-D PSD 및 radial PSD
- correctable / uncorrectable spatial-frequency band 분리
- wafer edge ring statistics
- bonding 전/후 delta map
- lot / wafer 간 trend dashboard

## P4 — Productization

- parameter preset 저장
- analysis report export
- batch folder processing
- regression test dataset
- calibration provenance / audit trail
