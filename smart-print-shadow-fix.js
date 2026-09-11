/* NR BizPro Smart Print — left camera-shadow correction v5
   Strong local illumination correction for phone-camera document shadows.
   Keeps geometry unchanged and protects dark printed text. */
(function(){
'use strict';
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
const clamp=(v,a=0,b=255)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
function fixShadow(src,mode){
 const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(src,0,0);
 const im=x.getImageData(0,0,w,h),d=im.data;
 const tw=Math.max(72,Math.min(180,Math.round(w/24))),th=Math.max(96,Math.min(220,Math.round(h/24)));
 const sm=document.createElement('canvas');sm.width=tw;sm.height=th;
 const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(c,0,0,tw,th);
 const sd=sx.getImageData(0,0,tw,th).data,lum=new Float32Array(tw*th);
 for(let y=0;y<th;y++)for(let xx=0;xx<tw;xx++){const i=(y*tw+xx)*4;lum[y*tw+xx]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2]}
 const rowRef=new Float32Array(th);
 for(let y=0;y<th;y++){
  const vals=[];
  for(let xx=Math.floor(tw*.72);xx<Math.floor(tw*.98);xx++){const v=lum[y*tw+xx];if(v>75)vals.push(v)}
  vals.sort((a,b)=>a-b);rowRef[y]=vals.length?vals[Math.floor(vals.length*.60)]:205;rowRef[y]=clamp(rowRef[y],185,235);
 }
 for(let y=0;y<h;y++){
  const fy=y*(th-1)/Math.max(1,h-1),y0=Math.floor(fy),y1=Math.min(th-1,y0+1),ty=fy-y0,rr=rowRef[y0]*(1-ty)+rowRef[y1]*ty;
  for(let xx=0;xx<w;xx++){
   const xn=xx/Math.max(1,w-1),edge=smooth(clamp(1-xn/.72,0,1));
   const fx=xn*(tw-1),x0=Math.floor(fx),x1=Math.min(tw-1,x0+1),tx=fx-x0;
   const local=(lum[y0*tw+x0]*(1-tx)+lum[y0*tw+x1]*tx)*(1-ty)+(lum[y1*tw+x0]*(1-tx)+lum[y1*tw+x1]*tx)*ty;
   const deficit=clamp((rr-local)/Math.max(55,rr),0,.94);
   let amount=Math.min(1.65,deficit*(1.05+1.85*edge));
   const i=(y*w+xx)*4,r=d[i],g=d[i+1],b=d[i+2],L=.2126*r+.7152*g+.0722*b;
   let protect;
   if(L<28)protect=.015;
   else if(L<48)protect=.12+.18*(L-28)/20;
   else if(L<75)protect=.30+.45*(L-48)/27;
   else if(L<120)protect=.75+.25*(L-75)/45;
   else protect=1;
   const eg=1+amount*protect;
   let nr=clamp(r*eg),ng=clamp(g*eg),nb=clamp(b*eg);
   if(mode==='Black & White'){let v=.2126*nr+.7152*ng+.0722*nb;v=clamp((v-8)*1.18+8);nr=ng=nb=v}
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
  body.innerHTML=`<div class="ai-badge">✓ Xerox Clean — left camera shadow strongly corrected; original colour preserved; dark document details protected.</div><div class="preview-sheet"><p><b>Document • Page 1 • ${copies} copy/copies</b></p><img src="${page}" alt="Print preview page 1"></div>`;
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
