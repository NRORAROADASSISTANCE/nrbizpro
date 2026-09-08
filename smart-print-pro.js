/* NR BizPro Smart Print Pro — fast non-destructive Xerox-style cleanup. */
(function(){
  const clamp=v=>Math.max(0,Math.min(255,v));
  function cleanDocument(src,mode='Black & White'){
    const max=3000,scale=Math.min(1.5,max/src.width,max/src.height),w=Math.max(1,Math.round(src.width*scale)),h=Math.max(1,Math.round(src.height*scale));
    const out=document.createElement('canvas');out.width=w;out.height=h;const c=out.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(src,0,0,w,h);
    // Build a low-resolution illumination map. This removes broad camera shadows
    // without the extremely expensive per-pixel neighbourhood scan used before.
    const bw=220,bh=Math.max(1,Math.round(220*h/w)),bg=document.createElement('canvas');bg.width=bw;bg.height=bh;const bc=bg.getContext('2d');bc.filter='grayscale(1)';bc.drawImage(out,0,0,bw,bh);bc.filter='blur(12px)';bc.drawImage(bg,0,0);bc.filter='none';
    const srcIm=c.getImageData(0,0,w,h),d=srcIm.data,small=bc.getImageData(0,0,bw,bh).data;
    const sampleBg=(x,y)=>{const sx=Math.min(bw-1,Math.max(0,Math.round(x*(bw-1)/Math.max(1,w-1)))),sy=Math.min(bh-1,Math.max(0,Math.round(y*(bh-1)/Math.max(1,h-1))));const i=(sy*bw+sx)*4;return .2126*small[i]+.7152*small[i+1]+.0722*small[i+2]};
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,g=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2],bgv=Math.max(70,sampleBg(x,y));let n=clamp(g*(235/bgV));
      // Preserve dark text while lifting grey paper/shadows toward clean white.
      n=clamp(205+(n-205)*1.12);
      if(mode==='Black & White')n=n>190?255:n<90?0:Math.round(255*((n-90)/100));
      d[i]=d[i+1]=d[i+2]=n;d[i+3]=255;
    }
    c.putImageData(srcIm,0,0);return out;
  }
  window.cleanDocumentXerox=cleanDocument;
})();