const helpText = {
  RMS:'값을 제곱해 평균한 후 제곱근을 취합니다. 큰 값에 민감합니다. Magnitude의 RMS는 sqrt(mean(X²+Y²))입니다.',
  Mean:'산술 평균입니다. 부호 있는 X/Y 평균은 방향성 편향을 나타냅니다.',
  Median:'중앙값(P50). 절반의 값이 이 값 이하이며 극단값에 비교적 강합니다.',
  Std:'평균을 중심으로 한 모집단 표준편차입니다. RMS와 달리 평균 성분을 제외한 산포입니다.',
  MAD:'median(|v − median(v)|). 정규분포 환산 계수를 곱하지 않은 중앙절대편차입니다.',
  IQR:'P75 − P25. 가운데 50% 데이터의 폭으로 극단값에 비교적 강합니다.',
  P90:'유효 값의 90%가 이 값 이하입니다. 인접 순위 사이를 선형 보간합니다.',
  P95:'유효 값의 95%가 이 값 이하입니다. 규격 판단에는 Max와 측정 불확도도 함께 확인하세요.',
  P99:'유효 값의 99%가 이 값 이하입니다. 꼬리 분포 확인에 유용합니다.',
  PV:'Max − Min. 형상 높이의 전체 범위이며 표준 bow/warp 측정치를 대신하지 않습니다.',
  Min:'분석 영역의 최소 유효 값입니다.',Max:'분석 영역의 최대 유효 값입니다. 단일 이상값에 민감합니다.',
  Outliers:'Q1−1.5×IQR 미만 또는 Q3+1.5×IQR 초과 값. 탐색용 표시이며 실제 결함 판정이 아닙니다. 통계/fit에서 제거하지 않습니다.',
  Count:'NaN/No Data를 제외한 유효 값 수입니다.',
  Cx:'IPD X = Cx × ∂Z/∂x. Cx를 2배로 하면 X 성분이 2배, 음수면 방향이 반전됩니다. 값만 바꿔도 nm가 되지는 않습니다. nm 출력에는 nm/(µm/mm) 차원의 검증된 계수와 보정 이력이 필요합니다.',
  Cy:'IPD Y = Cy × ∂Z/∂y. Cy만 바꾸면 Y 성분과 벡터 방향/크기가 바뀝니다. X/Y 계수가 다르면 방향별 비등방 스케일링입니다.',
  Pitch:'한 픽셀의 실제 길이(mm/pixel). CameraRes(m/pixel)×1000. 동일 Z에서 pitch가 2배면 기울기는 절반, 물리 span은 2배가 됩니다. 맞는 모양을 만들기 위해 임의로 바꾸면 안 됩니다.',
  Smoothing:'미분 전 NaN-aware Gaussian smoothing. σ는 pixel, 물리 길이는 σ×pitch mm. 노이즈와 작은 실제 패턴을 함께 완화하므로 적용값을 기록하세요.',
  Correction:'X/Y에 각각 0–5차 다항식을 최소제곱 적합합니다. 차수가 높으면 residual이 작아져도 과적합일 수 있습니다. 실제 장비 보정 가능량을 보장하지 않습니다.',
  Reference:'동일 grid/origin/pitch의 Zref를 빼서 ΔZ를 분석합니다. notch, 앞/뒷면, 회전, 중심이 이미 정합되어야 합니다. 자동 정합은 제공하지 않습니다.',
  Radial:'중심에서 바깥 방향의 성분입니다. 양수는 바깥, 음수는 안쪽입니다. 중심점 방향은 정의되지 않으므로 No Data로 처리합니다.',
  Tangential:'현재 배열 좌표는 +X 오른쪽, +Y 아래쪽입니다. 양의 접선 성분은 화면에서 시계 방향입니다. 장비 좌표 방향을 확인하세요.',
  Zernike:'300 mm 기준 원판에서 비정규화 실수 다항식 계수(µm)를 least squares로 계산합니다. 선택한 13개 모드이며 완전한 Noll 순서/모드 집합이 아닙니다. 계수는 모드별 RMS와 다릅니다.',
  Edge:'150 mm 반경 기준 Center 0–60%, Mid 60–85%, Edge 85–100%. 데이터 grid 중심을 wafer 중심으로 가정합니다. 비중심 ROI라면 해석에 주의하세요.',
  Color:'자동은 이상값 영향을 줄인 범위, 전체는 Min–Max, 수동은 입력 범위입니다. 색상 포화는 표시만 바꾸며 원본/통계/보정을 바꾸지 않습니다.',
  Vector:'화살표는 샘플링된 위치의 방향/크기입니다. 화면 길이는 확대 표시이며 물리적 이동 길이가 아닙니다. 선택 위치에서 정확한 X/Y/크기를 확인하세요.'
};
function help(name) {
  const d=document.createElement('details');d.className='help';
  const s=document.createElement('summary');s.textContent='?';s.setAttribute('aria-label',name+' 설명');
  const p=document.createElement('div');p.textContent=helpText[name]||name;d.append(s,p);
  d.addEventListener('toggle',()=>{if(!d.open)return;const r=s.getBoundingClientRect();p.style.position='fixed';p.style.right='auto';p.style.left=Math.max(8,Math.min(r.left,innerWidth-Math.min(290,innerWidth*.7)-8))+'px';p.style.top=Math.max(8,Math.min(r.bottom+6,innerHeight-p.offsetHeight-8))+'px';});
  s.addEventListener('keydown',e=>{if(e.key==='Escape')d.open=false;});
  return d;
}
export function setupAnalysisUI({state,worker,renderMap,renderSection,fmt,toast}) {
  const $=id=>document.getElementById(id);
  const controls=document.createElement('div');controls.className='display-controls';
  controls.innerHTML='<label>컬러 범위 <select id="colorMode"><option value="auto">자동 · 분위수 범위</option><option value="full">전체 · Min–Max</option><option value="manual">수동</option></select></label><label>Min<input id="colorMin" type="number" step="any" disabled></label><label>Max<input id="colorMax" type="number" step="any" disabled></label><button id="colorApply" class="secondary">범위 적용</button><label>컬러바 두께<input id="legendSize" type="range" min="6" max="32" value="10"></label><label>벡터 밀도<select id="vectorDensity"><option>10</option><option selected>18</option><option>26</option></select></label><label><input id="vectorNumbers" type="checkbox">벡터 크기 숫자</label>';
  document.querySelector('.map-toolbar').after(controls);
  controls.append(help('Color'),help('Vector'));
  const probe=document.createElement('section');probe.className='point-probe';probe.id='pointProbe';probe.setAttribute('aria-live','polite');
  document.querySelector('.map-foot').after(probe);
  const panel=document.createElement('section');panel.className='panel';
  panel.innerHTML='<h2>분포 통계 · 전체 유효 영역</h2><p id="statsUnit" class="subtle"></p><p class="subtle">컬러 clipping과 무관하게 모든 유효 값을 포함합니다. Outlier를 자동 제거하지 않습니다.</p><div class="table-scroll"><table id="richStats"></table></div>';
  document.querySelector('.analysis-grid').after(panel);
  const guide=document.createElement('section');guide.className='panel';
  guide.innerHTML='<h2>단위와 파라미터</h2><p>현재 ZYGO 결과는 <strong>미보정 weighted slope</strong>입니다. Cx=Cy=1이면 µm/mm이며, nm 변위가 아닙니다.</p><p>Cx=2, Cy=1 → X만 2배. Cx 또는 Cy가 음수 → 해당 방향 반전. Pitch 2배 → 같은 Z의 기울기는 1/2, 좌표 span은 2배. 통계·radial/tangential·보정 결과도 함께 달라집니다.</p><p>좌표: grid 중심 원점, +X 오른쪽, +Y 아래쪽. 앞/뒷면·notch 방향은 실측과 확인해야 합니다.</p>';
  document.querySelector('.methods-panel').before(guide);
  [['coeffX','Cx'],['coeffY','Cy'],['pitchMode','Pitch'],['sigma','Smoothing'],['corrOrder','Correction'],['referenceInput','Reference']].forEach(([id,k])=>{const label=$(id).closest('label');const group=document.createElement('div');group.className='help-field';label.before(group);group.append(label,help(k));});
  for(const [selector,key] of [['[data-map="radial"]','Radial'],['[data-map="tangential"]','Tangential'],['#zernikeResidual','Zernike'],['#edgeStats','Edge']])document.querySelector(selector).after(help(key));
  const saved=new Map();
  function syncRange(){const on=$('colorMode').value==='manual';$('colorMin').disabled=!on;$('colorMax').disabled=!on;renderMap();}
  $('colorMode').onchange=syncRange;
  $('colorApply').onclick=()=>{if($('colorMode').value==='manual'){const lo=Number($('colorMin').value),hi=Number($('colorMax').value);if(!$('colorMin').value||!$('colorMax').value||!Number.isFinite(lo)||!Number.isFinite(hi)||lo>=hi)return toast('Min/Max는 유한한 숫자이며 Min < Max여야 합니다.',true);saved.set(state.map,{min:lo,max:hi});}renderMap();};
  $('legendSize').oninput=()=>document.querySelector('.legend').style.height=$('legendSize').value+'px';
  $('vectorDensity').onchange=renderMap;$('vectorNumbers').onchange=renderMap;
  let lastResult=null;
  function range(key,auto){
    if(lastResult!==state.result){lastResult=state.result;saved.clear();}
    const stats=state.result.stats?.[key];let r=auto;
    if($('colorMode').value==='full'&&stats?.count)r={min:stats.min,max:stats.max};
    if($('colorMode').value==='manual')r=saved.get(key)||auto;
    if(r.max===r.min){const pad=Math.max(Math.abs(r.min)*.01,1e-12);r={min:r.min-pad,max:r.max+pad};}
    $('colorMin').value=r.min;$('colorMax').value=r.max;return r;
  }
  function unit(key){return key==='z'?'µm':'weighted slope · 미보정 (Cx=Cy=1: µm/mm)';}
  function render(){
    if(!state.result?.stats)return;
    const table=$('richStats');table.replaceChildren();
    const headers=['Metric','현재 '+state.map,'|IPD| before','|Residual| after'];
    const tr=document.createElement('tr');headers.forEach(t=>{const th=document.createElement('th');th.textContent=t;tr.append(th);});table.append(tr);
    const keys=[['Count','count'],['Mean','mean'],['Median','median'],['Std','std'],['RMS','rms'],['MAD','mad'],['IQR','iqr'],['P90','p90'],['P95','p95'],['P99','p99'],['Min','min'],['Max','max'],['PV','pv'],['Outliers','outliers']];
    for(const [name,key] of keys){const row=document.createElement('tr'),th=document.createElement('th');th.textContent=name;th.append(help(name));row.append(th);for(const s of [state.result.stats[state.map],state.result.stats.magnitude,state.result.stats.residualMagnitude]){const td=document.createElement('td');td.textContent=key==='count'||key==='outliers'?(s?.[key]??0).toLocaleString():fmt(s?.[key]);row.append(td);}table.append(row);}
    $('statsUnit').textContent='현재 맵: '+unit(state.map)+' | before/after: 미보정 weighted slope. Count/Outliers는 점 수.';
    point();
  }
  function point(){
    if(!state.result||state.crossX==null)return;
    const i=state.crossY*state.meta.width+state.crossX,a=state.result.arrays,p=state.result.pitch.pitchMm;
    const x=(state.crossX-(state.meta.width-1)/2)*p,y=(state.crossY-(state.meta.height-1)/2)*p;
    const vals=[['X',a.ipdX[i]],['Y',a.ipdY[i]],['|IPD|',a.magnitude[i]],['Radial',a.radial[i]],['Tangential',a.tangential[i]],['|Residual|',a.residualMagnitude[i]]];
    probe.textContent='선택 위치 ('+x.toFixed(3)+', '+y.toFixed(3)+') mm · '+vals.map(([k,v])=>k+' '+fmt(v)).join(' · ')+' · 미보정 weighted slope (nm 아님)';
  }
  // Independent measured-overlay workflow; never relabels shape-derived fields as nm.
  const overlay=document.createElement('details');overlay.className='panel measured-overlay';
  overlay.innerHTML='<h2>Hybrid bonding · 실측 overlay (nm)</h2><p>정렬 마크에서 측정한 CSV: <code>x_mm,y_mm,dx_nm,dy_nm</code>. 위치는 mm, signed displacement는 nm. 같은 좌표계의 2차원에 분포한 6점 이상이 필요합니다.</p><input id="overlayCsv" type="file" accept=".csv,text/csv" aria-label="실측 overlay CSV"><p>이동·배율·회전·전단의 affine 분해와 잔차를 계산합니다. 실제 bonder 보정 한계는 별도 검증해야 합니다.</p><div id="overlayResult" role="status"></div><button id="overlayExport" class="secondary" disabled>실측 분석 JSON</button><h3>본딩 분석에 더 필요한 데이터</h3><p>상/하부 wafer 정합과 flip/notch 방향, 본딩 전후 형상, 측정 반복성·불확도, die/shot 위치, 온도·두께·재료·chuck 조건, void/접합 품질이 필요합니다. XYZ 하나로 최종 misalignment 또는 수율을 판정할 수 없습니다.</p><p><a href="https://www.imec-int.com/en/articles/path-high-density-front-and-backside-wafer-connectivity" target="_blank" rel="noreferrer">imec: 본딩 overlay와 형상 보정</a> · <a href="https://www.evgroup.com/fileadmin/media/company/news/2025/2025_09_08_EVG40_D2W/Press_Release_EVG40_D2W_2025_09_08_EN.pdf" target="_blank" rel="noreferrer">EVG: 실측 배치·왜곡·회전 분석</a></p>';
  const overlayHeading=overlay.querySelector('h2');const overlaySummary=document.createElement('summary');overlaySummary.textContent=overlayHeading.textContent+' · CSV 분석 열기';overlayHeading.replaceWith(overlaySummary);
  document.querySelector('.intro').after(overlay);
  let measured=null;
  $('overlayCsv').onchange=async()=>{const f=$('overlayCsv').files[0];if(!f)return;measured=null;$('overlayExport').disabled=true;$('overlayResult').textContent='로컬 분석 중…';try{worker.postMessage({type:'overlay-csv',payload:{text:await f.text()}});}catch(e){$('overlayResult').textContent=e.message;}};
  function overlayResult(r){measured=r;$('overlayExport').disabled=false;$('overlayResult').textContent=[
    'N '+r.raw.count,'이동 X/Y '+fmt(r.translationXNm)+' / '+fmt(r.translationYNm)+' nm',
    '배율 X/Y '+fmt(r.magnificationXPpm)+' / '+fmt(r.magnificationYPpm)+' ppm',
    '회전 '+fmt(r.rotationUrad)+' µrad','전단 '+fmt(r.shearPpm)+' ppm',
    'Before median/P95/max '+[r.raw.median,r.raw.p95,r.raw.max].map(fmt).join(' / ')+' nm',
    'Affine residual median/P95/max '+[r.residual.median,r.residual.p95,r.residual.max].map(fmt).join(' / ')+' nm',
    '최소제곱·동일 데이터 적합 잔차. 실제 보정 성능/불확도 검증 아님.'
  ].join(' · ');}
  $('overlayExport').onclick=()=>{if(!measured)return;const url=URL.createObjectURL(new Blob([JSON.stringify(measured,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='measured_overlay_analysis.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  return {range,render,point,overlayResult,overlayError:msg=>{$('overlayResult').textContent=msg;},unit};
}
