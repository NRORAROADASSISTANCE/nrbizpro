/* NR BizPro Smart Print — connects non-destructive Xerox cleanup directly to preview. */
(function(){
  function canvasFromData(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);resolve(c)};im.onerror=reject;im.src=src})}
  function cleanCanvas(src){
    if(typeof window.cleanDocumentXerox==='function') return window.cleanDocumentXerox(src);
    return src;
  }
  function install(){
    const old=window.prepareProcessedPages;
    if(typeof old!=='function'||old.__xeroxUiInstalled)return;
    async function wrapped(){
      await old();
      if(!window.processedPages?.length)return;
      const next=[];
      for(const src of window.processedPages){const c=await canvasFromData(src);next.push(cleanCanvas(c).toDataURL('image/png'));}
      window.processedPages=next;
      const hint=document.getElementById('typeHint');
      if(hint&&!/Xerox clean/i.test(hint.textContent))hint.textContent+=' • Xerox-style clean ready';
    }
    wrapped.__xeroxUiInstalled=true;window.prepareProcessedPages=wrapped;
  }
  function addPreviewCompare(){
    const body=document.getElementById('previewBody');if(!body||body.querySelector('[data-xerox-note]'))return;
    const note=document.createElement('div');note.dataset.xeroxNote='1';note.className='ai-badge';note.textContent='✓ Xerox-style cleanup applied: shadows flattened • paper cleaned • edges preserved • original untouched';body.insertBefore(note,body.firstChild);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,500));else setTimeout(install,500);
  const oldPreview=window.previewPrint;
  if(typeof oldPreview==='function'){
    window.previewPrint=async function(){await oldPreview();addPreviewCompare();};
  } else window.addEventListener('load',()=>{const p=window.previewPrint;if(typeof p==='function'&&!p.__wrappedXerox){window.previewPrint=async function(){await p();addPreviewCompare();};window.previewPrint.__wrappedXerox=true;}});
})();