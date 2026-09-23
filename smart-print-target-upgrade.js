/* NR BizPro Smart Print — TARGET ENGINE v10
   Multi-image document, auto ID-card sizing/layout and one-click passport sheet. */
(function(){
'use strict';
const $=id=>document.getElementById(id),Y=(r,g,b)=>.2126*r+.7152*g+.0722*b,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),raf=()=>new Promise(r=>requestAnimationFrame(r));
function read(f){return new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)})}
function image(src){return new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=src})}
function show(html){const m=$('preview'),b=$('previewBody');if(!m||!b)return;b.innerHTML=html;m.classList.remove('hidden')}
function mm(mm){return Math.round(mm*300/25.4)}
function srcCanvas(im,maxW=1800,maxH=2400){const s=Math.min(1,maxW/im.naturalWidth,maxH/im.naturalHeight),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*s));c.height=Math.max(1,Math.round(im.naturalHeight*s));const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,c.width,c.height);return c}
function autoCrop(c){
 const w=c.width,h=c.height,x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,w,h).data;
 const corners=[0,Math.max(0,w-3),Math.max(0,(h-3)*w),Math.max(0,(h-3)*w+(w-3))];
 let bg=0;for(const q of corners){bg+=(d[q*4]+d[q*4+1]+d[q*4+2])/3}bg/=4;
 const tol=bg>220?34:30;let minX=w,minY=h,maxX=-1,maxY=-1;
 for(let y=0;y<h;y+=5)for(let xx=0;xx<w;xx+=5){const k=(y*w+xx)*4,g=(d[k]+d[k+1]+d[k+2])/3;if(Math.abs(g-bg)>tol){minX=Math.min(minX,xx);minY=Math.min(minY,y);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,y)}}
 if(maxX<0||maxX-minX<w*.35||maxY-minY<h*.35)return c;
 const pad=Math.round(Math.min(w,h)*.02);minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(w-1,maxX+pad);maxY=Math.min(h-1,maxY+pad);
 const o=document.createElement('canvas');o.width=maxX-minX+1;o.height=maxY-minY+1;o.getContext('2d').drawImage(c,minX,minY,o.width,o.height,0,0,o.width,o.height);return o;
}
function fitCrop(c,w,h){const r=w/h,sr=c.width/c.height;let sw=c.width,sh=c.height,sx=0,sy=0;if(sr>r){sw=Math.round(c.height*r);sx=Math.round((c.width-sw)/2)}else{sh=Math.round(c.width/r);sy=Math.round((c.height-sh)/2)}const o=document.createElement('canvas');o.width=w;o.height=h;o.getContext('2d').drawImage(c,sx,sy,sw,sh,0,0,w,h);return o}
function canvasData(c){return c.toDataURL('image/jpeg',.97)}
async function makeTarget(src){
 const im=await image(src),c=srcCanvas(im),ctx=c.getContext('2d',{willReadFrequently:true}),data=ctx.getImageData(0,0,c.width,c.height),p=data.data;
 const tw=96,th=128,t=document.createElement('canvas');t.width=tw;t.height=th;const tc=t.getContext('2d',{willReadFrequently:true});tc.drawImage(c,0,0,tw,th);
 const td=tc.getImageData(0,0,tw,th).data,raw=new Float32Array(tw*th);
 for(let i=0;i<raw.length;i++){const q=i*4;raw[i]=Y(td[q],td[q+1],td[q+2])}
 const blur=raw.slice(),tmp=new Float32Array(raw.length);
 for(let pass=0;pass<5;pass++){for(let y=0;y<th;y++)for(let x=0;x<tw;x++){let s=0,n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=clamp(x+dx,0,tw-1),yy=clamp(y+dy,0,th-1);s+=blur[yy*tw+xx];n++}tmp[y*tw+x]=s/n}blur.set(tmp)}
 function sample(x,y){x=clamp(x,0,tw-1);y=clamp(y,0,th-1);const x0=Math.floor(x),x1=Math.min(tw-1,x0+1),y0=Math.floor(y),y1=Math.min(th-1,y0+1),fx=x-x0,fy=y-y0;return (blur[y0*tw+x0]*(1-fx)+blur[y0*tw+x1]*fx)*(1-fy)+(blur[y1*tw+x0]*(1-fx)+blur[y1*tw+x1]*fx)*fy}
 const refs=new Float32Array(th);for(let y=0;y<th;y++){const a=[];for(let x=Math.floor(tw*.68);x<tw;x++){const v=blur[y*tw+x];if(v>100)a.push(v)}a.sort((m,n)=>m-n);refs[y]=a.length?clamp(a[Math.floor(a.length*.70)],150,242):190}
 function ref(y){const yy=clamp(y,0,th-1),y0=Math.floor(yy),y1=Math.min(th-1,y0+1),f=yy-y0;return refs[y0]*(1-f)+refs[y1]*f}
 for(let y=0;y<c.height;y++){const fy=y*(th-1)/Math.max(1,c.height-1),rr=ref(fy);for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,r=p[i],g=p[i+1],b=p[i+2],l=Y(r,g,b),mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0,local=Math.max(35,sample(x*(tw-1)/Math.max(1,c.width-1),fy)),deficit=clamp((rr-local)/Math.max(50,rr),0,.7),left=1-clamp((x/c.width-.06)/.72,0,1),detail=Math.abs(l-local),inkSafe=1-clamp((detail-10)/36,0,1),neutral=1-clamp((sat-.55)/.23,0,1),bright=.45+.55*clamp((l-55)/80,0,1),gain=1+clamp(deficit*left*left*(3-2*left)*inkSafe*neutral*bright*.95,0,.48);p[i]=clamp(r*gain,0,255);p[i+1]=clamp(g*gain,0,255);p[i+2]=clamp(b*gain,0,255)}if(y%20===0)await raf()}ctx.putImageData(data,0,0);return c}
