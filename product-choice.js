// Separate product entry points on the public Create Account screen.
(function(){
  function addStyles(){
    if(document.getElementById('nrProductChoiceStyles'))return;
    const s=document.createElement('style');s.id='nrProductChoiceStyles';
    s.textContent='.nr-product-choice{margin:0 0 18px;padding:16px;border:1px solid #e5e9f0;border-radius:14px;background:#fbfcfe}.nr-product-choice-head h3{margin:0 0 5px;font-size:16px;color:#172033}.nr-product-choice-head p{margin:0 0 13px;color:#748094;font-size:12px;line-height:1.45}.nr-product-choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.nr-product-choice-card{border:1px solid #dce2eb;background:#fff;border-radius:12px;padding:14px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:5px}.nr-product-choice-card:hover,.nr-product-choice-card.nr-selected{border-color:#172033;box-shadow:0 5px 18px rgba(15,23,42,.07)}.nr-product-choice-card span{font-size:21px}.nr-product-choice-card b{font-size:13px;color:#172033}.nr-product-choice-card small{font-size:11px;color:#748094;line-height:1.4}@media(max-width:760px){.nr-product-choice-grid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }
  function removeBillingLinks(){
    document.querySelectorAll('.quick-grid button').forEach(function(b){
      var text=b.innerText||'';
      if(text.indexOf('Smart Print')>=0 || text.indexOf('Rewards')>=0)b.remove();
    });
  }
  function install(){
    addStyles();
    removeBillingLinks();
    if(typeof window.renderAuth!=='function' || window.__productChoiceInstalled)return;
    window.__productChoiceInstalled=true;
    const original=window.renderAuth;
    window.renderAuth=function(mode='login',message=''){
      original(mode,message);
      if(mode!=='signup')return;
      const el=document.getElementById('authContent');
      if(!el || el.querySelector('.nr-product-choice'))return;
      const box=document.createElement('div');box.className='nr-product-choice';
      box.innerHTML='<div class="nr-product-choice-head"><h3>Choose Product</h3><p>Billing Software and Smart Print are separate services. Smart Print does not use the Billing Software login.</p></div><div class="nr-product-choice-grid"><button type="button" class="nr-product-choice-card nr-selected" onclick="document.getElementById(\'suBusiness\')?.focus()"><span>🧾</span><b>Billing Software</b><small>NR BizPro billing, stock, customers and reports.</small></button><button type="button" class="nr-product-choice-card" onclick="window.location.href=\'smart-print.html\'"><span>🖨️</span><b>Smart Print</b><small>Separate print utility for invoices and document formats.</small></button></div>';
      const form=el.querySelector('form');if(form)el.insertBefore(box,form);else el.prepend(box);
    };
    const obs=new MutationObserver(removeBillingLinks);obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',install);
})();
