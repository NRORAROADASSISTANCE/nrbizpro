/* NR BizPro Smart Print — targeted left camera-shadow correction v3
   Stronger shadow lift, colour-safe, no external libraries. */
(function(){
'use strict';
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
const clamp=(v,a=0,b=255)=>Math.max(a,Math.min(b,v));
function fixShadow(src,mode){
 const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});
 x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(src,0,0);
 const im=x.getImageData(0,0,w,h),d=im.data;
 const tw=Math.max(40,Math.min(120,Math.round(w/36))),th=Math.max(50,Math.min(140,Math.round(h/36)));
 const sm=document.createElement('canvas');sm.width=tw;sm.height=th;const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(c,0,0,tw,th);
 const sd=sx.getImageData(0,0,tw,th).data,col=new Float32Array(tw);
 for(let xx=0;xx<tw;xx++){
  let sum=0,n=0;
  for(let yy=Math.floor(th*.06);yy<Math.floor(th*.94);yy++){
   const i=(yy*tw+xx)*4,L=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];
   if(L>45){sum+=L;n++}
  }
  col[xx]=n?sum/n:205;
 }
 let ref=0,rn=0;for(let i=Math.floor(tw*.72);i<tw;i++){ref+=col[i];rn++}ref=rn?ref/rn:210;
 ref=clamp(ref,190,228);
 for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){
  const xn=xx/Math.max(1,w-1);
  const z=clamp(1-(xn/.55),0,1),zone=z*z*(3-2*z);
  const fx=xn*(tw-1),a=Math.floor(fx),bb=Math.min(tw-1,a+1),t=fx-a;
  const local=col[a]*(1-t)+col[bb]*t;
  let deficit=clamp((ref-local)/Math.max(75,ref),0,.90);
  let amount=deficit*(0.78+1.35*zone);
  amount=Math.min(.98,amount);
  const i=(y*w+xx)*4,r=d[i],g=d[i+1],b=d[i+2],L=.2126*r+.7152*g+.0722*b;
  let protect;
  if(L<28) protect=.03;
  else if(L<55) protect=.10+.18*(L-28)/27;
  else if(L<85) protect=.28+.42*(L-55)/30;
  else if(L<125) protect=.70+.30*(L-85)/40;
  else protect=1;
  const eg=1+amount*protect;
  let nr=clamp(r*eg),ng=clamp(g*eg),nb=clamp(b*eg);
  if(mode==='Black & White'){
   let v=.2126*nr+.7152*ng+.0722*nb;
   v=clamp((v-8)*1.10+8);
   nr=ng=nb=v;
  }
  d[i]=nr;d[i+1]=ng;d[i+2]=nb;
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
  body.innerHTML=`<div class="ai-badge">✓ Xerox Clean — left camera shadow reduced, original colour preserved and dark document details protected.</div><div class="preview-sheet"><p><b>Document • Page 1 • ${copies} copy/copies</b></p><img src="${page}" alt="Print preview page 1"></div>`;
  document.getElementById('preview').classList.remove('hidden');
 }catch(e){console.error(e);return original.apply(this,arguments)}
};
const baseConfirm=window.confirmPrint;
if(typeof baseConfirm==='function')window.confirmPrint=function(){
 const pages=window.__shadowFixedPages;if(!pages||!pages.length)return baseConfirm.apply(this,arguments);
 const copies=Math.max(1,+document.getElementById('copies').value||1),paper=document.getElementById('paper').value,w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');
 const all=[];for(let i=0;i<copies;i++)all.push(...pages);
 w.document.write(`<html><head><title>NR BizPro Smart Print</title><style>@page{size:${paper};margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>${all.map(p=>`<div class="page"><img src="${p}"></div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\\/script></body></html>`);w.document.close();
 setTimeout(()=>{try{const key='nr-bizpro-smart-print-customer-test-v1',d=JSON.parse(localStorage.getItem(key)||'{}');if(location.search.includes('customerTest=1')){d.test=d.test||{licensed:false,expires:null,trialCopies:0};d.test.trialCopies=(d.test.trialCopies||0)+copies;localStorage.setItem(key,JSON.stringify(d))}}catch(e){}document.getElementById('preview').classList.add('hidden');window.__shadowFixedPages=[]},1200);
};
})();
