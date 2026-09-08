/* NR BizPro Smart Print — reliable in-page document scanner/xerox engine. */
(function(){
  const MAX_SIDE=2600, $=id=>document.getElementById(id), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const load=(src)=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
  function canvasClean(c,mode){
    const ctx=c.getContext('2d'),w=c.width,h=c.height,img=ctx.getImageData(0,0,w,h),d=img.data;
    const gray=new Uint8Array(w*h); let sum=0;
    for(let i=0,p=0;i<d.length;i+=4,p++){const g=(d[i]*.299+d[i+1]*.587+d[i+2]*.114);gray[p]=g;sum+=g}
    const avg=sum/gray.length;
    // Conservative white-paper normalization; preserves dark text instead of erasing it.
    for(let p=0,i=0;p<gray.length;p++,i+=4){let g=gray[p];g=clamp((g-(avg-205))*1.22+205,0,255);if(mode==='Black & White')g=g>210?255:g<75?0:g;d[i]=d[i+1]=d[i+2]=g;d[i+3]=255}
    ctx.putImageData(img,0,0);return c;
  }
  function orderQuad(pts){const s=pts.map(p=>p.x+p.y),d=pts.map(p=>p.x-p.y);return[pts[s.indexOf(Math.min(...s))],pts[d.indexOf(Math.max(...d))],pts[s.indexOf(Math.max(...s))],pts[d.indexOf(Math.min(...d))]]}
  function detectQuad(src){
    let scale=Math.min(1,1200/Math.max(src.cols,src.rows)),small=new cv.Mat();cv.resize(src,small,new cv.Size(0,0),scale,scale,cv.INTER_AREA);
    let gray=new cv.Mat(),blur=new cv.Mat(),edge=new cv.Mat();cv.cvtColor(small,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);cv.Canny(blur,45,130,edge);
    let contours=new cv.MatVector(),hier=new cv.Mat();cv.findContours(edge,contours,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);let best=null,bestScore=0,frame=small.rows*small.cols;
    for(let i=0;i<contours.size();i++){let cnt=contours.get(i),peri=cv.arcLength(cnt,true),approx=new cv.Mat();cv.approxPolyDP(cnt,approx,.025*peri,true);let area=Math.abs(cv.contourArea(approx));if(approx.rows===4&&area>frame*.25){let pts=[];for(let j=0;j<4;j++){let q=approx.intPtr(j,0);pts.push({x:q[0]/scale,y:q[1]/scale})}let score=area; if(score>bestScore){best=pts;bestScore=score}}approx.delete();cnt.delete()}
    small.delete();gray.delete();blur.delete();edge.delete();contours.delete();hier.delete();return best;
  }
  function warp(src,quad){if(!quad)return src;const p=orderQuad(quad),w=Math.round(Math.max(Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y),Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y))),h=Math.round(Math.max(Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y),Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y)));if(w<150||h<150)return src;const sp=cv.matFromArray(4,1,cv.CV_32FC2,[p[0].x,p[0].y,p[1].x,p[1].y,p[2].x,p[2].y,p[3].x,p[3].y]),dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,w,0,w,h,0,h]),M=cv.getPerspectiveTransform(sp,dp),dst=new cv.Mat();cv.warpPerspective(src,dst,M,new cv.Size(w,h),cv.INTER_CUBIC,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));sp.delete();dp.delete();M.delete();return dst}
  function flatten(src){const gray=new cv.Mat(),bg=new cv.Mat(),norm=new cv.Mat(),out=new cv.Mat();cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);const k=cv.getStructuringElement(cv.MORPH_ELLIPSE,new cv.Size(41,41));cv.morphologyEx(gray,bg,cv.MORPH_CLOSE,k);cv.divide(gray,bg,norm,255,cv.CV_8U);const clahe=new cv.CLAHE(2.0,new cv.Size(8,8));clahe.apply(norm,norm);cv.cvtColor(norm,out,cv.COLOR_GRAY2RGBA);gray.delete();bg.delete();k.delete();clahe.delete();return out}
  async function process(srcData,mode){
    const im=await load(srcData),base=document.createElement('canvas'),scale=Math.min(1,MAX_SIDE/Math.max(im.naturalWidth||im.width,im.naturalHeight||im.height));base.width=Math.round((im.naturalWidth||im.width)*scale);base.height=Math.round((im.naturalHeight||im.height)*scale);base.getContext('2d').drawImage(im,0,0,base.width,base.height);
    if(typeof cv==='undefined'||!cv.Mat)return{data:canvasClean(base,mode).toDataURL('image/jpeg',.94),corrected:false,fallback:true};
    let src=cv.imread(base),warped=src,quad=null,final=null;try{quad=detectQuad(src);if(quad)warped=warp(src,quad);final=flatten(warped);let out=final;if(mode==='Black & White'){const g=new cv.Mat(),bw=new cv.Mat();cv.cvtColor(final,g,cv.COLOR_RGBA2GRAY);cv.adaptiveThreshold(g,bw,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY,31,9);out=new cv.Mat();cv.cvtColor(bw,out,cv.COLOR_GRAY2RGBA);g.delete();bw.delete()}const c=document.createElement('canvas');c.width=out.cols;c.height=out.rows;cv.imshow(c,out);const data=c.toDataURL('image/png');src.delete();if(warped!==src)warped.delete();final.delete();if(out!==final)out.delete();return{data,corrected:!!quad,fallback:false}}catch(e){try{src.delete()}catch{}return{data:canvasClean(base,mode).toDataURL('image/jpeg',.94),corrected:false,fallback:true}}
  }
  function install(){
    if(window.__smartPrintDocumentEngineInstalled)return;
    const old=window.prepareProcessedPages;if(typeof old!=='function'){setTimeout(install,250);return}
    async function wrapped(){
      if(window.type!=='document'&&typeof type!=='undefined'&&type!=='document'){await old();return}
      if(!window.sourcePages?.length){await old();return}
      window.processedPages=[];let fixed=0,fallback=0;
      for(const src of window.sourcePages){const r=await process(src,$('mode')?.value||'Black & White');window.processedPages.push(r.data);if(r.corrected)fixed++;if(r.fallback)fallback++}
      const hint=$('typeHint');if(hint)hint.textContent=`✓ ${window.processedPages.length} print-ready page${window.processedPages.length>1?'s':''} • ${fixed?'edges/perspective corrected • ':''}shadow removal • xerox cleanup • original untouched${fallback?' • compatibility cleanup used':''}.`;
    }
    wrapped.__documentEngine=true;window.prepareProcessedPages=wrapped;window.__smartPrintDocumentEngineInstalled=true;
  }
  function boot(){if(typeof cv!=='undefined'&&cv.Mat)install();else setTimeout(boot,300)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();