function fitSheet(cards,kind){
 const W=2480,H=3508,gap=kind==='id'?mm(4):24,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);
 if(kind==='document'){let y=70;for(const card of cards){const s=Math.min((W-140)/card.width,(H-140)/card.height),w=Math.round(card.width*s),h=Math.round(card.height*s);if(y+h>H-70){break}x.drawImage(card,(W-w)/2,y,w,h);y+=h+30}return c}
 const card=cards[0],cw=card.width,ch=card.height,cols=Math.max(1,Math.floor((W-120+gap)/(cw+gap))),rows=Math.max(1,Math.floor((H-120+gap)/(ch+gap))),startX=Math.round((W-(cols*cw+(cols-1)*gap))/2),startY=60;
 let k=0;for(const item of cards){const repeat=item.repeat||1;for(let n=0;n<repeat;n++){if(k>=cols*rows)break;const col=k%cols,row=Math.floor(k/cols),xx=startX+col*(cw+gap),yy=startY+row*(ch+gap);x.drawImage(item,xx,yy);if(kind==='id'){}k++}}return c
}
async function filesToData(){const input=$('fileInput'),fs=input&&[...input.files||[]];if(!fs.length)throw Error('no files');const arr=[];for(const f of fs){if(f.type==='application/pdf'||/\\.pdf$/i.test(f.name)){if(window.sourcePages?.length)arr.push(...window.sourcePages);continue}arr.push(await read(f))}return arr}
async function preview(){
 const input=$('fileInput'),fs=input&&[...input.files||[]];if(!fs.length){alert('Upload one or more WhatsApp images or a PDF first.');return}
 const copies=Math.max(1,+($('copies')?.value||1)),kind=window.type||'document';
 if(typeof window.canPrint==='function'&&!window.canPrint())return;
 show('<div style="padding:22px;text-align:center"><b>Preparing Smart Print…</b><br><small>Auto-cropping, cleaning and arranging your selected files.</small></div>');
 try{
  if(kind==='passport'){
   const sw=mm(35),sh=mm(45),count=Math.max(1,Math.min(32,+($('photoCount')?.value||8))),cards=[];
   for(const f of fs){if(f.type==='application/pdf')continue;const im=await image(await read(f)),base=srcCanvas(im),card=fitCrop(base,sw,sh);card.repeat=count;cards.push(card)}
   if(!cards.length)throw Error('passport image required');
   const sheet=fitSheet(cards,'passport');window.__nrTargetSheets=[canvasData(sheet)];show('<div class="ai-badge">✓ 1-click passport sheet — '+count+' photos per selected image, 35×45 mm.</div><div class="preview-sheet"><p><b>Passport Photo • '+count+' copies</b></p><img src="'+window.__nrTargetSheets[0]+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>');return;
  }
  if(kind==='id'){
   const iw=mm(Number($('idW')?.value||85.6)),ih=mm(Number($('idH')?.value||54)),cards=[];
   for(const f of fs){if(f.type==='application/pdf')continue;const im=await image(await read(f)),base=autoCrop(srcCanvas(im)),card=fitCrop(base,iw,ih);cards.push(card)}
   if(!cards.length)throw Error('ID image required');
   const sheet=fitSheet(cards,'id');window.__nrTargetSheets=[canvasData(sheet)];show('<div class="ai-badge">✓ Auto ID-card layout — '+cards.length+' card(s), '+(Number($('idW')?.value||85.6)).toFixed(1)+' × '+(Number($('idH')?.value||54)).toFixed(1)+' mm.</div><div class="preview-sheet"><p><b>ID Card Print • '+cards.length+' image(s)</b></p><img src="'+window.__nrTargetSheets[0]+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>');return;
  }
  const pages=[];for(const f of fs){if(f.type==='application/pdf'||/\\.pdf$/i.test(f.name)){if(window.sourcePages?.length)pages.push(...window.sourcePages);continue}pages.push(canvasData(await makeTarget(await read(f))))}
  if(!pages.length)throw Error('no document pages');window.__nrTargetSheets=pages;
  show('<div class="ai-badge">✓ Smart Xerox output — '+pages.length+' page(s) prepared; original files remain untouched.</div>'+pages.map((p,i)=>'<div class="preview-sheet"><p><b>Document • Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>').join(''));
 }catch(e){console.error('Smart Print TARGET v10',e);show('<div class="warn">Processing failed safely. Your original files were not modified.</div>')}
}
function patchPrint(){if(window.__nrTargetPrintPatchedV10)return;window.__nrTargetPrintPatchedV10=true;window.confirmPrint=function(){const sheets=window.__nrTargetSheets;if(!sheets?.length)return alert('Please prepare the preview first.');const copies=Math.max(1,+($('copies')?.value||1)),paper=$('paper')?.value||'A4',w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');let pages=[];const kind=window.type||'document';if(kind==='id'||kind==='passport')for(let c=0;c<copies;c++)pages.push(...sheets);else for(let c=0;c<copies;c++)pages.push(...sheets);w.document.write('<html><head><title>NR BizPro Smart Print</title><style>@page{size:'+paper+';margin:0}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;width:100%;min-height:297mm}.page img{width:210mm;height:297mm;object-fit:contain}</style></head><body>'+pages.map(p=>'<div class="page"><img src="'+p+'"></div>').join('')+'<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\\/script></body></html>');w.document.close();setTimeout(()=>{try{if(typeof window.save==='function'&&typeof window.isLicensed==='function'&&!window.isLicensed()){data.trialCopies=(data.trialCopies||0)+copies;save()}else if(window.CUSTOMER_TEST){data.trialCopies=(data.trialCopies||0)+copies;save()}}catch(e){}},800)}}
function install(){window.previewPrint=preview;patchPrint();document.querySelectorAll('.types button').forEach(b=>b.addEventListener('click',()=>setTimeout(updateOptions,0)));updateOptions()}
function updateOptions(){const t=window.type||'document';$('idSizeWrap')?.classList.toggle('hidden',t!=='id');$('idHeightWrap')?.classList.toggle('hidden',t!=='id');$('photoCountWrap')?.classList.toggle('hidden',t!=='passport');if(t==='passport'&&$('typeHint'))$('typeHint').textContent='📸 One-click: one mobile photo → 8 clean 35×45 mm passport photos on one A4 sheet.'}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();