// NR BizPro — Final billing module authority
(function(){
  'use strict';
  function category(){return String(window.currentUser?.category||window.state?.settings?.category||'General Business').trim()||'General Business'}
  function apply(){
    const cat=category(), host=document.getElementById('nrBillingModuleSwitcher');
    if(window.state?.settings){window.state.settings.activeModule=cat;window.state.settings.modules=[cat];}
    if(!host)return;
    let sel=document.getElementById('nrActiveBillingModule');
    if(!sel){
      sel=document.createElement('select');sel.id='nrActiveBillingModule';
      sel.style.cssText='min-width:210px;padding:8px 10px;border:1px solid #d8e1ed;border-radius:8px;background:#fff';
      host.innerHTML='';
      const label=document.createElement('label');label.style.cssText='display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600';
      const span=document.createElement('span');span.textContent='Billing Module';label.append(span,sel);host.appendChild(label);
    }
    sel.innerHTML='';const o=document.createElement('option');o.value=cat;o.textContent=cat;o.selected=true;sel.appendChild(o);sel.value=cat;sel.disabled=true;
  }
  function boot(){apply();setTimeout(apply,100);setTimeout(apply,500);setTimeout(apply,1500);}
  window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);window.addEventListener('load',()=>setTimeout(boot,1200));
  window.NRBizProFinalModuleAuthority={apply};
})();
