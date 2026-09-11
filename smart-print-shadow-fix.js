/* NR BizPro Smart Print — Xerox-style shadow correction v7
   Target: remove broad camera shadow from the LEFT side only.
   Geometry unchanged; colour channels are scaled together so colour stays stable. */
(function(){
'use strict';
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
const clamp=(v,a=0,b=255)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
function percentile(a,p){if(!a.length)return 190;const b=Array.from(a).sort((x,y)=>x-y);return b[Math.max(0,Math.min(b.length-1,Math.floor((b.length-1)*p)))]}
function fixShadow(src,mode){
 const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(src,0,0);
 const im=x.getImageData(0,0,w,h),d=im.data;
 // Small working image -> heavily blurred luminance = camera illumination/shadow map.
 const tw=Math.max(64,Math.min(160,Math.round(w/24))),th=Math.max(80,Math.min(200,Math.round(h/24)));
 const sm=document.createElement('canvas');sm.width=tw;sm.height=th;
 const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(c,0,0,tw,th);
 const raw=sx.getImageData(0,0,tw,th).data, lum=new Float32Array(tw*th);
 for(let y=0;y<th;y++)for(let xx=0;xx<tw;xx++){const i=(y*tw+xx)*4;lum[y*tw+xx]=.2126*raw[i]+.7152*raw[i+1]+.0722*raw[i+2]}
 // 2-pass box blur gives a smooth illumination field without external libraries.
 function blur(srcArr,rad){const out=new Float32Array(srcArr.length),tmp=new Float32Array(srcArr.length);
  for(let y=0;y<th;y++){let sum=0;for(let k=-rad;k<=rad;k++){const q=Math.max(0,Math.min(tw-1,k));sum+=srcArr[y*tw+q]}for(let xx=0;xx<tw;xx++){if(xx>0){const add=Math.min(tw-1,xx+rad),sub=Math.max(0,xx-rad-1);sum+=srcArr[y*tw+add]-srcArr[y*tw+sub]}tmp[y*tw+xx]=sum/(rad*2+1)}}
  for(let xx=0;xx<tw;xx++){let sum=0;for(let k=-rad;k<=rad;k++){const q=Math.max(0,Math.min(th-1,k));sum+=tmp[q*tw+xx]}for(let y=0;y<th;y++){if(y>0){const add=Math.min(th-1,y+rad),sub=Math.max(0,y-rad-1);sum+=tmp[add*tw+xx]-tmp[sub*tw+xx]}out[y*tw+xx]=sum/(rad*2+1)}}return out;}
 const field=blur(blur(lum,Math.max(3,Math.round(tw*.055))),Math.max(3,Math.round(tw*.055)));
 // Reference is taken from the clean/right portion of the same document.
 const refs=[];for(let y=0;y<th;y++)for(let xx=Math.floor(tw*.72);xx<tw;xx++){const v=field[y*tw+xx];if(v>90)refs.push(v)}
 const ref=clamp(percentile(refs,.60),170,225);
 for(let y=0;y<h;y++){
  const fy=y*(th-1)/Math.max(1,h-1),y0=Math.floor(fy),y1=Math.min(th-1,y0+1),ty=fy-y0;
  for(let xx=0;xx<w;xx++){
   const fx=xx*(tw-1)/Math.max(1,w-1),x0=Math.floor(fx),x1=Math.min(tw-1,x0+1),tx=fx-x0;
   const local=field[y0*tw+x0]*(1-tx)*(1-ty)+field[y0*tw+x1]*tx*(1-ty)+field[y1*tw+x0]*(1-tx)*ty+field[y1*tw+x1]*tx*ty;
   const xn=xx/Math.max(1,w-1);
   // Correction is confined to the shadow side and feathered into the clean area.
   const edge=smooth(clamp(1-xn/.68,0,1));
   const desired=Math.pow(ref/Math.max(55,local),.88);
   const gain=1+Math.min(1.45,Math.max(0,desired-1))*edge;
   const i=(y*w+xx)*4,r=d[i],g=d[i+1],b=d[i+2],L=.2126*r+.7152*g+.0722*b;
   // Ink/photo details are protected only when they are much darker than their
   // surrounding paper; ordinary shadowed paper still receives the correction.
   const ratio=L/Math.max(35,local);
   let protection=1;
   if(ratio<.32)protection=.08;
   else if(ratio<.48)protection=.25+.55*(ratio-.32)/.16;
   else if(ratio<.62)protection=.80+.20*(ratio-.48)/.14;
   const eg=1+(gain-1)*protection;
   let nr=clamp(r*eg),ng=clamp(g*eg),nb=clamp(b*eg);
   if(mode==='Black & White'){let v=.2126*nr+.7152*ng+.0722*nb;v=clamp((v-10)*1.08+10);nr=ng=nb=v}
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
  body.innerHTML=`<div class="ai-badge">✓ Xerox Clean — left camera shadow removed with soft feathering; original colour and document details preserved.</div><div class="preview-sheet"><p><b>Document • Page 1 • ${copies} copy/copies</b></p><img src="${page}" alt="Print preview page 1"></div>`;
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
