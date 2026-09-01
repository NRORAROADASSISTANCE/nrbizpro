// Final New Bill fallback. Independent of app.js/billing-fix.js readiness.
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
    return false;
  }
  function launch(){
    if(typeof window.openBillModal==='function' && window.openBillModal!==launch) return window.openBillModal();
    return fallbackBill();
  }
  window.launchNewBill=launch;
  function bind(){
    ['newBillButton','createBillButton'].forEach(function(id){
      var b=document.getElementById(id); if(!b)return;
      b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();return launch();};
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
  window.addEventListener('load',bind);
})();
