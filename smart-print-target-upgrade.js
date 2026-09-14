/* NR BizPro Smart Print — TARGET OUTPUT v6
   Dedicated target pipeline: preserve ink, correct left camera illumination, and feed the same target into Preview + Print. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const Y=(r,g,b)=>.2126*r+.7152*g+.0722*b;
const raf=()=>new Promise(r=>requestAnimationFrame(r));
function read(file){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(file)})}
function image(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src})}
async function makeTarget(src){
  const im=await image(src), maxW=1800,maxH=2400,scale=Math.min(1,maxW/im.naturalWidth,maxH/im.naturalHeight);
  const w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
  const data=ctx.getImageData(0,0,w,h),p=data.data;
  // Low-resolution luminance field for camera illumination, not document content.
  const tw=90,th=120,t=document.createElement('canvas');t.width=tw;t.height=th;
  const tx=t.getContext('2d',{willReadFrequently:true});tx.drawImage(c,0,0,tw,th);
  const td=tx.getImageData(0,0,tw,th).data,field=new Float32Array(tw*th);
  for(let i=0;i<field.length;i++){const q=i*4;field[i]=Y(td[q],td[q+1],td[q+2])}
  const med=(a)=>{if(!a.length)return 190;a.sort((x,y)=>x-y);return a[Math.floor(a.length*.65)]};
  const rowRef=new Float32Array(th);
  for(let y=0;y<th;y++){
    const a=[];for(let x=Math.floor(tw*.55);x<tw;x++){const v=field[y*tw+x];if(v>95)a.push(v)}
    rowRef[y]=clamp(med(a),155,235);
  }
  const sample=(x,y)=>{x=clamp(x,0,tw-1);y=clamp(y,0,th-1);const x0=Math.floor(x),x1=Math.min(tw-1,x0+1),y0=Math.floor(y),y1=Math.min(th-1,y0+1),fx=x-x0,fy=y-y0;return (field[y0*tw+x0]*(1-fx)+field[y0*tw+x1]*fx)*(1-fy)+(field[y1*tw+x0]*(1-fx)+field[y1*tw+x1]*fx)*fy};
  const refAt=y=>{y=clamp(y,0,th-1);const y0=Math.floor(y),y1=Math.min(th-1,y0+1),f=y-y0;return rowRef[y0]*(1-f)+rowRef[y1]*f};
  for(let y=0;y<h;y++){
    const fy=y*(th-1)/Math.max(1,h-1),rr=refAt(fy);
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4,r=p[i],g=p[i+1],b=p[i+2],l=Y(r,g,b),mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?((mx-mn)/mx):0;
      const fx=x*(tw-1)/Math.max(1,w-1),local=Math.max(28,sample(fx,fy));
      // Strong only where illumination is genuinely darker than the clean paper reference.
      let deficiency=clamp((rr-local)/Math.max(70,rr),0,.90);
      // Camera shadow is strongest on the left and fades out before the right side.
      const left=1-Math.min(1,Math.max(0,(x/w-.08)/.62));
      const edge=left*left*(3-2*left);
      // Do not lift black ink/signatures; protect saturated stamps and artwork.
      const ink=l<48?0:clamp((l-48)/55,0,1);
      const colour=sat>.58?.22:(sat>.38?.55:1);
      let amount=deficiency*edge*ink*colour;
      // Additional direct lift makes a dark paper region visibly match the clean side.
      let gain=1+clamp(amount*1.55,0,.92);
      if(l<82)gain=1+(gain-1)*.45;
      if(l>205)gain=1+(gain-1)*.65;
      p[i]=clamp(r*gain,0,255);p[i+1]=clamp(g*gain,0,255);p[i+2]=clamp(b*gain,0,255);
    }
    if(y%16===0)await raf();
  }
  ctx.putImageData(data,0,0);
  return c.toDataURL('image/jpeg',.97);
}
function show(html){const m=$('preview'),b=$('previewBody');if(!m||!b)return;b.innerHTML=html;m.classList.remove('hidden')}
async function preview(){
  const input=$('fileInput'),f=input&&input.files&&input.files[0];
  if(!f){alert('Upload a WhatsApp image or PDF first.');return}
  const copies=Math.max(1,+($('copies')?.value||1));
  show('<div style="padding:22px;text-align:center"><b>Preparing Smart Xerox Target…</b><br><small>Removing camera shadow and building the print target.</small></div>');
  try{
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
      const pages=window.sourcePages||[];
      if(!pages.length){show('<div class="warn">PDF is still loading. Please Preview again after the PDF finishes loading.</div>');return}
      window.__nrSmartPrintTargetPages=pages.slice();
    }else{
      window.__nrSmartPrintTargetPages=[await makeTarget(await read(f))];
    }
    const pages=window.__nrSmartPrintTargetPages;
    show('<div class="ai-badge">✓ SMART XEROX TARGET — camera shadow removed with document-safe illumination correction.</div>'+pages.map((p,i)=>'<div class="preview-sheet"><p><b>Target • Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" alt="Smart Xerox target" style="max-width:100%;height:auto;display:block;margin:auto"></div>').join(''));
  }catch(e){console.error('Smart Print TARGET v6',e);show('<div class="warn">Target generation failed. Please select the source image again and Preview.</div>')}
}
function patchPrint(){
  if(window.__nrTargetPrintPatched)return;window.__nrTargetPrintPatched=true;
  const old=window.confirmPrint;
  window.confirmPrint=function(){
    const target=window.__nrSmartPrintTargetPages;
    if(target&&target.length){
      const original=window.processedPages;
      // Main app keeps its private processedPages; temporarily replace the print source through a small print clone.
      const copies=Math.max(1,+($('copies')?.value||1)),paper=$('paper')?.value||'A4';
      const w=window.open('','_blank');if(!w){alert('Allow pop-ups to print.');return}
      const pages=[];for(let c=0;c<copies;c++)pages.push(...target);
      w.document.write('<html><head><title>NR BizPro Smart Print Target</title><style>@page{size:'+paper+';margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>'+pages.map(p=>'<div class="page"><img src="'+p+'"></div>').join('')+'<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\\/script></body></html>');
      w.document.close();
      return;
    }
    return old&&old.apply(this,arguments);
  };
}
function install(){
  if(window.__nrTargetV6Installed)return;window.__nrTargetV6Installed=true;
  window.previewPrint=preview;patchPrint();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
