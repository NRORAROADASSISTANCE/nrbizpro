/* NR BizPro Smart Print Pro: non-destructive clarity layer. Never rewrites document text. */
(function(){
  function estimateFineSkew(canvas){
    const max=1200,s=Math.min(1,max/Math.max(canvas.width,canvas.height));
    const w=Math.max(120,Math.round(canvas.width*s)),h=Math.max(120,Math.round(canvas.height*s));
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(canvas,0,0,w,h);
    const d=x.getImageData(0,0,w,h).data;
    function score(deg){
      const r=deg*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),cx=w/2,cy=h/2;
      let sum=0,n=0;
      for(let y=2;y<h-2;y+=3){for(let xx=2;xx<w-2;xx+=3){
        const px=xx-cx,py=y-cy,rx=Math.round(px*cs-py*sn+cx),ry=Math.round(px*sn+py*cs+cy);
        if(rx<2||rx>=w-2||ry<2||ry>=h-2)continue;
        const i=(ry*w+rx)*4;
        const a=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
        const l=.2126*d[i-4]+.7152*d[i-3]+.0722*d[i-2];
        const rr=.2126*d[i+4]+.7152*d[i+5]+.0722*d[i+6];
        const u=.2126*d[i-w*4]+.7152*d[i-w*4+1]+.0722*d[i-w*4+2];
        const dn=.2126*d[i+w*4]+.7152*d[i+w*4+1]+.0722*d[i+w*4+2];
        const gx=Math.abs(rr-l),gy=Math.abs(dn-u);
        if(gx+gy>35){sum+=Math.max(gx,gy);n++}
      }}
      return n?sum/n:0;
    }
    let best=0,bs=-1;
    for(let deg=-5;deg<=5.0001;deg+=.5){const v=score(deg);if(v>bs){bs=v;best=deg}}
    return Math.abs(best)<.75?0:-best;
  }
  function rotateSafe(src,deg){
    if(!deg)return src;const r=deg*Math.PI/180,sw=src.width,sh=src.height;
    const c=document.createElement('canvas'),cs=Math.abs(Math.cos(r)),sn=Math.abs(Math.sin(r));
    c.width=Math.ceil(sw*cs+sh*sn);c.height=Math.ceil(sw*sn+sh*cs);
    const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
    x.translate(c.width/2,c.height/2);x.rotate(r);x.drawImage(src,-sw/2,-sh/2);return c;
  }
  function paperCleanup(src,mode){
    const w=src.width,h=src.height,out=document.createElement('canvas');out.width=w;out.height=h;
    const ctx=out.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,0,0);
    const im=ctx.getImageData(0,0,w,h),d=im.data;
    const lum=[];const step=Math.max(1,Math.floor((w*h)/8000));
    for(let y=0;y<h;y+=Math.max(2,Math.floor(step/4))){for(let x=0;x<w;x+=Math.max(2,Math.floor(step/4))){const i=(y*w+x)*4;lum.push(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2]);}}
    lum.sort((a,b)=>a-b);const p=q=>lum[Math.min(lum.length-1,Math.floor((lum.length-1)*q))]||0,lo=p(.02),hi=p(.985),gain=255/Math.max(45,hi-lo);
    for(let i=0;i<d.length;i+=4){let r=Math.max(0,Math.min(255,(d[i]-lo)*gain)),g=Math.max(0,Math.min(255,(d[i+1]-lo)*gain)),b=Math.max(0,Math.min(255,(d[i+2]-lo)*gain));
      if(mode==='Black & White'){const y=.2126*r+.7152*g+.0722*b;const bw=y<150?y*.90:y>232?255:112+(y-150)*1.53;r=g=b=Math.max(0,Math.min(255,bw));}
      d[i]=r;d[i+1]=g;d[i+2]=b;
    }
    ctx.putImageData(im,0,0);return out;
  }
  async function proPrepare(){
    if(!window.sourcePages||!sourcePages.length)return;
    processedPages=[];const use=$('safeEnhance')?.checked!==false,deskew=$('autoStraighten')?.checked!==false,mode=$('mode')?.value||'Black & White';let changed=0;
    for(const src of sourcePages){const im=await loadImage(src),c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);let work=c;
      if(deskew&&type==='document'){const a=estimateFineSkew(c);if(Math.abs(a)>=.75){work=rotateSafe(c,a);changed++;}}
      if(use)work=paperCleanup(work,mode);processedPages.push(work.toDataURL('image/png'));
    }
    $('typeHint').textContent=`✓ ${processedPages.length} print-ready page${processedPages.length>1?'s':''} prepared${changed?` • ${changed} page${changed>1?'s':''} finely straightened`:''}. Original file remains unchanged.`;
  }
  window.estimateFineSkew=estimateFineSkew;window.prepareProcessedPages=proPrepare;
})();
