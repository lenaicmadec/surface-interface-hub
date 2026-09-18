'use strict';

const {parseVamas, decodeVamas, compatible, sumBlocks, writeVamas, encodeVamas, unsupportedWindows1252} = window.XPSVamas;

const state = {
  files: [],
  fileKeys: new Set(),
  groups: new Map(),
  active: null,
  builder: [],
  renameMap: new Map(),
  groupMap: new Map(),
  namesConfirmed: false,
  plotMode: 'cps',
  energyMode: 'be',
  activeSample: null,
  sampleMessage: '',
  exportMode: 'combined'
};

const SEP='\u241f';

function escapeHtml(s){
  return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function safe(s){return String(s).replace(/[^a-z0-9._-]+/gi,'_')}
function fmt(v,n=3){return Number.isFinite(+v)?Number(v).toFixed(n):'—'}
function baseName(fileName){return String(fileName||'').replace(/\.[^.]+$/,'')}
function sourceId(fileKey,label){return `${fileKey}${SEP}${label}`}

async function readVamasText(file){return decodeVamas(await file.arrayBuffer())}

/*
  One physical VAMAS file can contain one or many internal samples.
  A detected sample is therefore identified by (physical file + detected sample label),
  never by its label alone. This prevents two independent files that both contain
  "Sample 1" from being merged automatically.
*/
function sourceUnits(){
  const units=[];
  for(const f of state.files){
    const byLabel=new Map();
    for(const b of f.blocks){
      const label=(b.sourceSample||b.logicalSample||baseName(f.fileName)||'Sample').trim();
      const id=sourceId(f.fileKey,label);
      b.sourceId=id;
      if(!byLabel.has(label)){
        byLabel.set(label,{
          id,
          label,
          fileKey:f.fileKey,
          fileName:f.fileName,
          blocks:[],
          rawSampleIds:new Set()
        });
      }
      const unit=byLabel.get(label);
      unit.blocks.push(b);
      if(String(b.sample||'').trim())unit.rawSampleIds.add(String(b.sample).trim());
    }
    units.push(...byLabel.values());
  }
  return units;
}

function unitsByFile(){
  const out=new Map();
  for(const f of state.files)out.set(f.fileKey,[]);
  for(const unit of sourceUnits())out.get(unit.fileKey)?.push(unit);
  return out;
}

function syncSampleMaps(){
  const units=sourceUnits();
  const ids=new Set(units.map(u=>u.id));
  for(const u of units){
    if(!state.renameMap.has(u.id))state.renameMap.set(u.id,u.label);
    if(!state.groupMap.has(u.id))state.groupMap.set(u.id,u.id);
  }
  for(const id of [...state.renameMap.keys()])if(!ids.has(id))state.renameMap.delete(id);
  for(const id of [...state.groupMap.keys()])if(!ids.has(id))state.groupMap.delete(id);
}

function datasetInfoForBlock(b){
  const src=b.sourceId;
  const leader=state.groupMap.get(src)||src;
  const name=state.renameMap.get(leader)||state.renameMap.get(src)||b.sourceSample||b.logicalSample||'Sample';
  return {id:leader,name};
}

function rebuildGroups(){
  state.groups.clear();
  sourceUnits(); // ensures every block has a sourceId
  for(const f of state.files){
    for(const b of f.blocks){
      const dataset=datasetInfoForBlock(b);
      const key=`${dataset.id}${SEP}${b.region}`;
      if(!state.groups.has(key))state.groups.set(key,{datasetId:dataset.id,sample:dataset.name,region:b.region,blocks:[]});
      state.groups.get(key).blocks.push(b);
    }
  }
}

function groupInfo(){
  const units=sourceUnits();
  const members=new Map();
  for(const u of units){
    const leader=state.groupMap.get(u.id)||u.id;
    if(!members.has(leader))members.set(leader,[]);
    members.get(leader).push(u.id);
  }
  const labels=new Map();
  let n=1;
  for(const [leader,arr] of members)if(arr.length>1)labels.set(leader,`Group ${n++}`);
  return {units,members,labels};
}

function stats(){
  const units=sourceUnits();
  const all=state.files.flatMap(f=>f.blocks);
  return {
    files:state.files.length,
    samples:units.length,
    blocks:all.length,
    repeated:[...state.groups.values()].filter(g=>g.blocks.filter(b=>!b.isProcessed).length>1).length
  };
}

function removeFileByKey(key){
  state.files=state.files.filter(f=>f.fileKey!==key);
  state.fileKeys=new Set(state.files.map(f=>f.fileKey));
  syncSampleMaps();
  state.active=null;
  state.activeSample=null;
  state.sampleMessage='';
  state.builder=[];
  state.namesConfirmed=false;
  rebuildGroups();
  renderAll();
}

function renderImportInfo(){
  const list=document.getElementById('fileList');
  const summary=document.getElementById('importSummary');
  if(!state.files.length){
    summary.textContent='No file loaded.';
    list.innerHTML='';
    renderOrganization();
    return;
  }

  const s=stats();
  summary.textContent=`${s.files} VAMAS file${s.files===1?'':'s'} · ${s.samples} detected sample${s.samples===1?'':'s'} · ${s.blocks} blocks`;

  const byFile=unitsByFile();
  list.innerHTML=state.files.map(f=>{
    const n=(byFile.get(f.fileKey)||[]).length;
    return `<span class="fileChip"><span class="fileChipLabel" title="${escapeHtml(f.fileName)}">${escapeHtml(f.fileName)} · ${n} sample${n===1?'':'s'}</span><button type="button" data-remove-file="${escapeHtml(f.fileKey)}" title="Remove file">×</button></span>`;
  }).join('');
  list.querySelectorAll('[data-remove-file]').forEach(btn=>btn.onclick=()=>removeFileByKey(btn.dataset.removeFile));
  renderOrganization();
}

function renderOrganization(){
  const rows=document.getElementById('orgRows');
  const confirm=document.getElementById('confirmNames');
  const groupBtn=document.getElementById('groupSelected');
  const reset=document.getElementById('resetGroups');
  const status=document.getElementById('orgStatus');
  const meta=document.getElementById('orgMetaLeft');
  const {units,members,labels}=groupInfo();

  if(!units.length){
    rows.innerHTML='<div class="hint">Confirm sample names first. Grouping is optional and can be applied to any checked rows.</div>';
    confirm.disabled=groupBtn.disabled=reset.disabled=true;
    status.textContent='Names not confirmed';
    meta.textContent='Import files to begin';
    return;
  }

  const unitMap=new Map(units.map(u=>[u.id,u]));
  const byFile=unitsByFile();
  rows.innerHTML='';

  for(const f of state.files){
    const fileUnits=byFile.get(f.fileKey)||[];
    const fileGroup=document.createElement('div');
    fileGroup.className='orgFileGroup';

    const fileMeta=document.createElement('div');
    fileMeta.className='orgFileMeta';
    fileMeta.innerHTML=`<div class="orgFileName" title="${escapeHtml(f.fileName)}">${escapeHtml(f.fileName)}</div><div class="orgFileCount">${fileUnits.length} sample${fileUnits.length===1?'':'s'}</div>`;
    fileMeta.style.gridRow=`1 / span ${Math.max(1,fileUnits.length)}`;
    fileGroup.appendChild(fileMeta);

    fileUnits.forEach((unit,index)=>{
      const gridRow=index+1;
      const leader=state.groupMap.get(unit.id)||unit.id;
      const groupMembers=members.get(leader)||[];
      const groupSize=groupMembers.length;
      const label=groupSize>1?(labels.get(leader)||'Grouped'):'—';
      const memberNames=groupMembers.map(id=>state.renameMap.get(id)||unitMap.get(id)?.label||id);
      const rawIds=[...unit.rawSampleIds];
      const sourceTitle=rawIds.length?`VAMAS Sample ID${rawIds.length===1?'':'s'}: ${rawIds.join(', ')}`:'Detected sample';

      const source=document.createElement('div');
      source.className='orgSource';
      source.style.gridRow=gridRow;
      source.title=sourceTitle;
      source.textContent=unit.label;

      const name=document.createElement('input');
      name.type='text';
      name.className='orgNameInput';
      name.style.gridRow=gridRow;
      name.dataset.nameSrc=unit.id;
      name.value=state.renameMap.get(unit.id)||unit.label;
      name.setAttribute('aria-label',`Sample name for ${unit.label}`);

      const use=document.createElement('input');
      use.type='checkbox';
      use.className='orgUse';
      use.style.gridRow=gridRow;
      use.dataset.groupCheck=unit.id;
      use.disabled=!state.namesConfirmed;
      use.setAttribute('aria-label',`Select ${unit.label} for grouping`);

      const badge=document.createElement('span');
      badge.className=`groupBadge ${groupSize>1?'grouped':''}`;
      badge.style.gridRow=gridRow;
      badge.title=groupSize>1?memberNames.join(', '):'Not grouped';
      badge.textContent=label;

      fileGroup.append(source,name,use,badge);
    });
    rows.appendChild(fileGroup);
  }

  confirm.disabled=false;
  groupBtn.disabled=!state.namesConfirmed;
  reset.disabled=!state.namesConfirmed;
  const grouped=[...members.values()].filter(a=>a.length>1).length;
  meta.textContent=`${units.length} detected sample${units.length===1?'':'s'} · ${grouped} group${grouped===1?'':'s'}`;
  status.textContent=state.namesConfirmed?'Names confirmed ✓':'Names not confirmed';
}
function confirmNamesFromUI(){
  document.querySelectorAll('[data-name-src]').forEach(inp=>state.renameMap.set(inp.dataset.nameSrc,inp.value.trim()||inp.dataset.nameSrc.split(SEP).at(-1)));
  state.namesConfirmed=true;
  state.active=null;
  state.activeSample=null;
  state.sampleMessage='';
  state.builder=[];
  rebuildGroups();
  renderAll();
}

function groupSelected(){
  const checked=[...document.querySelectorAll('[data-group-check]:checked')].map(x=>x.dataset.groupCheck);
  if(checked.length<2)return;
  const selectedLeaders=[...new Set(checked.map(id=>state.groupMap.get(id)||id))];
  const leader=selectedLeaders[0];
  for(const [id,currentLeader] of state.groupMap){
    if(selectedLeaders.includes(currentLeader))state.groupMap.set(id,leader);
  }
  for(const id of checked)state.groupMap.set(id,leader);
  state.active=null;
  state.activeSample=null;
  state.sampleMessage='';
  state.builder=[];
  rebuildGroups();
  renderAll();
}

function resetGroups(){
  for(const u of sourceUnits())state.groupMap.set(u.id,u.id);
  state.active=null;
  state.activeSample=null;
  state.sampleMessage='';
  state.builder=[];
  rebuildGroups();
  renderAll();
}

function renderNav(){
  const nav=document.getElementById('nav');
  if(!state.files.length){nav.innerHTML='<div class="empty">Import VAMAS files to begin.</div>';return}
  if(!state.namesConfirmed){nav.innerHTML='<div class="empty">Confirm sample names to start review.</div>';return}
  if(!state.groups.size){nav.innerHTML='<div class="empty">No blocks detected.</div>';return}

  const datasets=new Map();
  for(const [key,g] of state.groups){
    if(!datasets.has(g.datasetId))datasets.set(g.datasetId,{sample:g.sample,regions:[]});
    datasets.get(g.datasetId).regions.push([key,g]);
  }
  const regionDataset=state.active&&state.groups.get(state.active)?state.groups.get(state.active).datasetId:null;
  const activeDataset=regionDataset||state.activeSample;
  nav.innerHTML='';

  for(const [datasetId,entry] of datasets){
    const d=document.createElement('div');
    d.className='sample';

    const sampleBtn=document.createElement('button');
    sampleBtn.type='button';
    sampleBtn.className='sampleHeadBtn'+(activeDataset===datasetId?' activeSample':'');
    sampleBtn.title='Open sample overview';
    sampleBtn.textContent=entry.sample;
    sampleBtn.onclick=()=>{
      state.active=null;
      state.activeSample=datasetId;
      state.sampleMessage='';
      renderNav();renderAcquisitions();renderMain();renderBuilder();
    };
    d.appendChild(sampleBtn);

    entry.regions.sort((a,b)=>a[1].region.localeCompare(b[1].region));
    for(const [key,g] of entry.regions){
      const raw=g.blocks.filter(b=>!b.isProcessed).length;
      const pr=g.blocks.filter(b=>b.isProcessed).length;
      const validated=state.builder.some(x=>x.datasetId===g.datasetId&&x.region===g.region);
      const btn=document.createElement('button');
      btn.className='regionBtn'+(state.active===key?' active':'');
      btn.innerHTML=`<span class="regionName">${validated?'✓ ':''}${escapeHtml(g.region)}</span><span class="regionMeta">${raw} raw${pr?` · ${pr} Pr`:''}</span>`;
      btn.onclick=()=>{state.active=key;state.activeSample=null;state.sampleMessage='';renderNav();renderAcquisitions();renderMain();renderBuilder()};
      d.appendChild(btn);
    }
    nav.appendChild(d);
  }
}

function photonEnergyValue(b){
  const raw=String(b?.sourceEnergy??'').replace(',', '.');
  const v=Number(raw);
  return Number.isFinite(v)?v:null;
}

function xAxisForBlock(b, energyMode=state.energyMode){
  const rawLabel=String(b.xLabel||'Energy');
  const label=rawLabel.toLowerCase();
  const unit=b.xUnit||'eV';
  const x=b.x.slice();
  const hv=photonEnergyValue(b);
  const isBinding=label.includes('binding');
  const isKinetic=label.includes('kinetic');

  if(energyMode==='be'){
    if(isBinding)return {x,label:'Binding Energy',unit,reverse:true};
    if(isKinetic&&hv!==null)return {x:x.map(v=>hv-v),label:'Binding Energy',unit:'eV',reverse:true};
    return {x,label:rawLabel,unit,reverse:false};
  }

  if(isKinetic)return {x,label:'Kinetic Energy',unit,reverse:false};
  if(isBinding&&hv!==null)return {x:x.map(v=>hv-v),label:'Kinetic Energy',unit:'eV',reverse:false};
  return {x,label:rawLabel,unit,reverse:false};
}

function toggleLabel(active, inactive, activeFirst=true){
  return activeFirst
    ? `<span class="toggleActive">${escapeHtml(active)}</span><span class="toggleSep">/</span><span class="toggleInactive">${escapeHtml(inactive)}</span>`
    : `<span class="toggleInactive">${escapeHtml(inactive)}</span><span class="toggleSep">/</span><span class="toggleActive">${escapeHtml(active)}</span>`;
}

function curveColor(i){
  const light=document.documentElement.dataset.themeMode==='light';
  const colors=light
    ? ['#0369a1','#047857','#be185d','#a16207','#6d28d9','#c2410c','#0f766e','#4d7c0f','#b45309','#1d4ed8','#86198f','#0f766e']
    : ['#38bdf8','#34d399','#f472b6','#fbbf24','#a78bfa','#fb7185','#22d3ee','#84cc16','#f97316','#60a5fa','#e879f9','#2dd4bf'];
  return colors[i%colors.length];
}

function chartSvg(blocks,sum,mode,energyMode){
  const W=1000,H=430,p={l:70,r:20,t:18,b:45},datasets=[];
  for(const b of blocks){
    let y=b.data[0].slice();
    if(mode==='cps')y=y.map(v=>v/(b.collectionTime*Math.max(1,b.scans)));
    const axis=xAxisForBlock(b,energyMode);
    datasets.push({b,x:axis.x,y,sum:false,label:axis.label,unit:axis.unit,reverse:axis.reverse});
  }
  if(sum&&!sum.error){
    let y=sum.data[0].slice();
    if(mode==='cps')y=y.map(v=>v/(sum.collectionTime*Math.max(1,sum.scans)));
    const axis=xAxisForBlock(sum,energyMode);
    datasets.push({b:sum,x:axis.x,y,sum:true,label:axis.label,unit:axis.unit,reverse:axis.reverse});
  }
  if(!datasets.length)return '';

  let xmin=Math.min(...datasets.flatMap(d=>d.x));
  let xmax=Math.max(...datasets.flatMap(d=>d.x));
  let ymin=Math.min(...datasets.flatMap(d=>d.y));
  let ymax=Math.max(...datasets.flatMap(d=>d.y));
  if(ymax===ymin)ymax=ymin+1;
  const reverse=!!datasets[0].reverse;
  const sx=reverse
    ? x=>p.l+(xmax-x)/(xmax-xmin)*(W-p.l-p.r)
    : x=>p.l+(x-xmin)/(xmax-xmin)*(W-p.l-p.r);
  const sy=y=>p.t+(ymax-y)/(ymax-ymin)*(H-p.t-p.b);
  const yLabel=mode==='cps'?'CPS':'Counts';

  let s=`<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`;
  for(let i=0;i<6;i++){
    const yy=p.t+i*(H-p.t-p.b)/5;
    s+=`<line class="gridline" x1="${p.l}" x2="${W-p.r}" y1="${yy}" y2="${yy}"/>`;
    const val=ymax-i*(ymax-ymin)/5;
    s+=`<text class="axisText" x="${p.l-8}" y="${yy+4}" text-anchor="end">${fmt(val,0)}</text>`;
  }
  for(let i=0;i<6;i++){
    const xx=p.l+i*(W-p.l-p.r)/5;
    const val=reverse ? (xmax-i*(xmax-xmin)/5) : (xmin+i*(xmax-xmin)/5);
    s+=`<line class="gridline" y1="${p.t}" y2="${H-p.b}" x1="${xx}" x2="${xx}"/><text class="axisText" x="${xx}" y="${H-18}" text-anchor="middle">${fmt(val,1)}</text>`;
  }
  s+=`<line class="axis" x1="${p.l}" x2="${W-p.r}" y1="${H-p.b}" y2="${H-p.b}"/><line class="axis" x1="${p.l}" x2="${p.l}" y1="${p.t}" y2="${H-p.b}"/><text class="axisText" transform="translate(16 ${H/2}) rotate(-90)" text-anchor="middle">${yLabel}</text><text class="axisText" x="${W/2}" y="${H-3}" text-anchor="middle">${escapeHtml(datasets[0].label)} (${escapeHtml(datasets[0].unit||'')})</text>`;
  datasets.forEach((d,i)=>{
    const pts=d.x.map((x,k)=>`${sx(x)},${sy(d.y[k])}`).join(' ');
    const uid=d.b.uid||'';
    s+=`<polyline class="${d.sum?'sumcurve':'curve'}" ${d.sum?'':`stroke="${curveColor(i)}" data-uid="${escapeHtml(uid)}"`} points="${pts}"/>`;
  });
  return s+'</svg>';
}

function currentGroup(){return state.active&&state.groups.has(state.active)?state.groups.get(state.active):null}
function currentSum(){
  const g=currentGroup();
  if(!g)return null;
  return sumBlocks(g.blocks.filter(b=>!b.isProcessed&&b._selected));
}

function acquisitionSourceLabel(b){
  const raw=String(b.sample||'').trim();
  const detected=String(b.sourceSample||b.logicalSample||'').trim();
  return raw&&raw!==detected?raw:b.fileName;
}

function renderAcquisitions(){
  const el=document.getElementById('acqList');
  const g=currentGroup();
  if(!g){
    el.innerHTML=`<div class="acqEmpty">${state.activeSample?'Select a core level to review acquisitions.':'Select a region.'}</div>`;
    return;
  }
  const raw=g.blocks.filter(b=>!b.isProcessed);
  const prs=g.blocks.filter(b=>b.isProcessed);
  raw.forEach(b=>{if(b._selected===undefined)b._selected=true});
  el.innerHTML='';
  for(const b of [...raw,...prs]){
    const src=acquisitionSourceLabel(b);
    const row=document.createElement('div');
    row.className='acqRow';
    row.innerHTML=`<div>${b.isProcessed?'':`<input type="checkbox" ${b._selected?'checked':''}>`}</div><div class="acqSource" title="${escapeHtml(`${b.fileName} · VAMAS sample: ${b.sample||'—'}`)}">${escapeHtml(src)}</div><div>${fmt(b.collectionTime,3)}</div><div>${b.scans}</div><div class="acqType ${b.isProcessed?'pr':''}">${b.isProcessed?'Pr':'raw'}</div>`;
    if(!b.isProcessed)row.querySelector('input').onchange=e=>{b._selected=e.target.checked;renderAcquisitions();renderMain();renderBuilder()};
    el.appendChild(row);
  }
}

function formatSeconds(s){
  if(s<60)return fmt(s,1)+' s';
  if(s<3600)return `${Math.floor(s/60)} min ${fmt(s%60,1)} s`;
  return `${Math.floor(s/3600)} h ${Math.floor((s%3600)/60)} min`;
}

function casaReferenceStatus(g,sum){
  const prs=g.blocks.filter(b=>b.isProcessed);
  if(!prs.length||!sum||sum.error)return '';
  const raw=g.blocks.filter(b=>!b.isProcessed);
  const selected=raw.filter(b=>b._selected!==false);
  if(selected.length!==raw.length)return '';
  const pr=prs[0],why=compatible(sum,pr);
  if(why.length)return `<div class="reviewStatus warn">Casa Pr reference exists but is not directly comparable: ${escapeHtml(why.join(', '))}.</div>`;
  let maxRel=0;
  for(let j=0;j<sum.data[0].length;j++){
    const a=sum.data[0][j],bb=pr.data[0][j],d=Math.abs(a-bb);
    maxRel=Math.max(maxRel,d/Math.max(1,Math.abs(bb)));
  }
  const scanOK=sum.scans===pr.scans;
  const dtOK=Math.abs(sum.collectionTime-pr.collectionTime)<1e-7;
  const ok=maxRel<2e-5&&scanOK&&dtOK;
  if(ok)return '<div class="reviewStatus good">✓ Casa Pr reference matched</div>';
  return `<div class="reviewStatus warn"><b>Casa Pr reference differs:</b> Δ counts ${maxRel.toExponential(2)} · scans ${sum.scans}/${pr.scans} · dwell ${fmt(sum.collectionTime,5)}/${fmt(pr.collectionTime,5)} s</div>`;
}

function datasetGroups(datasetId){
  return [...state.groups.entries()].filter(([,g])=>g.datasetId===datasetId);
}

function builderAddBlock(g,block){
  if(!block||block.error)return false;
  const final={...block,datasetId:g.datasetId,logicalSample:g.sample,region:g.region};
  state.builder=state.builder.filter(x=>!(x.datasetId===g.datasetId&&x.region===g.region));
  state.builder.push(final);
  return true;
}

function automaticRegionResult(g){
  const raw=g.blocks.filter(b=>!b.isProcessed);
  const prs=g.blocks.filter(b=>b.isProcessed);
  if(raw.length){
    const out=sumBlocks(raw);
    if(out?.error)return {status:'Review',kind:'warn',result:null,raw:raw.length,pr:prs.length};
    return {status:raw.length===1?'Add':'Sum',kind:'good',result:out,raw:raw.length,pr:prs.length};
  }
  if(prs.length===1){
    const pr=prs[0];
    return {status:'Pr',kind:'good',result:{...pr,sourceBlocks:[pr]},raw:0,pr:1};
  }
  if(prs.length>1)return {status:'Review',kind:'warn',result:null,raw:0,pr:prs.length};
  return {status:'—',kind:'warn',result:null,raw:0,pr:0};
}

function addWholeSample(datasetId){
  const entries=datasetGroups(datasetId);
  let added=0;
  const review=[];
  for(const [,g] of entries){
    if(state.builder.some(x=>x.datasetId===g.datasetId&&x.region===g.region))continue;
    const info=automaticRegionResult(g);
    if(info.result){builderAddBlock(g,info.result);added++}
    else review.push(g.region);
  }
  state.sampleMessage=review.length
    ? `${added} region${added===1?'':'s'} added · Review: ${review.join(', ')}`
    : `${added} region${added===1?'':'s'} added`;
  renderBuilder();renderNav();renderMain();
}

function renderSampleOverview(){
  const m=document.getElementById('main');
  const entries=datasetGroups(state.activeSample);
  if(!entries.length){m.innerHTML='<div class="empty">Select a detected region.</div>';return}
  const sample=entries[0][1].sample;
  let rows='';
  for(const [key,g] of entries){
    const info=automaticRegionResult(g);
    const validated=state.builder.some(x=>x.datasetId===g.datasetId&&x.region===g.region);
    const status=validated?'✓':info.status;
    const kind=validated?'good':info.kind;
    rows+=`<div class="sampleOverviewRow"><span class="region">${escapeHtml(g.region)}</span><span>${info.raw}</span><span>${info.pr||'—'}</span><span class="${kind==='good'?'statusGood':'statusWarn'}">${escapeHtml(status)}</span><button class="btn small" data-review-region="${escapeHtml(key)}">Review</button></div>`;
  }
  m.innerHTML=`<div class="sampleOverview"><div class="sampleOverviewHead"><span class="idPill">${escapeHtml(sample)}</span><button id="addSampleBtn" class="btn small primary">Add sample</button></div><div class="sampleOverviewTable"><div class="sampleOverviewRow head"><span>Core level</span><span>Raw</span><span>Pr</span><span>Action</span><span></span></div>${rows}</div><div class="sampleOverviewActions"><span class="sampleOverviewNote">${escapeHtml(state.sampleMessage||'')}</span></div></div>`;
  m.querySelectorAll('[data-review-region]').forEach(btn=>btn.onclick=()=>{
    state.active=btn.dataset.reviewRegion;
    state.activeSample=null;
    state.sampleMessage='';
    renderNav();renderAcquisitions();renderMain();renderBuilder();
  });
  document.getElementById('addSampleBtn').onclick=()=>addWholeSample(state.activeSample);
}

function renderMain(){
  const m=document.getElementById('main');
  if(state.activeSample&&!state.active){renderSampleOverview();return}
  const g=currentGroup();
  if(!g){m.innerHTML='<div class="empty">Confirm sample names, then select a sample or core level.</div>';return}
  const raw=g.blocks.filter(b=>!b.isProcessed);
  raw.forEach(b=>{if(b._selected===undefined)b._selected=true});
  const selected=raw.filter(b=>b._selected);
  const sum=sumBlocks(selected);
  const totalScans=sum&&!sum.error?sum.scans:0;
  const total=sum&&!sum.error?sum.scans*sum.points*sum.collectionTime:0;
  const canAdd=!!sum&&!sum.error&&selected.length>=1;
  const metric=`${selected.length} selected · ${totalScans} scan${totalScans===1?'':'s'} · ${total?formatSeconds(total):'—'}`;

  const selectionStatus=sum?.error
    ? `<div class="reviewStatus bad"><b>Cannot sum:</b> ${escapeHtml(sum.error)}</div>`
    : selected.length
      ? '<div class="reviewStatus good">Compatible selection: raw counts can be summed while preserving dwell time and accumulating scans.</div>'
      : '<div class="reviewStatus">Select one or more acquisitions to add them to the final dataset.</div>';
  const csvTitle=selected.length>1?'Download the sum of the selected acquisitions as CSV':'Download the selected acquisition as CSV';
  m.innerHTML=`<div class="reviewHeader"><div class="spectrumIdentity"><span class="idPill" title="Selected dataset">${escapeHtml(g.sample)}</span><span class="idPill region" title="Selected core level">${escapeHtml(g.region)}</span></div><div class="plotControls"><button class="btn small toggleBtn" id="energyBtn">${toggleLabel('BE','KE',state.energyMode==='be')}</button><button class="btn small toggleBtn" id="modeBtn">${toggleLabel('CPS','Counts',state.plotMode==='cps')}</button></div><div class="reviewActions"><div class="selectControls"><button class="btn small" id="allBtn">Select all</button><button class="btn small" id="noneBtn">Clear</button></div><div class="sumControls"><button class="btn small primary" id="addBtn" title="Add the selected acquisition, or sum and add multiple acquisitions" ${canAdd?'':'disabled'}>Add (sum)</button><button class="btn small" id="downloadCurrent" title="${csvTitle}" ${canAdd?'':'disabled'}>↓ CSV</button></div></div></div><div id="chart" class="chartWrap"><div class="chartMetricBar">${escapeHtml(metric)}</div><div class="chartCanvas"></div></div>${selectionStatus}${casaReferenceStatus(g,sum)}`;

  const chart=document.querySelector('#chart .chartCanvas');
  chart.innerHTML=chartSvg(selected,sum,state.plotMode,state.energyMode);
  chart.querySelectorAll('.curve[data-uid]').forEach(curve=>curve.addEventListener('click',()=>{
    const uid=curve.dataset.uid;
    const b=g.blocks.find(x=>x.uid===uid);
    if(b&&!b.isProcessed){b._selected=false;renderAcquisitions();renderMain();renderBuilder()}
  }));

  document.getElementById('allBtn').onclick=()=>{raw.forEach(b=>b._selected=true);renderAcquisitions();renderMain();renderBuilder()};
  document.getElementById('noneBtn').onclick=()=>{raw.forEach(b=>b._selected=false);renderAcquisitions();renderMain();renderBuilder()};
  document.getElementById('modeBtn').onclick=()=>{state.plotMode=state.plotMode==='cps'?'counts':'cps';renderMain()};
  document.getElementById('energyBtn').onclick=()=>{state.energyMode=state.energyMode==='be'?'ke':'be';renderMain()};

  const addCurrent=()=>{
    const s=currentSum();
    if(!s||s.error)return;
    builderAddBlock(g,s);
    renderBuilder();renderNav();
  };

  document.getElementById('addBtn').onclick=addCurrent;
  document.getElementById('downloadCurrent').onclick=()=>downloadCSV(g,currentSum());
}
function downloadCSV(g,s){
  if(!s||s.error)return;
  let out='Energy,Counts,Transmission\n';
  for(let i=0;i<s.points;i++)out+=`${s.x[i]},${s.data[0][i]},${s.data[1]?.[i]??''}\n`;
  const blob=new Blob([out],{type:'text/csv'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=`${safe(g.sample)}_${safe(g.region)}_SUM.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function builderDatasetMap(){
  const datasets=new Map();
  state.builder.forEach((x,i)=>{
    if(!datasets.has(x.datasetId))datasets.set(x.datasetId,{name:x.logicalSample,items:[]});
    datasets.get(x.datasetId).items.push([i,x]);
  });
  return datasets;
}

function orderedBuilderBlocks(){
  return [...builderDatasetMap().values()].flatMap(entry=>entry.items.map(([,x])=>x));
}

function moveBuilderItem(index,direction){
  const item=state.builder[index];
  if(!item)return;
  const indices=state.builder.map((x,i)=>x.datasetId===item.datasetId?i:null).filter(i=>i!==null);
  const pos=indices.indexOf(index);
  const targetPos=pos+direction;
  if(pos<0||targetPos<0||targetPos>=indices.length)return;
  const other=indices[targetPos];
  [state.builder[index],state.builder[other]]=[state.builder[other],state.builder[index]];
  renderBuilder();
}

function moveBuilderItemTo(sourceIndex,targetIndex){
  const source=state.builder[sourceIndex],target=state.builder[targetIndex];
  if(!source||!target||source.datasetId!==target.datasetId||sourceIndex===targetIndex)return;
  const indices=state.builder.map((x,i)=>x.datasetId===source.datasetId?i:null).filter(i=>i!==null);
  const items=indices.map(i=>state.builder[i]);
  const from=indices.indexOf(sourceIndex),to=indices.indexOf(targetIndex);
  if(from<0||to<0)return;
  const [moved]=items.splice(from,1);
  items.splice(to,0,moved);
  indices.forEach((index,pos)=>{state.builder[index]=items[pos]});
  renderBuilder();
}

function renderBuilder(){
  const el=document.getElementById('builderList');
  const datasets=builderDatasetMap();
  const sampleCount=datasets.size;
  document.getElementById('builderMeta').textContent=`${sampleCount} sample${sampleCount===1?'':'s'} · ${state.builder.length} region${state.builder.length===1?'':'s'}`;

  if(!state.builder.length){
    el.innerHTML='<div class="empty">Validated spectra will appear here.</div>';
  }else{
    let html='';
    for(const entry of datasets.values()){
      html+=`<div class="builderSample"><h4>${escapeHtml(entry.name)}</h4>`;
      entry.items.forEach(([i,x],pos)=>{
        html+=`<div class="builderRow" data-builder-row="${i}"><span class="builderDrag" draggable="true" tabindex="0" data-drag-index="${i}" title="Drag to reorder" aria-label="Reorder ${escapeHtml(x.region)}">⠿</span><span class="rname">✓ ${escapeHtml(x.region)}</span><span>${x.scans} scan${x.scans===1?'':'s'}</span><button class="remove" data-remove="${i}" title="Remove">×</button></div>`;
      });
      html+='</div>';
    }
    el.innerHTML=html;
    el.querySelectorAll('[data-remove]').forEach(btn=>btn.onclick=()=>{state.builder.splice(Number(btn.dataset.remove),1);renderBuilder();renderNav()});
    let draggedIndex=null;
    el.querySelectorAll('[data-drag-index]').forEach(handle=>{
      handle.addEventListener('dragstart',event=>{
        draggedIndex=Number(handle.dataset.dragIndex);
        handle.closest('.builderRow')?.classList.add('dragging');
        event.dataTransfer.effectAllowed='move';
        event.dataTransfer.setData('text/plain',String(draggedIndex));
      });
      handle.addEventListener('dragend',()=>{
        draggedIndex=null;
        el.querySelectorAll('.builderRow').forEach(row=>row.classList.remove('dragging','dragTarget'));
      });
      handle.addEventListener('keydown',event=>{
        if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
        event.preventDefault();
        moveBuilderItem(Number(handle.dataset.dragIndex),event.key==='ArrowUp'?-1:1);
      });
    });
    el.querySelectorAll('[data-builder-row]').forEach(row=>{
      row.addEventListener('dragover',event=>{
        if(draggedIndex===null)return;
        const source=state.builder[draggedIndex],target=state.builder[Number(row.dataset.builderRow)];
        if(!source||!target||source.datasetId!==target.datasetId)return;
        event.preventDefault();
        event.dataTransfer.dropEffect='move';
        el.querySelectorAll('.builderRow').forEach(item=>item.classList.remove('dragTarget'));
        row.classList.add('dragTarget');
      });
      row.addEventListener('dragleave',()=>row.classList.remove('dragTarget'));
      row.addEventListener('drop',event=>{
        event.preventDefault();
        const sourceIndex=draggedIndex===null?Number(event.dataTransfer.getData('text/plain')):draggedIndex;
        moveBuilderItemTo(sourceIndex,Number(row.dataset.builderRow));
      });
    });
  }

  document.getElementById('exportCombinedMode').classList.toggle('activeMode',state.exportMode==='combined');
  document.getElementById('exportSeparateMode').classList.toggle('activeMode',state.exportMode==='separate');
  document.getElementById('exportCombinedNameField').classList.toggle('workflowHidden',state.exportMode!=='combined');
  document.getElementById('exportSeparateNameField').classList.toggle('workflowHidden',state.exportMode!=='separate');
  const exportBtn=document.getElementById('exportVamas');
  exportBtn.disabled=!state.builder.length;
  exportBtn.textContent='Export VAMAS';
  exportBtn.onclick=()=>exportFinalVamas();
}

function downloadBlob(bytes,fileName){
  const blob=new Blob([bytes],{type:'application/octet-stream'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function downloadBaseName(s,fallback='XPS_preprocessed_dataset'){
  let out=String(s||'').trim().replace(/[<>:"/\\|?*\x00-\x1F]/g,'_').replace(/[. ]+$/g,'');
  if(!out)out=fallback;
  return out;
}

function exportBlocks(blocks,fileName){
  const finalBlocks=blocks.map(x=>({
    ...x,
    sample:x.logicalSample,
    logicalSample:x.logicalSample
  }));
  const text=writeVamas(finalBlocks,{version:'0.3'});
  const bad=unsupportedWindows1252(text);
  if(bad.length)throw new Error(`Unsupported Windows-1252 character${bad.length===1?'':'s'}: ${bad.map(x=>`“${x}”`).join(', ')}. Rename the sample or remove the unsupported character before export.`);
  downloadBlob(encodeVamas(text),fileName);
}

function exportFinalVamas(){
  if(!state.builder.length)return;
  try{
    const datasets=builderDatasetMap();
    if(state.exportMode==='separate'){
      let delay=0;
      for(const entry of datasets.values()){
        const blocks=entry.items.map(([,x])=>x);
        const fileName=`${downloadBaseName(entry.name,'Sample')}.vms`;
        setTimeout(()=>{
          try{exportBlocks(blocks,fileName)}
          catch(ex){showExportError(ex)}
        },delay);
        delay+=140;
      }
    }else{
      const base=downloadBaseName(document.getElementById('exportName').value);
      exportBlocks(orderedBuilderBlocks(),`${base}.vms`);
    }
  }catch(ex){showExportError(ex)}
}

function showExportError(ex){
  console.error(ex);
  const err=document.getElementById('error');
  err.textContent=`VAMAS export failed: ${ex.message}`;
  err.style.display='block';
}

function renderAll(){
  document.getElementById('organizationCard').classList.toggle('workflowHidden',!state.files.length);
  document.getElementById('reviewWorkspace').classList.toggle('workflowHidden',!state.namesConfirmed);
  renderImportInfo();
  renderNav();
  renderAcquisitions();
  renderMain();
  renderBuilder();
}

document.getElementById('confirmNames').onclick=confirmNamesFromUI;
document.getElementById('groupSelected').onclick=groupSelected;
document.getElementById('resetGroups').onclick=resetGroups;
document.getElementById('clearBuilder').onclick=()=>{state.builder=[];renderBuilder();renderNav()};
document.getElementById('openFiles').onclick=()=>document.getElementById('files').click();
document.getElementById('exportCombinedMode').onclick=()=>{state.exportMode='combined';renderBuilder()};
document.getElementById('exportSeparateMode').onclick=()=>{state.exportMode='separate';renderBuilder()};

document.getElementById('files').addEventListener('change',async e=>{
  const err=document.getElementById('error');
  err.style.display='none';
  state.active=null;
  state.activeSample=null;
  state.sampleMessage='';
  try{
    const pending=[];
    for(const f of e.target.files){
      const key=[f.name,f.size,f.lastModified].join('|');
      if(state.fileKeys.has(key))continue;
      let parsed;
      try{
        const text=await readVamasText(f);
        parsed=parseVamas(text,f.name);
      }catch(ex){
        throw new Error(`${f.name}: ${ex.message}`);
      }
      parsed.size=f.size;
      parsed.fileKey=key;
      parsed.blocks.forEach(b=>{
        b.uid=key+'#'+b.index;
        b.vamasMeta={
          institution:parsed.institution,
          instrument:parsed.instrument,
          operator:parsed.operator,
          experiment:parsed.experiment
        };
      });
      pending.push({key,parsed});
    }
    pending.forEach(({key,parsed})=>{state.files.push(parsed);state.fileKeys.add(key)});
    syncSampleMaps();
    state.namesConfirmed=false;
    state.builder=[];
    rebuildGroups();
    renderAll();
    e.target.value='';
  }catch(ex){
    console.error(ex);
    err.textContent=ex.message;
    err.style.display='block';
  }
});

document.getElementById('clearFiles').onclick=()=>{
  state.files=[];
  state.fileKeys.clear();
  state.groups.clear();
  state.renameMap.clear();
  state.groupMap.clear();
  state.active=null;
  state.activeSample=null;
  state.sampleMessage='';
  state.builder=[];
  state.namesConfirmed=false;
  renderAll();
};

document.addEventListener('xps-theme-change',()=>{
  if(document.getElementById('main'))renderMain();
});

renderAll();
