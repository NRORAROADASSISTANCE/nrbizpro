// NR BizPro — final billing product search/list fix
(function(){
  function getState(){try{return typeof state!=='undefined'?state:null}catch(e){return null}}
  function getItems(){
    const s=getState();
    if(!s) return [];
    if(typeof window.visibleItems==='function') return window.visibleItems();
    const all=Array.isArray(s.items)?s.items:[];
    return all;
  }
  function moneySafe(n){try{return typeof money==='function'?money(n):'₹'+(Number(n)||0).toFixed(2)}catch(e){return '₹'+(Number(n)||0).toFixed(2)}}
  function openStableBill(){
    const modal=document.getElementById('modal'), title=document.getElementById('modalTitle'), body=document.getElementById('modalBody');
    if(!modal||!title||!body){alert('Billing window could not load. Please refresh the page.');return false}
    title.textContent='Create New Bill';
    body.innerHTML='<div class="modal-grid">'
      +'<label class="field wide">Customer Address<textarea id="bAddress" rows="2" placeholder="Door No, Street, Village/Town, District, State, PIN"></textarea></label>'
      +'<label class="field">Customer Name<input id="bCustomer" placeholder="Walk-in Customer"></label>'
      +'<label class="field">Customer Mobile<input id="bMobile" inputmode="tel"></label>'
      +'<label class="field wide">🔎 Search Product / 📷 Barcode Scan<input id="bSearch" autocomplete="off" placeholder="Type product name or scan barcode"></label>'
      +'<div id="billSuggestions" class="suggestions wide"></div>'
      +'<div id="billLines" class="bill-lines wide"></div>'
      +'<div id="billSummary" class="bill-summary wide"></div>'
      +'</div><div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" onclick="window.saveBillFixed?window.saveBillFixed():window.saveBill()">Generate Bill</button></div>';
    modal.classList.remove('hidden');
    window.billCart=[];
    renderSearchResults('');
    if(typeof window.renderCart==='function')window.renderCart();
    const search=document.getElementById('bSearch');
    if(search){
      search.addEventListener('input',function(){renderSearchResults(this.value)});
      search.addEventListener('keydown',function(e){
        if(e.key==='Enter'){
          e.preventDefault();
          const q=this.value.trim().toLowerCase();
          const i=getItems().find(x=>String(x.barcode||'').toLowerCase()===q);
          if(i){addProduct(i.id);this.value='';renderSearchResults('');}
        }
      });
      setTimeout(()=>search.focus(),50);
    }
    return true;
  }
  function renderSearchResults(query){
    const box=document.getElementById('billSuggestions');
    if(!box)return;
    const q=String(query||'').trim().toLowerCase();
    const items=getItems();
    if(!q){box.innerHTML=items.length?'<div class="muted">Type a product name or barcode to search.</div>':'<div class="empty">No products available. Add a product first.</div>';return}
    const found=items.filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase().includes(q)).slice(0,12);
    box.innerHTML=found.map(i=>'<button type="button" class="suggestion" data-product-id="'+String(i.id).replace(/"/g,'&quot;')+'"><b>'+escSafe(i.name)+'</b><span>'+(escSafe(i.barcode||'No barcode'))+' • '+moneySafe(i.sell)+' • Stock '+(Number(i.stock)||0)+'</span></button>').join('')||'<div class="empty">No product found</div>';
    box.querySelectorAll('[data-product-id]').forEach(btn=>btn.addEventListener('click',function(){addProduct(this.getAttribute('data-product-id'));const s=document.getElementById('bSearch');if(s){s.value='';s.focus()}renderSearchResults('')}));
  }
  function escSafe(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function addProduct(id){
    const items=getItems(), i=items.find(x=>String(x.id)===String(id));if(!i)return;
    if(typeof window.addToCart==='function'){window.addToCart(i.id);return}
    window.billCart=window.billCart||[];const line=window.billCart.find(x=>x.id===i.id);if(line)line.qty++;else window.billCart.push({id:i.id,qty:1});if(typeof window.renderCart==='function')window.renderCart();
  }
  function install(){
    window.openBillModal=openStableBill;
    window.launchNewBill=function(){return openStableBill()};
    document.addEventListener('click',function(e){const b=e.target.closest&&e.target.closest('button');if(!b)return;const t=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(t.includes('new bill')||t.includes('create bill')){e.preventDefault();e.stopImmediatePropagation();openStableBill()}},true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
