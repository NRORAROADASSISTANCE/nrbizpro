/* NR BizPro Smart Print MASTER FIX V5
   Fix the real failure: V4 was replacing runScannerPreview/Print and then
   calling the replacement itself. It also rejected a processed selection by
   looking only at fileInput.files. This controller captures the existing
   handlers BEFORE replacing them and delegates without recursion.
*/
(function(){
  'use strict';
  const input=()=>document.getElementById('fileInput');
  const originalPreview=window.runScannerPreview;
  const originalConfirm=window.confirmScannerPrint;
  const originalDirect=window.__finalDirectPrint;
  let selectionSeen=false;

  function rememberSelection(){
    const el=input();
    if(el && el.files && el.files.length) selectionSeen=true;
  }

  function hasWork(){
    const el=input();
    return !!((el&&el.files&&el.files.length)||selectionSeen);
  }

  function preview(){
    rememberSelection();
    if(!hasWork()){
      alert('Upload one or more WhatsApp documents, photos or PDFs first.');
      return;
    }
    if(typeof originalPreview==='function'){
      try{return originalPreview.apply(window,arguments)}
      catch(e){console.error('Smart Print preview:',e);alert('Smart Print preview could not be prepared.');}
    }else{
      alert('Smart Print preview is still loading. Please try again.');
    }
  }

  function print(){
    rememberSelection();
    if(!hasWork()){
      alert('Upload one or more WhatsApp documents, photos or PDFs first.');
      return;
    }
    const fn=typeof originalConfirm==='function'?originalConfirm:originalDirect;
    if(typeof fn==='function'){
      try{return fn.apply(window,arguments)}
      catch(e){console.error('Smart Print print:',e);alert('Smart Print could not open the print dialog.');}
    }else{
      alert('Smart Print printing is still loading. Please try again.');
    }
  }

  function install(){
    const el=input();
    if(!el)return;
    el.multiple=true;
    rememberSelection();
    if(!el.__masterV5Bound){
      el.__masterV5Bound=true;
      el.addEventListener('change',rememberSelection,false);
    }
    window.__smartPrintPreviewV5=preview;
    window.__smartPrintPrintV5=print;
    window.runScannerPreview=preview;
    window.__finalDirectPrint=print;
    window.confirmScannerPrint=print;

    document.querySelectorAll('.actions button').forEach(b=>{
      const t=(b.textContent||'').trim();
      if(/Scanner Preview/i.test(t))b.onclick=preview;
      if(/Print Now|Confirm & Print/i.test(t))b.onclick=print;
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(install,120));
  }else setTimeout(install,120);
})();
