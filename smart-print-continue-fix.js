// NR BizPro Smart Print — robust Continue button fix
(function(){
  'use strict';
  function openWorkspace(){
    try{
      const gate=document.getElementById('gate');
      const workspace=document.getElementById('workspace');
      if(!workspace)return false;
      if(typeof window.enterPrint==='function' && !window.enterPrint.__nrContinueFix){
        try{ window.enterPrint(); return true; }catch(e){}
      }
      if(gate)gate.classList.add('hidden');
      workspace.classList.remove('hidden');
      if(typeof window.updateLicense==='function')window.updateLicense();
      if(typeof window.selectType==='function')window.selectType('document');
      return true;
    }catch(e){ console.error('Smart Print Continue fix',e); return false; }
  }
  function install(){
    const gate=document.getElementById('gate');
    if(!gate || gate.dataset.nrContinueFix==='1')return;
    gate.dataset.nrContinueFix='1';
    const original=window.enterPrint;
    const wrapped=function(){
      try{
        if(typeof original==='function'){
          const r=original.apply(this,arguments);
          const workspace=document.getElementById('workspace');
          if(workspace && !workspace.classList.contains('hidden'))return r;
        }
      }catch(e){}
      return openWorkspace();
    };
    wrapped.__nrContinueFix=true;
    window.enterPrint=wrapped;
    const button=gate.querySelector('button');
    if(button){
      button.type='button';
      button.onclick=function(ev){ev.preventDefault();ev.stopPropagation();return openWorkspace();};
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  [100,500,1200,2500].forEach(ms=>setTimeout(install,ms));
})();
