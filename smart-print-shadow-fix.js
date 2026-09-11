/* NR BizPro Smart Print — Xerox-style lighting normalization v6
   Removes broad left camera shadow while keeping document geometry and colour stable. */
(function(){
'use strict';
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
const clamp=(v,a=0,b=255)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
function percentile(a,p){if(!a.length)return 205;a.sort((x,y)=>x-y);return a[Math.max(0,Math.min(a.length-1,Math.floor((a.length-1)*p)))]}
function fixShadow(src,mode){
 const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(src,0,0);
 const im=x.getImageData(0,0,w,h),d=im.data;
 // Build a low-resolution luminance profile. A column profile is used instead of
 // local per-pixel correction so text, stamps and security patterns are not washed out.
 const tw=Math.max(96,Math.min(220,Math.round(w/18))),th=Math.max(120,Math.min(260,Math.round(h/18)));
 const sm=document.createElement('canvas');sm.width=tw;sm.height=th;
 const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(c,0,0,tw,th);
 const sd=sx.getImageData(0,0,tw,th).data,lum=new Float32Array(tw*th);
 for(let y=0;y<th;y++)for(let xx=0;xx<tw;xx++){const i=(y*tw+xx)*4;lum[y*tw+xx]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2]}
 // Robust brightness per column: ignore black text/edges and use the upper paper range.
 const profile=new Float32Array(tw);
 for(let xx=0;xx<tw;xx++){
  const vals=[];for(let y=0;y<th;y++){const v=lum[y*tw+xx];if(v>65)vals.push(v)}
  profile[xx]=clamp(percentile(vals,.62),80,245);
 }
 // Smooth the 1-D illumination profile so printed content cannot create bands.
 const smoothProfile=new Float32Array(tw),rad=Math.max(4,Math.round(tw*.055));
 for(let xx=0;xx<tw;xx++){let s=0,n=0;for(let k=-rad;k<=rad;k++){const q=Math.max(0,Math.min(tw-1,xx+k));s+=profile[q];n++}smoothProfile[xx]=s/n}
 const refVals=[];for(let xx=Math.floor(tw*.78);xx<tw;xx++)refVals.push(smoothProfile[xx]);
 const ref=clamp(percentile(refVals,.55),175,238);
 const factors=new Float32Array(tw);
 for(let xx=0;xx<tw;xx++){
  const xn=xx/Math.max(1,tw-1), deficit=Math.max(0,ref-smoothProfile[xx]);
  // Correction is strongest at the left edge and fades out by ~72% of page width.
  const edge=smooth(clamp(1-xn/.72,0,1));
  const ratio=deficit/Math.max(65,ref);
  factors[xx]=1+Math.min(.82,ratio*(.92+1.15*edge));
 }
 for(let y=0;y<h;y++){
  const fy=y*(th-1)/Math.max(1,h-1),y0=Math.floor(fy),y1=Math.min(th-1,y0+1),ty=fy-y0;
  for(let xx=0;xx<w;xx++){
   const fx=xx*(tw-1)/Math.max(1,w-1),x0=Math.floor(fx),x1=Math.min(tw-1,x0+1),tx=fx-x0;
   const f=factors[x0]*(1-tx)+factors[x1]*tx;
   const i=(y*w+xx)*4,r=d[i],g=d[i+1],b=d[i+2],L=.2126*r+.7152*g+.0722*b;
   // Protect true ink and very dark photo/details; correct paper/midtones strongly.
   let protect;
   if(L<35)protect=.03;
   else if(L<60)protect=.10+.20*(L-35)/25;
   else if(L<95)protect=.30+.50*(L-60)/35;
   else protect=1;
   const eg=1+(f-1)*protect;
   let nr=clamp(r*eg),ng=clamp(g*eg),nb=clamp(b*eg);
   if(mode==='Black & White'){
    let v=.2126*nr+.7152*ng+.0722*nb;
    // Stable scanner-like grayscale; no thresholding and no random mode changes.
    v=clamp((v-12)*1.10+12);nr=ng=nb=v;
   }
   d[i]=nr;d[i+1]=ng;d[i+2]=nb;
  }
 }
 x.putImageData(im,0,0);return c;
}
const original=window.previewPrint;if(typeof original!=='function')return;
window.previewPrint=async function(){
 const input=document.getElementById('fileInput'),f=input&&input.files&&input.files[0];
 if(!f)return original.apply(this,arguments);
 if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return original.apply(this,arguments);
 try{
  if(window.canPrint&&!window.canPrint())return;
  const src=await new Promise((ok,bad)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=bad;r.readAsDataURL(f)});
  const im=await load(src),mode=document.getElementById('mode')?.value||'Color';
  const page=fixShadow(im,mode).toDataURL('image/png');window.__shadowFixedPages=[page];
  const copies=Math.max(1,+document.getElementById('copies').value||1),body=document.getElementById('previewBody');
  body.innerHTML=`<div class="ai-badge">✓ Xerox Clean — even lighting, left camera shadow reduced, original colour preserved and document details protected.</div><div class="preview-sheet"><p><b>Document • Page 1 • ${copies} copy/copies</b></p><img src="${page}" alt="Print preview page 1"></div>`;
  document.getElementById('preview').classList.remove('hidden');
 }catch(e){console.error(e);return original.apply(this,arguments)}
};
const baseConfirm=window.confirmPrint;
if(typeof baseConfirm==='function')window.confirmPrint=function(){
 const pages=window.__shadowFixedPages;if(!pages||!pages.length)return baseConfirm.apply(this,arguments);
 const copies=Math.max(1,+document.getElementById('copies').value||1),paper=document.getElementById('paper').value,w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');
 const all=[];for(let i=0;i<copies;i++)all.push(...pages);
 w.document.write(`<html><head><title>NR BizPro Smart Print</title><style>@page{size:${paper};margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>${all.map(p=>`<div class="page"><img src="${p}"></div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script></body></html>`);w.document.close();
 setTimeout(()=>{try{const key='nr-bizpro-smart-print-customer-test-v1',d=JSON.parse(localStorage.getItem(key)||'{}');if(location.search.includes('customerTest=1')){d.test=d.test||{licensed:false,expires:null,trialCopies:0};d.test.trialCopies=(d.test.trialCopies||0)+copies;localStorage.setItem(key,JSON.stringify(d))}}catch(e){}document.getElementById('preview').classList.add('hidden');window.__shadowFixedPages=[]},1200);
};
})();
