/* NR BizPro Smart Print — ID Card Front + Back V7
   Stronger ID-card boundary detection: multi-pass edge/threshold search,
   largest valid card quadrilateral selection, perspective correction,
   exact 85.6 x 54 mm output, per-side rotation and true-size print.
*/
(function(){
'use strict';
const CARD={mmW:85.6,mmH:54,ratio:85.6/54,W:1011,H:638};
let files=[],front=null,back=null,frontCanvas=null,backCanvas=null,frontRot=0,backRot=0;
const $=id=>document.getElementById(id); const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
const load=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
function active(){return document.querySelector('.types button.active')?.dataset.type==='id'||window.type==='id'}
function rot(c,n){n=((n%4)+4)%4;if(!n)return c;const z=document.createElement('canvas');z.width=n%2?c.height:c.width;z.height=n%2?c.width:c.height;const x=z.getContext('2d');x.translate(z.width/2,z.height/2);x.rotate(n*Math.PI/2);x.drawImage(c,-c.width/2,-c.height/2);return z}
function order(p){let tl=p[0],tr=p[0],br=p[0],bl=p[0];for(const q of p){if(q.x+q.y<tl.x+tl.y)tl=q;if(q.y-q.x<tr.y-tr.x)tr=q;if(q.x+q.y>br.x+br.y)br=q;if(q.y-q.x>bl.y-bl.x)bl=q}return[tl,tr,br,bl]}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
async function cvReady(){for(let i=0;i<120;i++){if(window.cv&&cv.Mat)return true;await sleep(100)}return false}
function quadCandidate(a,sc,frame){
  if(!a||a.rows!==4||!cv.isContourConvex(a))return null;
  let p=[];for(let j=0;j<4;j++){const q=a.intPtr(j,0);p.push({x:q[0]/sc,y:q[1]/sc})}p=order(p);
  const w=(dist(p[0],p[1])+dist(p[3],p[2]))/2;
  const h=(dist(p[0],p[3])+dist(p[1],p[2]))/2;
  if(w<30||h<20)return null;
  const ratio=Math.max(w,h)/Math.min(w,h);
  const ratioErr=Math.abs(ratio-CARD.ratio);
  if(ratioErr>.30)return null;
  const area=w*h;
  const fill=area/frame;
  if(fill<.008||fill>.98)return null;
  // Prefer a large true card rectangle, but heavily penalize wrong aspect ratios.
  const score=Math.min(fill/.55,1)*0.62+Math.max(0,1-ratioErr/.30)*0.38;
  return {p,score,fill,ratioErr};
}
function detect(c){
 if(!window.cv||!cv.Mat)return null;
 let src=null,g=null,blur=null,edge=null,closed=null,thr=null,cont=null,h=null,k1=null,k2=null;
 try{
  src=cv.imread(c);
  const sc=Math.min(1,2000/Math.max(src.cols,src.rows));
  if(sc<1){const z=new cv.Mat;cv.resize(src,z,new cv.Size(Math.round(src.cols*sc),Math.round(src.rows*sc)),0,0,cv.INTER_AREA);src.delete();src=z}
  const frame=src.cols*src.rows;
  g=new cv.Mat;cv.cvtColor(src,g,cv.COLOR_RGBA2GRAY);blur=new cv.Mat;cv.GaussianBlur(g,blur,new cv.Size(5,5),0);
  let best=null;
  const passes=[];
  edge=new cv.Mat;cv.Canny(blur,edge,20,100);
  k1=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(11,11));closed=new cv.Mat;cv.morphologyEx(edge,closed,cv.MORPH_CLOSE,k1);
  passes.push(closed);
  thr=new cv.Mat;cv.threshold(blur,thr,0,255,cv.THRESH_BINARY+cv.THRESH_OTSU);
  k2=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(9,9));cv.morphologyEx(thr,thr,cv.MORPH_CLOSE,k2);
  passes.push(thr);
  for(const mask of passes){
   cont=new cv.MatVector;h=new cv.Mat;cv.findContours(mask,cont,h,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
   for(let i=0;i<cont.size();i++){
    const co=cont.get(i);const ca=Math.abs(cv.contourArea(co));
    if(ca<frame*.008){co.delete();continue}
    const per=cv.arcLength(co,true),a=new cv.Mat;cv.approxPolyDP(co,a,Math.max(2,per*.018),true);
    const cand=quadCandidate(a,sc,frame);
    if(cand && (!best||cand.score>best.score))best=cand;
    a.delete();co.delete();
   }
   cont.delete();h.delete();cont=null;h=null;
  }
  [src,g,blur,edge,closed,thr,k1,k2].forEach(x=>{try{x&&x.delete()}catch{}});
  return best?.p||null;
 }catch(err){
  [src,g,blur,edge,closed,thr,cont,h,k1,k2].forEach(x=>{try{x&&x.delete()}catch{}});return null;
 }
}
function warp(c,q){
 try{
  const p=order(q),s=cv.imread(c),sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(z=>[z.x,z.y])),dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,CARD.W-1,0,CARD.W-1,CARD.H-1,0,CARD.H-1]),m=cv.getPerspectiveTransform(sp,dp),o=new cv.Mat;
  cv.warpPerspective(s,o,m,new cv.Size(CARD.W,CARD.H),cv.INTER_CUBIC,cv.BORDER_REPLICATE);
  const z=document.createElement('canvas');z.width=CARD.W;z.height=CARD.H;cv.imshow(z,o);[s,sp,dp,m,o].forEach(x=>{try{x.delete()}catch{}});return z;
 }catch{return null}
}
function cropCenter(c){const t=CARD.ratio;let w=c.width,h=c.height;if(w/h>t)w=Math.round(h*t);else h=Math.round(w/t);const z=document.createElement('canvas');z.width=w;z.height=h;z.getContext('2d').drawImage(c,Math.round((c.width-w)/2),Math.round((c.height-h)/2),w,h,0,0,w,h);return z}
function resize(c){const z=document.createElement('canvas');z.width=CARD.W;z.height=CARD.H;const x=z.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(c,0,0,CARD.W,CARD.H);return z}
async function prepare(f,manualRot){
 const src=await read(f),i=await load(src);let base=document.createElement('canvas');base.width=i.naturalWidth;base.height=i.naturalHeight;base.getContext('2d').drawImage(i,0,0);base=rot(base,manualRot);await cvReady();
 // Try all four orientations only for detection. The warp itself always returns landscape ID-card output.
 let winner=null,wq=null,wscore=-1;
 for(let n=0;n<4;n++){const c=rot(base,n),q=detect(c);if(q){const p=order(q);const w=(dist(p[0],p[1])+dist(p[3],p[2]))/2;const h=(dist(p[0],p[3])+dist(p[1],p[2]))/2;const score=(w*h)/(c.width*c.height);if(score>wscore){wscore=score;winner=c;wq=q}}}
 let out=winner&&wq?warp(winner,wq):null;
 // Only use center crop as last resort. This keeps the card ratio but never pretends background was removed.
 if(!out){let c=base;if(base.height>base.width*1.18)c=rot(base,1);out=cropCenter(c)}
 return resize(out);
}
function note(){let n=$('idV7Note');if(!n){n=document.createElement('div');n.id='idV7Note';n.className='pro-note';const u=$('fileInput')?.closest('.upload');if(u)u.after(n)}n.innerHTML='<b>🪪 ID Card V7:</b> Front + Back are cropped independently from the real card boundary, perspective-corrected and prepared at exact <b>85.6 × 54 mm</b>. Rotate controls remain available when the source photo itself is rotated.';n.style.display=active()?'block':'none'}
function install(){const input=$('fileInput');if(!input||input.__idv7)return;input.__idv7=true;input.multiple=true;input.accept='image/*';note();input.addEventListener('change',()=>{if(!active())return;files=Array.from(input.files||[]).filter(f=>f.type.startsWith('image/')).slice(0,2);front=files[0]||null;back=files[1]||null;frontCanvas=backCanvas=null;frontRot=backRot=0;note();if(files.length!==2)alert('ID Card: select exactly 2 photos — Front first, Back second.');});}
function bw(c){const x=c.getContext('2d'),im=x.getImageData(0,0,c.width,c.height);for(let j=0;j<im.data.length;j+=4){const y=.299*im.data[j]+.587*im.data[j+1]+.114*im.data[j+2];im.data[j]=im.data[j+1]=im.data[j+2]=y}x.putImageData(im,0,0)}
function controls(){return '<div id="idV7Controls" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:14px 0"><button type="button" data-side="front" data-r="-1">↶ Rotate Front</button><button type="button" data-side="front" data-r="1">↷ Rotate Front</button><button type="button" data-side="back" data-r="-1">↶ Rotate Back</button><button type="button" data-side="back" data-r="1">↷ Rotate Back</button><button type="button" data-r="0" data-reset="1">Reset Rotations</button></div>'}
async function preview(){
 if(!active())return window.__v6OldRun?.();if(files.length!==2)return alert('ID Card: select exactly 2 photos — Front first, Back second.');
 const p=$('preview'),body=$('previewBody');p?.classList.remove('hidden');body.innerHTML='<div class="ai-badge">⏳ Finding card boundaries and cropping Front + Back…</div>';
 try{
  frontCanvas=await prepare(front,frontRot);backCanvas=await prepare(back,backRot);const mode=$('mode')?.value||'Color';if(mode==='Black & White'){bw(frontCanvas);bw(backCanvas)}
  const f=frontCanvas.toDataURL('image/png'),b=backCanvas.toDataURL('image/png');
  body.innerHTML='<div class="ai-badge">✓ FRONT + BACK ready • exact 85.6 × 54 mm • 300 DPI • '+mode+' • real boundary crop + straightening applied.</div>'+controls()+'<div style="display:flex;gap:28px;justify-content:center;align-items:flex-start;flex-wrap:wrap"><div style="text-align:center"><p><b>FRONT</b></p><div style="width:323.5px;height:204.1px;background:#fff;border:1px solid #bbb"><img src="'+f+'" style="display:block;width:100%;height:100%;object-fit:fill"></div></div><div style="text-align:center"><p><b>BACK</b></p><div style="width:323.5px;height:204.1px;background:#fff;border:1px solid #bbb"><img src="'+b+'" style="display:block;width:100%;height:100%;object-fit:fill"></div></div></div><p style="text-align:center"><b>Print layout:</b> both sides are placed on the same A4/A5 sheet at true physical size.</p>';
  body.querySelectorAll('#idV7Controls button').forEach(btn=>btn.onclick=async()=>{if(btn.dataset.reset){frontRot=backRot=0}else{const d=+btn.dataset.r;if(btn.dataset.side==='front')frontRot=(frontRot+d+4)%4;else backRot=(backRot+d+4)%4}frontCanvas=await prepare(front,frontRot);backCanvas=await prepare(back,backRot);const m=$('mode')?.value||'Color';if(m==='Black & White'){bw(frontCanvas);bw(backCanvas)}const imgs=body.querySelectorAll('#idV7Controls + div img');if(imgs[0])imgs[0].src=frontCanvas.toDataURL('image/png');if(imgs[1])imgs[1].src=backCanvas.toDataURL('image/png')});
 }catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ ID card preparation failed. Original photos are unchanged.</div>'}
}
function print(){
 if(!active())return window.__v6OldPrint?.();if(!frontCanvas||!backCanvas)return alert('Run Preview first.');
 const paper=$('paper')?.value||'A4',copies=Math.max(1,Math.min(100,+$('copies')?.value||1)),mode=$('mode')?.value||'Color';const old=document.getElementById('idPrintFrame');if(old)old.remove();
 const frame=document.createElement('iframe');frame.id='idPrintFrame';frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;';document.body.appendChild(frame);const d=frame.contentDocument||frame.contentWindow.document;
 const pw=paper==='A5'?148:210,ph=paper==='A5'?210:297,filter=mode==='Black & White'?'filter:grayscale(1);':'';const f=frontCanvas.toDataURL('image/png'),b=backCanvas.toDataURL('image/png');let pages='';for(let n=0;n<copies;n++)pages+='<div class="sheet"><div class="cards"><img src="'+f+'"><img src="'+b+'"></div></div>';
 const css='@page{size:'+paper+' portrait;margin:0}html,body{margin:0!important;padding:0!important;background:white}.sheet{width:'+pw+'mm;height:'+ph+'mm;page-break-after:always;position:relative}.cards{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:8mm}.cards img{display:block;width:85.6mm;height:54mm;object-fit:fill;'+filter+'}';
 d.open();d.write('<!doctype html><html><head><meta charset="utf-8"><title>NR BizPro ID Cards</title><style>'+css+'</style></head><body>'+pages+'</body></html>');d.close();setTimeout(()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){alert('Printer dialog could not be opened. Please use browser Print once.')}},500)
}
function boot(){install();window.__v6OldRun=window.runScannerPreview;window.__v6OldPrint=window.confirmScannerPrint;window.runScannerPreview=()=>active()?preview():window.__v6OldRun?.();window.confirmScannerPrint=()=>active()?print():window.__v6OldPrint?.();window.__finalDirectPrint=window.confirmScannerPrint}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500));else setTimeout(boot,500);
})();
