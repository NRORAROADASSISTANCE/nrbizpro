// NR BizPro — show products for the logged-in business, respecting selected modules
(function(){
  'use strict';
  const selected=()=>Array.isArray(window.state?.settings?.modules)&&window.state.settings.modules.length?window.state.settings.modules:[];
  const allItems=()=>Array.isArray(window.state?.items)?window.state.items:[];
  const visible=()=>{
    // Business isolation is the source of truth when available. This prevents a
    // paint-shop product/sample from appearing inside an EV showroom account.
    if(window.NRBizProBusinessDataIsolation?.visible)return window.NRBizProBusinessDataIsolation.visible();
    const mods=selected();
    if(!mods.length)return allItems();
    return allItems().filter(i=>!i.businessModule||mods.includes(i.businessModule)||mods.includes(i.businessCategory));
  };
  const moneyP=v=>typeof window.money==='function'?window.money(v):('₹'+(Number(v)||0).toFixed(2));
  const escP=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
  function render(){
    const tb=document.getElementById('itemTable');if(!tb)return;
    const items=visible();
    if(!items.length){tb.innerHTML='<tr><td colspan="8" class="empty">No products / services added yet.</td></tr>';return;}
    tb.innerHTML=items.map(i=>`<tr><td><b>${escP(i.name)}</b><small style="display:block;opacity:.7">${escP(i.businessModule||i.businessCategory||'General Business')}</small></td><td>${escP(i.barcode||'—')}</td><td>${escP(i.type||'Product')}</td><td>${moneyP(i.cost)}</td><td><b>${moneyP(i.sell)}</b></td><td>${Number(i.gst)||0}%</td><td><b>${Number(i.stock)||0}</b></td><td><button class="secondary" onclick="deleteItem('${i.id}')">Delete</button></td></tr>`).join('');
  }
  function stats(){
    const el=document.getElementById('itemCount');if(el)el.textContent=visible().length;
  }
  function install(){
    window.NRBizProAllProducts=visible;
    window.NRBizProRenderAllProducts=render;
    const oldR=window.renderItems;if(!oldR||!oldR.__nrAllProducts){const f=function(){render()};f.__nrAllProducts=true;window.renderItems=f;}
    const oldS=window.updateStats;if(oldS&&!oldS.__nrAllProducts){const f=function(){try{oldS.apply(this,arguments)}catch(e){}stats()};f.__nrAllProducts=true;window.updateStats=f;}
    render();stats();
  }
  window.addEventListener('load',()=>{setTimeout(install,400);setTimeout(install,1200);setTimeout(install,2500);});
  window.addEventListener('demoStarted',()=>setTimeout(install,300));
  setInterval(()=>{if(window.state)stats()},1500);
})();
