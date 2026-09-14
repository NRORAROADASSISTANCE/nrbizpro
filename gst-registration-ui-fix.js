(function(){
  'use strict';
  function installGST(){
    const input=document.getElementById('suGst');
    if(!input || input.dataset.nrGstReady==='1') return false;
    const form=input.closest('form');
    if(!form) return false;
    let gstLabel=input.closest('label');
    if(!gstLabel) return false;

    const choice=document.createElement('label');
    choice.className='nr-gst-registration-choice';
    choice.innerHTML='<span>GST Registration</span><select id="suGstRegistered" aria-label="GST Registration"><option value="NO">NO</option><option value="YES">YES</option></select>';
    gstLabel.parentNode.insertBefore(choice,gstLabel);

    gstLabel.dataset.nrGstOriginal='1';
    gstLabel.style.display='none';
    input.disabled=true;
    input.required=false;
    input.placeholder='Enter GSTIN';

    const select=choice.querySelector('#suGstRegistered');
    function toggle(){
      const yes=select.value==='YES';
      gstLabel.style.display=yes?'block':'none';
      input.disabled=!yes;
      input.required=yes;
      if(!yes) input.value='';
      input.setAttribute('aria-hidden',yes?'false':'true');
    }
    select.addEventListener('change',toggle);
    input.dataset.nrGstReady='1';
    toggle();
    return true;
  }

  function watch(){
    installGST();
    const root=document.getElementById('authContent')||document.body;
    if(root.dataset.nrGstObserver==='1') return;
    root.dataset.nrGstObserver='1';
    new MutationObserver(function(){installGST()}).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',watch); else watch();
  [100,500,1000,2000,4000].forEach(function(ms){setTimeout(installGST,ms)});
})();
