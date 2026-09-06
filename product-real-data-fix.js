// NR BizPro — real saved products must always be available to billing/search
(function(){
  'use strict';
  function getState(){
    try{ if(typeof state!=='undefined' && state) return state; }catch(e){}
    return window.state||null;
  }
  function getAllItems(){
    const st=getState();
    return st && Array.isArray(st.items) ? st.items : [];
  }
  // A product belongs to the logged-in business account. Do not hide a saved
  // product just because a demo/category label uses a different internal key.
  window.visibleItems=function(){ return getAllItems(); };
  window.__nrGetRealProducts=getAllItems;

  function moneySafe(n){
    try{return typeof money==='function'?money(n):'₹'+(Number(n)||0).toFixed(2)}catch(e){return '₹'+(Number(n)||0).toFixed(2)}
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

  function refresh(){
    try{ if(typeof renderItems==='function') renderItems(); }catch(e){}
    try{ if(typeof updateStats==='function') updateStats(); }catch(e){}
  }

  // Re-render the bill search from the actual saved state, including products
  // created through the category-specific Add Product form.
  window.__nrRenderSavedProductSearch=function(query){
    const box=document.getElementById('billSuggestions');
    if(!box)return;
    const q=String(query||'').trim().toLowerCase();
    const items=getAllItems();
    if(!q){box.innerHTML=items.length?'<div class="muted">Type a product name or barcode to search.</div>':'<div class="empty">No products available. Add a product first.</div>';return;}
    const found=items.filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase().includes(q)).slice(0,20);
    box.innerHTML=found.map(i=>'<button type="button" class="suggestion" data-product-id="'+esc(i.id)+'"><b>'+esc(i.name)+'</b><span>'+(esc(i.barcode||'No barcode'))+' • '+moneySafe(i.sell)+' • Stock '+(Number(i.stock)||0)+'</span></button>').join('')||'<div class="empty">No product found</div>';
    box.querySelectorAll('[data-product-id]').forEach(btn=>btn.addEventListener('click',function(){
      const id=this.getAttribute('data-product-id');
      if(typeof window.addToCart==='function') window.addToCart(id);
      const s=document.getElementById('bSearch'); if(s){s.value='';s.focus();}
      window.__nrRenderSavedProductSearch('');
    }));
  };

  function installBillSearch(){
    const s=document.getElementById('bSearch');
    if(!s || s.dataset.nrSavedSearch==='1')return;
    s.dataset.nrSavedSearch='1';
    s.addEventListener('input',function(){window.__nrRenderSavedProductSearch(this.value);});
  }

  // If another script opens/replaces the bill modal, attach to its new search box.
  const observer=new MutationObserver(()=>installBillSearch());
  observer.observe(document.body,{childList:true,subtree:true});

  // Keep Products / Services and the bill search in sync after any successful save.
  document.addEventListener('click',function(e){
    const b=e.target?.closest?.('#universalSaveProduct,#businessSaveProduct');
    if(b)setTimeout(refresh,100);
  },true);
  window.addEventListener('load',()=>{refresh();installBillSearch();});
})();
