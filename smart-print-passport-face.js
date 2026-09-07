/* NR BizPro Smart Print — automatic passport face framing helper.
   Conservative: only adjusts framing when a confident face box is supplied by a local detector. */
(function(){
  function frame(src,face){
    if(!face||face.width<=0||face.height<=0)return src;
    const padX=face.width*0.62,padTop=face.height*0.85,padBottom=face.height*1.25;
    const x=Math.max(0,face.x-padX),y=Math.max(0,face.y-padTop),r=Math.min(src.width,face.x+face.width+padX),b=Math.min(src.height,face.y+face.height+padBottom);
    if(r-x<1||b-y<1)return src;
    const out=document.createElement('canvas');out.width=Math.round(r-x);out.height=Math.round(b-y);out.getContext('2d').drawImage(src,x,y,out.width,out.height,0,0,out.width,out.height);return out;
  }
  window.smartPassportFace={frame};
})();