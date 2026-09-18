(function(){
'use strict';
class VamasError extends Error{}
class LineReader{
  constructor(text){this.lines=text.replace(/\r/g,'').split('\n');this.i=0;this.context='VAMAS header'}
  location(line=this.i+1){return `line ${line}${this.context?` while reading ${this.context}`:''}`}
  read(){if(this.i>=this.lines.length)throw new VamasError(`Unexpected end of file at ${this.location()}`);return this.lines[this.i++].trim()}
  raw(){if(this.i>=this.lines.length)throw new VamasError(`Unexpected end of file at ${this.location()}`);return this.lines[this.i++]}
  int(label='integer'){
    const line=this.i+1,v=Number(this.read());
    if(!Number.isInteger(v))throw new VamasError(`Expected ${label} at ${this.location(line)}`);
    return v;
  }
  count(label){
    const line=this.i+1,v=this.int(label);
    if(v<0)throw new VamasError(`Expected a non-negative ${label} at ${this.location(line)}`);
    return v;
  }
  num(label='number'){
    const line=this.i+1,v=Number(this.read());
    if(!Number.isFinite(v))throw new VamasError(`Expected ${label} at ${this.location(line)}`);
    return v;
  }
  skip(n){if(!Number.isInteger(n)||n<0)throw new VamasError(`Invalid entry count at ${this.location()}`);this.i+=n;if(this.i>this.lines.length)throw new VamasError(`Unexpected end of file at ${this.location(this.lines.length+1)}`)}
  trailingEntries(){const out=[];for(let i=this.i;i<this.lines.length;i++){const text=this.lines[i].trim();if(text)out.push({line:i+1,text})}return out}
}
function inherit(b,first,key,reader){if(reader){b[key]=reader()}else if(first){b[key]=first[key]}}
function parseVamas(text,fileName){
  const r=new LineReader(text), meta={fileName};
  const magic=r.read();if(!magic.startsWith('VAMAS Surface Chemical Analysis Standard Data Transfer Format'))throw new VamasError('This is not a VAMAS file.');
  meta.magic=magic;meta.institution=r.read();meta.instrument=r.read();meta.operator=r.read();meta.experiment=r.read();
  let n=r.count('experiment comment count');meta.comments=[];for(let i=0;i<n;i++)meta.comments.push(r.raw());
  meta.expMode=r.read();meta.scanMode=r.read();
  if(meta.scanMode!=='REGULAR')throw new VamasError(`Unsupported VAMAS scan mode “${meta.scanMode||'unspecified'}”. Only REGULAR spectra are currently supported.`);
  if(['MAP','MAPD','NORM','SDP'].includes(meta.expMode))meta.nRegions=r.count('region count');
  if(['MAP','MAPD'].includes(meta.expMode)){meta.nPositions=r.count('analysis-position count');meta.nx=r.count('X-coordinate count');meta.ny=r.count('Y-coordinate count')}
  meta.expVarCount=r.count('experimental-variable count');meta.expVars=[];for(let i=0;i<meta.expVarCount;i++)meta.expVars.push([r.read(),r.read()]);
  n=r.int('block-parameter inclusion count');const incl=Array(40).fill(n<=0),all=Array(40).fill(true);for(let i=0;i<Math.abs(n);i++){const idx=r.int('block-parameter index')-1;if(idx<0||idx>=40)throw new VamasError(`Block-parameter index must be between 1 and 40 at ${r.location(r.i)}`);incl[idx]=!incl[idx]}
  n=r.count('manually-entered-item count');meta.manual=[];for(let i=0;i<n;i++)meta.manual.push(r.raw());
  meta.expFutureCount=r.count('experiment future-entry count');meta.blockFutureCount=r.count('block future-entry count');meta.expFuture=[];for(let i=0;i<meta.expFutureCount;i++)meta.expFuture.push(r.raw());
  meta.blockCount=r.count('block count');meta.blocks=[];let first=null,currentRoot=null;
  for(let bi=0;bi<meta.blockCount;bi++){
    r.context=`block ${bi+1} of ${meta.blockCount}`;
    const inc=bi===0?all:incl,b={index:bi,fileName};b.name=r.read();b.sample=r.read();
    b.dateParts=[];for(let k=0;k<7;k++)b.dateParts[k]=inc[k]?r.read():(first?first.dateParts[k]:'');
    if(inc[7]){const c=r.count('block comment count');b.comments=[];for(let i=0;i<c;i++)b.comments.push(r.raw())}else b.comments=first?.comments||[];
    if(inc[8])b.tech=r.read();else b.tech=first?.tech||'';
    if(inc[9]&&['MAP','MAPDP'].includes(meta.expMode))b.xy=[r.read(),r.read()];
    if(inc[10]){b.expValues=[];for(let i=0;i<meta.expVarCount;i++)b.expValues.push(r.read())}
    if(inc[11])b.sourceLabel=r.read();else b.sourceLabel=first?.sourceLabel;
    if(inc[12]&&(['MAPDP','MAPSVDP','SDP','SDPSV'].includes(meta.expMode)||['SNMS energy spec','FABMS','FABMS energy spec','ISS','SIMS','SIMS energy spec','SNMS'].includes(b.tech))){b.sputter=[r.read(),r.read(),r.read()]}
    if(inc[13])b.sourceEnergy=r.read();else b.sourceEnergy=first?.sourceEnergy;
    if(inc[14])b.sourceStrength=r.read();
    if(inc[15])b.sourceBeam=[r.read(),r.read()];
    if(inc[16]&&['MAP','MAPDP','MAPSV','MAPSVDP','SEM'].includes(meta.expMode))b.fov=[r.read(),r.read()];
    if(inc[17]&&['SEM','MAPSV','MAPSVDP'].includes(meta.expMode))throw new VamasError('Mapping mode not supported in this prototype');
    if(inc[18])b.sourcePolar=r.read();if(inc[19])b.sourceAzimuth=r.read();
    if(inc[20])b.analyserMode=r.read();else b.analyserMode=first?.analyserMode;
    if(inc[21])b.passEnergy=r.read();else b.passEnergy=first?.passEnergy;
    if(inc[22]&&b.tech==='AES diff')b.diffWidth=r.read();if(inc[23])b.magnification=r.read();if(inc[24])b.workFunction=r.read();if(inc[25])b.targetBias=r.read();
    if(inc[26])b.analysisWidth=[r.read(),r.read()];if(inc[27])b.takeoff=[r.read(),r.read()];
    if(inc[28])b.species=r.read();else b.species=first?.species;
    if(inc[29]){b.transition=r.read();b.charge=r.read()}else{b.transition=first?.transition;b.charge=first?.charge}
    if(inc[30]){b.xLabel=r.read();b.xUnit=r.read();b.xStart=r.num('abscissa start');b.xStep=r.num('abscissa increment')}else{Object.assign(b,{xLabel:first.xLabel,xUnit:first.xUnit,xStart:first.xStart,xStep:first.xStep})}
    if(inc[31]){const cv=r.count('corresponding-variable count');b.corVars=[];for(let i=0;i<cv;i++)b.corVars.push([r.read(),r.read()])}else b.corVars=first.corVars.map(x=>[...x]);
    if(inc[32])b.signalMode=r.read();else b.signalMode=first?.signalMode;
    if(inc[33])b.collectionTime=r.num();else b.collectionTime=first?.collectionTime;
    if(inc[34])b.scans=r.count('scan count');else b.scans=first?.scans;
    if(inc[35])b.timeCorrection=r.read();
    if(inc[36]&&['AES diff','AES dir','EDX','ELS','UPS','XPS','XRF'].includes(b.tech)&&['MAPDP','MAPSVDP','SDP','SDPSV'].includes(meta.expMode))r.skip(7);
    if(inc[37])b.tilt=[r.read(),r.read()];if(inc[38])b.rotation=r.read();
    if(inc[39]){const q=r.count('additional-parameter count');b.additional=[];for(let i=0;i<q;i++)b.additional.push([r.read(),r.read(),r.read()])}
    r.skip(meta.blockFutureCount);
    b.steps=r.count('ordinate-value count');
    if(!b.corVars.length)throw new VamasError(`No corresponding variable is declared for block “${b.name||bi+1}”.`);
    if(b.steps%b.corVars.length!==0)throw new VamasError(`The ordinate-value count (${b.steps}) is not divisible by the ${b.corVars.length} corresponding variables in block “${b.name||bi+1}”.`);
    b.minmax=[];for(let i=0;i<b.corVars.length;i++)b.minmax.push([r.num('ordinate minimum'),r.num('ordinate maximum')]);
    const vals=[];for(let i=0;i<b.steps;i++)vals.push(r.num());b.data=b.corVars.map((_,j)=>vals.filter((__,k)=>k%b.corVars.length===j));b.points=b.data[0]?.length||0;b.x=Array.from({length:b.points},(_,k)=>b.xStart+k*b.xStep);
    b.isProcessed=/^Pr:/i.test(b.name);b.region=b.name.replace(/^Pr:/i,'').trim();
    const s=b.sample.trim();const iter=/^(ite|iter|iteration)\s*\d+/i.test(s);
    if(!iter && s && !/^Pr:/i.test(s))currentRoot=s;
    b.logicalSample=iter?(currentRoot||fileName.replace(/\.[^.]+$/,'')):(s||currentRoot||fileName.replace(/\.[^.]+$/,''));
    // sourceSample is the dataset candidate detected inside this physical VAMAS file.
    // The preprocessor combines it with the physical file identity so identical sample names
    // from different files are never merged automatically.
    b.sourceSample=b.logicalSample;
    meta.blocks.push(b);if(!first)first=b;
  }
  r.context='end of VAMAS file';
  const trailing=r.trailingEntries();
  const hasStandardEndMarker=trailing.length===1&&/^end of experiment$/i.test(trailing[0].text);
  if(trailing.length&&!hasStandardEndMarker)throw new VamasError(`Unexpected content after the ${meta.blockCount} declared block${meta.blockCount===1?'':'s'} at line ${trailing[0].line}.`);
  meta.endMarker=hasStandardEndMarker?trailing[0].text:'';
  return meta;
}
function decodeVamas(buffer){
  const bytes=buffer instanceof ArrayBuffer?buffer:buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);
  try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}
  catch(_){return new TextDecoder('windows-1252').decode(bytes)}
}
function compatible(a,b){
  const eps=1e-9, reasons=[];
  if(a.points!==b.points)reasons.push('different point count');
  if(Math.abs(a.xStart-b.xStart)>eps||Math.abs(a.xStep-b.xStep)>eps)reasons.push('different energy grid');
  if(Math.abs(a.collectionTime-b.collectionTime)>1e-7)reasons.push('different collection time');
  if(String(a.passEnergy)!==String(b.passEnergy))reasons.push('different pass energy');
  if(a.corVars.length!==b.corVars.length||a.corVars.some((v,i)=>v[0]!==b.corVars[i]?.[0]))reasons.push('different corresponding variables');
  return reasons;
}
function sumBlocks(blocks){
  if(!blocks.length)return null;
  const ref=blocks[0];
  for(const b of blocks.slice(1)){
    const why=compatible(ref,b);
    if(why.length)return {error:why.join(', ')};
  }
  const totalScans=blocks.reduce((s,b)=>s+Math.max(1,Number(b.scans)||1),0);
  const isProcessed=blocks.length>1||blocks.some(b=>b.isProcessed);

  // Counts are additive. Instrumental corresponding variables such as Transmission are not.
  // Keep non-count columns from the reference acquisition so they are not artificially multiplied.
  const data=ref.data.map((col,j)=>{
    const label=String(ref.corVars?.[j]?.[0]||'').toLowerCase();
    const additive=j===0||label.includes('count');
    return additive
      ? col.map((_,i)=>blocks.reduce((s,b)=>s+(Number(b.data?.[j]?.[i])||0),0))
      : col.slice();
  });

  return {
    ...ref,
    name:isProcessed?'SUM:'+ref.region:ref.name,
    isProcessed,
    data,
    scans:totalScans,
    collectionTime:Number(ref.collectionTime)||0,
    sourceBlocks:blocks
  };
}

