(function(){'use strict';
  function getState(){
    if(window.state && Array.isArray(window.state.items)) return window.state;
    try{
      const id=window.currentUser?.id;
      if(id){
        const raw=localStorage.getItem('nr-bizpro-data-v2:'+id);
        if(raw){ window.state=JSON.parse(raw); return window.state; }
      }
    }catch(e){console.error('NR bill state recovery',e)}
    return {items:[]};
  }
  const esc=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const money=v=>typeof window.money==='function'?window.money(v):('₹'+(Number(v)||0).toFixed(2));
  function renderSearch(){
    const input=document.getElementById('nbSearch'), box=document.getElementById('nbSuggestions');
    if(!input||!box)return;
    const q=(input.value||'').trim().toLowerCase();
    if(!q){box.innerHTML='';return;}
    const s=getState();
    const items=(s.items||[]).filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase()===q).slice(0,10);
    box.innerHTML=items.length?items.map(i=>`<button type="button" class="suggestion nr-final-bill-suggestion" data-id="${esc(i.id)}"><b>${esc(i.name)}</b><span>${esc(i.unit||'pcs')} • ${money(i.sell)} • Stock ${Number(i.stock)||0}</span></button>`).join(''):'<div class="empty">No product found</div>';
  }
  function selectProduct(id){
    const s=getState();
    const item=(s.items||[]).find(i=>i.id===id);
    if(!item)return;
    try{
      if(typeof window.NRVehicleAddBillItem==='function') window.NRVehicleAddBillItem(id);
      else if(typeof window.addToCart==='function') window.addToCart(id);
      else return;
      const input=document.getElementById('nbSearch'); if(input)input.value='';
      const box=document.getElementById('nbSuggestions'); if(box)box.innerHTML='';
      input?.focus();
    }catch(e){console.error('NR bill add item',e);alert('Unable to add product. Please try again.');}
  }
  function bind(){
    document.addEventListener('input',e=>{if(e.target?.id==='nbSearch')renderSearch()},true);
    document.addEventListener('click',e=>{
      const b=e.target.closest('.nr-final-bill-suggestion');
      if(b){e.preventDefault();e.stopPropagation();selectProduct(b.dataset.id)}
    },true);
    document.addEventListener('keydown',e=>{
      if(e.target?.id==='nbSearch'&&e.key==='Enter'){
        e.preventDefault();
        const s=getState(),q=e.target.value.trim().toLowerCase();
        const item=(s.items||[]).find(i=>String(i.barcode||'').toLowerCase()===q);
        if(item)selectProduct(item.id); else renderSearch();
      }
    },true);
  }
  bind();
  window.NRFinalBillSearch=renderSearch;
})();
