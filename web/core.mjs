export const WAFER_DIAMETER_MM = 300;

export function parseZygoXYZ(text, sourceName = 'measurement.xyz') {
  const lines = text.replace(/\r/g, '').split('\n');
  if (!lines[0]?.trim().startsWith('Zygo XYZ Data File')) throw new Error('ZYGO XYZ Data File header was not found.');
  const marker = lines.findIndex((line) => line.trim() === '#');
  if (marker < 0) throw new Error("ZYGO data marker '#' was not found.");
  if (marker < 13) throw new Error('ZYGO header is incomplete.');

  const phase = lines[3].trim().split(/\s+/).map(Number);
  const phaseOriginX = phase[0], phaseOriginY = phase[1], width = phase[2], height = phase[3];
  if (![phaseOriginX, phaseOriginY, width, height].every(Number.isFinite) || width <= 0 || height <= 0) throw new Error('Invalid phase origin/size in ZYGO header line 4.');

  const optical = lines[7].trim().split(/\s+/);
  const wavelengthM = Number(optical[2]);
  const cameraResM = Number(optical[6]);
  const pitchMmHeader = Number.isFinite(cameraResM) && cameraResM > 0 ? cameraResM * 1000 : null;

  const zUm = new Float64Array(width * height); zUm.fill(Number.NaN);
  let validCount = 0, minZ = Infinity, maxZ = -Infinity;
  for (let i = marker + 1; i < lines.length; i += 1) {
    const line = lines[i].trim(); if (!line || line === '#') continue;
    const parts = line.split(/\s+/); if (parts.length < 3) continue;
    const rawX = Number(parts[0]), rawY = Number(parts[1]); if (!Number.isFinite(rawX) || !Number.isFinite(rawY)) continue;
    const x = rawX - phaseOriginX, y = rawY - phaseOriginY; if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const idx = y * width + x;
    if (parts[2] === 'No' && parts[3] === 'Data') continue;
    const value = Number(parts[2]); if (!Number.isFinite(value)) continue;
    if (!Number.isFinite(zUm[idx])) validCount += 1;
    zUm[idx] = value; minZ = Math.min(minZ, value); maxZ = Math.max(maxZ, value);
  }
  if (validCount === 0) throw new Error('No valid Z values were found.');
  return { sourceName, zUm, width, height, phaseOriginX, phaseOriginY, pitchMmHeader, wavelengthM: Number.isFinite(wavelengthM) ? wavelengthM : null, validCount, minZ, maxZ, headerLines: lines.slice(0, marker + 1) };
}

export function resolvePitch(dataset, manualPitchMm = null, waferDiameterMm = WAFER_DIAMETER_MM) {
  if (Number.isFinite(manualPitchMm) && manualPitchMm > 0) return pitchInfo(manualPitchMm, 'manual', dataset, waferDiameterMm);
  if (Number.isFinite(dataset.pitchMmHeader) && dataset.pitchMmHeader > 0) return pitchInfo(dataset.pitchMmHeader, 'header', dataset, waferDiameterMm);
  const fallback = waferDiameterMm / Math.max(dataset.width - 1, dataset.height - 1);
  return pitchInfo(fallback, 'wafer-fallback', dataset, waferDiameterMm);
}

function pitchInfo(pitchMm, source, dataset, waferDiameterMm) {
  const spanX = (dataset.width - 1) * pitchMm, spanY = (dataset.height - 1) * pitchMm, maxSpan = Math.max(spanX, spanY);
  const spanErrorPct = Math.abs(maxSpan - waferDiameterMm) / waferDiameterMm * 100;
  let status = 'ok', warning = '';
  if (source === 'wafer-fallback') { status = 'warning'; warning = 'CameraRes가 없어 300 mm wafer와 grid 크기로 pitch를 추정했습니다. 장비 설정값으로 확인하세요.'; }
  else if (spanErrorPct > 8) { status = 'danger'; warning = `Header pitch로 계산한 grid span이 300 mm와 ${spanErrorPct.toFixed(1)}% 차이납니다. 배율/ROI/CameraRes를 확인하세요.`; }
  else if (spanErrorPct > 3) { status = 'warning'; warning = `Header pitch 기준 grid span이 300 mm와 ${spanErrorPct.toFixed(1)}% 차이납니다. edge No Data/ROI 영향을 확인하세요.`; }
  return { pitchMm, source, spanX, spanY, maxSpan, spanErrorPct, status, warning };
}

export function subtractReference(zUm, referenceUm) {
  if (!referenceUm) return zUm.slice();
  if (referenceUm.length !== zUm.length) throw new Error('Reference shape size does not match measurement.');
  const out = new Float64Array(zUm.length);
  for (let i = 0; i < zUm.length; i += 1) out[i] = Number.isFinite(zUm[i]) && Number.isFinite(referenceUm[i]) ? zUm[i] - referenceUm[i] : Number.NaN;
  return out;
}

