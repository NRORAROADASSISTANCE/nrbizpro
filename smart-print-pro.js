/* NR BizPro Smart Print Pro — non-destructive Xerox-style cleanup. */
(function(){
  function clamp(v){return Math.max(0,Math.min(255,v));}
  function cleanDocument(src,mode){
    const max=3000,scale=Math.min(1.5,max/src.width,max/src.height),w=Math.max(1,Math.round(src.width*scale)),h=Math.max(1,Math.round(src.height*scale));
    const out=document.createElement('canvas');out.width=w;out.height=h;const c=out.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(src,0,0,w,h);
    const im=c.getImageData(0,0,w,h),d=im.data,gray=new Float32Array(w*h),res=new Uint8ClampedArray(d.length);
    for(let p=0,i=0;p<gray.length;p++,i+=4)gray[p]=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x,i=p*4;let sum=0,n=0;for(let yy=Math.max(0,y-24);yy<=Math.min(h-1,y+24);yy+=8)for(let xx=Math.max(0,x-24);xx<=Math.min(w-1,x+24);xx+=8){sum+=gray[yy*w+xx];n++;}const bg=Math.max(50,sum/n),g=gray[p],norm=clamp(220-(220-g)*(190/bg)),boost=Math.max(-10,Math.min(18,(g-sum/n)*.28));let r=clamp(d[i]+boost+(norm-g)*.28),gg=clamp(d[i+1]+boost+(norm-g)*.28),b=clamp(d[i+2]+boost+(norm-g)*.28);if(mode==='Black & White'){const yv=.2126*r+.7152*gg+.0722*b;const bw=yv<150?Math.max(0,yv*.82):yv>225?255:115+(yv-150)*1.75;r=gg=b=bw;}res[i]=r;res[i+1]=gg;res[i+2]=b;res[i+3]=255;}
    c.putImageData(new ImageData(res,w,h),0,0);return out;
  }
  window.cleanDocumentXerox=cleanDocument;
})();