// NR BizPro final UI fallback — runs after every other module
(function(){
  function renderStockTable(){
    try{
      if(typeof state==='undefined'||!state||!Array.isArray(state.items)) return;
      const tb=document.getElementById('itemTable'); if(!tb) return;
      const escx=typeof esc==='function'?esc:(v)=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
      const moneyx=typeof money==='function'?money:(n)=>'₹'+(Number(n)||0).toFixed(2);
      if(!state.items.length){tb.innerHTML='<tr><td colspan="8" class="empty">No products yet.</td></tr>';return;}
      tb.innerHTML=state.items.map(i=>`<tr><td><b>${escx(i.name||'—')}</b></td><td>${escx(i.barcode||'—')}</td><td>${escx(i.type||'Product')}</td><td>${moneyx(i.cost)}</td><td><b>${moneyx(i.sell)}</b></td><td>${Number(i.gst)||0}%</td><td><b>${Number(i.stock)||0}</b></td><td></td></tr>`).join('');
    }catch(e){console.error('NR stock table fix',e)}
  }
  function ensureRawProduct(){
    const sel=document.getElementById('mType'); if(!sel) return;
    if(!Array.from(sel.options).some(o=>o.value==='Raw Product')){
      const o=document.createElement('option');o.value='Raw Product';o.textContent='Raw Product';sel.appendChild(o);
    }
  }
  function patchModal(){
    if(typeof window.openItemModal!=='function'||window.openItemModal.__finalUiFix)return;
    const old=window.openItemModal;
    function wrapped(){old();setTimeout(ensureRawProduct,0);setTimeout(ensureRawProduct,100);}
    wrapped.__finalUiFix=true;window.openItemModal=wrapped;
  }
  function run(){renderStockTable();patchModal();ensureRawProduct();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  window.addEventListener('load',()=>{run();setTimeout(run,300);setTimeout(run,1000);});
  setInterval(()=>{renderStockTable();patchModal();},1000);
})();
