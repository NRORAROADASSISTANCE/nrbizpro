/* NR BizPro Smart Print: exact-size ID/passport helpers. No source mutation. */
(function(){
  const S={id:{w:85.6,h:54},passport:{w:35,h:45}};
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
    const gap=Math.round(1.5/25.4*dpi),cols=4,rows=Math.ceil(copies/cols);
    const out=document.createElement('canvas');out.width=cols*one.width+(cols+1)*gap;out.height=rows*one.height+(rows+1)*gap;
    const c=out.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,out.width,out.height);
    for(let i=0;i<copies;i++){const x=gap+(i%4)*(one.width+gap),y=gap+Math.floor(i/4)*(one.height+gap);c.drawImage(one,x,y);}
    return out;
  }
  window.smartPrintExactSize={fitExact,passportSheet};
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
      if(hint)hint.textContent=t==='passport'?'✓ DSLR-style passport photo processed • 8 copies • 35×45 mm • 300 DPI • one A4 sheet. Original photo unchanged.':'✓ Exact-size ID card print layout ready • 85.6×54 mm • 300 DPI.';
    }
    wrapped.__idPassportInstalled=true;window.prepareProcessedPages=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,150));else setTimeout(install,150);
})();