/* Smart Print scanner override: prevent legacy preview handler from winning before OpenCV loads. */
(function(){
  function install(){
    const input=document.getElementById('fileInput');
    if(!input)return setTimeout(install,150);
    input.addEventListener('change',function(){
      // Give the final scanner module a moment to finish wiring, then force its handler.
      setTimeout(function(){
        if(typeof window.previewPrint==='function'){
          const fn=window.previewPrint;
          window.previewPrint=function(){return fn();};
          window.printNow=window.previewPrint;
        }
      },500);
    });
  }
  install();
})();