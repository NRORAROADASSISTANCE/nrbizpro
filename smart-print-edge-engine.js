/* NR BizPro Smart Print — conservative but reliable document boundary detection. */
(function(){
  function normalizeQuad(p){
    if(!p||p.length!==4)return null;
    const c=p.reduce((a,b)=>({x:a.x+b.x,y:a.y+b.y}),{x:0,y:0}); c.x/=4;c.y/=4;
    const q=p.slice().sort((a,b)=>Math.atan2(a.y-c.y,a.x-c.x)-Math.atan2(b.y-c.y,b.x-c.x));
    const s=q.map(a=>a.x+a.y),d=q.map(a=>a.x-a.y);
    return [q[s.indexOf(Math.min(...s))],q[d.indexOf(Math.max(...d))],q[s.indexOf(Math.max(...s))],q[d.indexOf(Math.min(...d))]];
  }
  function candidateScore(p,area,src){
    const frame=src.cols*src.rows;
    const w=(Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)+Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y))/2;
    const h=(Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)+Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y))/2;
    if(w<120||h<120)return -1;
    const r=Math.min(w,h)/Math.max(w,h), ar=area/frame;
    const cx=p.reduce((s,z)=>s+z.x,0)/4,cy=p.reduce((s,z)=>s+z.y,0)/4;
    const cd=Math.hypot(cx-src.cols/2,cy-src.rows/2)/Math.hypot(src.cols/2,src.rows/2);
    const edgeMargin=Math.min(...p.map(z=>Math.min(z.x,z.y,src.cols-z.x,src.rows-z.y)))/Math.min(src.cols,src.rows);
    return ar*1.8 + (r>.12?.08:0) + (r>.20?.05:0) + Math.max(0,.08*(1-cd)) + Math.min(.06,edgeMargin*.12);
  }
  function find(src,mode){
    let g=null,b=null,w=null,e=null,k=null,cs=null,h=null;
    try{
      g=new cv.Mat(); cv.cvtColor(src,g,cv.COLOR_RGBA2GRAY);
      b=new cv.Mat(); cv.GaussianBlur(g,b,new cv.Size(5,5),0);
      w=new cv.Mat();
      if(mode==='threshold') cv.adaptiveThreshold(b,w,255,cv.ADAPTIVE_THRESH_GAUSSIAN_C,cv.THRESH_BINARY_INV,41,7);
      else { e=new cv.Mat(); cv.Canny(b,e,mode==='soft'?6:12,mode==='soft'?45:65); w=e; }
      k=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(mode==='soft'?13:9,mode==='soft'?13:9));
      cv.morphologyEx(w,w,cv.MORPH_CLOSE,k);
      cs=new cv.MatVector(); h=new cv.Mat();
      cv.findContours(w,cs,h,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
      const out=[],frame=src.cols*src.rows;
      for(let i=0;i<cs.size();i++){
        const cnt=cs.get(i),per=cv.arcLength(cnt,true),a=new cv.Mat();
        cv.approxPolyDP(cnt,a,Math.max(2,.018*per),true);
        const area=Math.abs(cv.contourArea(a));
        if(a.rows===4&&area>frame*.012&&area<frame*.999&&cv.isContourConvex(a)){
          const pts=[]; for(let j=0;j<4;j++){const z=a.intPtr(j,0);pts.push({x:z[0],y:z[1]});}
          const p=normalizeQuad(pts),score=candidateScore(p,area,src);
          if(score>0)out.push({p,score,area});
        }
        a.delete();cnt.delete();
      }
      return out;
    }catch(e){return []}
    finally{[g,b,w,e,k,cs,h].forEach(x=>{try{x&&x.delete()}catch{}})}
  }
  function detect(src){
    if(!window.cv||!cv.Mat)return null;
    let input=null,small=null;
    try{
      input=cv.imread(src);
      const scale=Math.min(1,2600/Math.max(input.cols,input.rows));
      small=new cv.Mat(); cv.resize(input,small,new cv.Size(Math.round(input.cols*scale),Math.round(input.rows*scale)),0,0,cv.INTER_AREA);
      let all=[];
      for(const mode of ['normal','soft','threshold']){
        for(const x of find(small,mode)){x.p=x.p.map(z=>({x:z.x/scale,y:z.y/scale}));x.area/=scale*scale;all.push(x);}
      }
      if(!all.length)return null;
      all.sort((a,b)=>b.score-a.score||b.area-a.area);
      const best=all[0],ratio=best.area/(input.cols*input.rows);
      if(ratio>=.012&&ratio<=.998&&best.score>=.035)return best.p;
      return null;
    }catch(e){console.warn('edge detection skipped',e);return null}
    finally{[input,small].forEach(x=>{try{x&&x.delete()}catch{}})}
  }
  function warp(src,q){
    if(!q||!window.cv)return src;
    const p=normalizeQuad(q); if(!p)return src;
    const W=Math.round((Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)+Math.hypot(p[2].x-p[3].x,p[2].y-p[3].y))/2);
    const H=Math.round((Math.hypot(p[3].x-p[0].x,p[3].y-p[0].y)+Math.hypot(p[2].x-p[1].x,p[2].y-p[1].y))/2);
    if(W<120||H<120)return src;
    const pad=Math.max(3,Math.round(Math.min(W,H)*.004)),w=W+pad*2,h=H+pad*2;
    const sp=cv.matFromArray(4,1,cv.CV_32FC2,p.flatMap(z=>[z.x,z.y]));
    const dp=cv.matFromArray(4,1,cv.CV_32FC2,[pad,pad,w-pad-1,pad,w-pad-1,h-pad-1,pad,h-pad-1]);
    const M=cv.getPerspectiveTransform(sp,dp),dst=new cv.Mat();
    cv.warpPerspective(src,dst,M,new cv.Size(w,h),cv.INTER_CUBIC,cv.BORDER_REPLICATE);
    sp.delete();dp.delete();M.delete();return dst;
  }
  window.smartPrintEdgeEngine={detect,warp};
})();
