/* NR BizPro Smart Print — automatic document crop / perspective correction */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let cvPromise=null, preparedPages=[];
  const customerMode=()=>new URLSearchParams(location.search).get('customerTest')==='1';
  function loadCV(){
    if(window.cv&&window.cv.Mat)return Promise.resolve(window.cv);
    if(cvPromise)return cvPromise;
    cvPromise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://docs.opencv.org/4.x/opencv.js';s.async=true;s.onload=()=>{const w=()=>window.cv&&window.cv.Mat?resolve(window.cv):setTimeout(w,50);w()};s.onerror=()=>reject(new Error('OpenCV could not load'));document.head.appendChild(s)});
    return cvPromise;
  }
  function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
  function readImage(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
  function orderPoints(p){const a=p.slice().sort((u,v)=>u.y-v.y),top=a.slice(0,2).sort((u,v)=>u.x-v.x),bot=a.slice(2).sort((u,v)=>u.x-v.x);return [top[0],top[1],bot[1],bot[0]]}
  async function cropDocument(im){
    const cv=await loadCV(),src=document.createElement('canvas');src.width=im.naturalWidth||im.width;src.height=im.naturalHeight||im.height;src.getContext('2d').drawImage(im,0,0);
    const mat=cv.imread(src),gray=new cv.Mat(),blur=new cv.Mat(),edges=new cv.Mat();cv.cvtColor(mat,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);cv.Canny(blur,35,120,edges);
    const contours=new cv.MatVector(),hier=new cv.Mat();cv.findContours(edges,contours,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);const area0=mat.rows*mat.cols;let best=null,bestArea=0;
    for(let i=0;i<contours.size();i++){const c=contours.get(i),peri=cv.arcLength(c,true),ap=new cv.Mat();cv.approxPolyDP(c,ap,0.018*peri,true);const ar=Math.abs(cv.contourArea(ap));if(ap.rows===4&&ar>bestArea&&ar>area0*0.20){bestArea=ar;best=ap.clone()}ap.delete();c.delete()}
    let out=src,detected=false;
    if(best){const p=[];for(let i=0;i<4;i++)p.push({x:best.intAt(i,0),y:best.intAt(i,1)});const [tl,tr,br,bl]=orderPoints(p);const w=Math.max(Math.hypot(tr.x-tl.x,tr.y-tl.y),Math.hypot(br.x-bl.x,br.y-bl.y));const h=Math.max(Math.hypot(bl.x-tl.x,bl.y-tl.y),Math.hypot(br.x-tr.x,br.y-tr.y));if(w>300&&h>400&&w*h>area0*.20){const margin=Math.max(2,Math.round(Math.min(w,h)*.008)),W=Math.round(w+margin*2),H=Math.round(h+margin*2),sp=cv.matFromArray(4,1,cv.CV_32FC2,[tl.x,tr.x,tr.y,tl.y,br.x,br.y,bl.x,bl.y]),dp=cv.matFromArray(4,1,cv.CV_32FC2,[margin,margin,W-margin-1,margin,W-margin-1,H-margin-1,margin,H-margin-1]),M=cv.getPerspectiveTransform(sp,dp),dst=new cv.Mat();cv.warpPerspective(mat,dst,M,new cv.Size(W,H),cv.INTER_CUBIC,cv.BORDER_REPLICATE);out=document.createElement('canvas');out.width=W;out.height=H;cv.imshow(out,dst);M.delete();dst.delete();sp.delete();dp.delete();detected=true}best.delete()}
    mat.delete();gray.delete();blur.delete();edges.delete();contours.delete();hier.delete();return {canvas:out,detected};
  }
  function enhance(c){const maxW=2480,maxH=3508,sc=Math.min(1.5,maxW/c.width,maxH/c.height),w=Math.max(1,Math.round(c.width*sc)),h=Math.max(1,Math.round(c.height*sc)),o=document.createElement('canvas');o.width=w;o.height=h;const x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(c,0,0,w,h);const im=x.getImageData(0,0,w,h),d=im.data;for(let i=0;i<d.length;i+=4){d[i]=Math.max(0,Math.min(255,(d[i]-128)*1.06+128));d[i+1]=Math.max(0,Math.min(255,(d[i+1]-128)*1.06+128));d[i+2]=Math.max(0,Math.min(255,(d[i+2]-128)*1.06+128))}x.putImageData(im,0,0);return o}
  async function buildFromUpload(){
    const input=$('fileInput'),files=input?.files;if(!files||!files.length)return false;
    if(files[0].type==='application/pdf'||/\.pdf$/i.test(files[0].name))return false;
    preparedPages=[];let detected=0;
    for(const f of files){if(f.type&&!f.type.startsWith('image/'))continue;const src=await readImage(f),im=await loadImage(src);let r;try{r=await cropDocument(im)}catch(e){r={canvas:(()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c})(),detected:false}}const c=$('safeEnhance')?.checked===false?r.canvas:enhance(r.canvas);preparedPages.push(c.toDataURL('image/png'));if(r.detected)detected++}
    const hint=$('typeHint');if(hint)hint.textContent=`✓ ${preparedPages.length} print-ready page${preparedPages.length>1?'s':''} prepared${detected?` • ${detected} document${detected>1?'s':''} auto-cropped & perspective-corrected`:' • original framing retained'}.`;
    return preparedPages.length>0;
  }
  function activeType(){return document.querySelector('.types button.active')?.dataset.type||'document'}
  window.previewPrint=async function(){
    const input=$('fileInput');if(!input?.files?.length)return alert('Upload a WhatsApp image or PDF first.');
    if(typeof window.canPrint==='function'&&!window.canPrint())return;
    if(activeType()==='passport')return alert('Passport-size photos are Premium only. Please activate Smart Print Premium.');
    const built=await buildFromUpload();if(!built)return alert('PDF preview will use the standard Smart Print preview.');
    const copies=Math.max(1,Number($('copies')?.value)||1),body=$('previewBody');body.innerHTML=`<div class="ai-badge">✓ Smart Clean + Auto Document Crop + Perspective Correction ready — original content preserved</div>${preparedPages.map((p,i)=>`<div class="preview-sheet"><p><b>${activeType()==='id'?'ID Card':'Document'} • Page ${i+1}${preparedPages.length>1?` of ${preparedPages.length}`:''} • ${copies} copy/copies</b></p><img src="${p}" alt="Print preview page ${i+1}"></div>`).join('')}`;$('preview').classList.remove('hidden');
  };
  window.printNow=async function(){await window.previewPrint()};
  window.confirmPrint=function(){
    if(!preparedPages.length)return alert('Prepare the Scanner Preview first.');
    const copies=Math.max(1,Number($('copies')?.value)||1),paper=$('paper')?.value||'A4',mode=$('mode')?.value||'Color',pages=[];for(let n=0;n<copies;n++)pages.push(...preparedPages);
    const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');w.document.write(`<html><head><title>NR BizPro Smart Print</title><style>@page{size:${paper};margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain;${mode==='Black & White'?'filter:grayscale(1)':''}}</style></head><body>${pages.map((p,i)=>`<div class="page"><img src="${p}"></div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script></body></html>`);w.document.close();
    if(!customerMode()){try{const sid=localStorage.getItem('nr-bizpro-session-v1'),all=JSON.parse(localStorage.getItem('nr-bizpro-smart-print-v1')||'{}');if(sid&&all[sid]){all[sid].trialCopies=(all[sid].trialCopies||0)+copies;localStorage.setItem('nr-bizpro-smart-print-v1',JSON.stringify(all))}}catch{}}
    setTimeout(()=>{window.closePreview?.()},900);
  };
})();
