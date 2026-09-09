/* NR BizPro Smart Print — ID/Aadhaar/PAN front + back true-size Xerox workflow. */
(function(){
  const CARD={w:85.6,h:54,dpi:300,ratio:85.6/54};
  let frontData=null,backData=null,frontCanvas=null,backCanvas=null;
  const $=id=>document.getElementById(id);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const img=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  const toCanvas=i=>{const c=document.createElement('canvas');c.width=i.naturalWidth||i.width;c.height=i.naturalHeight||i.height;c.getContext('2d').drawImage(i,0,0);return c;};
  async function waitCV(){const t=Date.now();while(Date.now()-t<7000){if(window.cv&&cv.Mat)return true;await wait(100)}return false;}
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function order(pts){const tl=pts.reduce((a,b)=>a.x+a.y<b.x+b.y?a:b);const br=pts.reduce((a,b)=>a.x+a.y>b.x+b.y?a:b);const tr=pts.reduce((a,b)=>a.y-a.x<b.y-b.x?a:b);const bl=pts.reduce((a,b)=>a.y-a.x>b.y-b.x?a:b);return [tl,tr,br,bl]}
  function quadScore(p,area,frame){
    const w=((dist(p[0],p[1])+dist(p[3],p[2]))/2),h=((dist(p[0],p[3])+dist(p[1],p[2]))/2);
    if(!w||!h)return -1; const r=Math.max(w,h)/Math.min(w,h);
    if(r<1.30||r>1.82)return -1;
    const ar=area/frame; if(ar<0.025)return -1;
    const ratioScore=1-Math.min(1,Math.abs(r-CARD.ratio)/0.28);
    const areaScore=Math.min(1,ar/0.35);
    return ratioScore*0.62+areaScore*0.38;
  }
  function detectQuad(c){
    if(!window.cv||!cv.Mat)return null;
    let src=null,gray=null,edges=null,th=null,k=null,cs=null,hier=null;
    try{
      src=cv.imread(c);
      const scale=Math.min(1,1800/Math.max(src.cols,src.rows));
      if(scale<1){const r=new cv.Mat();cv.resize(src,r,new cv.Size(Math.round(src.cols*scale),Math.round(src.rows*scale)),0,0,cv.INTER_AREA);src.delete();src=r;}
      const frame=src.cols*src.rows;
      gray=new cv.Mat();cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);
      const edgeSets=[];
      edges=new cv.Mat();cv.GaussianBlur(gray,gray,new cv.Size(5,5),0);cv.Canny(gray,edges,20,85);edgeSets.push(edges);
      th=new cv.Mat();cv.adaptiveThreshold(gray,th,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY,31,7);cv.bitwise_not(th,th);edgeSets.push(th);
      k=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(9,9));
      const candidates=[];
      for(const ed of edgeSets){
        const closed=new cv.Mat();cv.morphologyEx(ed,closed,cv.MORPH_CLOSE,k);
        cs=new cv.MatVector();hier=new cv.Mat();cv.findContours(closed,cs,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
        for(let i=0;i<cs.size();i++){
          const cnt=cs.get(i),per=cv.arcLength(cnt,true),rawArea=Math.abs(cv.contourArea(cnt));
          if(rawArea<frame*.02){cnt.delete();continue;}
          const a=new cv.Mat();cv.approxPolyDP(cnt,a,Math.max(2,.018*per),true);
          if(a.rows===4&&cv.isContourConvex(a)){
            const pts=[];for(let j=0;j<4;j++){const z=a.intPtr(j,0);pts.push({x:z[0]/scale,y:z[1]/scale})}
            const p=order(pts);const area=Math.abs(cv.contourArea(a))/(scale*scale);const score=quadScore(p,area,c.width*c.height);
            if(score>=0)candidates.push({p,score});
          }
          a.delete();cnt.delete();
        }
        closed.delete();cs.delete();hier.delete();cs=null;hier=null;
      }
      candidates.sort((a,b)=>b.score-a.score);
      if(candidates[0])return candidates[0].p;

      // Fallback for faint/low-contrast card borders: largest plausible rotated rectangle.
      const all=new cv.MatVector();const hh=new cv.Mat();cv.findContours(th,all,hh,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
      let best=null,bestScore=-1;
      for(let i=0;i<all.size();i++){
        const cnt=all.get(i),area=Math.abs(cv.contourArea(cnt));
        if(area<frame*.04){cnt.delete();continue;}
        const rect=cv.minAreaRect(cnt),rw=rect.size.width,rh=rect.size.height;if(!rw||!rh){cnt.delete();continue;}
        const r=Math.max(rw,rh)/Math.min(rw,rh);if(r<1.30||r>1.82){cnt.delete();continue;}
        const s=(1-Math.min(1,Math.abs(r-CARD.ratio)/.30))*.7+Math.min(1,(area/frame)/.30)*.3;
        if(s>bestScore){const v=cv.RotatedRect.points(rect);best={p:v.map(z=>({x:z.x/scale,y:z.y/scale})),score:s};bestScore=s;}
        cnt.delete();
      }
      all.delete();hh.delete();return best?.p||null;
    }catch(e){console.warn('ID card detection failed',e);return null}
    finally{[src,gray,edges,th,k,cs,hier].forEach(x=>{try{x&&x.delete()}catch{}})}
  }
  function warp(c,q){
    if(!window.cv||!q)return c;
    try{
      const p=order(q),W=Math.max(500,Math.round(Math.max(dist(p[0],p[1]),dist(p[3],p[2])))),H=Math.max(315,Math.round(Math.max(dist(p[0],p[3]),dist(p[1],p[2]))));
      const si=cv.imread(c),sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(z=>[z.x,z.y])),dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,W-1,0,W-1,H-1,0,H-1]),M=cv.getPerspectiveTransform(sp,dp),di=new cv.Mat();
      cv.warpPerspective(si,di,M,new cv.Size(W,H),cv.INTER_CUBIC,cv.BORDER_REPLICATE);
      const o=document.createElement('canvas');o.width=W;o.height=H;cv.imshow(o,di);[si,sp,dp,M,di].forEach(x=>{try{x.delete()}catch{}});return o;
    }catch{return c}
  }
  function fitExact(c){
    const W=Math.round(CARD.w/25.4*CARD.dpi),H=Math.round(CARD.h/25.4*CARD.dpi),o=document.createElement('canvas');o.width=W;o.height=H;
    const x=o.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
    // The input has already been cropped/warped to the card. Fill the exact physical canvas — no letterboxing, no surrounding table/background.
    x.drawImage(c,0,0,W,H);return o;
  }
  async function makeCard(data){const im=await img(data);let c=toCanvas(im);await waitCV();const q=detectQuad(c);if(q)c=warp(c,q);return fitExact(c)}
  function installUI(){
    const main=$('fileInput');if(!main||$('idBackInput'))return;
    const wrap=document.createElement('div');wrap.id='idBackUpload';wrap.className='upload';wrap.style.display='none';wrap.innerHTML='<strong>🪪 Upload ID Card Back Side</strong><span>Upload the back-side photo separately. Original is never overwritten.</span><input id="idBackInput" type="file" accept="image/*">';main.closest('.upload')?.after(wrap);
    $('idBackInput').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{backData=await read(f);updateStatus()}catch{alert('Could not read the back-side image.')}});
    const oldSelect=window.selectType;if(typeof oldSelect==='function'&&!oldSelect.__fb){const s=oldSelect;const wrapped=function(t){s(t);const b=$('idBackUpload');if(b)b.style.display=t==='id'?'block':'none';if(t!=='id'){frontData=null;backData=null;frontCanvas=null;backCanvas=null;if($('idBackInput'))$('idBackInput').value='';}};wrapped.__fb=true;window.selectType=wrapped;try{window.selectType(window.type||'document')}catch{}}
    main.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f||window.type!=='id')return;try{frontData=await read(f);updateStatus()}catch{}});
  }
  function updateStatus(){const b=$('idBackUpload');if(!b)return;const s=b.querySelector('span');if(s)s.textContent=frontData&&backData?'✓ Front + Back selected — exact 85.6 × 54 mm Xerox print ready.':frontData?'✓ Front selected — now upload the Back side.':'Upload the back-side photo separately.'}
  async function run(){
    if(window.type!=='id'||!frontData||!backData)return window.__idfbOldRun?window.__idfbOldRun():alert(window.type==='id'?'Please upload both Front and Back images.':'Upload the document photo first.');
    $('preview').classList.remove('hidden');const body=$('previewBody');body.innerHTML='<div class="ai-badge">⏳ Detecting card edges and preparing true-size 85.6 × 54 mm Front + Back Xerox.</div>';
    try{
      frontCanvas=await makeCard(frontData);backCanvas=await makeCard(backData);
      const a=frontCanvas.toDataURL('image/jpeg',.985),b=backCanvas.toDataURL('image/jpeg',.985);
      body.innerHTML='<div class="ai-badge">✓ Cropped to card • 85.6 × 54 mm • 300 DPI • original content preserved.</div><div style="display:flex;gap:20px;justify-content:center;align-items:flex-start;flex-wrap:wrap"><div class="preview-sheet" style="width:323.5px"><p><b>Front • 85.6 × 54 mm</b></p><img style="display:block;width:323.5px;height:204.1px;object-fit:fill;border:1px solid #bbb" src="'+a+'"></div><div class="preview-sheet" style="width:323.5px"><p><b>Back • 85.6 × 54 mm</b></p><img style="display:block;width:323.5px;height:204.1px;object-fit:fill;border:1px solid #bbb" src="'+b+'"></div></div><p style="text-align:center;font-size:13px">Preview is shown at approximately physical 96-DPI scale. Final print uses exact millimetre dimensions.</p>';
      const acts=document.createElement('div');acts.className='actions';acts.innerHTML='<button class="secondary" onclick="window.idFbClear()">Change Front/Back</button><button class="primary" onclick="window.confirmScannerPrint()">Confirm & Print</button>';body.appendChild(acts);
    }catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ Could not prepare the ID card safely. Original images are untouched.</div>'}
  }
  function confirm(){
    if(window.type!=='id'||!frontCanvas||!backCanvas)return window.__idfbOldConfirm?window.__idfbOldConfirm():alert('Prepare the preview first.');
    if(typeof window.canPrint==='function'&&!window.canPrint())return;
    const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies')?.value||1),w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');
    const f=frontCanvas.toDataURL('image/png'),b=backCanvas.toDataURL('image/png');
    const pages=Array.from({length:copies},()=>'<div class="p"><div class="pair"><img src="'+f+'"><img src="'+b+'"></div></div>').join('');
    const pw=paper==='A5'?148:210,ph=paper==='A5'?210:297;
    const css='@page{size:'+paper+' portrait;margin:0}html,body{margin:0;padding:0;background:#fff}.p{width:'+pw+'mm;height:'+ph+'mm;display:flex;align-items:center;justify-content:center;page-break-after:always;overflow:hidden}.p:last-child{page-break-after:auto}.pair{display:flex;gap:8mm;align-items:center;justify-content:center}.pair img{display:block;width:85.6mm;height:54mm;min-width:85.6mm;min-height:54mm;max-width:85.6mm;max-height:54mm;object-fit:fill}';
    w.document.write('<!doctype html><html><head><title>NR BizPro ID Card Front + Back</title><style>'+css+'</style></head><body>'+pages+'<script>window.onload=function(){setTimeout(function(){window.print()},500)}<\\/script></body></html>');w.document.close();
    setTimeout(()=>{try{const key='nr-bizpro-smart-print-customer-test-v1',all=JSON.parse(localStorage.getItem(key)||'{}');if(all.test){all.test.trialCopies=(all.test.trialCopies||0)+copies;localStorage.setItem(key,JSON.stringify(all))}}catch{}},1200)
  }
  function clear(){frontData=null;backData=null;frontCanvas=null;backCanvas=null;if($('fileInput'))$('fileInput').value='';if($('idBackInput'))$('idBackInput').value='';$('preview')?.classList.add('hidden');updateStatus()}
  function hook(){installUI();window.__idfbOldRun=window.runScannerPreview;window.__idfbOldConfirm=window.confirmScannerPrint;window.runScannerPreview=run;window.confirmScannerPrint=confirm;window.idFbClear=clear;const main=$('fileInput');if(main&&window.type==='id'&&!frontData&&main.files?.[0])read(main.files[0]).then(x=>{frontData=x;updateStatus()})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(hook,300));else setTimeout(hook,300);
})();
