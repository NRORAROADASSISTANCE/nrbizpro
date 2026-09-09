/* NR BizPro Smart Print — conservative multi-pass document edge detector. */
(function(){
  function order(p){
    const s=p.map(x=>x.x+x.y),d=p.map(x=>x.x-x.y);
    return [p[s.indexOf(Math.min(...s))],p[d.indexOf(Math.max(...d))],p[s.indexOf(Math.max(...s))],p[d.indexOf(Math.min(...d))]];
  }
  function candidateFromContours(contours,scale,iw,ih,frame){
    const out=[];
    for(let i=0;i<contours.size();i++){
      const cnt=contours.get(i),peri=cv.arcLength(cnt,true),approx=new cv.Mat();
      cv.approxPolyDP(cnt,approx,Math.max(1.2,.018*peri),true);
      const area=Math.abs(cv.contourArea(approx));
      if(approx.rows===4&&area>frame*.012&&area<frame*.94&&cv.isContourConvex(approx)){
        const pts=[];for(let j=0;j<4;j++){const q=approx.intPtr(j,0);pts.push({x:q[0]/scale,y:q[1]/scale});}
        const p=order(pts);
        const w=(Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)+Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y))/2;
        const h=(Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)+Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y))/2;
        const long=Math.max(w,h),short=Math.min(w,h),ratio=short/Math.max(1,long);
        const plausible=ratio>=.12&&ratio<=1;
        const margin=Math.min(...pts.map(q=>Math.min(q.x,q.y,iw-q.x,ih-q.y)));
        const centerX=(p[0].x+p[1].x+p[2].x+p[3].x)/4,centerY=(p[0].y+p[1].y+p[2].y+p[3].y)/4;
        const centerDist=Math.hypot(centerX-iw/2,centerY-ih/2)/Math.hypot(iw/2,ih/2);
        if(w>100&&h>100&&plausible&&margin>=0){
          const areaRatio=area/frame;
          const edgeBonus=margin>3?0.10:0;
          const sizeBonus=areaRatio>0.16&&areaRatio<0.90?0.08:0;
          const shapeBonus=ratio>.16?0.05:0;
          const centerBonus=Math.max(0,0.04*(1-centerDist));
          const score=areaRatio+edgeBonus+sizeBonus+shapeBonus+centerBonus;
          out.push({pts:p,area,score,areaRatio,ratio,margin});
        }
      }
      approx.delete();cnt.delete();
    }
    return out;
  }
  function find(src,mode){
    let gray=null,work=null,blur=null,edge=null,kernel=null,contours=null,hier=null;
    try{
      gray=new cv.Mat();cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY);
      blur=new cv.Mat();cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);
      work=new cv.Mat();
      if(mode==='threshold')cv.adaptiveThreshold(blur,work,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY_INV,31,7);
      else{edge=new cv.Mat();cv.Canny(blur,edge,mode==='soft'?10:22,mode==='soft'?65:85);work=edge;}
      kernel=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(mode==='soft'?7:9,mode==='soft'?7:9));
      cv.morphologyEx(work,work,cv.MORPH_CLOSE,kernel);
      contours=new cv.MatVector();hier=new cv.Mat();cv.findContours(work,contours,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
      return candidateFromContours(contours,1,src.cols,src.rows,src.cols*src.rows);
    }catch(e){return []}
    finally{[gray,work,blur,edge,kernel,contours,hier].forEach(x=>{try{x&&x.delete()}catch{}})}
  }
  function detect(src){
    if(!window.cv||!cv.Mat)return null;
    let input=null,small=null;
    try{
      input=cv.imread(src);const maxSide=1800,scale=Math.min(1,maxSide/Math.max(input.cols,input.rows));
      small=new cv.Mat();cv.resize(input,small,new cv.Size(Math.round(input.cols*scale),Math.round(input.rows*scale)),0,0,cv.INTER_AREA);
      let all=[];for(const mode of ['normal','soft','threshold']){
        const got=find(small,mode);for(const c of got){c.pts=c.pts.map(p=>({x:p.x/scale,y:p.y/scale}));c.area*=1/(scale*scale);all.push(c)}
      }
      if(!all.length)return null;
      all.sort((a,b)=>b.score-a.score||b.area-a.area);
      const best=all[0],ratio=best.area/(input.cols*input.rows);
      /* Never crop unless the detected page is substantial but not almost the whole camera frame. */
      if(ratio<.055||ratio>.94)return null;
      /* Reject weak/ambiguous detections so the original is safer than a bad crop. */
      if(best.score<.16)return null;
      return best.pts;
    }catch(e){console.warn('Smart Print edge detection skipped',e);return null}
    finally{[input,small].forEach(x=>{try{x&&x.delete()}catch{}})}
  }
  function warp(src,q){
    if(!q||!window.cv)return src;
    const p=order(q);
    const rawW=Math.max(1,Math.round((Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)+Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y))/2));
    const rawH=Math.max(1,Math.round((Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)+Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y))/2));
    if(rawW<120||rawH<120)return src;
    const pad=Math.max(8,Math.round(Math.min(rawW,rawH)*.012)),w=rawW+2*pad,h=rawH+2*pad;
    const sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(x=>[x.x,x.y]));
    const dp=cv.matFromArray(4,1,cv.CV_32FC2,[pad,pad,w-pad-1,pad,w-pad-1,h-pad-1,pad,h-pad-1]);
    const M=cv.getPerspectiveTransform(sp,dp),dst=new cv.Mat();
    cv.warpPerspective(src,dst,M,new cv.Size(w,h),cv.INTER_CUBIC,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));
    sp.delete();dp.delete();M.delete();return dst;
  }
  window.smartPrintEdgeEngine={detect,warp};
})();
