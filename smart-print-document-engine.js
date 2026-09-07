/* NR BizPro Smart Print — in-page document scanner engine.
   Designed for WhatsApp camera photos: detect page edges, correct perspective,
   flatten shadows/uneven lighting, and prepare a xerox-like print image.
   Source files are never modified and no text is generated. */
(function(){
  const MAX_SIDE=2600;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const matToCanvas=(mat)=>{const c=document.createElement('canvas');c.width=mat.cols;c.height=mat.rows;cv.imshow(c,mat);return c};
  function orderQuad(pts){
    const sums=pts.map(p=>p.x+p.y), diffs=pts.map(p=>p.x-p.y);
    return [pts[sums.indexOf(Math.min(...sums))],pts[diffs.indexOf(Math.max(...diffs))],pts[sums.indexOf(Math.max(...sums))],pts[diffs.indexOf(Math.min(...diffs))]];
  }
  function detectQuad(src){
    let scale=Math.min(1,1100/Math.max(src.cols,src.rows));
    const small=new cv.Mat();cv.resize(src,small,new cv.Size(0,0),scale,scale,cv.INTER_AREA);
    const gray=new cv.Mat(),blur=new cv.Mat(),edge=new cv.Mat();cv.cvtColor(small,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);cv.Canny(blur,40,120,edge);
    const contours=new cv.MatVector(),hier=new cv.Mat();cv.findContours(edge,contours,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
    let best=null,bestArea=0,frame=small.rows*small.cols;
    for(let i=0;i<contours.size();i++){
      const cnt=contours.get(i), peri=cv.arcLength(cnt,true), approx=new cv.Mat();cv.approxPolyDP(cnt,approx,.02*peri,true);const area=Math.abs(cv.contourArea(approx));
      if(approx.rows===4 && area>frame*.18 && area>bestArea){
        const pts=[];for(let j=0;j<4;j++)pts.push({x:approx.intPtr(j,0)[0]/scale,y:approx.intPtr(j,0)[1]/scale});best=pts;bestArea=area;
      } approx.delete();cnt.delete();
    }
    small.delete();gray.delete();blur.delete();edge.delete();contours.delete();hier.delete();
    return best;
  }
  function warp(src,quad){
    if(!quad)return src;
    const p=orderQuad(quad),w=Math.max(Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y));
    const h=Math.max(Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y),Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y));
    if(w<100||h<100)return src;
    const srcPts=cv.matFromArray(4,1,cv.CV_32FC2,[p[0].x,p[0].y,p[1].x,p[1].y,p[2].x,p[2].y,p[3].x,p[3].y]);
    const dstPts=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,w,0,w,h,0,h]),M=cv.getPerspectiveTransform(srcPts,dstPts),dst=new cv.Mat();
    cv.warpPerspective(src,dst,M,new cv.Size(Math.round(w),Math.round(h)),cv.INTER_CUBIC,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));
    srcPts.delete();dstPts.delete();M.delete();return dst;
  }
  function flattenShadows(src){
    const gray=new cv.Mat();cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);
    const bg=new cv.Mat(),norm=new cv.Mat();const k=cv.getStructuringElement(cv.MORPH_ELLIPSE,new cv.Size(31,31));
    cv.morphologyEx(gray,bg,cv.MORPH_CLOSE,k);cv.divide(gray,bg,norm,255,cv.CV_8U);
    const clahe=new cv.CLAHE(2.0,new cv.Size(8,8)),enh=new cv.Mat();clahe.apply(norm,enh);
    const out=new cv.Mat();cv.cvtColor(enh,out,cv.COLOR_GRAY2RGBA);
    gray.delete();bg.delete();norm.delete();k.delete();clahe.delete();enh.delete();return out;
  }
  function xeroxBW(src){
    const gray=new cv.Mat();cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);
    const den=new cv.Mat();cv.GaussianBlur(gray,den,new cv.Size(3,3),0);
    const bw=new cv.Mat();cv.adaptiveThreshold(den,bw,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY,31,11);
    const out=new cv.Mat();cv.cvtColor(bw,out,cv.COLOR_GRAY2RGBA);
    gray.delete();den.delete();bw.delete();return out;
  }
  async function process(srcData,mode){
    if(typeof cv==='undefined'||!cv.Mat)return null;
    const im=await loadImage(srcData),base=document.createElement('canvas');let scale=Math.min(1,MAX_SIDE/Math.max(im.naturalWidth||im.width,im.naturalHeight||im.height));base.width=Math.round((im.naturalWidth||im.width)*scale);base.height=Math.round((im.naturalHeight||im.height)*scale);base.getContext('2d').drawImage(im,0,0,base.width,base.height);
    let src=cv.imread(base),warped=src,quad=null;try{quad=detectQuad(src);if(quad)warped=warp(src,quad);const clean=flattenShadows(warped);let final=clean;if(mode==='Black & White')final=xeroxBW(clean);const out=matToCanvas(final);const result=out.toDataURL('image/png');src.delete();if(warped!==src)warped.delete();clean.delete();if(final!==clean)final.delete();return {data:result,corrected:!!quad};}catch(e){try{src.delete();}catch{}if(warped!==src)try{warped.delete();}catch{}throw e;}
  }
  function install(){
    const old=window.prepareProcessedPages;if(typeof old!=='function'||old.__documentEngine)return;
    async function wrapped(){
      if(type!=='document'){await old();return;}
      // Skip the older generic enhancement for documents: this engine replaces it
      // with a document-scanner pipeline that is edge-aware and shadow-aware.
      if(!sourcePages?.length)return;
      processedPages=[];let fixed=0;
      for(const src of sourcePages){
        try{const r=await process(src,$('mode')?.value||'Black & White');if(r){processedPages.push(r.data);if(r.corrected)fixed++;}else{processedPages.push(src)}}
        catch(e){console.warn('Smart Print document engine fallback',e);processedPages.push(src)}
      }
      $('typeHint').textContent=`✓ ${processedPages.length} print-ready page${processedPages.length>1?'s':''} • ${fixed?'document edges corrected • shadows flattened • xerox cleanup applied':'safe cleanup applied'} • original untouched.`;
    }
    wrapped.__documentEngine=true;window.prepareProcessedPages=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,400));else setTimeout(install,400);
})();