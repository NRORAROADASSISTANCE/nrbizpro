// NR BizPro Smart Print — preview bridge
(function(){
  'use strict';
  // smart-print.js already prepares the real cleaned target output.
  // Do not replace it with a raw-source preview.
  var mainPreview=window.previewPrint;
  window.previewPrint=function(){
    if(typeof mainPreview==='function') return mainPreview.apply(this,arguments);
    alert('Preview is not ready. Please upload the document again.');
  };
  function hook(){
    document.querySelectorAll('.actions button').forEach(function(btn){
      if(/Scanner Preview/i.test(btn.textContent||'')&&!btn.dataset.targetPreviewHook){
        btn.dataset.targetPreviewHook='1';
        btn.onclick=function(ev){ev.preventDefault();ev.stopImmediatePropagation();window.previewPrint();return false;};
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
  [100,500,1200,2500].forEach(function(ms){setTimeout(hook,ms)});
})();
