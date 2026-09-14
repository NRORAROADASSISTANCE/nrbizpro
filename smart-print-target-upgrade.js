/* NR BizPro Smart Print — TARGET ENGINE v9
   Targeted illumination correction: remove broad camera shadow while preserving ink/details. */
(function(){
'use strict';
const $=id=>document.getElementById(id),Y=(r,g,b)=>.2126*r+.7152*g+.0722*b,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),raf=()=>new Promise(r=>requestAnimationFrame(r));
function read(f){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)})}
function image(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src})}
function smooth(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)}
function show(html){const m=$('preview'),b=$('previewBody');if(!m||!b)return;b.innerHTML=html;m.classList.remove('hidden')}
async function makeTarget(src){
 const im=await image(src),maxW=1800,maxH=2400,scale=Math.min(1,maxW/im.naturalWidth,maxH/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 const data=ctx.getImageData(0,0,w,h),p=data.data;
 // Low-frequency illumination field: broad shadow survives, text and stamps are averaged out.
 const tw=96,th=128,t=document.createElement('canvas');t.width=tw;t.height=th;const tc=t.getContext('2d',{willReadFrequently:true});tc.drawImage(c,0,0,tw,th);
 const td=tc.getImageData(0,0,tw,th).data,raw=new Float32Array(tw*th);
 for(let i=0;i<raw.length;i++){const q=i*4;raw[i]=Y(td[q],td[q+1],td[q+2])}
 const blur=raw.slice(),tmp=new Float32Array(raw.length);
 for(let pass=0;pass<7;pass++){
   for(let y=0;y<th;y++)for(let x=0;x<tw;x++){
     let s=0,n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=clamp(x+dx,0,tw-1),yy=clamp(y+dy,0,th-1);s+=blur[yy*tw+xx];n++}tmp[y*tw+x]=s/n;
   }
   blur.set(tmp);
 }
 function sample(x,y){x=clamp(x,0,tw-1);y=clamp(y,0,th-1);const x0=Math.floor(x),x1=Math.min(tw-1,x0+1),y0=Math.floor(y),y1=Math.min(th-1,y0+1),fx=x-x0,fy=y-y0;return (blur[y0*tw+x0]*(1-fx)+blur[y0*tw+x1]*fx)*(1-fy)+(blur[y1*tw+x0]*(1-fx)+blur[y1*tw+x1]*fx)*fy}
 // Clean-paper reference: use the brighter/right portion, row by row.
 const refs=new Float32Array(th);
 for(let y=0;y<th;y++){const a=[];for(let x=Math.floor(tw*.70);x<tw;x++){const v=blur[y*tw+x];if(v>100)a.push(v)}a.sort((m,n)=>m-n);refs[y]=a.length?clamp(a[Math.floor(a.length*.70)],150,242):190}
 function ref(y){y=clamp(y,0,th-1);const y0=Math.floor(y),y1=Math.min(th-1,y0+1),f=y-y0;return refs[y0]*(1-f)+refs[y1]*f}
 for(let y=0;y<h;y++){
   const fy=y*(th-1)/Math.max(1,h-1),rr=ref(fy);
   for(let x=0;x<w;x++){
     const i=(y*w+x)*4,r=p[i],g=p[i+1],b=p[i+2],l=Y(r,g,b),mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0;
     const local=Math.max(35,sample(x*(tw-1)/Math.max(1,w-1),fy));
     const deficit=clamp((rr-local)/Math.max(50,rr),0,.70);
     // Broad camera shadow is strongest at the left and fades before the clean/right side.
     const left=1-smooth(.06,.78,x/Math.max(1,w-1));
     const edge=left*left*(3-2*left);
     // If the pixel is much darker than its low-frequency neighbourhood, it is likely ink/lines.
     // If it follows the neighbourhood, it is likely shadowed paper and can be lifted.
     const detail=Math.abs(l-local);
     const inkSafe=1-smooth(10,46,detail);
     const paperNeutral=1-smooth(.55,.78,sat);
     const brightEnough=.45+.55*smooth(55,135,l);
     let amount=deficit*edge*inkSafe*paperNeutral*brightEnough;
     // Strong enough to remove the visible left band, but bounded to avoid bleaching the document.
     amount*=.95;
     const gain=1+clamp(amount,0,.48);
     p[i]=clamp(r*gain,0,255);p[i+1]=clamp(g*gain,0,255);p[i+2]=clamp(b*gain,0,255);
   }
   if(y%16===0)await raf();
 }
 ctx.putImageData(data,0,0);return c.toDataURL('image/jpeg',.985)
}
async function preview(){
 const input=$('fileInput'),f=input&&input.files&&input.files[0];if(!f){alert('Upload a WhatsApp image or PDF first.');return}const copies=Math.max(1,+($('copies')?.value||1));
 show('<div style="padding:22px;text-align:center"><b>Preparing TARGET…</b><br><small>Removing the broad left camera shadow while protecting document details.</small></div>');
 try{let pages=[];
   if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){pages=(window.sourcePages||[]).slice();if(!pages.length){show('<div class="warn">PDF is still loading. Please Preview again.</div>');return}}
   else pages=[await makeTarget(await read(f))];
   window.__nrSmartPrintTargetPages=pages;
   show('<div class="ai-badge">✓ TARGET OUTPUT — left camera shadow reduced; ink, signatures and colours protected.</div>'+pages.map((p,i)=>'<div class="preview-sheet"><p><b>Target • Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" alt="Target output" style="max-width:100%;height:auto;display:block;margin:auto"></div>').join(''));
 }catch(e){console.error('Smart Print TARGET v9',e);show('<div class="warn">Target generation failed safely. Original source was not modified.</div>')}
}
function patchPrint(){if(window.__nrTargetPrintPatched)return;window.__nrTargetPrintPatched=true;const old=window.confirmPrint;window.confirmPrint=function(){const target=window.__nrSmartPrintTargetPages;if(!target||!target.length)return old&&old.apply(this,arguments);const copies=Math.max(1,+($('copies')?.value||1)),paper=$('paper')?.value||'A4',w=window.open('','_blank');if(!w){alert('Allow pop-ups to print.');return}const pages=[];for(let c=0;c<copies;c++)pages.push(...target);w.document.write('<html><head><title>NR BizPro Smart Print Target</title><style>@page{size:'+paper+';margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>'+pages.map(p=>'<div class="page"><img src="'+p+'"></div>').join('')+'<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script></body></html>');w.document.close()}}
function install(){if(window.__nrTargetV9Installed)return;window.__nrTargetV9Installed=true;window.previewPrint=preview;patchPrint()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
