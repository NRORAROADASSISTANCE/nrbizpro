/* NR BizPro Smart Print — automatic document crop / perspective correction */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let cvPromise=null;
  function loadCV(){
    if(window.cv&&window.cv.Mat)return Promise.resolve(window.cv);
    if(cvPromise)return cvPromise;
    cvPromise=new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://docs.opencv.org/4.x/opencv.js';
      s.async=true;
      s.onload=()=>{const wait=()=>{if(window.cv&&window.cv.Mat)resolve(window.cv);else setTimeout(wait,50)};wait()};
      s.onerror=()=>reject(new Error('OpenCV could not load'));
      document.head.appendChild(s);
    });
    return cvPromise;
  }
  function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
  function orderPoints(p){
    const pts=p.map(x=>({x:x.x,y:x.y}));
    pts.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
    const tl=pts[0],br=pts[3];
    const mid=[pts[1],pts[2]].sort((a,b)=>a.x-b.x);
    return [tl,mid[0],br,mid[1]];
  }
  function warpDocument(im){
    return loadCV().then(cv=>{
      const src=document.createElement('canvas');
      src.width=im.naturalWidth||im.width;src.height=im.naturalHeight||im.height;
      src.getContext('2d').drawImage(im,0,0);
      let mat=cv.imread(src), gray=new cv.Mat(), blur=new cv.Mat(), edges=new cv.Mat();
      cv.cvtColor(mat,gray,cv.COLOR_RGBA2GRAY);
      cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);
      cv.Canny(blur,edges,45,140);
      const contours=new cv.MatVector(),hier=new cv.Mat();
      cv.findContours(edges,contours,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
      let best=null,bestArea=0;
      const imageArea=mat.rows*mat.cols;
      for(let i=0;i<contours.size();i++){
        const c=contours.get(i), peri=cv.arcLength(c,true), approx=new cv.Mat();
        cv.approxPolyDP(c,approx,0.02*peri,true);
        const area=Math.abs(cv.contourArea(approx));
        if(approx.rows===4&&area>bestArea&&area>imageArea*0.12){
          bestArea=area;best=approx.clone();
        }
        approx.delete();c.delete();
      }
      let outCanvas=src,detected=false;
      if(best){
        const p=[];for(let i=0;i<4;i++)p.push({x:best.intAt(i,0),y:best.intAt(i,1)});
        const [tl,tr,br,bl]=orderPoints(p);
        const width=Math.max(Math.hypot(br.x-bl.x,br.y-bl.y),Math.hypot(tr.x-tl.x,tr.y-tl.y));
        const height=Math.max(Math.hypot(tr.x-br.x,tr.y-br.y),Math.hypot(tl.x-bl.x,tl.y-bl.y));
        if(width>250&&height>350&&width*height>imageArea*0.15){
          const maxW=2480,maxH=3508,scale=Math.min(1,maxW/width,maxH/height),W=Math.max(300,Math.round(width*scale)),H=Math.max(400,Math.round(height*scale));
          const srcPts=cv.matFromArray(4,1,cv.CV_32FC2,[tl.x,tr.x,tr.y,tl.y,br.x,br.y,bl.x,bl.y]);
          const dstPts=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,W-1,0,W-1,H-1,0,H-1]);
          const M=cv.getPerspectiveTransform(srcPts,dstPts),dst=new cv.Mat();
          cv.warpPerspective(mat,dst,M,new cv.Size(W,H),cv.INTER_CUBIC,cv.BORDER_REPLICATE);
          outCanvas=document.createElement('canvas');outCanvas.width=W;outCanvas.height=H;cv.imshow(outCanvas,dst);detected=true;
          M.delete();dst.delete();srcPts.delete();dstPts.delete();
        }
        best.delete();
      }
      mat.delete();gray.delete();blur.delete();edges.delete();contours.delete();hier.delete();
      return {canvas:outCanvas,detected};
    });
  }
  function enhance(c){
    const maxW=2480,maxH=3508,scale=Math.min(1.5,maxW/c.width,maxH/c.height),w=Math.max(1,Math.round(c.width*scale)),h=Math.max(1,Math.round(c.height*scale));
    const o=document.createElement('canvas');o.width=w;o.height=h;const x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(c,0,0,w,h);
    const img=x.getImageData(0,0,w,h),d=img.data;let sum=0,count=0;
    for(let i=0;i<d.length;i+=4*30){sum+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];count++}
    const avg=sum/count,gain=avg<150?1.12:1.03;
    for(let i=0;i<d.length;i+=4){d[i]=Math.max(0,Math.min(255,(d[i]-128)*gain+128));d[i+1]=Math.max(0,Math.min(255,(d[i+1]-128)*gain+128));d[i+2]=Math.max(0,Math.min(255,(d[i+2]-128)*gain+128))}
    x.putImageData(img,0,0);return o;
  }
  async function buildPages(){
    if(!window.sourcePages||!sourcePages.length)return false;
    const out=[];let detected=0;
    for(const src of sourcePages){
      const im=await loadImage(src);let r;
      try{r=await warpDocument(im)}catch(e){r={canvas:(()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c})(),detected:false}}
      const c=($('safeEnhance')?.checked===false)?r.canvas:enhance(r.canvas);out.push(c.toDataURL('image/png'));if(r.detected)detected++;
    }
    window.processedPages=out;
    const hint=$('typeHint');if(hint)hint.textContent=`✓ ${out.length} print-ready page${out.length>1?'s':''} prepared${detected?` • ${detected} document${detected>1?'s':''} auto-cropped & straightened`: ' • original framing retained'}.`;
    return true;
  }
  window.previewPrint=async function(){
    if(!window.sourcePages||!sourcePages.length)return alert('Upload a WhatsApp image or PDF first.');
    if(typeof window.canPrint==='function'&&!window.canPrint())return;
    await buildPages();
    const copies=Math.max(1,Number($('copies')?.value)||1),type=window.type||'document';
    const body=$('previewBody');if(!body)return;
    body.innerHTML=`<div class="ai-badge">✓ Smart Clean + Auto Document Crop ready — original content preserved</div>${processedPages.map((p,i)=>`<div class="preview-sheet"><p><b>${type==='passport'?'Passport Photo':type==='id'?'ID Card':'Document'} • Page ${i+1}${processedPages.length>1?` of ${processedPages.length}`:''} • ${copies} copy/copies</b></p><img src="${p}" alt="Print preview page ${i+1}"></div>`).join('')}`;
    $('preview')?.classList.remove('hidden');
  };
  window.printNow=async function(){await window.previewPrint()};
})();
