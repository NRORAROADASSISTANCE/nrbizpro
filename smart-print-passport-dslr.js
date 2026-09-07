/* NR BizPro Smart Print — Premium passport 8-up + photo-quality pipeline. */
(function(){
  const W=35,H=45,DPI=300;
  function canvasFromImage(im){const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);return c;}
  function premiumPortrait(src){
    const out=document.createElement('canvas');const w=Math.round(W/25.4*DPI),h=Math.round(H/25.4*DPI);out.width=w;out.height=h;const c=out.getContext('2d',{willReadFrequently:true});c.fillStyle='#fff';c.fillRect(0,0,w,h);
    const scale=Math.max(w/src.width,h/src.height);const dw=src.width*scale,dh=src.height*scale;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(src,(w-dw)/2,(h-dh)/2,dw,dh);
    const im=c.getImageData(0,0,w,h),d=im.data;
    for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],lum=.2126*r+.7152*g+.0722*b;const contrast=(lum-128)*1.05+128;d[i]=Math.max(0,Math.min(255,r+(contrast-lum)*.22));d[i+1]=Math.max(0,Math.min(255,g+(contrast-lum)*.22));d[i+2]=Math.max(0,Math.min(255,b+(contrast-lum)*.22));}
    c.putImageData(im,0,0);return out;
  }
  function sheet(src,copies=8){const one=premiumPortrait(src),gap=Math.round(.12*DPI),cols=4,rows=2,out=document.createElement('canvas');out.width=cols*one.width+(cols+1)*gap;out.height=rows*one.height+(rows+1)*gap;const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,out.width,out.height);for(let i=0;i<8;i++){const x=gap+(i%4)*(one.width+gap),y=gap+Math.floor(i/4)*(one.height+gap);c.drawImage(one,x,y);}return out;}
  window.smartPassportPremium={premiumPortrait,sheet};
})();