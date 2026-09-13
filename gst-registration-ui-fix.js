(function(){
  'use strict';
  function installGST(){
    const form=document.querySelector('#authContent form');
    if(!form||form.dataset.nrGstInstalled==='1')return;
    const gstInput=document.getElementById('suGst');
    if(!gstInput)return;
    const gstLabel=gstInput.closest('label');
    if(!gstLabel)return;
    form.dataset.nrGstInstalled='1';
    const choice=document.createElement('label');
    choice.innerHTML='GST Registration <select id="suGstRegistered"><option value="NO">NO</option><option value="YES">YES</option></select>';
    gstLabel.parentNode.insertBefore(choice,gstLabel);
    const span=gstLabel.querySelector('span');
    if(span)span.textContent='(required when GST is YES)';
    gstLabel.style.display='none';
    gstInput.disabled=true;
    gstInput.required=false;
    gstInput.placeholder='Enter GSTIN';
    const toggle=()=>{
      const yes=document.getElementById('suGstRegistered')?.value==='YES';
      gstLabel.style.display=yes?'block':'none';
      gstInput.disabled=!yes;
      gstInput.required=yes;
      if(!yes)gstInput.value='';
    };
    document.getElementById('suGstRegistered').addEventListener('change',toggle);
    toggle();
  }
  function hook(){
    const original=window.renderAuth;
    if(typeof original!=='function'||original.__nrGSTHook)return;
    const wrapped=function(){const r=original.apply(this,arguments);if(arguments[0]==='signup')setTimeout(installGST,0);return r};
    wrapped.__nrGSTHook=true;
    window.renderAuth=wrapped;
    if(document.getElementById('suGst'))installGST();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
  setTimeout(hook,300);
  setTimeout(hook,1200);
})();