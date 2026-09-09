/* NR BizPro Smart Print: exact-size ID/passport helpers. No source mutation. */
(function(){
  const S={id:{w:85.6,h:54},passport:{w:35,h:45}};
  const PHOTO4X6={w:152.4,h:101.6,dpi:300}; // 6 x 4 inch landscape
  function fitExact(src,type,dpi=300){
    const s=S[type];if(!s||!src)return src;
    const pxW=Math.round(s.w/25.4*dpi),pxH=Math.round(s.h/25.4*dpi);
    const out=document.createElement('canvas');out.width=pxW;out.height=pxH;
    const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,pxW,pxH);
    const scale=Math.min(pxW/src.width,pxH/src.height),w=src.width*scale,h=src.height*scale;
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(src,(pxW-w)/2,(pxH-h)/2,w,h);return out;
  }
  function passportSheet(src,copies=8,dpi=300){
    const one=(window.smartPassportPremium&&typeof window.smartPassportPremium.premiumPortrait==='function')
      ? window.smartPassportPremium.premiumPortrait(src) : fitExact(src,'passport',dpi);
    const gap=Math.round(1.5/25.4*dpi),cols=4,rows=2;
    const sheetW=Math.round(PHOTO4X6.w/25.4*dpi),sheetH=Math.round(PHOTO4X6.h/25.4*dpi);
    const contentW=cols*one.width+(cols-1)*gap,contentH=rows*one.height+(rows-1)*gap;
    const left=Math.floor((sheetW-contentW)/2),top=Math.floor((sheetH-contentH)/2);
    const out=document.createElement('canvas');out.width=sheetW;out.height=sheetH;
    const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,out.width,out.height);
    for(let i=0;i<Math.min(copies,8);i++){
      const x=left+(i%cols)*(one.width+gap),y=top+Math.floor(i/cols)*(one.height+gap);c.drawImage(one,x,y);
    }
    return out;
  }
  window.smartPrintExactSize={fitExact,passportSheet,passportPaper:{widthMm:PHOTO4X6.w,heightMm:PHOTO4X6.h,widthIn:6,heightIn:4,dpi:PHOTO4X6.dpi}};
  function install(){
    const old=window.prepareProcessedPages;if(typeof old!=='function'||old.__idPassportInstalled)return;
    async function wrapped(){
      await old();if(!window.processedPages?.length)return;
      const t=window.type;if(t!=='id'&&t!=='passport')return;
      const next=[];
      for(const src of window.processedPages){
        const im=await loadImage(src),c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;
        c.getContext('2d').drawImage(im,0,0);
        const out=t==='passport'?passportSheet(c,8,300):fitExact(c,'id',300);
        next.push(out.toDataURL('image/png'));
      }
      window.processedPages=next;
      const hint=document.getElementById('typeHint');
      if(hint)hint.textContent=t==='passport'?'✓ DSLR-style passport photo processed • 8 copies • 35×45 mm each • 4×6 inch photo paper • Color • 300 DPI. Original photo unchanged.':'✓ Exact-size ID card print layout ready • 85.6×54 mm • 300 DPI.';
    }
    wrapped.__idPassportInstalled=true;window.prepareProcessedPages=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,150));else setTimeout(install,150);
})();