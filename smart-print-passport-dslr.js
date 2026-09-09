/* NR BizPro Smart Print — Premium passport 8-up for 4x6 photo paper, DSLR-style enhancement + studio background cleanup. */
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
  function studioBackground(c){
    // Conservative edge-connected background cleanup: whiten only background-like
    // pixels connected to the photo edges. This avoids painting over the face/hair.
    const w=c.width,h=c.height;
    const im=c.getImageData(0,0,w,h),d=im.data;
    const lum=(i)=>.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
    const sat=(i)=>Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);
    const samples=[];
    const stride=Math.max(1,Math.floor(Math.min(w,h)/220));
    for(let x=0;x<w;x+=stride){samples.push(lum(x*4));samples.push(lum(((h-1)*w+x)*4));}
    for(let y=0;y<h;y+=stride){samples.push(lum((y*w)*4));samples.push(lum((y*w+w-1)*4));}
    samples.sort((a,b)=>a-b);
    const edgeMean=samples[Math.floor(samples.length*.65)]||210;
    const brightFloor=Math.max(145,edgeMean-42);
    const mask=new Uint8Array(w*h),q=new Int32Array(w*h),dist=new Uint8Array(w*h);
    let head=0,tail=0;
    const push=(x,y)=>{const p=y*w+x;if(mask[p])return;const i=p*4,L=lum(i),S=sat(i);if(L>=brightFloor&&S<75){mask[p]=1;dist[p]=1;q[tail++]=p;}};
    for(let x=0;x<w;x+=Math.max(1,Math.floor(w/180))){push(x,0);push(x,h-1);}
    for(let y=0;y<h;y+=Math.max(1,Math.floor(h/180))){push(0,y);push(w-1,y);}
    while(head<tail){const p=q[head++],x=p%w,y=Math.floor(p/w);if(x>0)push(x-1,y);if(x<w-1)push(x+1,y);if(y>0)push(x,y-1);if(y<h-1)push(x,y+1);}
    // Feather one pixel around the detected region, then move the background toward white.
    const out=document.createImageData(w,h),o=out.data;
    for(let p=0;p<w*h;p++){
      const i=p*4;
      let a=mask[p]?1:0;
      if(!a){const x=p%w,y=Math.floor(p/w);for(let yy=-1;yy<=1&&!a;yy++)for(let xx=-1;xx<=1;xx++){const nx=x+xx,ny=y+yy;if(nx>=0&&nx<w&&ny>=0&&ny<h&&mask[ny*w+nx]){a=.55;break;}}}
      o[i]=d[i];o[i+1]=d[i+1];o[i+2]=d[i+2];o[i+3]=d[i+3];
      if(a){o[i]=Math.round(d[i]*(1-a)+255*a);o[i+1]=Math.round(d[i+1]*(1-a)+255*a);o[i+2]=Math.round(d[i+2]*(1-a)+255*a);}
    }
    c.putImageData(out,0,0);
  }
  function premiumPortrait(src){
    const out=document.createElement('canvas');out.width=pxW;out.height=pxH;
    const c=out.getContext('2d',{willReadFrequently:true});
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
    c.fillStyle='#fff';c.fillRect(0,0,pxW,pxH);
    const crop=portraitCrop(src);
    c.drawImage(src,crop.x,crop.y,crop.w,crop.h,0,0,pxW,pxH);
    studioBackground(c);
    const im=c.getImageData(0,0,pxW,pxH),d=im.data;
    let mean=0,count=0;
    for(let i=0;i<d.length;i+=16){mean+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];count++;}
    mean/=Math.max(1,count);
    const exposure=Math.max(-10,Math.min(16,142-mean));
    for(let i=0;i<d.length;i+=4){
      let r=d[i],g=d[i+1],b=d[i+2];
      const y=.2126*r+.7152*g+.0722*b;
      const shadow=Math.max(0,1-y/150)*.10;
      const highlight=Math.max(0,(y-210)/45)*.06;
      r=clamp(r+exposure+shadow*14-highlight*9);
      g=clamp(g+exposure+shadow*13-highlight*8);
      b=clamp(b+exposure+shadow*12-highlight*7);
      const lum2=.2126*r+.7152*g+.0722*b;
      const contrast=(lum2-128)*1.07+128;
      const mix=(contrast-lum2)*.30;
      d[i]=clamp(r+mix);d[i+1]=clamp(g+mix);d[i+2]=clamp(b+mix);
    }
    c.putImageData(im,0,0);
    const copy=document.createElement('canvas');copy.width=pxW;copy.height=pxH;
    const cc=copy.getContext('2d');cc.drawImage(out,0,0);
    c.globalAlpha=.12;c.drawImage(copy,-1,-1);c.drawImage(copy,1,1);c.globalAlpha=1;
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