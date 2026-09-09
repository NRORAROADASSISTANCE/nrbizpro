/* NR BizPro Smart Print — conservative scanner-style edge detector. */
(function(){
  function order(p){const s=p.map(x=>x.x+x.y),d=p.map(x=>x.x-x.y);return [p[s.indexOf(Math.min(...s))],p[d.indexOf(Math.max(...d))],p[s.indexOf(Math.max(...s))],p[d.indexOf(Math.min(...d))]];}
  function detect(src){
    if(!window.cv||!cv.Mat)return null;
    let input,small,gray,blur,edge,contours,hier,kernel;
    try{
      input=cv.imread(src);const maxSide=1600,scale=Math.min(1,maxSide/Math.max(input.cols,input.rows));
      small=new cv.Mat();cv.resize(input,small,new cv.Size(Math.round(input.cols*scale),Math.round(input.rows*scale)),0,0,cv.INTER_AREA);
      gray=new cv.Mat();blur=new cv.Mat();edge=new cv.Mat();cv.cvtColor(small,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);cv.Canny(blur,30,100,edge);
      kernel=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(7,7));cv.morphologyEx(edge,edge,cv.MORPH_CLOSE,kernel);kernel.delete();kernel=null;
      contours=new cv.MatVector();hier=new cv.Mat();cv.findContours(edge,contours,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
      const frame=small.cols*small.rows;let candidates=[];
      for(let i=0;i<contours.size();i++){
        const cnt=contours.get(i),peri=cv.arcLength(cnt,true),approx=new cv.Mat();cv.approxPolyDP(cnt,approx,Math.max(2,.012*peri),true);const area=Math.abs(cv.contourArea(approx));
        if(approx.rows===4&&area>frame*.28&&area<frame*.995&&cv.isContourConvex(approx)){
          const pts=[];for(let j=0;j<4;j++){const q=approx.intPtr(j,0);pts.push({x:q[0]/scale,y:q[1]/scale});}const p=order(pts);
          const w=(Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)+Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y))/2;
          const h=(Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)+Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y))/2;const r=w/h;
          const plausible=(r>=.45&&r<=.95)||(r>=1.05&&r<=2.1);const margin=Math.min(...pts.map(q=>Math.min(q.x,q.y,input.cols-q.x,input.rows-q.y)));
          if(w>180&&h>180&&plausible&&margin>=2)candidates.push({pts:p,area});
        }approx.delete();cnt.delete();
      }
      if(!candidates.length)return null;candidates.sort((a,b)=>b.area-a.area);return candidates[0].pts;
    }catch(e){console.warn('Smart Print edge detection skipped',e);return null;}
    finally{[input,small,gray,blur,edge,contours,hier,kernel].forEach(x=>{try{x&&x.delete()}catch{}});}
  }
  function warp(src,q){
    if(!q||!window.cv)return src;const p=order(q),rawW=Math.max(1,Math.round((Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)+Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y))/2)),rawH=Math.max(1,Math.round((Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)+Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y))/2));
    if(rawW<150||rawH<150)return src;
    // Add a small safety border so legitimate paper pixels at the detected boundary are never clipped.
    const pad=Math.max(8,Math.round(Math.min(rawW,rawH)*.012)),w=rawW+2*pad,h=rawH+2*pad;
    const sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(x=>[x.x,x.y])),dp=cv.matFromArray(4,1,cv.CV_32FC2,[pad,pad,w-pad-1,pad,w-pad-1,h-pad-1,pad,h-pad-1]),M=cv.getPerspectiveTransform(sp,dp),dst=new cv.Mat();
    cv.warpPerspective(src,dst,M,new cv.Size(w,h),cv.INTER_CUBIC,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));sp.delete();dp.delete();M.delete();return dst;
  }
  window.smartPrintEdgeEngine={detect,warp};
})();