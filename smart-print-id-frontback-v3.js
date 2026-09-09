/* NR BizPro Smart Print — ID Card Front + Back V5
   Reliable ID-card crop + orientation + in-page print.
   Front/back are prepared independently at exact 85.6 x 54 mm.
*/
(function(){
'use strict';
const CARD={mmW:85.6,mmH:54,ratio:85.6/54,W:1011,H:638};
let files=[],front=null,back=null,frontCanvas=null,backCanvas=null;
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
const load=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
function active(){return document.querySelector('.types button.active')?.dataset.type==='id'||window.type==='id'}
function rot(c,n){n=((n%4)+4)%4;if(!n)return c;const z=document.createElement('canvas');z.width=n%2?c.height:c.width;z.height=n%2?c.width:c.height;const x=z.getContext('2d');x.translate(z.width/2,z.height/2);x.rotate(n*Math.PI/2);x.drawImage(c,-c.width/2,-c.height/2);return z}
function order(p){let tl=p[0],tr=p[0],br=p[0],bl=p[0];for(const q of p){if(q.x+q.y<tl.x+tl.y)tl=q;if(q.y-q.x<tr.y-tr.x)tr=q;if(q.x+q.y>br.x+br.y)br=q;if(q.y-q.x>bl.y-bl.x)bl=q}return[tl,tr,br,bl]}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
async function cvReady(){for(let i=0;i<100;i++){if(window.cv&&cv.Mat)return true;await sleep(100)}return false}
function detect(c){if(!window.cv||!cv.Mat)return null;let s,g,e,cont,h,k;try{
 s=cv.imread(c);const sc=Math.min(1,1600/Math.max(s.cols,s.rows));if(sc<1){const z=new cv.Mat;cv.resize(s,z,new cv.Size(Math.round(s.cols*sc),Math.round(s.rows*sc)),0,0,cv.INTER_AREA);s.delete();s=z}
 g=new cv.Mat;cv.cvtColor(s,g,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(g,g,new cv.Size(5,5),0);e=new cv.Mat;cv.Canny(g,e,35,120);k=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(7,7));cv.morphologyEx(e,e,cv.MORPH_CLOSE,k);cont=new cv.MatVector;h=new cv.Mat;cv.findContours(e,cont,h,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
 let best=null,bestScore=0,frame=s.cols*s.rows;
 for(let i=0;i<cont.size();i++){const co=cont.get(i),area=Math.abs(cv.contourArea(co));if(area<frame*.035){co.delete();continue}const per=cv.arcLength(co,true),a=new cv.Mat;cv.approxPolyDP(co,a,Math.max(2,per*.018),true);if(a.rows===4&&cv.isContourConvex(a)){
  let p=[];for(let j=0;j<4;j++){const q=a.intPtr(j,0);p.push({x:q[0]/sc,y:q[1]/sc})}p=order(p);
  const w=(dist(p[0],p[1])+dist(p[3],p[2]))/2,hh=(dist(p[0],p[3])+dist(p[1],p[2]))/2,r=Math.max(w,hh)/Math.min(w,hh);
  const ratioErr=Math.abs(r-CARD.ratio);const fill=area/frame;const edge=ratioErr<.18;
  if(edge){const score=(Math.min(fill/.55,1)*.5)+(Math.max(0,1-ratioErr/.18)*.5);if(score>bestScore){bestScore=score;best=p}}
 }a.delete();co.delete()}
 [s,g,e,cont,h,k].forEach(x=>{try{x&&x.delete()}catch{}});return best;
 }catch(err){[s,g,e,cont,h,k].forEach(x=>{try{x&&x.delete()}catch{}});return null}}
function warp(c,q){try{const p=order(q),s=cv.imread(c),sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(z=>[z.x,z.y])),dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,CARD.W-1,0,CARD.W-1,CARD.H-1,0,CARD.H-1]),m=cv.getPerspectiveTransform(sp,dp),o=new cv.Mat;cv.warpPerspective(s,o,m,new cv.Size(CARD.W,CARD.H),cv.INTER_CUBIC,cv.BORDER_REPLICATE);const z=document.createElement('canvas');z.width=CARD.W;z.height=CARD.H;cv.imshow(z,o);[s,sp,dp,m,o].forEach(x=>{try{x.delete()}catch{}});return z}catch{return null}}
function cropCenter(c){const t=CARD.ratio;let w=c.width,h=c.height;if(w/h>t)w=Math.round(h*t);else h=Math.round(w/t);const z=document.createElement('canvas');z.width=w;z.height=h;z.getContext('2d').drawImage(c,Math.round((c.width-w)/2),Math.round((c.height-h)/2),w,h,0,0,w,h);return z}
function resize(c){const z=document.createElement('canvas');z.width=CARD.W;z.height=CARD.H;const x=z.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(c,0,0,CARD.W,CARD.H);return z}
async function prepare(f){
 const src=await read(f),i=await load(src);let base=document.createElement('canvas');base.width=i.naturalWidth;base.height=i.naturalHeight;base.getContext('2d').drawImage(i,0,0);
 await cvReady();let winner=null,wq=null,wscore=-1;
 /* Test all four orientations. This fixes sideways and upside-down WhatsApp photos before cropping. */
 for(let n=0;n<4;n++){const c=rot(base,n),q=detect(c);if(q){const a=dist(q[0],q[1])*dist(q[0],q[3]);const score=a/(c.width*c.height);if(score>wscore){wscore=score;winner=c;wq=q}}}
 let out=winner&&wq?warp(winner,wq):null;
 /* If no reliable boundary exists, still force the correct card ratio without distorting. */
 if(!out){let c=base;if(base.height>base.width*1.18)c=rot(base,1);out=cropCenter(c)}
 return resize(out);
}
function note(){let n=$('idV4Note');if(!n){n=document.createElement('div');n.id='idV4Note';n.className='pro-note';const u=$('fileInput')?.closest('.upload');if(u)u.after(n)}n.innerHTML='<b>🪪 ID Card V5:</b> Select <b>Front first + Back second</b>. Each photo is auto-rotated, card boundary cropped, perspective corrected and prepared at exact <b>85.6 × 54 mm</b> in color.';n.style.display=active()?'block':'none'}
function install(){const input=$('fileInput');if(!input||input.__idv5)return;input.__idv5=true;input.multiple=true;input.accept='image/*';note();input.addEventListener('change',()=>{if(!active())return;files=Array.from(input.files||[]).filter(f=>f.type.startsWith('image/')).slice(0,2);front=files[0]||null;back=files[1]||null;frontCanvas=backCanvas=null;note();if(files.length!==2)alert('ID Card: select exactly 2 photos — Front first, Back second.');});const old=window.selectType;if(typeof old==='function'&&!old.__idv5){const w=t=>{const r=old(t);if(t!=='id'){files=[];front=back=null;frontCanvas=backCanvas=null}setTimeout(note,0);return r};w.__idv5=true;window.selectType=w}}
function bw(c){const x=c.getContext('2d'),im=x.getImageData(0,0,c.width,c.height);for(let j=0;j<im.data.length;j+=4){const y=.299*im.data[j]+.587*im.data[j+1]+.114*im.data[j+2];im.data[j]=im.data[j+1]=im.data[j+2]=y}x.putImageData(im,0,0)}
async function preview(){if(!active())return window.__v4OldRun?.();if(files.length!==2)return alert('ID Card: select exactly 2 photos — Front first, Back second.');const p=$('preview'),body=$('previewBody');p?.classList.remove('hidden');body.innerHTML='<div class="ai-badge">⏳ Auto-cropping and preparing Front + Back…</div>';try{frontCanvas=await prepare(front);backCanvas=await prepare(back);const mode=$('mode')?.value||'Color';if(mode==='Black & White'){bw(frontCanvas);bw(backCanvas)}const f=frontCanvas.toDataURL('image/png'),b=backCanvas.toDataURL('image/png');body.innerHTML='<div class="ai-badge">✓ FRONT + BACK ready • exact 85.6 × 54 mm • 300 DPI • '+mode+' • cropped + straightened.</div><div style="display:flex;gap:28px;justify-content:center;align-items:flex-start;flex-wrap:wrap"><div style="text-align:center"><p><b>FRONT</b></p><div style="width:323.5px;height:204.1px;background:#fff;border:1px solid #bbb"><img src="'+f+'" style="display:block;width:100%;height:100%;object-fit:fill"></div></div><div style="text-align:center"><p><b>BACK</b></p><div style="width:323.5px;height:204.1px;background:#fff;border:1px solid #bbb"><img src="'+b+'" style="display:block;width:100%;height:100%;object-fit:fill"></div></div></div><p style="text-align:center"><b>Print:</b> both cards are placed on one A4/A5 sheet at true physical size. No separate print page is opened.</p>'}catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ Could not prepare the ID card. Original photos are unchanged.</div>'}}
function print(){if(!active())return window.__v4OldPrint?.();if(!frontCanvas||!backCanvas)return alert('Run Scanner Preview first.');const paper=$('paper')?.value||'A4',copies=Math.max(1,Math.min(100,+$('copies')?.value||1)),mode=$('mode')?.value||'Color';const old=document.getElementById('idPrintFrame');if(old)old.remove();const frame=document.createElement('iframe');frame.id='idPrintFrame';frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;';document.body.appendChild(frame);const d=frame.contentDocument||frame.contentWindow.document;const pw=paper==='A5'?148:210,ph=paper==='A5'?210:297,filter=mode==='Black & White'?'filter:grayscale(1);':'';const f=frontCanvas.toDataURL('image/png'),b=backCanvas.toDataURL('image/png');let pages='';for(let n=0;n<copies;n++)pages+='<div class="sheet"><div class="cards"><img src="'+f+'"><img src="'+b+'"></div></div>';const css='@page{size:'+paper+' portrait;margin:0}html,body{margin:0!important;padding:0!important;background:white}.sheet{width:'+pw+'mm;height:'+ph+'mm;page-break-after:always;position:relative}.cards{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:8mm}.cards img{display:block;width:85.6mm;height:54mm;object-fit:fill;'+filter+'}';d.open();d.write('<!doctype html><html><head><meta charset="utf-8"><title>NR BizPro ID Cards</title><style>'+css+'</style></head><body>'+pages+'</body></html>');d.close();setTimeout(()=>{try{frame.contentWindow.focus();frame.contentWindow.print()}catch(e){console.error(e);alert('Printer dialog could not be opened. Please use the browser print command once.')}},500)}
function boot(){install();window.__v4OldRun=window.runScannerPreview;window.__v4OldPrint=window.confirmScannerPrint;window.runScannerPreview=()=>active()?preview():window.__v4OldRun?.();window.confirmScannerPrint=()=>active()?print():window.__v4OldPrint?.();window.__finalDirectPrint=window.confirmScannerPrint}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500));else setTimeout(boot,500);
})();
