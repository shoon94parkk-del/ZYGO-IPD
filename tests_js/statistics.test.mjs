import test from 'node:test';
import assert from 'node:assert/strict';
import {statistics,analyzeOverlayCsv} from '../web/statistics.mjs';
import {computeIPD,decomposeRadialTangential} from '../web/core.mjs';
test('robust distribution stays interpretable with one extreme value',()=>{
  const s=statistics([1,2,3,4,100,NaN]);
  assert.equal(s.count,5);assert.equal(s.median,3);assert.equal(s.mad,1);
  assert.equal(s.iqr,2);assert.equal(s.outliers,1);assert.equal(s.p95,80.79999999999998);
  assert.ok(s.rms>40);assert.equal(statistics([NaN]).count,0);
});
test('Cx and pitch scale physical slopes and preserve sign',()=>{
  const z=Float64Array.from([0,1,2,2,3,4,4,5,6]);
  const a=computeIPD(z,3,3,1,1,1),b=computeIPD(z,3,3,2,-2,1);
  assert.equal(b.ipdX[4],-a.ipdX[4]);assert.equal(b.ipdY[4],a.ipdY[4]/2);
  assert.ok(Number.isNaN(decomposeRadialTangential(a.ipdX,a.ipdY,3,3).radial[4]));
});
test('measured nm overlay recovers affine parameters in mm coordinates',()=>{
  const rows=['x_mm,y_mm,dx_nm,dy_nm'];
  for(const y of [-100,0,100])for(const x of [-100,0,100])
    rows.push([x,y,12+2*x-3*y,-8+3*x+4*y].join(','));
  const r=analyzeOverlayCsv(rows.join('\n'));
  assert.ok(Math.abs(r.translationXNm-12)<1e-9);assert.ok(Math.abs(r.translationYNm+8)<1e-9);
  assert.equal(r.magnificationXPpm,2);assert.equal(r.magnificationYPpm,4);
  assert.equal(r.rotationUrad,3);assert.equal(r.shearPpm,0);assert.ok(r.residual.rms<1e-9);
});
test('overlay rejects wrong units, incomplete rows and degenerate geometry',()=>{
  assert.throws(()=>analyzeOverlayCsv('x,y,dx,dy\n0,0,1,1'));
  assert.throws(()=>analyzeOverlayCsv('x_mm,y_mm,dx_nm,dy_nm\n0,0,,2'));
  assert.throws(()=>analyzeOverlayCsv('x_mm,y_mm,dx_nm,dy_nm\n'+Array.from({length:6},(_,i)=>[i,i,1,1].join(',')).join('\n')));
});
