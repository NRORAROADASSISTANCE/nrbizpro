/* Smart Print — conservative edge confidence guard. Never crops when uncertain. */
(function(){
  function scoreQuad(pts,w,h){if(!pts||pts.length!==4)return 0;const area=Math.abs(pts.reduce((a,p,i)=>{const q=pts[(i+1)%4];return a+p.x*q.y-q.x*p.y},0))/2;const ratio=area/(w*h);if(ratio<.35)return 0;let right=0;for(let i=0;i<4;i++){const a=pts[i],b=pts[(i+1)%4],c=pts[(i+2)%4];const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-b.x,vy=c.y-b.y;const dot=Math.abs(ux*vx+uy*vy)/(Math.hypot(ux,uy)*Math.hypot(vx,vy)+1e-9);right+=1-dot;}return Math.min(1,ratio*.7+right/4*.3)}
  window.smartPrintEdgeConfidence={scoreQuad};
})();