function gaussianKernel1D(sigma) {
  if (!(sigma > 0)) return new Float64Array([1]);
  const radius = Math.max(1, Math.ceil(3 * sigma)), kernel = new Float64Array(radius * 2 + 1); let sum = 0;
  for (let i = -radius; i <= radius; i += 1) { const v = Math.exp(-(i * i) / (2 * sigma * sigma)); kernel[i + radius] = v; sum += v; }
  for (let i = 0; i < kernel.length; i += 1) kernel[i] /= sum;
  return kernel;
}

export function nanGaussian(z, width, height, sigma) {
  if (!(sigma > 0)) return z.slice();
  const kernel = gaussianKernel1D(sigma), radius = (kernel.length - 1) >> 1;
  const temp = new Float64Array(z.length); temp.fill(Number.NaN);
  const out = new Float64Array(z.length); out.fill(Number.NaN);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const idx = y * width + x; if (!Number.isFinite(z[idx])) continue; let sum = 0, weight = 0;
    for (let k = -radius; k <= radius; k += 1) { const xx = x + k; if (xx < 0 || xx >= width) continue; const v = z[y * width + xx]; if (!Number.isFinite(v)) continue; const w = kernel[k + radius]; sum += v * w; weight += w; }
    if (weight > 0) temp[idx] = sum / weight;
  }
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const idx = y * width + x; if (!Number.isFinite(temp[idx])) continue; let sum = 0, weight = 0;
    for (let k = -radius; k <= radius; k += 1) { const yy = y + k; if (yy < 0 || yy >= height) continue; const v = temp[yy * width + x]; if (!Number.isFinite(v)) continue; const w = kernel[k + radius]; sum += v * w; weight += w; }
    if (weight > 0) out[idx] = sum / weight;
  }
  return out;
}

export function physicalGradient(z, width, height, pitchMm) {
  const dx = new Float64Array(z.length), dy = new Float64Array(z.length); dx.fill(Number.NaN); dy.fill(Number.NaN);
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const idx = y * width + x; if (!Number.isFinite(z[idx])) continue;
    const l = x > 0 ? z[idx - 1] : Number.NaN, r = x + 1 < width ? z[idx + 1] : Number.NaN;
    if (Number.isFinite(l) && Number.isFinite(r)) dx[idx] = (r - l) / (2 * pitchMm); else if (Number.isFinite(r)) dx[idx] = (r - z[idx]) / pitchMm; else if (Number.isFinite(l)) dx[idx] = (z[idx] - l) / pitchMm;
    const u = y > 0 ? z[idx - width] : Number.NaN, d = y + 1 < height ? z[idx + width] : Number.NaN;
    if (Number.isFinite(u) && Number.isFinite(d)) dy[idx] = (d - u) / (2 * pitchMm); else if (Number.isFinite(d)) dy[idx] = (d - z[idx]) / pitchMm; else if (Number.isFinite(u)) dy[idx] = (z[idx] - u) / pitchMm;
  }
  return { dx, dy };
}

export function computeIPD(zUm, width, height, pitchMm, coeffX = 1, coeffY = 1, sigmaPx = 0) {
  const zUsed = nanGaussian(zUm, width, height, sigmaPx), grad = physicalGradient(zUsed, width, height, pitchMm);
  const ipdX = new Float64Array(zUm.length), ipdY = new Float64Array(zUm.length), magnitude = new Float64Array(zUm.length); ipdX.fill(Number.NaN); ipdY.fill(Number.NaN); magnitude.fill(Number.NaN);
  for (let i = 0; i < zUm.length; i += 1) { if (!Number.isFinite(grad.dx[i]) || !Number.isFinite(grad.dy[i])) continue; const x = coeffX * grad.dx[i], y = coeffY * grad.dy[i]; ipdX[i] = x; ipdY[i] = y; magnitude[i] = Math.hypot(x, y); }
  return { zUsed, dzDx: grad.dx, dzDy: grad.dy, ipdX, ipdY, magnitude };
}

export function decomposeRadialTangential(ipdX, ipdY, width, height) {
  const radial = new Float64Array(ipdX.length), tangential = new Float64Array(ipdX.length);
  radial.fill(Number.NaN); tangential.fill(Number.NaN);
  const cx = (width - 1) / 2, cy = (height - 1) / 2;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const i = y * width + x;
    if (!Number.isFinite(ipdX[i]) || !Number.isFinite(ipdY[i])) continue;
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy);
    if (r < 1e-12) { radial[i] = 0; tangential[i] = 0; continue; }
    const ux = dx / r, uy = dy / r;
    radial[i] = ipdX[i] * ux + ipdY[i] * uy;
    tangential[i] = -ipdX[i] * uy + ipdY[i] * ux;
  }
  return { radial, tangential };
}

