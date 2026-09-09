/* NR BizPro Smart Print — Premium passport 8-up for 4x6 photo paper, local DSLR-style portrait enhancement. */
(function(){
  const W=35,H=45,DPI=300;
  const SHEET_W=152.4,SHEET_H=101.6; // 6 x 4 inch landscape photo paper
  const pxW=Math.round(W/25.4*DPI),pxH=Math.round(H/25.4*DPI);
  const sheetW=Math.round(SHEET_W/25.4*DPI),sheetH=Math.round(SHEET_H/25.4*DPI);
  function clamp(v){return Math.max(0,Math.min(255,v));}
  function portraitCrop(src){
    const sw=src.width,sh=src.height,target=pxW/pxH;
    let cw=sw,ch=Math.round(sw/target);
    if(ch>sh){ch=sh;cw=Math.round(sh*target);}
    let x=Math.round((sw-cw)/2), y=Math.round((sh-ch)*0.40);
    x=Math.max(0,Math.min(sw-cw,x)); y=Math.max(0,Math.min(sh-ch,y));
    return {x,y,w:cw,h:ch};
  }
  function premiumPortrait(src){
    const out=document.createElement('canvas');out.width=pxW;out.height=pxH;
    const c=out.getContext('2d',{willReadFrequently:true});
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.fillStyle='#fff';c.fillRect(0,0,pxW,pxH);
    const crop=portraitCrop(src);
    c.drawImage(src,crop.x,crop.y,crop.w,crop.h,0,0,pxW,pxH);
    const im=c.getImageData(0,0,pxW,pxH),d=im.data;
    let mean=0,count=0;
    for(let i=0;i<d.length;i+=16){mean+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];count++;}
    mean/=Math.max(1,count);
    const exposure=Math.max(-12,Math.min(18,142-mean));
    for(let i=0;i<d.length;i+=4){
      let r=d[i],g=d[i+1],b=d[i+2];
      const lum=.2126*r+.7152*g+.0722*b;
      const shadow=Math.max(0,1-lum/150)*0.12;
      const highlight=Math.max(0,(lum-205)/50)*0.08;
      r=clamp(r+exposure+shadow*18-highlight*12);
      g=clamp(g+exposure+shadow*16-highlight*10);
      b=clamp(b+exposure+shadow*14-highlight*8);
      const y=.2126*r+.7152*g+.0722*b;
      const contrast=(y-128)*1.08+128;
      const mix=(contrast-y)*0.32;
      d[i]=clamp(r+mix);d[i+1]=clamp(g+mix);d[i+2]=clamp(b+mix);
    }
    c.putImageData(im,0,0);
    const copy=document.createElement('canvas');copy.width=pxW;copy.height=pxH;
    const cc=copy.getContext('2d');cc.drawImage(out,0,0);
    c.globalAlpha=0.16;c.drawImage(copy,-1,-1);c.drawImage(copy,1,1);c.globalAlpha=1;
    return out;
  }
  function sheet(src,copies=8){
    const one=premiumPortrait(src);
    const gap=Math.round(1.5/25.4*DPI),cols=4,rows=2;
    const contentW=cols*one.width+(cols-1)*gap,contentH=rows*one.height+(rows-1)*gap;
    const left=Math.floor((sheetW-contentW)/2),top=Math.floor((sheetH-contentH)/2);
    const out=document.createElement('canvas');out.width=sheetW;out.height=sheetH;
    const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,out.width,out.height);
    for(let i=0;i<Math.min(copies,8);i++){
      const x=left+(i%cols)*(one.width+gap),y=top+Math.floor(i/cols)*(one.height+gap);
      c.drawImage(one,x,y);
    }
    return out;
  }
  window.smartPassportPremium={premiumPortrait,sheet,portraitCrop,sheetSize:{widthMm:SHEET_W,heightMm:SHEET_H,dpi:DPI}};
})();