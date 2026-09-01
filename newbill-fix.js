// Robust New Bill launcher and product edit fallback
(function(){
  function openNewBill(){
    if(typeof window.openModal!=='function') return alert('Billing module is not loaded. Please refresh the page.');
    window.billCart=[];
    window.openModal('Create New Bill',`<label class="field">Customer Name<input id="bCustomer" placeholder="Walk-in Customer"></label><label class="field">Customer Mobile<input id="bMobile"></label><label class="field wide">🔎 Search Product / 📷 Barcode Scan<input id="bSearch" placeholder="Type product name or scan barcode"></label><div id="billSuggestions" class="suggestions"></div><div id="billLines" class="bill-lines"></div><div class="bill-adjustments"><label class="field">Discount Type<select id="billDiscountType"><option value="percent">Percentage (%)</option><option value="fixed">Fixed Amount (₹)</option></select></label><label class="field">Discount<input id="billDiscount" type="number" min="0" step="0.01" value="0"></label></div><div id="billSummary" class="bill-summary"></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="window.saveBillFixed ? window.saveBillFixed() : window.saveBill()">Generate Bill</button></div>`);
    if(typeof window.renderCart==='function')window.renderCart();
    const s=document.getElementById('bSearch');
    if(s){s.oninput=function(){if(typeof window.searchBillProducts==='function')window.searchBillProducts()};s.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();if(typeof window.handleBarcodeKey==='function')window.handleBarcodeKey(e)}};s.focus()}
    const d=document.getElementById('billDiscount'),dt=document.getElementById('billDiscountType');
    const recalc=()=>{if(typeof window.__recalcBill==='function')window.__recalcBill()};
    if(d)d.oninput=recalc;if(dt)dt.oninput=recalc;recalc();
  }
  function boot(){
    window.openBillModal=openNewBill;
    document.addEventListener('click',function(e){const b=e.target.closest('[onclick*="openBillModal"]');if(b){e.preventDefault();openNewBill()}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
