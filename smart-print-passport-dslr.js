/* NR BizPro Smart Print — Premium passport 8-up, non-destructive photo enhancement. */
(function(){
  const W=35,H=45,DPI=300;
  function premiumPortrait(src){
    const out=document.createElement('canvas'),w=Math.round(W/25.4*DPI),h=Math.round(H/25.4*DPI);out.width=w;out.height=h;
    const c=out.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.fillStyle='#fff';c.fillRect(0,0,w,h);
    const scale=Math.max(w/src.width,h/src.height),dw=src.width*scale,dh=src.height*scale;c.drawImage(src,(w-dw)/2,(h-dh)/2,dw,dh);
    const im=c.getImageData(0,0,w,h),d=im.data;
    for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],lum=.2126*r+.7152*g+.0722*b;const local=(lum-128)*1.10+128;const mix=(local-lum)*.24;d[i]=Math.max(0,Math.min(255,r+mix));d[i+1]=Math.max(0,Math.min(255,g+mix));d[i+2]=Math.max(0,Math.min(255,b+mix));}
    c.putImageData(im,0,0);return out;
  }
  function sheet(src){const one=premiumPortrait(src),gap=Math.round(.12*DPI),cols=4,rows=2,out=document.createElement('canvas');out.width=cols*one.width+(cols+1)*gap;out.height=rows*one.height+(rows+1)*gap;const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,out.width,out.height);for(let i=0;i<8;i++)c.drawImage(one,gap+(i%4)*(one.width+gap),gap+Math.floor(i/4)*(one.height+gap));return out;}
  window.smartPassportPremium={premiumPortrait,sheet};
})();