/* NR BizPro Smart Print — Xerox shadow correction v16
   Keeps the current v15 appearance and adds a targeted vertical-shadow correction. */
(function(){
'use strict';
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
const clamp=(v,a=0,b=255)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const pct=(a,p)=>{if(!a.length)return 205;const b=Array.from(a).sort((x,y)=>x-y);return b[Math.floor((b.length-1)*p)]};
function fixShadow(src,mode){
 const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
 const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});
 x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(src,0,0);
 const im=x.getImageData(0,0,w,h),d=im.data;
 const tw=Math.max(120,Math.min(220,Math.round(w/18))),th=Math.max(140,Math.min(280,Math.round(h/18)));
 const sm=document.createElement('canvas');sm.width=tw;sm.height=th;const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(c,0,0,tw,th);
 const raw=sx.getImageData(0,0,tw,th).data,lum=new Float32Array(tw*th);
 for(let y=0;y<th;y++)for(let xx=0;xx<tw;xx++){const i=(y*tw+xx)*4;lum[y*tw+xx]=.2126*raw[i]+.7152*raw[i+1]+.0722*raw[i+2]}
 function blur(a,rad){const out=new Float32Array(a.length),tmp=new Float32Array(a.length),rr=Math.max(1,rad);
  for(let y=0;y<th;y++){let sum=0;for(let k=-rr;k<=rr;k++)sum+=a[y*tw+Math.max(0,Math.min(tw-1,k))];for(let xx=0;xx<tw;xx++){if(xx){const ad=Math.min(tw-1,xx+rr),su=Math.max(0,xx-rr-1);sum+=a[y*tw+ad]-a[y*tw+su]}tmp[y*tw+xx]=sum/(rr*2+1)}}
  for(let xx=0;xx<tw;xx++){let sum=0;for(let k=-rr;k<=rr;k++)sum+=tmp[Math.max(0,Math.min(th-1,k))*tw+xx];for(let y=0;y<th;y++){if(y){const ad=Math.min(th-1,y+rr),su=Math.max(0,y-rr-1);sum+=tmp[ad*tw+xx]-tmp[su*tw+xx]}out[y*tw+xx]=sum/(rr*2+1)}}return out}
 const field=blur(blur(lum,Math.max(4,Math.round(tw*.07))),Math.max(4,Math.round(tw*.07)));
 /* Vertical camera shadow profile: use the upper luminance percentile of each column,
    so text and lines do not dominate the estimate. */
 const col=new Float32Array(tw),tmp=[];
 for(let xx=0;xx<tw;xx++){tmp.length=0;for(let y=0;y<th;y++){const v=lum[y*tw+xx];if(v>75)tmp.push(v)}col[xx]=pct(tmp,.78)}
 const colSmooth=new Float32Array(tw);const rad=Math.max(3,Math.round(tw*.035));
 for(let xx=0;xx<tw;xx++){let s=0,n=0;for(let k=-rad;k<=rad;k++){const q=xx+k;if(q>=0&&q<tw){s+=col[q];n++}}colSmooth[xx]=s/n}
 const right=[];for(let xx=Math.floor(tw*.78);xx<tw;xx++)if(colSmooth[xx]>115)right.push(colSmooth[xx]);
 const colRef=clamp(pct(right,.55),180,225);
 for(let y=0;y<h;y++){
  const fy=y*(th-1)/Math.max(1,h-1),y0=Math.floor(fy),y1=Math.min(th-1,y0+1),ty=fy-y0;
  for(let xx=0;xx<w;xx++){
   const fx=xx*(tw-1)/Math.max(1,w-1),x0=Math.floor(fx),x1=Math.min(tw-1,x0+1),tx=fx-x0;
   const local=field[y0*tw+x0]*(1-tx)*(1-ty)+field[y0*tw+x1]*tx*(1-ty)+field[y1*tw+x0]*(1-tx)*ty+field[y1*tw+x1]*tx*ty;
   const xn=xx/Math.max(1,w-1),profile=colSmooth[Math.max(0,Math.min(tw-1,Math.round(xn*(tw-1))))];
   const leftEdge=smooth(clamp((.88-xn)/.88,0,1));
   const verticalShadow=smooth(clamp((colRef-profile)/70,0,1));
   const deficit=clamp((colRef-local)/155,0,1);
   const i=(y*w+xx)*4,r=d[i],g=d[i+1],b=d[i+2],L=.2126*r+.7152*g+.0722*b;
   let protect;if(L<30)protect=.10;else if(L<55)protect=.25+.50*(L-30)/25;else if(L<95)protect=.75+.25*(L-55)/40;else protect=1;
   const strength=clamp((deficit*leftEdge*.82 + verticalShadow*.30)*.78,0,.58)*protect;
   let nr=r+(255-r)*strength,ng=g+(255-g)*strength,nb=b+(255-b)*strength;
   const gain=1+Math.min(.22,deficit*.22)*leftEdge*protect;nr=clamp(nr*gain);ng=clamp(ng*gain);nb=clamp(nb*gain);
   if(mode==='Black & White'){let v=.2126*nr+.7152*ng+.0722*nb;v=clamp(255*Math.pow(Math.max(0,v)/255,.90));nr=ng=nb=v}
   d[i]=nr;d[i+1]=ng;d[i+2]=nb;
  }
 }
 x.putImageData(im,0,0);return c;
}
function install(){const original=window.previewPrint;if(typeof original!=='function')return false;if(original.__nrShadowV16)return true;
 const wrapped=async function(){const input=document.getElementById('fileInput'),f=input&&input.files&&input.files[0];if(!f)return original.apply(this,arguments);if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return original.apply(this,arguments);
  try{if(window.canPrint&&!window.canPrint())return;const src=await new Promise((ok,bad)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=bad;r.readAsDataURL(f)});const im=await load(src),mode=document.getElementById('mode')?.value||'Color';const page=fixShadow(im,mode).toDataURL('image/png');window.__shadowFixedPages=[page];const copies=Math.max(1,+document.getElementById('copies').value||1),body=document.getElementById('previewBody');body.innerHTML=`<div class="ai-badge">✓ Xerox Clean — camera shadow gently reduced, original colour preserved and document details protected.</div><div class="preview-sheet"><p><b>Document • Page 1 • ${copies} copy/copies</b></p><img src="${page}" alt="Print preview page 1"></div>`;document.getElementById('preview').classList.remove('hidden')}catch(e){console.error(e);return original.apply(this,arguments)}};
 wrapped.__nrShadowV16=true;window.previewPrint=wrapped;const baseConfirm=window.confirmPrint;if(typeof baseConfirm==='function'&&!baseConfirm.__nrShadowV16){const confirmWrapped=function(){const pages=window.__shadowFixedPages;if(!pages||!pages.length)return baseConfirm.apply(this,arguments);const copies=Math.max(1,+document.getElementById('copies').value||1),paper=document.getElementById('paper').value,w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');const all=[];for(let i=0;i<copies;i++)all.push(...pages);w.document.write(`<html><head><title>NR BizPro Smart Print</title><style>@page{size:${paper};margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>${all.map(p=>`<div class="page"><img src="${p}"></div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script></body></html>`);w.document.close();setTimeout(()=>{try{const key='nr-bizpro-smart-print-customer-test-v1',d=JSON.parse(localStorage.getItem(key)||'{}');if(location.search.includes('customerTest=1')){d.test=d.test||{licensed:false,expires:null,trialCopies:0};d.test.trialCopies=(d.test.trialCopies||0)+copies;localStorage.setItem(key,JSON.stringify(d))}}catch(e){}document.getElementById('preview').classList.add('hidden');window.__shadowFixedPages=[]},1200)};confirmWrapped.__nrShadowV16=true;window.confirmPrint=confirmWrapped}return true}
if(!install()){let tries=0;const timer=setInterval(()=>{if(install()||++tries>40)clearInterval(timer)},50)}
})();