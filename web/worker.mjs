import { parseZygoXYZ, resolvePitch, subtractReference, computeIPD, decomposeRadialTangential, radialBandMetrics, decomposeZernike, fitLowOrderCorrection, fieldMetrics, finiteRange } from './core.mjs';
import { statistics, analyzeOverlayCsv } from './statistics.mjs';

let dataset = null, reference = null, latest = null;
self.onmessage = async (event) => {
  const { type, payload } = event.data || {};
  try {
    if (type === 'overlay-csv') { self.postMessage({type:'overlay-result',payload:analyzeOverlayCsv(payload.text)}); return; }
    if (type === 'load') { dataset = parseZygoXYZ(payload.text, payload.name); reference = null; latest = null; self.postMessage({ type: 'loaded', payload: metadata(dataset) }); return; }
    if (type === 'load-reference') { if (!dataset) throw new Error('Load a measurement before loading a reference.'); reference = parseZygoXYZ(payload.text, payload.name); if (reference.width !== dataset.width || reference.height !== dataset.height) { reference = null; throw new Error('Reference grid dimensions do not match the measurement.'); } self.postMessage({ type: 'reference-loaded', payload: metadata(reference) }); return; }
    if (type === 'clear-reference') { reference = null; latest = null; self.postMessage({ type: 'reference-cleared' }); return; }
    if (type === 'analyze') {
      if (!dataset) throw new Error('Load a ZYGO XYZ file first.');
      const settings = payload;
      if(!Number.isFinite(settings.coeffX)||!Number.isFinite(settings.coeffY)||!Number.isFinite(settings.sigmaPx)||settings.sigmaPx<0||settings.sigmaPx>4) throw new Error('Cx/Cy와 smoothing 값을 확인하세요.');
      if(settings.manualPitchMm!==null&&!(Number.isFinite(settings.manualPitchMm)&&settings.manualPitchMm>0)) throw new Error('Pitch는 0보다 큰 유한한 숫자여야 합니다.');
      const pitch = resolvePitch(dataset, settings.manualPitchMm, 300);
      if(reference && (reference.phaseOriginX!==dataset.phaseOriginX || reference.phaseOriginY!==dataset.phaseOriginY || Math.abs(resolvePitch(reference,settings.manualPitchMm,300).pitchMm-pitch.pitchMm)>pitch.pitchMm*1e-6)) throw new Error('기준 파일의 origin/pitch가 다릅니다. 동일 좌표계로 정합한 파일이 필요합니다.');
      const z = subtractReference(dataset.zUm, reference?.zUm || null);
      const ipd = computeIPD(z, dataset.width, dataset.height, pitch.pitchMm, settings.coeffX, settings.coeffY, settings.sigmaPx);
      const polar = decomposeRadialTangential(ipd.ipdX, ipd.ipdY, dataset.width, dataset.height);
      const corr = fitLowOrderCorrection(ipd.ipdX, ipd.ipdY, dataset.width, dataset.height, settings.correctionOrder);
      const before = fieldMetrics(ipd.ipdX, ipd.ipdY), after = fieldMetrics(corr.residualX, corr.residualY);
      const bands = radialBandMetrics(ipd.ipdX, ipd.ipdY, dataset.width, dataset.height, pitch.pitchMm);
      const zernike = decomposeZernike(ipd.zUsed, dataset.width, dataset.height, pitch.pitchMm);
      latest = { z, ipd, polar, corr, pitch, before, after, bands, zernike, settings };
      const result = { meta: metadata(dataset), referenceName: reference?.sourceName || null, pitch, before, after, reductionPct: Number.isFinite(before.rms) && before.rms !== 0 ? (1 - after.rms / before.rms) * 100 : Number.NaN, fitSamples: corr.usedSamples,
        bands, zernike,
        arrays: { z: toF32(z), ipdX: toF32(ipd.ipdX), ipdY: toF32(ipd.ipdY), magnitude: toF32(ipd.magnitude), radial: toF32(polar.radial), tangential: toF32(polar.tangential), residualX: toF32(corr.residualX), residualY: toF32(corr.residualY), residualMagnitude: toF32(corr.residualMagnitude) },
        ranges: { z: finiteRange(z), ipdX: signedRange(ipd.ipdX), ipdY: signedRange(ipd.ipdY), magnitude: finiteRange(ipd.magnitude, 0, 0.98), radial: signedRange(polar.radial), tangential: signedRange(polar.tangential), residualX: signedRange(corr.residualX), residualY: signedRange(corr.residualY), residualMagnitude: finiteRange(corr.residualMagnitude, 0, 0.98) } };
      result.stats = {};
      const fullPrecision = {z,ipdX:ipd.ipdX,ipdY:ipd.ipdY,magnitude:ipd.magnitude,radial:polar.radial,tangential:polar.tangential,residualMagnitude:corr.residualMagnitude};
      for(const [key,values] of Object.entries(fullPrecision)) result.stats[key]=statistics(values);
      latest.stats=result.stats;
      result.settings={...settings};
      self.postMessage({ type: 'analysis', payload: result }, Object.values(result.arrays).map((a) => a.buffer)); return;
    }
    if (type === 'export-summary') { if (!latest || !dataset) throw new Error('Run analysis first.'); self.postMessage({ type: 'summary', payload: {...buildSummary(),statistics:latest.stats,ipdUnit:'Uncalibrated weighted slope; not nm',coordinateConvention:'Grid-centered; +X right, +Y down; tangential positive clockwise on screen'} }); return; }
    if (type === 'export-csv') { if (!latest || !dataset) throw new Error('Run analysis first.'); self.postMessage({ type: 'csv', payload: { name: `${baseName(dataset.sourceName)}_ipd.csv`, csv: buildCsv() } }); return; }
  } catch (error) { self.postMessage({ type: 'error', operation:type, payload: { message: error?.message || String(error) } }); }
};

