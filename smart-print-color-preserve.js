/* Smart Print Color Preserve
   In Color mode, do not run the global color illumination enhancer.
   The final left-shadow pass is allowed to handle only the camera shadow. */
(function(){
'use strict';
const originalPrepare=window.prepareProcessedPages;
if(typeof originalPrepare!=='function')return;
window.prepareProcessedPages=async function(){
  const mode=document.getElementById('mode')?.value||'Color';
  const safe=document.getElementById('safeEnhance');
  if(mode==='Color' && safe){
    const old=safe.checked;
    safe.checked=false;
    try{return await originalPrepare.apply(this,arguments)}
    finally{safe.checked=old}
  }
  return originalPrepare.apply(this,arguments);
};
})();