function lineValue(v,fallback='1e+037'){
  if(v===undefined||v===null||v==='')return fallback;
  return String(v).replace(/[\r\n]+/g,' ');
}
function numericValue(v,fallback=0){
  const n=Number(v);return Number.isFinite(n)?String(n):String(fallback);
}
function blockComments(b,version){
  const comments=[`XPS VAMAS Dataset Builder v${version}`];
  const sourceBlocks=(Array.isArray(b.sourceBlocks)&&b.sourceBlocks.length)?b.sourceBlocks:[b];
  const n=sourceBlocks.length;
  const allProcessed=sourceBlocks.every(x=>x?.isProcessed);
  comments.push(allProcessed
    ? 'Existing processed block preserved without resumming.'
    : `Validated final spectrum from ${n} selected raw acquisition${n===1?'':'s'}`);
  const files=[...new Set(sourceBlocks.map(x=>String(x?.fileName||'').trim()).filter(Boolean))];
  if(files.length)comments.push(`Source file${files.length===1?'':'s'}: ${files.join(', ')}`);
  comments.push('Processed blocks (Pr:) are final outputs and should not be resummed.');
  return comments;
}
function writeVamas(blocks,options={}){
  if(!blocks?.length)throw new VamasError('No validated spectra to export');
  const version=options.version||'0.3';
  const first=blocks[0];
  const meta=first.vamasMeta||{};
  const samples=[...new Set(blocks.map(b=>String(b.logicalSample||b.sample||'Sample')))];
  const regions=[...new Set(blocks.map(b=>String(b.region||b.name||'Region').replace(/^Pr:/i,'')))];
  const out=[];
  const push=(...v)=>out.push(...v.map(x=>String(x)));

  push('VAMAS Surface Chemical Analysis Standard Data Transfer Format 1988 May 4');
  push(lineValue(meta.institution,'Not Specified'));
  push(lineValue(meta.instrument,'Not Specified'));
  push(lineValue(meta.operator,'Not Specified'));
  push(lineValue(meta.experiment,'XPS VAMAS Dataset Builder'));
  const headerComments=[
    `Created by XPS VAMAS Dataset Builder v${version}`,
    `${samples.length} sample${samples.length===1?'':'s'} · ${blocks.length} validated block${blocks.length===1?'':'s'}`,
    ...samples.map(s=>`Sample: ${s}`)
  ];
  push(headerComments.length);headerComments.forEach(x=>push(x));
  push('NORM','REGULAR',Math.max(1,regions.length));
  push(0); // experimental variables
  push(0); // all 40 block parameters included
  push(0); // manually entered items
  push(0); // experiment future upgrade entries
  push(0); // block future upgrade entries
  push(blocks.length);

  for(const original of blocks){
    const b={...original};
    const region=String(b.region||b.name||'Region').replace(/^Pr:/i,'').trim()||'Region';
    const sample=String(b.logicalSample||b.sample||'Sample').trim()||'Sample';
    const name=b.isProcessed?`Pr:${region}`:String(b.name||region).replace(/^Pr:/i,'').trim()||region;
    push(name,sample);
    const dp=Array.isArray(b.dateParts)?b.dateParts:[];
    const now=new Date();
    const date=[dp[0]||now.getFullYear(),dp[1]||now.getMonth()+1,dp[2]||now.getDate(),dp[3]||now.getHours(),dp[4]||now.getMinutes(),dp[5]||now.getSeconds(),dp[6]||0];
    date.forEach(x=>push(lineValue(x,'0')));

    const comments=blockComments(b,version);
    push(comments.length);comments.forEach(x=>push(x));
    push(lineValue(b.tech,'XPS'));
    // no experimental variable values (header expVarCount = 0)
    push(lineValue(b.sourceLabel,'Al'));
    push(lineValue(b.sourceEnergy,'1486.68'));
    push(lineValue(b.sourceStrength));
    push(lineValue(b.sourceBeam?.[0]),lineValue(b.sourceBeam?.[1]));
    push(lineValue(b.sourcePolar),lineValue(b.sourceAzimuth));
    push(lineValue(b.analyserMode,'FAT'));
    push(lineValue(b.passEnergy,'20'));
    push(lineValue(b.magnification),lineValue(b.workFunction),lineValue(b.targetBias));
    push(lineValue(b.analysisWidth?.[0]),lineValue(b.analysisWidth?.[1]));
    push(lineValue(b.takeoff?.[0]),lineValue(b.takeoff?.[1]));
    push(lineValue(b.species,region),lineValue(b.transition,''),lineValue(b.charge,'-1'));
    push(lineValue(b.xLabel,'Kinetic Energy'),lineValue(b.xUnit,'eV'),numericValue(b.xStart),numericValue(b.xStep));

    const corVars=(Array.isArray(b.corVars)&&b.corVars.length)?b.corVars:[['Counts','d']];
    push(corVars.length);
    corVars.forEach(v=>push(lineValue(v?.[0],'Counts'),lineValue(v?.[1],'d')));
    push(lineValue(b.signalMode,'pulse counting'));
    push(numericValue(b.collectionTime));
    push(Math.max(1,Math.trunc(Number(b.scans)||1)));
    push(lineValue(b.timeCorrection));
    push(lineValue(b.tilt?.[0]),lineValue(b.tilt?.[1]));
    push(lineValue(b.rotation));
    const additional=Array.isArray(b.additional)?b.additional:[];
    push(additional.length);
    additional.forEach(a=>push(lineValue(a?.[0],''),lineValue(a?.[1],''),lineValue(a?.[2],'')));

    const points=Number(b.points)||b.data?.[0]?.length||0;
    const data=corVars.map((_,j)=>Array.from({length:points},(__,i)=>Number(b.data?.[j]?.[i])||0));
    const steps=points*corVars.length;
    push(steps);
    data.forEach(col=>{
      const finite=col.filter(Number.isFinite);
      push(finite.length?Math.min(...finite):0,finite.length?Math.max(...finite):0);
    });
    for(let i=0;i<points;i++)for(let j=0;j<corVars.length;j++)push(data[j][i]);
  }
  return out.join('\r\n')+'\r\n';
}

