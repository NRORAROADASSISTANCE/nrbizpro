/* NR BizPro Smart Print — universal in-browser document scanner/xerox engine. */
(function(){
  const MAX_SIDE=2600,$=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});

  function canvasFallback(c){
    const ctx=c.getContext('2d'),w=c.width,h=c.height,img=ctx.getImageData(0,0,w,h),d=img.data;
    for(let i=0;i<d.length;i+=4){const g=d[i]*.299+d[i+1]*.587+d[i+2]*.114;d[i]=d[i+1]=d[i+2]=clamp(g*1.04+3,0,255);d[i+3]=255}
    ctx.putImageData(img,0,0);return c;
  }

  function orderQuad(pts){
    const s=pts.map(p=>p.x+p.y),d=pts.map(p=>p.x-p.y);
    return [pts[s.indexOf(Math.min(...s))],pts[d.indexOf(Math.max(...d))],pts[s.indexOf(Math.max(...s))],pts[d.indexOf(Math.min(...d))]];
  }

  function quadQuality(pts,frame){
    const p=orderQuad(pts), sides=[
      Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y),
      Math.hypot(p[3].x-p[2].x,p[3].y-p[2].y),Math.hypot(p[0].x-p[3].x,p[0].y-p[3].y)
    ];
    const w=(sides[0]+sides[2])/2,h=(sides[1]+sides[3])/2,ratio=w/Math.max(1,h);
    if(ratio<.12||ratio>6)return 0;
    const minSide=Math.min(...sides),maxSide=Math.max(...sides);
    if(minSide<Math.min(frame.cols,frame.rows)*.025)return 0;
    const parallel=1-Math.min(1,Math.abs(sides[0]-sides[2])/Math.max(1,w)+Math.abs(sides[1]-sides[3])/Math.max(1,h));
    return parallel;
  }

  function detectQuad(src){
    const scale=Math.min(1,1600/Math.max(src.cols,src.rows));
    const small=new cv.Mat();cv.resize(src,small,new cv.Size(0,0),scale,scale,cv.INTER_AREA);
    const gray=new cv.Mat(),blur=new cv.Mat(),edge=new cv.Mat(),closed=new cv.Mat();
    cv.cvtColor(small,gray,cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);
    cv.Canny(blur,25,100,edge);
    const kernel=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(5,5));
    cv.dilate(edge,closed,kernel);cv.morphologyEx(closed,closed,cv.MORPH_CLOSE,kernel);
    const contours=new cv.MatVector(),hier=new cv.Mat();
    cv.findContours(closed,contours,hier,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
    const frame=small.rows*small.cols;let best=null,bestScore=0;
    for(let i=0;i<contours.size();i++){
      const cnt=contours.get(i),peri=cv.arcLength(cnt,true),approx=new cv.Mat();
      cv.approxPolyDP(cnt,approx,.025*peri,true);
      const area=Math.abs(cv.contourArea(approx)),frac=area/frame;
      if(approx.rows===4&&frac>.025&&frac<.97){
        const pts=[];for(let j=0;j<4;j++){const q=approx.intPtr(j,0);pts.push({x:q[0]/scale,y:q[1]/scale})}
        const quality=quadQuality(pts,src);if(quality){
          const p=orderQuad(pts),margin=Math.min(...pts.map(q=>Math.min(q.x,q.y,src.cols-q.x,src.rows-q.y)));
          const touches=margin<Math.min(src.cols,src.rows)*.012;
          const centerX=p.reduce((a,q)=>a+q.x,0)/4,centerY=p.reduce((a,q)=>a+q.y,0)/4;
          const centered=1-Math.min(1,Math.hypot(centerX-src.cols/2,centerY-src.rows/2)/Math.hypot(src.cols/2,src.rows/2));
          const score=(Math.sqrt(frac)*quality*(.75+.25*centered))*(touches?.88:1);
          if(score>bestScore){bestScore=score;best=pts}
        }
      }
      approx.delete();cnt.delete();
    }
    small.delete();gray.delete();blur.delete();edge.delete();closed.delete();kernel.delete();contours.delete();hier.delete();
    return bestScore>.14?best:null;
  }

  function warp(src,quad){
    if(!quad)return src;const p=orderQuad(quad);
    const w=Math.round(Math.max(Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y)));
    const h=Math.round(Math.max(Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y),Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y)));
    if(w<180||h<180)return src;
    const sp=cv.matFromArray(4,1,cv.CV_32FC2,[p[0].x,p[0].y,p[1].x,p[1].y,p[2].x,p[2].y,p[3].x,p[3].y]);
    const dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,w-1,0,w-1,h-1,0,h-1]);
    const M=cv.getPerspectiveTransform(sp,dp),dst=new cv.Mat();
    cv.warpPerspective(src,dst,M,new cv.Size(w,h),cv.INTER_CUBIC,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));
    sp.delete();dp.delete();M.delete();return dst;
  }

  // Gentle local illumination correction. It removes broad shadows without thresholding text/photos.
  function clean(src,mode){
    const gray=new cv.Mat(),bg=new cv.Mat(),norm=new cv.Mat(),smooth=new cv.Mat(),out=new cv.Mat();
    cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);
    const k=cv.getStructuringElement(cv.MORPH_ELLIPSE,new cv.Size(61,61));
    cv.GaussianBlur(gray,bg,new cv.Size(0,0),25,25,cv.BORDER_REPLICATE);
    cv.divide(gray,bg,norm,210,cv.CV_8U);
    cv.addWeighted(gray,.35,norm,.65,0,smooth);
    const clahe=new cv.CLAHE(1.2,new cv.Size(16,16));clahe.apply(smooth,smooth);
    // Keep B&W non-destructive: grayscale is used instead of hard adaptive threshold.
    cv.cvtColor(smooth,out,cv.COLOR_GRAY2RGBA);
    gray.delete();bg.delete();norm.delete();smooth.delete();k.delete();clahe.delete();
    return out;
  }

  async function process(srcData,mode){
    const im=await load(srcData),base=document.createElement('canvas'),scale=Math.min(1,MAX_SIDE/Math.max(im.naturalWidth||im.width,im.naturalHeight||im.height));
    base.width=Math.round((im.naturalWidth||im.width)*scale);base.height=Math.round((im.naturalHeight||im.height)*scale);
    base.getContext('2d').drawImage(im,0,0,base.width,base.height);
    if(typeof cv==='undefined'||!cv.Mat)return{data:canvasFallback(base).toDataURL('image/jpeg',.95),corrected:false,cropped:false,fallback:true};
    let src=null,warped=null,out=null;
    try{
      src=cv.imread(base);const quad=detectQuad(src);warped=quad?warp(src,quad):src;out=clean(warped,mode);
      const c=document.createElement('canvas');c.width=out.cols;c.height=out.rows;cv.imshow(c,out);
      const data=c.toDataURL('image/png');
      const cropped=!!quad;
      if(out)out.delete();if(warped&&warped!==src)warped.delete();if(src)src.delete();
      return{data,corrected:cropped,cropped,fallback:false};
    }catch(e){
      try{if(out)out.delete()}catch{}try{if(warped&&warped!==src)warped.delete()}catch{}try{if(src)src.delete()}catch{}
      return{data:canvasFallback(base).toDataURL('image/jpeg',.95),corrected:false,cropped:false,fallback:true};
    }
  }

  function install(){
    if(window.__smartPrintDocumentEngineInstalled)return;
    window.__smartPrintDocumentEngineBooting=true;
    const old=window.prepareProcessedPages;
    if(typeof old!=='function'){setTimeout(install,250);return}
    async function wrapped(){
      if(typeof window.type!=='undefined'&&window.type!=='document'){await old();return}
      if(!window.sourcePages?.length){await old();return}
      window.processedPages=[];let cropped=0,fallback=0;
      for(const src of window.sourcePages){const r=await process(src,$('mode')?.value||'Black & White');window.processedPages.push(r.data);if(r.cropped)cropped++;if(r.fallback)fallback++}
      const hint=$('typeHint');if(hint)hint.textContent=`✓ ${window.processedPages.length} print-ready page${window.processedPages.length>1?'s':''} • ${cropped?'auto crop + perspective correction • ':''}gentle shadow correction • content preserved${fallback?' • compatibility cleanup used':''}.`;
    }
    wrapped.__documentEngine=true;window.prepareProcessedPages=wrapped;window.__smartPrintDocumentEngineInstalled=true;window.__smartPrintDocumentEngineBooting=false;
  }
  function boot(){if(typeof cv!=='undefined'&&cv.Mat)install();else setTimeout(boot,300)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();