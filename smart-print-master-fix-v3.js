/* Smart Print final button flow: Preview first, then print from the same rendered output. */
(function(){
'use strict';
function waitForPreviewThenPrint(){
  const run=window.runScannerPreview;
  if(typeof run!=='function'){alert('Smart Print is still loading. Please wait one second and try again.');return}
  try{
    const result=run();
    if(result&&typeof result.then==='function')result.then(()=>setTimeout(()=>window.confirmScannerPrint&&window.confirmScannerPrint(),350));
    else setTimeout(()=>window.confirmScannerPrint&&window.confirmScannerPrint(),900);
  }catch(e){console.error(e);alert('Smart Print preview could not be prepared.')}
}
window.__finalDirectPrint=waitForPreviewThenPrint;
})();