// NR BizPro — final New Bill button wiring
(function(){
  'use strict';
  function fallback(){
    const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');
    if(!modal||!title||!body)return alert('New Bill is not ready yet. Please refresh once.');
    title.textContent='Create New Bill';
    body.innerHTML='<div class="modal-grid"><label class="field">Customer Name<input id="nbCustomer" placeholder="Walk-in Customer"></label><label class="field">Customer Mobile<input id="nbMobile"></label><label class="field wide">Customer Address<textarea id="nbAddress" rows="2"></textarea></label><label class="field">Customer GSTIN<input id="nbGstin" placeholder="Optional GSTIN"></label><label class="field wide">Search Product / Barcode<input id="nbSearch" autofocus placeholder="Type product name or scan barcode"></label></div><div id="nbSuggestions" class="suggestions"></div><div id="nbLines" class="bill-lines"></div><div class="bill-total">Subtotal: <span id="nbSubtotal">₹0</span> &nbsp; GST: <span id="nbGst">₹0</span> &nbsp; <b>Grand Total: <span id="nbTotal">₹0</span></b></div><div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" onclick="window.NRVehicleSaveBill?.()">Generate Bill</button></div>';
    window.billCart=[];modal.classList.remove('hidden');
    const s=document.getElementById('nbSearch');
    s?.addEventListener('input',()=>window.NRVehicleSearchBill?.());
    s?.focus();
    window.NRVehicleRenderBill?.();
  }
  function open(){
    try{
      if(typeof window.NRVehicleOpenBill==='function')return window.NRVehicleOpenBill();
      if(typeof window.openBillModal==='function')return window.openBillModal();
    }catch(e){console.error('NR BizPro New Bill:',e)}
    fallback();
  }
  function wire(){
    window.launchNewBill=open;
    document.querySelectorAll('button').forEach(b=>{
      if((b.textContent||'').trim().toLowerCase().includes('new bill')){
        b.type='button';
        b.onclick=function(e){e.preventDefault();e.stopPropagation();open()};
      }
    });
  }
  wire();
  [300,800,1500,3000,5000].forEach(ms=>setTimeout(wire,ms));
  window.addEventListener('demoStarted',()=>setTimeout(wire,200));
})();
