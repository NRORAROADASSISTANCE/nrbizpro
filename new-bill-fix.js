// Final New Bill launcher. Capture the click so it works even if older billing handlers interfere.
(function(){
  function fallbackBill(){
    var modal=document.getElementById('modal'), title=document.getElementById('modalTitle'), body=document.getElementById('modalBody');
    if(!modal||!title||!body){ alert('Billing window could not load. Please refresh the page.'); return false; }
    title.textContent='Create New Bill';
    body.innerHTML='<label class="field">Customer Name<input id="bCustomer" placeholder="Walk-in Customer"></label>'+
      '<label class="field">Customer Mobile<input id="bMobile"></label>'+
      '<label class="field wide">🔎 Search Product / 📷 Barcode Scan<input id="bSearch" placeholder="Type product name or scan barcode"></label>'+ 
      '<div id="billSuggestions" class="suggestions"></div><div id="billLines" class="bill-lines"></div>'+ 
      '<div class="bill-summary"><div><span>Subtotal</span><b id="bSubtotal">₹0.00</b></div><div><span>Discount</span><b id="bDiscount">₹0.00</b></div><div><span>GST</span><b id="bGst">₹0.00</b></div><div class="bill-net"><span>Net Amount</span><strong id="bNet">₹0.00</strong></div></div>'+ 
      '<div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" onclick="window.saveBillFixed?window.saveBillFixed():window.saveBill()">Generate Bill</button></div>';
    modal.classList.remove('hidden');
    window.billCart=[];
    if(typeof window.renderCart==='function') window.renderCart();
    var s=document.getElementById('bSearch'); if(s) s.focus();
    return true;
  }
  function launch(){
    try{
      if(typeof window.openBillModal==='function') return window.openBillModal();
      return fallbackBill();
    }catch(err){
      console.error('NR BizPro New Bill error:',err);
      return fallbackBill();
    }
  }
  window.launchNewBill=launch;

  function isNewBillButton(el){
    var b=el && el.closest ? el.closest('button') : null;
    if(!b) return false;
    var text=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    var onclick=b.getAttribute('onclick')||'';
    return text.includes('new bill') || text.includes('create bill') || onclick.includes('launchNewBill');
  }

  function captureClick(e){
    if(!isNewBillButton(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    launch();
  }

  document.addEventListener('click',captureClick,true);

  // EV showroom module is loaded only after the logged-in business profile is available.
  function loadEVModuleWhenReady(){
    try{
      var c='';
      if(typeof currentUser!=='undefined' && currentUser) c=currentUser.category||'';
      if(!c && typeof state!=='undefined' && state && state.settings) c=state.settings.category||'';
      if(!/ev two|electric two|ev 2|ev scooter|ev bike/i.test(String(c))){
        setTimeout(loadEVModuleWhenReady,700); return;
      }
      if(window.__nrEvModuleLoaded || document.getElementById('nrEvModuleScript')) return;
      var s=document.createElement('script'); s.id='nrEvModuleScript'; s.src='ev-two-wheeler-module.js'; s.onload=function(){window.__nrEvModuleLoaded=true;}; document.head.appendChild(s);
    }catch(e){ setTimeout(loadEVModuleWhenReady,700); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadEVModuleWhenReady); else loadEVModuleWhenReady();
})();
