// Separate product entry points on the public auth/create-account screen.
(function(){
  function install(){
    if(typeof window.renderAuth!=='function' || window.__productChoiceInstalled)return;
    window.__productChoiceInstalled=true;
    const original=window.renderAuth;
    window.renderAuth=function(mode='login',message=''){
      original(mode,message);
      if(mode!=='signup')return;
      const el=document.getElementById('authContent');
      if(!el || el.querySelector('.product-choice'))return;
      const title=document.createElement('div');
      title.className='product-choice';
      title.innerHTML=`<div class="product-choice-head"><h3>Choose a NR product</h3><p>Select the product you want to use. Billing and Smart Print are separate services.</p></div><div class="product-choice-grid"><button type="button" class="product-choice-card selected" onclick="document.querySelector('.product-choice-card').classList.add('selected');document.getElementById('smartPrintChoice')?.classList.remove('selected');document.getElementById('suBusiness')?.focus()"><span>🧾</span><b>NR BizPro Billing Software</b><small>Create a business account for billing, stock, customers and reports.</small></button><button id="smartPrintChoice" type="button" class="product-choice-card" onclick="window.location.href='smart-print.html'"><span>🖨️</span><b>NR Smart Print</b><small>Separate print utility for invoices and document formats.</small></button></div>`;
      const form=el.querySelector('form');
      if(form)el.insertBefore(title,form); else el.prepend(title);
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',install);
})();
