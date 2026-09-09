/* NR BizPro Smart Print — ID Card Front + Back V2
   Both sides can be selected together. Color mode is preserved. Exact CR80 output. */
(function(){
  const CARD={w:85.6,h:54,dpi:300,ratio:85.6/54};
  let front=null,back=null,frontCanvas=null,backCanvas=null;
  const $=id=>document.getElementById(id);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const img=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function order(p){const tl=p.reduce((a,b)=>a.x+a.y<b.x+b.y?a:b),br=p.reduce((a,b)=>a.x+a.y>b.x+b.y?a:b),tr=p.reduce((a,b)=>a.y-a.x<b.y-b.x?a:b),bl=p.reduce((a,b)=>a.y-a.x>b.y-b.x?a:b);return[tl,tr,br,bl]}
  function sourceCanvas(i){const c=document.createElement('canvas');c.width=i.naturalWidth||i.width;c.height=i.naturalHeight||i.height;c.getContext('2d').drawImage(i,0,0);return c}
  async function waitCV(){const t=Date.now();while(Date.now()-t<7000){if(window.cv&&cv.Mat)return true;await wait(100)}return false}
  function detect(c){
    if(!window.cv||!cv.Mat)return null;
    let s,g,e,vec,h;
    try{
      s=cv.imread(c);const scale=Math.min(1,1800/Math.max(s.cols,s.rows));
      if(scale<1){const r=new cv.Mat();cv.resize(s,r,new cv.Size(Math.round(s.cols*scale),Math.round(s.rows*scale)),0,0,cv.INTER_AREA);s.delete();s=r}
      const frame=s.cols*s.rows;g=new cv.Mat();cv.cvtColor(s,g,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(g,g,new cv.Size(5,5),0);e=new cv.Mat();cv.Canny(g,e,25,90);const k=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(9,9));const cl=new cv.Mat();cv.morphologyEx(e,cl,cv.MORPH_CLOSE,k);vec=new cv.MatVector();h=new cv.Mat();cv.findContours(cl,vec,h,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);let best=null,bestScore=-1;
      for(let i=0;i<vec.size();i++){const cnt=vec.get(i),area=Math.abs(cv.contourArea(cnt));if(area<frame*.08){cnt.delete();continue}const per=cv.arcLength(cnt,true),a=new cv.Mat();cv.approxPolyDP(cnt,a,Math.max(2,.02*per),true);if(a.rows===4&&cv.isContourConvex(a)){let pts=[];for(let j=0;j<4;j++){const z=a.intPtr(j,0);pts.push({x:z[0]/scale,y:z[1]/scale})}pts=order(pts);const w=(dist(pts[0],pts[1])+dist(pts[3],pts[2]))/2,hh=(dist(pts[0],pts[3])+dist(pts[1],pts[2]))/2,r=Math.max(w,hh)/Math.min(w,hh);const ar=area/frame;if(r>=1.25&&r<=1.9){const score=(1-Math.min(1,Math.abs(r-CARD.ratio)/.35))*.7+Math.min(1,ar/.55)*.3;if(score>bestScore){best=pts;bestScore=score}}}a.delete();cnt.delete()}
      [s,g,e,vec,h].forEach(x=>{try{x.delete()}catch{}});return best;
    }catch(err){console.warn('ID V2 edge detection',err);[s,g,e,vec,h].forEach(x=>{try{x&&x.delete()}catch{}});return null}
  }
  function warp(c,q){
    if(!q||!window.cv)return c;try{const p=order(q),W=Math.max(500,Math.round(Math.max(dist(p[0],p[1]),dist(p[3],p[2])))),H=Math.max(315,Math.round(Math.max(dist(p[0],p[3]),dist(p[1],p[2])))),si=cv.imread(c),sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(z=>[z.x,z.y])),dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,W-1,0,W-1,H-1,0,H-1]),M=cv.getPerspectiveTransform(sp,dp),di=new cv.Mat();cv.warpPerspective(si,di,M,new cv.Size(W,H),cv.INTER_CUBIC,cv.BORDER_REPLICATE);const o=document.createElement('canvas');o.width=W;o.height=H;cv.imshow(o,di);[si,sp,dp,M,di].forEach(x=>{try{x.delete()}catch{}});return o}catch{return c}}
  function exact(c){const W=Math.round(CARD.w/25.4*CARD.dpi),H=Math.round(CARD.h/25.4*CARD.dpi),o=document.createElement('canvas');o.width=W;o.height=H;const x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(c,0,0,W,H);return o}
  async function prepare(data){const i=await img(data);let c=sourceCanvas(i);await waitCV();const q=detect(c);if(q)c=warp(c,q);return exact(c)}
  function idMode(){return document.querySelector('.types button.active')?.dataset.type==='id'||window.type==='id'}
  function setStatus(){const q=$('quality');if(!q)return;q.textContent=front&&back?'✓ Front + Back selected • ID Card 85.6 × 54 mm • Color preserved • ready for preview.':front?'✓ Front selected • Select the Back side too.':'Upload Front + Back for ID Card printing.';q.classList.remove('hidden')}
  function install(){
    const input=$('fileInput');if(!input)return;
    input.multiple=true;input.setAttribute('accept','image/*');
    const oldBack=$('idBackUpload');if(oldBack)oldBack.style.display='none';
    let note=document.getElementById('idV2Note');if(!note){note=document.createElement('div');note.id='idV2Note';note.className='pro-note';note.style.display='none';note.innerHTML='<b>🪪 ID Card Front + Back:</b> Select both photos together in one upload. Color is preserved. Output is exact 85.6 × 54 mm at 300 DPI.';input.closest('.upload')?.after(note)}
    input.addEventListener('change',async e=>{if(!idMode())return;const fs=Array.from(e.target.files||[]).filter(f=>f.type.startsWith('image/'));if(fs[0])front=await read(fs[0]);if(fs[1])back=await read(fs[1]);setStatus()});
    const s=window.selectType;if(typeof s==='function'&&!s.__idV2){const w=function(t){const r=s(t);const n=$('idV2Note');if(n)n.style.display=t==='id'?'block':'none';if(t!=='id'){front=back=null;frontCanvas=backCanvas=null}return r};w.__idV2=true;window.selectType=w}
  }
  async function preview(){
    if(!idMode())return window.__idV2OldRun?window.__idV2OldRun():undefined;
    if(!front||!back){alert('ID Card: select both Front and Back photos together.');return}
    $('preview')?.classList.remove('hidden');const body=$('previewBody');body.innerHTML='<div class="ai-badge">⏳ Preparing Front + Back • detecting edges • exact 85.6 × 54 mm • preserving Color.</div>';
    try{frontCanvas=await prepare(front);backCanvas=await prepare(back);const mode=$('mode')?.value||'Color';if(mode==='Black & White'){[frontCanvas,backCanvas].forEach(c=>{const x=c.getContext('2d'),d=x.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4){const y=.299*d.data[i]+.587*d.data[i+1]+.114*d.data[i+2];d.data[i]=d.data[i+1]=d.data[i+2]=y}x.putImageData(d,0,0)})}const f=frontCanvas.toDataURL('image/png'),b=backCanvas.toDataURL('image/png');body.innerHTML='<div class="ai-badge">✓ ID Card Front + Back • 85.6 × 54 mm • 300 DPI • Mode: '+mode+' • no forced grayscale in Color mode.</div><div style="display:flex;gap:20px;justify-content:center;align-items:flex-start;flex-wrap:wrap"><div style="width:323.5px"><p><b>Front • 85.6 × 54 mm</b></p><img src="'+f+'" style="display:block;width:323.5px;height:204.1px;object-fit:fill;border:1px solid #aaa"></div><div style="width:323.5px"><p><b>Back • 85.6 × 54 mm</b></p><img src="'+b+'" style="display:block;width:323.5px;height:204.1px;object-fit:fill;border:1px solid #aaa"></div></div><p style="text-align:center;font-size:13px">Both sides are visible before printing. Color mode keeps the uploaded colors.</p>'}catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ ID Card could not be prepared safely. Please select the two original photos again.</div>'}
  }
  function print(){
    if(!idMode())return window.__idV2OldConfirm?window.__idV2OldConfirm():undefined;
    if(!frontCanvas||!backCanvas){alert('Open ID Card Preview first.');return}if(typeof window.canPrint==='function'&&!window.canPrint())return;const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies')?.value||1),mode=$('mode')?.value||'Color',w=window.open('','_blank');if(!w){alert('Allow pop-ups to print.');return}const f=frontCanvas.toDataURL('image/png'),b=backCanvas.toDataURL('image/png'),pw=paper==='A5'?148:210,ph=paper==='A5'?210:297;const pages=Array.from({length:copies},()=>'<div class="p"><div class="pair"><img src="'+f+'"><img src="'+b+'"></div></div>').join('');const filter=mode==='Black & White'?'filter:grayscale(1)':'';const css='@page{size:'+paper+' portrait;margin:0}html,body{margin:0;padding:0;background:#fff}.p{width:'+pw+'mm;height:'+ph+'mm;display:flex;align-items:center;justify-content:center;page-break-after:always;overflow:hidden}.pair{display:flex;gap:8mm;align-items:center;justify-content:center}.pair img{display:block;width:85.6mm;height:54mm;min-width:85.6mm;min-height:54mm;max-width:85.6mm;max-height:54mm;object-fit:fill;'+filter+'}';w.document.write('<!doctype html><html><head><title>NR BizPro ID Card Front + Back</title><style>'+css+'</style></head><body>'+pages+'<script>window.onload=function(){setTimeout(function(){window.print()},600)};window.onafterprint=function(){window.close()}<\\/script></body></html>');w.document.close();
  }
  function boot(){install();window.__idV2OldRun=window.runScannerPreview;window.__idV2OldConfirm=window.confirmScannerPrint;window.runScannerPreview=function(){return idMode()?preview():window.__idV2OldRun?.()};window.confirmScannerPrint=function(){return idMode()?print():window.__idV2OldConfirm?.()};window.__finalDirectPrint=window.confirmScannerPrint}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1200));else setTimeout(boot,1200);
})();
