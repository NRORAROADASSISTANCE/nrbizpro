/* NR BizPro Smart Print — TARGET ENGINE v7
   Conservative illumination correction: remove smooth camera shade without damaging document details. */
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
 const data=ctx.getImageData(0,0,w,h),p=data.data,tw=96,th=128,t=document.createElement('canvas');t.width=tw;t.height=th;const tc=t.getContext('2d',{willReadFrequently:true});tc.drawImage(c,0,0,tw,th);const td=tc.getImageData(0,0,tw,th).data,field=new Float32Array(tw*th);
 for(let i=0;i<field.length;i++){const q=i*4;field[i]=Y(td[q],td[q+1],td[q+2])}
 function sample(x,y){x=clamp(x,0,tw-1);y=clamp(y,0,th-1);const x0=Math.floor(x),x1=Math.min(tw-1,x0+1),y0=Math.floor(y),y1=Math.min(th-1,y0+1),fx=x-x0,fy=y-y0;return (field[y0*tw+x0]*(1-fx)+field[y0*tw+x1]*fx)*(1-fy)+(field[y1*tw+x0]*(1-fx)+field[y1*tw+x1]*fx)*fy}
 const refs=new Float32Array(th);
 for(let y=0;y<th;y++){const a=[];for(let x=Math.floor(tw*.68);x<tw;x++){const v=field[y*tw+x];if(v>125)a.push(v)}a.sort((m,n)=>m-n);refs[y]=a.length?clamp(a[Math.floor(a.length*.55)],155,235):180}
 function ref(y){y=clamp(y,0,th-1);const y0=Math.floor(y),y1=Math.min(th-1,y0+1),f=y-y0;return refs[y0]*(1-f)+refs[y1]*f}
 for(let y=0;y<h;y++){
   const fy=y*(th-1)/Math.max(1,h-1),rr=ref(fy);
   for(let x=0;x<w;x++){
     const i=(y*w+x)*4,r=p[i],g=p[i+1],b=p[i+2],l=Y(r,g,b),mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0,local=Math.max(55,sample(x*(tw-1)/Math.max(1,w-1),fy));
     const deficit=clamp((rr-local)/Math.max(85,rr),0,.38),left=1-smooth(.16,.78,x/Math.max(1,w-1)),edge=left*left*(3-2*left);
     const paper=smooth(82,150,l)*(1-smooth(205,245,l)),inkProtect=1-smooth(38,108,l),colour=sat>.62?.10:(sat>.42?.45:1);
     const gain=1+clamp(deficit*edge*paper*colour*(1-.90*inkProtect),0,.18);
     p[i]=clamp(r*gain,0,255);p[i+1]=clamp(g*gain,0,255);p[i+2]=clamp(b*gain,0,255);
   }
   if(y%18===0)await raf();
 }
 ctx.putImageData(data,0,0);return c.toDataURL('image/jpeg',.98)
}
async function preview(){
 const input=$('fileInput'),f=input&&input.files&&input.files[0];if(!f){alert('Upload a WhatsApp image or PDF first.');return}const copies=Math.max(1,+($('copies')?.value||1));
 show('<div style="padding:22px;text-align:center"><b>Preparing TARGET…</b><br><small>Removing only smooth camera shadow — document details are protected.</small></div>');
 try{let pages=[];
   if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){pages=(window.sourcePages||[]).slice();if(!pages.length){show('<div class="warn">PDF is still loading. Please Preview again.</div>');return}}
   else pages=[await makeTarget(await read(f))];
   window.__nrSmartPrintTargetPages=pages;
   show('<div class="ai-badge">✓ TARGET OUTPUT — conservative camera-shadow correction; document details preserved.</div>'+pages.map((p,i)=>'<div class="preview-sheet"><p><b>Target • Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" alt="Target output" style="max-width:100%;height:auto;display:block;margin:auto"></div>').join(''));
 }catch(e){console.error('Smart Print TARGET v7',e);show('<div class="warn">Target generation failed safely. Original source was not modified.</div>')}
}
function patchPrint(){if(window.__nrTargetPrintPatched)return;window.__nrTargetPrintPatched=true;const old=window.confirmPrint;window.confirmPrint=function(){const target=window.__nrSmartPrintTargetPages;if(!target||!target.length)return old&&old.apply(this,arguments);const copies=Math.max(1,+($('copies')?.value||1)),paper=$('paper')?.value||'A4',w=window.open('','_blank');if(!w){alert('Allow pop-ups to print.');return}const pages=[];for(let c=0;c<copies;c++)pages.push(...target);w.document.write('<html><head><title>NR BizPro Smart Print Target</title><style>@page{size:'+paper+';margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>'+pages.map(p=>'<div class="page"><img src="'+p+'"></div>').join('')+'<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script></body></html>');w.document.close()}}
function install(){if(window.__nrTargetV7Installed)return;window.__nrTargetV7Installed=true;window.previewPrint=preview;patchPrint()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
