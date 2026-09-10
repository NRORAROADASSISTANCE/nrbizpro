/* NR BizPro Smart Print — Xerox shade cleaner (non-blocking) */
(function(){
  'use strict';
  function cleanDataUrl(src){
    return new Promise((resolve)=>{
      const im=new Image();
      im.onload=()=>{
        try{
          const maxW=2480,maxH=3508,scale=Math.min(1.25,maxW/im.naturalWidth,maxH/im.naturalHeight);
          const w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
          const c=document.createElement('canvas');c.width=w;c.height=h;
          const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,w,h);
          const data=ctx.getImageData(0,0,w,h),d=data.data;
          const bg=document.createElement('canvas');
          bg.width=Math.max(1,Math.ceil(w/28));bg.height=Math.max(1,Math.ceil(h/28));
          const bx=bg.getContext('2d');bx.drawImage(c,0,0,bg.width,bg.height);
          bx.filter='blur(3px)';bx.drawImage(bg,0,0);
          const bd=bx.getImageData(0,0,bg.width,bg.height).data;
          for(let y=0;y<h;y++){
            const by=Math.min(bg.height-1,Math.floor(y*bg.height/h));
            for(let x=0;x<w;x++){
              const bxp=Math.min(bg.width-1,Math.floor(x*bg.width/w));
              const i=(y*w+x)*4,bi=(by*bg.width+bxp)*4;
              const lum=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
              const b=.2126*bd[bi]+.7152*bd[bi+1]+.0722*bd[bi+2];
              let v=lum+(238-b)*0.72;
              v=Math.max(0,Math.min(255,v));
              if(v>150)v=150+(v-150)*1.35;
              if(v>235)v=255;
              d[i]=d[i+1]=d[i+2]=v;
            }
          }
          ctx.putImageData(data,0,0);resolve(c.toDataURL('image/png'));
        }catch(e){resolve(src)}
      };
      im.onerror=()=>resolve(src);im.src=src;
    });
  }
  const originalPreview=window.previewPrint;
  const originalConfirm=window.confirmPrint;
  if(typeof originalPreview!=='function'||typeof originalConfirm!=='function')return;
  let cleaned=[];
  window.previewPrint=async function(){
    await originalPreview.apply(this,arguments);
    const imgs=[...document.querySelectorAll('#previewBody .preview-sheet img')];
    cleaned=[];
    for(const img of imgs){const s=await cleanDataUrl(img.src);cleaned.push(s);img.src=s;}
    const badge=document.querySelector('#previewBody .ai-badge');
    if(badge)badge.textContent='✓ Xerox Clean — shade removed, paper background whitened, text preserved.';
  };
  window.confirmPrint=function(){
    if(!cleaned.length)return originalConfirm.apply(this,arguments);
    const oldOpen=window.open;
    window.open=function(){
      const real=oldOpen.apply(window,arguments);
      if(!real)return real;
      const oldWrite=real.document.write.bind(real.document);
      real.document.write=function(html){
        let i=0;
        html=html.replace(/<img src="([^"]+)"/g,function(m){return i<cleaned.length?'<img src="'+cleaned[i++]+'"':m});
        return oldWrite(html);
      };
      return real;
    };
    try{return originalConfirm.apply(this,arguments)}finally{window.open=oldOpen}
  };
})();
