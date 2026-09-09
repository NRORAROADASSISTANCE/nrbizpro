/* NR BizPro Smart Print — ID Card Front + Back V3
   Dedicated ID workflow: two files, true card crop, color-preserving output, two-side preview/print. */
(function(){
  const CARD={w:85.6,h:54,dpi:300,ratio:85.6/54,W:1011,H:638};
  let files=[], front=null, back=null, frontCanvas=null, backCanvas=null;
  const $=id=>document.getElementById(id);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const load=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  function active(){return document.querySelector('.types button.active')?.dataset.type==='id'||window.type==='id'}
  function canvasOf(i){const c=document.createElement('canvas');c.width=i.naturalWidth||i.width;c.height=i.naturalHeight||i.height;c.getContext('2d').drawImage(i,0,0);return c}
  function d(a,b){return Math.hypot(a.x-b.x,a.y-b.y)};
  function order(p){let tl=p[0],br=p[0],tr=p[0],bl=p[0];for(const q of p){if(q.x+q.y<tl.x+tl.y)tl=q;if(q.x+q.y>br.x+br.y)br=q;if(q.y-q.x<tr.y-tr.x)tr=q;if(q.y-q.x>bl.y-bl.x)bl=q}return [tl,tr,br,bl]}
  async function cvReady(){const t=Date.now();while(Date.now()-t<6000){if(window.cv&&cv.Mat)return true;await sleep(100)}return false}
  function detect(c){
    if(!window.cv||!cv.Mat)return null;
    let src,gray,edges,contours,hier;
    try{
      src=cv.imread(c);const scale=Math.min(1,1600/Math.max(src.cols,src.rows));
      if(scale<1){const r=new cv.Mat();cv.resize(src,r,new cv.Size(Math.round(src.cols*scale),Math.round(src.rows*scale)),0,0,cv.INTER_AREA);src.delete();src=r}
      gray=new cv.Mat();cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,gray,new cv.Size(5,5),0);
      edges=new cv.Mat();cv.Canny(gray,18,75,3,true);const k=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(7,7));cv.morphologyEx(edges,edges,cv.MORPH_CLOSE,k);
      contours=new cv.MatVector();hier=new cv.Mat();cv.findContours(edges,contours,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
      let best=null,bestScore=-1,frame=src.cols*src.rows;
      for(let i=0;i<contours.size();i++){
        const cnt=contours.get(i),area=Math.abs(cv.contourArea(cnt));if(area<frame*.035){cnt.delete();continue}
        const per=cv.arcLength(cnt,true),a=new cv.Mat();cv.approxPolyDP(cnt,a,Math.max(2,.018*per),true);
        if(a.rows===4&&cv.isContourConvex(a)){
          let pts=[];for(let j=0;j<4;j++){const z=a.intPtr(j,0);pts.push({x:z[0]/scale,y:z[1]/scale})}pts=order(pts);
          const w=(d(pts[0],pts[1])+d(pts[3],pts[2]))/2,h=(d(pts[0],pts[3])+d(pts[1],pts[2]))/2,r=Math.max(w,h)/Math.min(w,h);
          if(r>=1.28&&r<=1.95){const ar=area/frame, ratio=1-Math.min(1,Math.abs(r-CARD.ratio)/.38), score=ratio*.68+Math.min(1,ar/.45)*.32;if(score>bestScore){best=pts;bestScore=score}}
        }
        a.delete();cnt.delete();
      }
      [src,gray,edges,contours,hier].forEach(x=>{try{x.delete()}catch{}});return best;
    }catch(e){console.warn('ID V3 detect',e);[src,gray,edges,contours,hier].forEach(x=>{try{x&&x.delete()}catch{}});return null}
  }
  function warp(c,q){
    if(!q||!window.cv)return c;try{const p=order(q),si=cv.imread(c),sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(z=>[z.x,z.y])),dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,CARD.W-1,0,CARD.W-1,CARD.H-1,0,CARD.H-1]),M=cv.getPerspectiveTransform(sp,dp),di=new cv.Mat();cv.warpPerspective(si,di,M,new cv.Size(CARD.W,CARD.H),cv.INTER_CUBIC,cv.BORDER_REPLICATE);const o=document.createElement('canvas');o.width=CARD.W;o.height=CARD.H;cv.imshow(o,di);[si,sp,dp,M,di].forEach(x=>{try{x.delete()}catch{}});return o}catch(e){return c}}
  function exact(c){const o=document.createElement('canvas');o.width=CARD.W;o.height=CARD.H;const x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(c,0,0,CARD.W,CARD.H);return o}
  async function prepare(f){const i=await load(await read(f));let c=canvasOf(i);await cvReady();const q=detect(c);if(q)c=warp(c,q);else{ // safe fallback: center-crop to the ID ratio, never invent content
      const sw=c.width,sh=c.height,target=CARD.ratio;let sx=0,sy=0,ww=sw,hh=sh;if(sw/sh>target){ww=Math.round(sh*target);sx=Math.round((sw-ww)/2)}else{hh=Math.round(sw/target);sy=Math.round((sh-hh)/2)}const z=document.createElement('canvas');z.width=ww;z.height=hh;z.getContext('2d').drawImage(c,sx,sy,ww,hh,0,0,ww,hh);c=z;
    }return exact(c)}
  function setNote(){let n=$('idV3Note');if(!n){n=document.createElement('div');n.id='idV3Note';n.className='pro-note';$('fileInput')?.closest('.upload')?.after(n)}n.innerHTML=active()?'<b>🪪 ID Card V3:</b> Select <b>Front + Back together</b>. Both sides will be cropped to the card boundary, kept in <b>Color</b>, and shown before printing at exact 85.6 × 54 mm.':' '} n.style.display=active()?'block':'none'}
  function install(){
    const input=$('fileInput');if(!input)return;input.multiple=true;input.accept='image/*';setNote();
    input.addEventListener('change',async()=>{if(!active())return;files=Array.from(input.files||[]).filter(f=>f.type.startsWith('image/')).slice(0,2);front=files[0]||null;back=files[1]||null;frontCanvas=backCanvas=null;setNote();if(files.length<2)alert('ID Card: please select both Front and Back photos together.');else setNote()},{capture:false});
    const oldSelect=window.selectType;if(typeof oldSelect==='function'&&!oldSelect.__v3){const s=oldSelect;const w=function(t){const r=s(t);setTimeout(setNote,0);if(t!=='id'){files=[];front=back=null;frontCanvas=backCanvas=null}return r};w.__v3=true;window.selectType=w}
  }
  async function preview(){
    if(!active())return window.__v3OldRun?.();
    if(files.length<2){alert('ID Card: select Front + Back together in the same upload.');return}
    const pv=$('preview');pv?.classList.remove('hidden');const body=$('previewBody');body.innerHTML='<div class="ai-badge">⏳ Preparing Front + Back • cropping card edges • Color preserved • 85.6 × 54 mm.</div>';
    try{frontCanvas=await prepare(front);backCanvas=await prepare(back);const mode=$('mode')?.value||'Color';if(mode==='Black & White'){for(const c of [frontCanvas,backCanvas]){const x=c.getContext('2d'),im=x.getImageData(0,0,c.width,c.height);for(let i=0;i<im.data.length;i+=4){const y=.299*im.data[i]+.587*im.data[i+1]+.114*im.data[i+2];im.data[i]=im.data[i+1]=im.data[i+2]=y}x.putImageData(im,0,0)}}const f=frontCanvas.toDataURL('image/png'),b=backCanvas.toDataURL('image/png');body.innerHTML='<div class="ai-badge">✓ Both sides ready • exact ID Card size 85.6 × 54 mm • 300 DPI • '+mode+'.</div><div style="display:flex;gap:22px;justify-content:center;align-items:flex-start;flex-wrap:wrap"><div style="width:323.5px;text-align:center"><p><b>FRONT</b></p><img src="'+f+'" style="display:block;width:323.5px;height:204.1px;object-fit:fill;border:1px solid #aaa;margin:auto"></div><div style="width:323.5px;text-align:center"><p><b>BACK</b></p><img src="'+b+'" style="display:block;width:323.5px;height:204.1px;object-fit:fill;border:1px solid #aaa;margin:auto"></div></div><p style="text-align:center">Color mode does not apply grayscale. Both sides will be printed together on the selected paper.</p>'}catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ ID Card preparation failed. Original photos are unchanged.</div>'}
  }
  function print(){if(!active())return window.__v3OldPrint?.();if(!frontCanvas||!backCanvas){alert('Open Scanner Preview first.');return}const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies')?.value||1),mode=$('mode')?.value||'Color',w=window.open('','_blank');if(!w){alert('Allow pop-ups to print.');return}const f=frontCanvas.toDataURL('image/png'),b=backCanvas.toDataURL('image/png'),pw=paper==='A5'?148:210,ph=paper==='A5'?210:297,filter=mode==='Black & White'?'filter:grayscale(1)':'';let pages='';for(let i=0;i<copies;i++)pages+='<div class="p"><div class="pair"><img src="'+f+'"><img src="'+b+'"></div></div>';const css='@page{size:'+paper+' portrait;margin:0}html,body{margin:0;padding:0;background:#fff}.p{width:'+pw+'mm;height:'+ph+'mm;display:flex;align-items:center;justify-content:center;page-break-after:always}.pair{display:flex;gap:8mm;align-items:center;justify-content:center}.pair img{width:85.6mm;height:54mm;object-fit:fill;display:block;'+filter+'}';w.document.write('<!doctype html><html><head><title>ID Card Front + Back</title><style>'+css+'</style></head><body>'+pages+'<script>window.onload=function(){setTimeout(function(){window.print()},700)};window.onafterprint=function(){window.close()}<\\/script></body></html>');w.document.close()}
  function boot(){install();window.__v3OldRun=window.runScannerPreview;window.__v3OldPrint=window.confirmScannerPrint;window.runScannerPreview=function(){return active()?preview():window.__v3OldRun?.()};window.confirmScannerPrint=function(){return active()?print():window.__v3OldPrint?.()};window.__finalDirectPrint=window.confirmScannerPrint}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500));else setTimeout(boot,500);
})();
