import test from 'node:test';
import assert from 'node:assert/strict';
import { parseZygoXYZ, resolvePitch, physicalGradient, computeIPD, fitLowOrderCorrection, fieldMetrics } from '../web/core.mjs';

function xyz({camera='0.0004',width=4,height=3}={}){const rows=[];for(let y=0;y<height;y++)for(let x=0;x<width;x++)rows.push(`${10+x} ${20+y} ${x+2*y}`);return `Zygo XYZ Data File - Format 1\n0 9 2 0 ""\n0 0 0 0 0 0\n10 20 ${width} ${height}\n""\n""\n""\n0 0.5 6.328e-07 0.5 1 0 ${camera} 1\n1200 1200 0 0 1 0 ""\n0 0 1 36 0 1 0 0 0 0\n1 1 100 0 0 0 0 0 0\n0 ""\n1 0.01\n#\n${rows.join('\n')}\n`;}

test('parses CameraRes as meters/pixel and Z as microns',()=>{const d=parseZygoXYZ(xyz(),'t.xyz');assert.equal(d.pitchMmHeader,0.4);assert.equal(d.width,4);assert.equal(d.height,3);assert.equal(d.zUm[1],1);});
test('300 mm sanity uses physical span',()=>{const d={width:753,height:753,pitchMmHeader:0.00039535*1000};const p=resolvePitch(d);assert.equal(p.source,'header');assert.ok(Math.abs(p.spanX-297.3032)<1e-6);assert.ok(p.spanErrorPct<3);});
test('physical gradient divides by real pitch',()=>{const w=5,h=4,p=0.5,z=new Float64Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)z[y*w+x]=2*(x*p)+3*(y*p);const g=physicalGradient(z,w,h,p);for(let i=0;i<z.length;i++){assert.ok(Math.abs(g.dx[i]-2)<1e-12);assert.ok(Math.abs(g.dy[i]-3)<1e-12);}});
test('No Data mask remains invalid in IPD',()=>{const w=3,h=3,z=new Float64Array([0,1,2,1,NaN,3,2,3,4]);const r=computeIPD(z,w,h,1,1,1,0);assert.ok(Number.isNaN(r.magnitude[4]));});
test('linear correction removes linear vector field',()=>{const w=20,h=18,xv=new Float64Array(w*h),yv=new Float64Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,xn=2*x/(w-1)-1,yn=2*y/(h-1)-1;xv[i]=1+2*xn+.5*yn;yv[i]=-3+.2*xn-1.5*yn;}const c=fitLowOrderCorrection(xv,yv,w,h,1);const m=fieldMetrics(c.residualX,c.residualY);assert.ok(m.rms<1e-10);});