function metadata(d) { const pitch = resolvePitch(d, null, 300); return { sourceName: d.sourceName, width: d.width, height: d.height, validCount: d.validCount, phaseOriginX: d.phaseOriginX, phaseOriginY: d.phaseOriginY, pitchMmHeader: d.pitchMmHeader, wavelengthNm: d.wavelengthM ? d.wavelengthM * 1e9 : null, minZ: d.minZ, maxZ: d.maxZ, defaultPitch: pitch }; }
function signedRange(a) { const r = finiteRange(a), m = Math.max(Math.abs(r.min), Math.abs(r.max)); return { min: -m, max: m }; }
function toF32(a) { const out = new Float32Array(a.length); for (let i = 0; i < a.length; i += 1) out[i] = a[i]; return out; }
function baseName(name) { return String(name || 'measurement').replace(/\.xyz$/i, '').replace(/[^a-zA-Z0-9._-]+/g, '_'); }
function buildSummary() { return { file: dataset.sourceName, reference: reference?.sourceName || null, grid: { width: dataset.width, height: dataset.height, validPoints: dataset.validCount }, zUnit: 'micron', pitchMm: latest.pitch.pitchMm, pitchSource: latest.pitch.source, spanMm: { x: latest.pitch.spanX, y: latest.pitch.spanY }, settings: latest.settings, metricsBefore: latest.before, metricsAfter: latest.after, radialBands: latest.bands, zernike: latest.zernike, rmsReductionPct: (1 - latest.after.rms / latest.before.rms) * 100, generatedAt: new Date().toISOString(), modelNotice: 'Gradient/polynomial/Zernike outputs are research diagnostics, not a verified scanner-vendor correction model.', privacy: 'Computed locally in browser; source XYZ was not uploaded.' }; }
function buildCsv() { const { width, height } = dataset, p = latest.pitch.pitchMm, z = latest.z, { ipdX, ipdY } = latest.ipd, { radial, tangential } = latest.polar, { residualX, residualY } = latest.corr, rows = ['x_mm,y_mm,z_um,ipd_x,ipd_y,ipd_radial,ipd_tangential,residual_x,residual_y'], cx = (width - 1) / 2, cy = (height - 1) / 2; for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) { const i = y * width + x; if (!Number.isFinite(z[i])) continue; rows.push([((x - cx) * p).toFixed(6), ((y - cy) * p).toFixed(6), z[i], ipdX[i], ipdY[i], radial[i], tangential[i], residualX[i], residualY[i]].join(',')); } return rows.join('\n'); }
