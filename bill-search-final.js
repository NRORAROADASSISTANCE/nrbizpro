// NR BizPro — final bill product search hardening
(function(){
'use strict';
function getItems(){
 try{
  if(window.state && Array.isArray(window.state.items)) return window.state.items;
 }catch(e){}
 return [];
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function openBillFinal(){
 const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');
 if(!modal||!body)return;
 title.textContent='Create New Bill';
 body.innerHTML='<label class="field wide">Customer Address<textarea id="bAddress" rows="2" placeholder="Door No, Street, Village/Town, District, State, PIN"></textarea></label><label class="field">Customer Name<input id="bCustomer" value="Walk-in Customer"></label><label class="field">Customer Mobile<input id="bMobile" inputmode="tel"></label><label class="field wide">🔎 Search Product / 📷 Barcode Scan<input id="bSearchFinal" autocomplete="off" placeholder="Type product name or scan barcode"></label><div id="billSuggestionsFinal" style="display:grid;gap:8px;margin-top:8px;max-height:220px;overflow:auto"></div><div id="billLines" class="bill-lines"></div><div id="billSummary" class="bill-summary"></div><div class="modal-actions"><button class="secondary" type="button" id="cancelBillFinal">Cancel</button><button class="primary" type="button" id="generateBillFinal">Generate Bill</button></div>';
 modal.classList.remove('hidden'); window.billCart=[];
 const search=document.getElementById('bSearchFinal'), box=document.getElementById('billSuggestionsFinal');
 function render(){
  const q=(search.value||'').trim().toLowerCase(), items=getItems();
  const found=(q?items.filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase().includes(q)):items).slice(0,12);
  box.innerHTML=found.length?found.map(i=>'<button type="button" data-id="'+esc(i.id)+'" style="display:flex;justify-content:space-between;gap:12px;text-align:left;padding:10px;border:1px solid #dce2eb;border-radius:9px;background:#fff;cursor:pointer"><b>'+esc(i.name)+'</b><span>'+esc(i.barcode||'No barcode')+' • ₹'+Number(i.sell||0).toFixed(2)+' • Stock '+Number(i.stock||0)+'</span></button>').join(''):(q?'<div class="empty">No product found</div>':'<div class="empty">No products available. Add a product first.</div>');
  box.querySelectorAll('[data-id]').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id, ex=window.billCart.find(x=>String(x.id)===String(id));if(ex)ex.qty++;else window.billCart.push({id,qty:1});search.value='';render();renderCart();search.focus()});
 }
 function renderCart(){const box=document.getElementById('billLines');let total=0;if(!window.billCart.length){box.innerHTML='<div class="empty">Search a product above to add it.</div>';}else{box.innerHTML=window.billCart.map(l=>{const i=getItems().find(x=>String(x.id)===String(l.id));if(!i)return '';const a=Number(i.sell||0)*l.qty;total+=a;return '<div class="bill-line"><span><b>'+esc(i.name)+'</b></span><span>'+l.qty+'</span><b>₹'+a.toFixed(2)+'</b></div>'}).join('');}document.getElementById('billSummary').textContent='Total: ₹'+total.toFixed(2)}
 search.oninput=render;
 search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const q=search.value.trim().toLowerCase(),i=getItems().find(x=>String(x.barcode||'').toLowerCase()===q);if(i){window.billCart.push({id:i.id,qty:1});search.value='';render();renderCart()}}};
 document.getElementById('cancelBillFinal').onclick=()=>closeModal();
 document.getElementById('generateBillFinal').onclick=()=>{if(typeof window.saveBillFixed==='function')window.saveBillFixed();else if(typeof window.saveBill==='function')window.saveBill();else alert('Billing function is not ready. Refresh once.')};
 render();renderCart();setTimeout(()=>search.focus(),50);
}
window.openBillModal=openBillFinal;window.launchNewBill=openBillFinal;
})();
