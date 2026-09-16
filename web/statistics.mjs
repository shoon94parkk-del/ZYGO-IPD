// Exact, linearly interpolated quantiles. MAD is unscaled median absolute deviation.
export function statistics(values) {
  const a = Array.from(values).filter(Number.isFinite).sort((x,y)=>x-y);
  if (!a.length) return {count:0};
  const q = (v,p) => { const k=(v.length-1)*p,l=Math.floor(k); return v[l]+(v[Math.ceil(k)]-v[l])*(k-l); };
  let mean=0,m2=0,sumSq=0;
  a.forEach((v,i)=>{const d=v-mean;mean+=d/(i+1);m2+=d*(v-mean);sumSq+=v*v;});
  const median=q(a,.5),q1=q(a,.25),q3=q(a,.75),iqr=q3-q1;
  const deviations=a.map(v=>Math.abs(v-median)).sort((x,y)=>x-y);
  const outliers=a.filter(v=>v<q1-1.5*iqr||v>q3+1.5*iqr).length;
  return {count:a.length,min:a[0],max:a.at(-1),pv:a.at(-1)-a[0],mean,
    std:Math.sqrt(m2/a.length),rms:Math.sqrt(sumSq/a.length),median,mad:q(deviations,.5),
    q1,q3,iqr,p90:q(a,.9),p95:q(a,.95),p99:q(a,.99),outliers,outlierPct:100*outliers/a.length};
}

// Measured overlay only: positions in mm, signed displacements in nm.
export function analyzeOverlayCsv(text) {
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/).filter(l=>l.trim());
  const header=lines.shift()?.split(',').map(s=>s.trim().toLowerCase());
  const required=['x_mm','y_mm','dx_nm','dy_nm'],ix=required.map(k=>header?.indexOf(k));
  if(ix.some(i=>i<0))throw new Error('CSV 열은 x_mm,y_mm,dx_nm,dy_nm 이어야 합니다.');
  const points=lines.map((line,index)=>{
    const cells=line.split(',');const row=ix.map(i=>cells[i]?.trim());
    if(row.some(v=>v===undefined||v==='')||row.map(Number).some(v=>!Number.isFinite(v)))
      throw new Error('CSV '+(index+2)+'행: 좌표/변위는 유한한 숫자여야 합니다.');
    return row.map(Number);
  });
  if(points.length<6)throw new Error('Affine 분석에는 2차원에 분포한 최소 6개 측정점이 필요합니다.');
  const n=points.length,mx=points.reduce((s,p)=>s+p[0],0)/n,my=points.reduce((s,p)=>s+p[1],0)/n;
  let scale=0; for(const p of points)scale=Math.max(scale,Math.abs(p[0]-mx),Math.abs(p[1]-my));
  if(!scale)throw new Error('측정 좌표가 모두 같습니다.');
  const matrix=Array.from({length:3},()=>[0,0,0]),bx=[0,0,0],by=[0,0,0];
  for(const [x,y,dx,dy] of points){const b=[1,(x-mx)/scale,(y-my)/scale];for(let i=0;i<3;i++){bx[i]+=b[i]*dx;by[i]+=b[i]*dy;for(let j=0;j<3;j++)matrix[i][j]+=b[i]*b[j];}}
  function solve(rhs){const a=matrix.map((r,i)=>[...r,rhs[i]]);
    for(let c=0;c<3;c++){let k=c;for(let r=c+1;r<3;r++)if(Math.abs(a[r][c])>Math.abs(a[k][c]))k=r;
      if(Math.abs(a[k][c])<1e-10)throw new Error('측정점이 일직선이거나 affine fit이 불안정합니다.');
      [a[c],a[k]]=[a[k],a[c]];const d=a[c][c];for(let j=c;j<4;j++)a[c][j]/=d;
      for(let r=0;r<3;r++)if(r!==c){const f=a[r][c];for(let j=c;j<4;j++)a[r][j]-=f*a[c][j];}}
    return a.map(r=>r[3]);}
  const ax=solve(bx),ay=solve(by);
  const residuals=points.map(([x,y,dx,dy])=>[x,y,dx-ax[0]-ax[1]*(x-mx)/scale-ax[2]*(y-my)/scale,dy-ay[0]-ay[1]*(x-mx)/scale-ay[2]*(y-my)/scale]);
  const raw=statistics(points.map(p=>Math.hypot(p[2],p[3]))),residual=statistics(residuals.map(p=>Math.hypot(p[2],p[3])));
  return {points,residuals,raw,residual,
    translationXNm:ax[0]-ax[1]*mx/scale-ax[2]*my/scale,
    translationYNm:ay[0]-ay[1]*mx/scale-ay[2]*my/scale,
    magnificationXPpm:ax[1]/scale,magnificationYPpm:ay[2]/scale,
    rotationUrad:(ay[1]-ax[2])/(2*scale),shearPpm:(ay[1]+ax[2])/(2*scale),
    note:'Measured overlay; infinitesimal affine decomposition; least squares, not robust fit. Residual is in-sample and is not guaranteed tool correctability.'};
}
