/* NR BizPro Smart Print — adaptive paper-shade cleaner. Loaded before smart-print.js. */
(function(){
'use strict';
const originalToDataURL=HTMLCanvasElement.prototype.toDataURL;
function clean(canvas){
  const w=canvas.width,h=canvas.height;
  if(w<120||h<120)return canvas;
  const max=900,scale=Math.min(1,max/Math.max(w,h));
  const sw=Math.max(80,Math.round(w*scale)),sh=Math.max(80,Math.round(h*scale));
  const small=document.createElement('canvas');small.width=sw;small.height=sh;
  const sx=small.getContext('2d',{willReadFrequently:true});
  sx.drawImage(canvas,0,0,sw,sh);
  const sd=sx.getImageData(0,0,sw,sh),illum=document.createElement('canvas');
  illum.width=sw;illum.height=sh;
  const ix=illum.getContext('2d');
  ix.putImageData(sd,0,0);
  const bg=document.createElement('canvas');bg.width=sw;bg.height=sh;
  const bx=bg.getContext('2d');
  bx.filter='blur(18px)';bx.drawImage(illum,0,0);
  const bd=bx.getImageData(0,0,sw,sh).data;
  const out=document.createElement('canvas');out.width=w;out.height=h;
  const ox=out.getContext('2d',{willReadFrequently:true});ox.drawImage(canvas,0,0);
  const od=ox.getImageData(0,0,w,h),d=od.data;
  const target=245;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    const bxp=Math.min(sw-1,Math.max(0,Math.round(x*sw/w))),byp=Math.min(sh-1,Math.max(0,Math.round(y*sh/h)));
    const bi=(byp*sw+bxp)*4;
    const bgLum=Math.max(105,Math.min(255,.2126*bd[bi]+.7152*bd[bi+1]+.0722*bd[bi+2]));
    const lum=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
    const factor=Math.min(1.32,Math.max(.88,target/bgLum));
    const blend=Math.min(1,Math.max(0,(bgLum-150)/95));
    const f=1+(factor-1)*blend;
    d[i]=Math.max(0,Math.min(255,d[i]*f));
    d[i+1]=Math.max(0,Math.min(255,d[i+1]*f));
    d[i+2]=Math.max(0,Math.min(255,d[i+2]*f));
  }
  ox.putImageData(od,0,0);
  return out;
}
HTMLCanvasElement.prototype.toDataURL=function(type,quality){
  try{return originalToDataURL.call(clean(this),type,quality)}catch(e){return originalToDataURL.call(this,type,quality)}
};
})();