export function radialBandMetrics(ipdX, ipdY, width, height, pitchMm, waferRadiusMm = 150, bands = [[0, .6], [.6, .85], [.85, 1]]) {
  const sums = bands.map(() => ({ count: 0, sumSq: 0, max: 0 })), cx = (width - 1) / 2, cy = (height - 1) / 2;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const i = y * width + x;
    if (!Number.isFinite(ipdX[i]) || !Number.isFinite(ipdY[i])) continue;
    const rn = Math.hypot((x - cx) * pitchMm, (y - cy) * pitchMm) / waferRadiusMm;
    const bi = bands.findIndex(([lo, hi], index) => rn >= lo && (rn < hi || (index === bands.length - 1 && rn <= hi)));
    if (bi < 0) continue;
    const m = Math.hypot(ipdX[i], ipdY[i]), s = sums[bi]; s.count += 1; s.sumSq += m * m; s.max = Math.max(s.max, m);
  }
  return sums.map((s, i) => ({ label: i === 0 ? 'Center' : i === sums.length - 1 ? 'Edge' : 'Mid', fromRadius: bands[i][0], toRadius: bands[i][1], count: s.count, rms: s.count ? Math.sqrt(s.sumSq / s.count) : Number.NaN, max: s.count ? s.max : Number.NaN }));
}

const ZERNIKE_MODES = [
  ['Piston', () => 1],
  ['Tilt X', (x) => x], ['Tilt Y', (_x, y) => y],
  ['Defocus', (x, y) => 2 * (x*x + y*y) - 1],
  ['Astig 0°', (x, y) => x*x - y*y], ['Astig 45°', (x, y) => 2*x*y],
  ['Coma X', (x, y) => x * (3*(x*x + y*y) - 2)], ['Coma Y', (x, y) => y * (3*(x*x + y*y) - 2)],
  ['Trefoil X', (x, y) => x * (x*x - 3*y*y)], ['Trefoil Y', (x, y) => y * (3*x*x - y*y)],
  ['Spherical', (x, y) => 6*(x*x + y*y)**2 - 6*(x*x + y*y) + 1],
  ['Quadrafoil 0°', (x, y) => x**4 - 6*x*x*y*y + y**4], ['Quadrafoil 45°', (x, y) => 4*x*y*(x*x-y*y)]
];

export function decomposeZernike(z, width, height, pitchMm, waferRadiusMm = 150, maxSamples = 60000) {
  const n = ZERNIKE_MODES.length, ata = Array.from({ length: n }, () => new Float64Array(n)), atb = new Float64Array(n);
  const cx = (width - 1) / 2, cy = (height - 1) / 2;
  let valid = 0; for (const v of z) if (Number.isFinite(v)) valid += 1;
  const stride = Math.max(1, Math.floor(valid / maxSamples)); let seen = 0, used = 0;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const i = y * width + x, v = z[i]; if (!Number.isFinite(v) || (seen++ % stride) !== 0) continue;
    const xn = (x - cx) * pitchMm / waferRadiusMm, yn = (y - cy) * pitchMm / waferRadiusMm;
    if (xn*xn + yn*yn > 1.03) continue;
    const b = ZERNIKE_MODES.map(([, fn]) => fn(xn, yn));
    for (let r = 0; r < n; r += 1) { atb[r] += b[r] * v; for (let c = 0; c < n; c += 1) ata[r][c] += b[r] * b[c]; }
    used += 1;
  }
  for (let i = 0; i < n; i += 1) ata[i][i] += 1e-10;
  const coeff = solveLinear(ata, atb), modes = ZERNIKE_MODES.map(([name], i) => ({ name, coefficientUm: coeff[i] }));
  let sumSq = 0, count = 0;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
    const i = y * width + x, v = z[i]; if (!Number.isFinite(v)) continue;
    const xn = (x - cx) * pitchMm / waferRadiusMm, yn = (y - cy) * pitchMm / waferRadiusMm; if (xn*xn + yn*yn > 1.03) continue;
    let fit = 0; for (let k = 0; k < n; k += 1) fit += coeff[k] * ZERNIKE_MODES[k][1](xn, yn);
    sumSq += (v - fit) ** 2; count += 1;
  }
  return { modes, usedSamples: used, residualRmsUm: count ? Math.sqrt(sumSq / count) : Number.NaN };
}