function unsupportedWindows1252(text){
  const special=new Set([0x20AC,0x201A,0x0192,0x201E,0x2026,0x2020,0x2021,0x02C6,0x2030,0x0160,0x2039,0x0152,0x017D,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,0x02DC,0x2122,0x0161,0x203A,0x0153,0x017E,0x0178]);
  const bad=[];
  for(const ch of String(text||'')){
    const cp=ch.codePointAt(0);
    const ok=cp<=0x7F||(cp>=0xA0&&cp<=0xFF)||special.has(cp);
    if(!ok&&!bad.includes(ch))bad.push(ch);
  }
  return bad;
}

function encodeVamas(text){
  // Windows-1252 maximises compatibility with older Casa/instrument workflows and preserves French accents.
  const special=new Map([
    [0x20AC,0x80],[0x201A,0x82],[0x0192,0x83],[0x201E,0x84],[0x2026,0x85],[0x2020,0x86],[0x2021,0x87],[0x02C6,0x88],[0x2030,0x89],[0x0160,0x8A],[0x2039,0x8B],[0x0152,0x8C],[0x017D,0x8E],
    [0x2018,0x91],[0x2019,0x92],[0x201C,0x93],[0x201D,0x94],[0x2022,0x95],[0x2013,0x96],[0x2014,0x97],[0x02DC,0x98],[0x2122,0x99],[0x0161,0x9A],[0x203A,0x9B],[0x0153,0x9C],[0x017E,0x9E],[0x0178,0x9F]
  ]);
  const bytes=[];
  for(const ch of text){
    const cp=ch.codePointAt(0);
    if(cp<=0x7F||cp>=0xA0&&cp<=0xFF)bytes.push(cp);
    else if(special.has(cp))bytes.push(special.get(cp));
    else bytes.push(0x3F);
  }
  return new Uint8Array(bytes);
}

window.XPSVamas={VamasError,parseVamas,decodeVamas,compatible,sumBlocks,writeVamas,encodeVamas,unsupportedWindows1252};
})();
