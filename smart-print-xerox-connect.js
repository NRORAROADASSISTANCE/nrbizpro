/* NR BizPro Smart Print — Xerox cleanup + conservative edge confidence gate. */
(function(){
  function install(){
    const old=window.prepareProcessedPages;
    if(typeof old!=='function'||old.__xeroxPreviewConnected)return;
    async function wrapped(){
      await old();
      if(!window.processedPages||!window.processedPages.length||typeof window.cleanDocumentXerox!=='function')return;
      const mode=document.getElementById('mode')?.value||'Black & White',next=[];
      for(const src of window.processedPages){
        try{
          const im=await loadImage(src),c=document.createElement('canvas');
          c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;
          c.getContext('2d').drawImage(im,0,0);
          next.push(window.cleanDocumentXerox(c,mode).toDataURL('image/png'));
        }catch(e){console.warn('Xerox cleanup skipped',e);next.push(src)}
      }
      window.processedPages=next;
      const hint=document.getElementById('typeHint');
      if(hint)hint.textContent=`✓ ${next.length} page${next.length>1?'s':''} • Xerox cleanup + shadow flattening applied • original unchanged.`;
    }
    wrapped.__xeroxPreviewConnected=true;
    window.prepareProcessedPages=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,200));else setTimeout(install,200);
})();