function basis(x, y, order) { const out = []; for (let degree = 0; degree <= order; degree += 1) for (let px = 0; px <= degree; px += 1) { const py = degree - px; out.push((x ** px) * (y ** py)); } return out; }
function solveLinear(matrix, vector) {
  const n = vector.length, a = Array.from({ length: n }, (_, r) => Float64Array.from([...matrix[r], vector[r]]));
  for (let col = 0; col < n; col += 1) { let pivot = col; for (let r = col + 1; r < n; r += 1) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r; if (Math.abs(a[pivot][col]) < 1e-12) throw new Error('Correction fit is singular for this dataset.'); [a[col], a[pivot]] = [a[pivot], a[col]]; const div = a[col][col]; for (let c = col; c <= n; c += 1) a[col][c] /= div; for (let r = 0; r < n; r += 1) { if (r === col) continue; const factor = a[r][col]; if (factor === 0) continue; for (let c = col; c <= n; c += 1) a[r][c] -= factor * a[col][c]; } }
  return Float64Array.from(a.map((row) => row[n]));
}

export function fitLowOrderCorrection(ipdX, ipdY, width, height, order = 2, maxSamples = 50000) {
  if (order < 0 || order > 5) throw new Error('Correction order must be between 0 and 5.');
  const termCount = (order + 1) * (order + 2) / 2, ata = Array.from({ length: termCount }, () => new Float64Array(termCount)), atbx = new Float64Array(termCount), atby = new Float64Array(termCount);
  let validTotal = 0; for (let i = 0; i < ipdX.length; i += 1) if (Number.isFinite(ipdX[i]) && Number.isFinite(ipdY[i])) validTotal += 1;
  if (validTotal < termCount) throw new Error('Not enough valid IPD points for correction fit.');
  const stride = Math.max(1, Math.floor(validTotal / maxSamples)); let seen = 0, used = 0;
  for (let y = 0; y < height; y += 1) { const yn = height > 1 ? (2 * y / (height - 1) - 1) : 0; for (let x = 0; x < width; x += 1) { const idx = y * width + x; if (!Number.isFinite(ipdX[idx]) || !Number.isFinite(ipdY[idx])) continue; if ((seen++ % stride) !== 0) continue; const xn = width > 1 ? (2 * x / (width - 1) - 1) : 0, b = basis(xn, yn, order); for (let i = 0; i < termCount; i += 1) { atbx[i] += b[i] * ipdX[idx]; atby[i] += b[i] * ipdY[idx]; for (let j = 0; j < termCount; j += 1) ata[i][j] += b[i] * b[j]; } used += 1; } }
  const coeffX = solveLinear(ata, atbx), coeffY = solveLinear(ata, atby);
  const fittedX = new Float64Array(ipdX.length), fittedY = new Float64Array(ipdY.length), residualX = new Float64Array(ipdX.length), residualY = new Float64Array(ipdY.length), residualMagnitude = new Float64Array(ipdY.length); fittedX.fill(Number.NaN); fittedY.fill(Number.NaN); residualX.fill(Number.NaN); residualY.fill(Number.NaN); residualMagnitude.fill(Number.NaN);
  for (let y = 0; y < height; y += 1) { const yn = height > 1 ? (2 * y / (height - 1) - 1) : 0; for (let x = 0; x < width; x += 1) { const idx = y * width + x; if (!Number.isFinite(ipdX[idx]) || !Number.isFinite(ipdY[idx])) continue; const xn = width > 1 ? (2 * x / (width - 1) - 1) : 0, b = basis(xn, yn, order); let fx = 0, fy = 0; for (let i = 0; i < termCount; i += 1) { fx += b[i] * coeffX[i]; fy += b[i] * coeffY[i]; } fittedX[idx] = fx; fittedY[idx] = fy; const rx = ipdX[idx] - fx, ry = ipdY[idx] - fy; residualX[idx] = rx; residualY[idx] = ry; residualMagnitude[idx] = Math.hypot(rx, ry); } }
  return { fittedX, fittedY, residualX, residualY, residualMagnitude, coeffX, coeffY, usedSamples: used };
}

export function fieldMetrics(x, y) { let sumSq = 0, max = 0; const mags = []; for (let i = 0; i < x.length; i += 1) { if (!Number.isFinite(x[i]) || !Number.isFinite(y[i])) continue; const m = Math.hypot(x[i], y[i]); sumSq += m * m; if (m > max) max = m; mags.push(m); } if (!mags.length) return { rms: Number.NaN, max: Number.NaN, p95: Number.NaN, count: 0 }; mags.sort((a, b) => a - b); return { rms: Math.sqrt(sumSq / mags.length), max, p95: mags[Math.min(mags.length - 1, Math.floor(0.95 * (mags.length - 1)))], count: mags.length }; }
export function finiteRange(values, lowQ = 0.02, highQ = 0.98) { const a = []; for (const v of values) if (Number.isFinite(v)) a.push(v); if (!a.length) return { min: 0, max: 1 }; a.sort((x, y) => x - y); const lo = a[Math.floor((a.length - 1) * lowQ)], hi = a[Math.floor((a.length - 1) * highQ)]; return lo === hi ? { min: lo - 1, max: hi + 1 } : { min: lo, max: hi }; }
