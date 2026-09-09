/* NR BizPro Smart Print — scanner-style edge detector with safer document selection. */
(function(){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function order(p){const s=p.map(x=>x.x+x.y),d=p.map(x=>x.x-x.y);return [p[s.indexOf(Math.min(...s))],p[d.indexOf(Math.max(...d))],p[s.indexOf(Math.max(...s))],p[d.indexOf(Math.min(...d))]];}
  function detect(src){
    if(!window.cv||!cv.Mat)return null;
    let input,small,gray,blur,edge,contours,hier;
    try{
      input=cv.imread(src); const maxSide=1400,scale=Math.min(1,maxSide/Math.max(input.cols,input.rows));
      small=new cv.Mat();cv.resize(input,small,new cv.Size(Math.max(1,Math.round(input.cols*scale)),Math.max(1,Math.round(input.rows*scale))),0,0,cv.INTER_AREA);
      gray=new cv.Mat();blur=new cv.Mat();edge=new cv.Mat();
      cv.cvtColor(small,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);
      cv.Canny(blur,35,120,edge);const kernel=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(5,5));cv.morphologyEx(edge,edge,cv.MORPH_CLOSE,kernel);kernel.delete();
      contours=new cv.MatVector();hier=new cv.Mat();cv.findContours(edge,contours,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
      const frame=small.cols*small.rows;let best=null,bestScore=-Infinity;
      for(let i=0;i<contours.size();i++){
        const cnt=contours.get(i),peri=cv.arcLength(cnt,true),approx=new cv.Mat();cv.approxPolyDP(cnt,approx,Math.max(2,.018*peri),true);
        const area=Math.abs(cv.contourArea(approx));
        if(approx.rows===4&&area>frame*.18&&area<frame*.98&&cv.isContourConvex(approx)){
          const pts=[];for(let j=0;j<4;j++){const q=approx.intPtr(j,0);pts.push({x:q[0]/scale,y:q[1]/scale});}
          const o=order(pts),w1=Math.hypot(o[1].x-o[0].x,o[1].y-o[0].y),w2=Math.hypot(o[2].x-o[3].x,o[2].y-o[3].y),h1=Math.hypot(o[3].x-o[0].x,o[3].y-o[0].y),h2=Math.hypot(o[2].x-o[1].x,o[2].y-o[1].y);const w=(w1+w2)/2,h=(h1+h2)/2;
          if(w<160||h<160) {approx.delete();cnt.delete();continue;}
          const ratio=w/h,rect=Math.max(.35,1-Math.abs(Math.log(ratio))/2.5),margin=Math.min(...pts.map(p=>Math.min(p.x,p.y,input.cols-p.x,input.rows-p.y)));
          const marginPenalty=margin<5?.55:margin<15?.82:1;const score=(area/frame)*rect*marginPenalty;
          if(score>bestScore){bestScore=score;best=pts;}
        }
        approx.delete();cnt.delete();
      }
      return bestScore>.10?best:null;
    }catch(e){console.warn('Edge detection skipped',e);return null;}
    finally{[input,small,gray,blur,edge,contours,hier].forEach(x=>{try{x&&x.delete()}catch{}});}
  }
  function warp(src,q){
    if(!q||!window.cv)return src;const p=order(q),w=Math.max(1,Math.round((Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)+Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y))/2)),h=Math.max(1,Math.round((Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)+Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y))/2));
    if(w<150||h<150)return src;const sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(x=>[x.x,x.y])),dp=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,w-1,0,w-1,h-1,0,h-1]),M=cv.getPerspectiveTransform(sp,dp),dst=new cv.Mat();
    cv.warpPerspective(src,dst,M,new cv.Size(w,h),cv.INTER_CUBIC,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));sp.delete();dp.delete();M.delete();return dst;
  }
  window.smartPrintEdgeEngine={detect,warp};
})();