// NR BizPro — isolate products by active business category.
(function(){
  const KEY={
    'General Business':'general','Grocery / General Store':'grocery','Footwear / Chappal Shop':'footwear',
    'Fertilizer / Agriculture':'fertilizer','Garage / Service Center':'garage','Spare Parts':'spareparts',
    'EV Two-Wheeler Showroom':'evtwo','Retail / Supermarket':'retail','Restaurant / Bakery':'restaurant',
    'Hardware / Building Materials':'hardware','Medical / Pharmacy':'medical','Electronics / Mobile':'electronics',
    'Clothing / Fashion':'clothing','Furniture':'furniture','Jewellery':'jewellery','Stationery / Book Store':'stationery',
    'Dairy / Milk Products':'dairy','Salon / Beauty Parlour':'salon','Printing / Xerox / Online Services':'printing',
    'Wholesale / Distributor':'wholesale','Professional Services':'professional','Construction / Building Materials':'construction',
    'Paint Shop':'paint','Plumbing Business':'plumbing','Paint Shop + Plumbing Business':'paintplumbing','Other Business':'other'
  };
  function category(){
    try{
      const c=(typeof state!=='undefined'&&state?.settings?.category)||'';
      const u=(typeof currentUser!=='undefined'&&currentUser?.category)||'';
      const d=document.getElementById('businessCategory')?.value||'';
      return KEY[c]||KEY[u]||KEY[d]||String(c||u||d||'general').toLowerCase();
    }catch(e){return 'general'}
  }
  function matches(item){
    const k=category();
    const raw=[item?.businessType,item?.businessCategory,item?.industry,item?.categoryKey].filter(Boolean).map(x=>String(x).toLowerCase());
    if(k==='general'||k==='other')return raw.length===0||raw.some(x=>x==='general'||x==='other'||x==='general business');
    if(k==='paintplumbing')return raw.some(x=>['paint','plumbing','paintplumbing','paint shop','plumbing business'].includes(x));
    if(k==='evtwo')return raw.some(x=>x.includes('ev-two-wheeler')||x==='evtwo'||x==='ev');
    return raw.includes(k);
  }
  function items(){try{return (typeof state!=='undefined'&&state?.items)||[]}catch(e){return []}}
  function visible(){return items().filter(matches)}
  function tagNewItem(){
    try{
      if(typeof state==='undefined'||!state?.items)return;
      const k=category();
      state.items.forEach(i=>{
        if(i && !i.businessType && !i.businessCategory && !i.industry)i.businessCategory=k;
      });
      if(typeof save==='function')save();
    }catch(e){}
  }
  function installSearch(){
    if(typeof window.searchBillProducts!=='function'||window.__nrProductIsolationSearch)return;
    const old=window.searchBillProducts;
    window.__nrProductIsolationSearch=true;
    window.searchBillProducts=function(){
      const q=(document.getElementById('bSearch')?.value||'').trim().toLowerCase();
      const box=document.getElementById('billSuggestions');
      if(!box)return;
      if(!q){box.innerHTML='';return}
      const found=visible().filter(i=>String(i.name||'').toLowerCase().includes(q)||(String(i.barcode||'').toLowerCase()===q)).slice(0,8);
      box.innerHTML=found.map(i=>`<button class="suggestion" onclick="addToCart('${i.id}')"><b>${esc(i.name)}</b><span>${i.barcode||'No barcode'} • ${money(i.sell)} • Stock ${i.stock}</span></button>`).join('')||'<div class="empty">No product found for this business</div>';
      if(found.length===1&&String(found[0].barcode||'').toLowerCase()===q)addToCart(found[0].id);
    };
  }
  function installBarcode(){
    if(typeof window.handleBarcodeKey!=='function'||window.__nrProductIsolationBarcode)return;
    window.__nrProductIsolationBarcode=true;
    window.handleBarcodeKey=function(e){
      if(e.key!=='Enter')return;e.preventDefault();
      const q=(e.target?.value||'').trim().toLowerCase();
      const i=visible().find(x=>String(x.barcode||'').toLowerCase()===q);
      if(i){addToCart(i.id);if(e.target)e.target.value='';const b=document.getElementById('billSuggestions');if(b)b.innerHTML=''}
    };
  }
  function installAddItemTag(){
    if(typeof window.addItem!=='function'||window.__nrProductIsolationAdd)return;
    const old=window.addItem;window.__nrProductIsolationAdd=true;
    window.addItem=function(){const before=new Set(items().map(i=>i.id));const r=old.apply(this,arguments);items().forEach(i=>{if(!before.has(i.id)&&!i.businessType&&!i.businessCategory&&!i.industry)i.businessCategory=category()});try{if(typeof save==='function')save()}catch(e){}return r};
  }
  function install(){installSearch();installBarcode();installAddItemTag();}
  function refresh(){
    install();
    try{
      if(typeof window.__nrRecalcBill==='function')window.__nrRecalcBill();
    }catch(e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh);else refresh();
  window.addEventListener('load',refresh);
  window.addEventListener('authReady',refresh);
  window.addEventListener('loginSuccess',()=>setTimeout(refresh,50));
  setTimeout(refresh,300);setTimeout(refresh,1000);setTimeout(refresh,2000);
  window.__nrBusinessProductVisible=visible;
})();
