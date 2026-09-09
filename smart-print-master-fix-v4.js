/* NR BizPro Smart Print MASTER FIX V4
   Fixes the race where a file is selected before the multi-document/ID handlers
   finish installing. Preview/Print now re-sync the current file input first.
*/
(function(){
  'use strict';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let syncing=false;
  let lastFilesKey='';

  function input(){return document.getElementById('fileInput')}
  function key(files){return Array.from(files||[]).map(f=>[f.name,f.size,f.lastModified].join(':')).join('|')}

  async function syncSelectedFiles(){
    const el=input();
    if(!el || !el.files || !el.files.length) return false;
    const k=key(el.files);
    if(syncing)return true;
    if(k===lastFilesKey)return true;
    syncing=true;
    try{
      /* Re-fire change so every Smart Print pipeline (multi-file, ID front/back,
         passport and the original processor) sees the files selected by the user. */
      const ev=new Event('change',{bubbles:true});
      el.dispatchEvent(ev);
      lastFilesKey=k;
      /* The handlers are async (FileReader/PDF.js/OpenCV), so give them time to
         populate their internal page queues before preview/print is requested. */
      await sleep(700);
      return true;
    }finally{syncing=false}
  }

  async function callPreview(){
    const el=input();
    if(!el?.files?.length){alert('Upload one or more WhatsApp documents, photos or PDFs first.');return}
    await syncSelectedFiles();
    const fn=window.runScannerPreview;
    if(typeof fn!=='function'){alert('Smart Print is still loading. Please wait one second and try again.');return}
    return fn();
  }

  async function callPrint(){
    const el=input();
    if(!el?.files?.length){alert('Upload one or more WhatsApp documents, photos or PDFs first.');return}
    await syncSelectedFiles();
    const fn=window.confirmScannerPrint || window.__finalDirectPrint;
    if(typeof fn!=='function'){alert('Smart Print is still loading. Please wait one second and try again.');return}
    return fn();
  }

  function install(){
    const el=input();
    if(!el)return;
    el.multiple=true;
    /* If the user selected a file before this script finished loading, process it now. */
    if(el.files?.length)syncSelectedFiles();

    /* Inline buttons resolve these functions at click time. */
    window.__smartPrintPreviewV4=callPreview;
    window.__smartPrintPrintV4=callPrint;
    window.runScannerPreview=callPreview;
    window.__finalDirectPrint=callPrint;

    /* Replace visible action handlers too, so programmatic/button clicks use the same flow. */
    document.querySelectorAll('.actions button').forEach(b=>{
      const t=(b.textContent||'').trim();
      if(/Scanner Preview/i.test(t))b.onclick=callPreview;
      if(/Print Now|Confirm & Print/i.test(t))b.onclick=callPrint;
    });
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,120));
  else setTimeout(install,120);
})();
