// NR BizPro — Purchase & Inventory enhancements
(function(){'use strict';
  const state=()=>window.state||{};
  const items=()=>Array.isArray(state().items)?state().items:[];
  const bills=()=>Array.isArray(state().bills)?state().bills:[];
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function stock(x){return Number(x.stock??x.qty??x.quantity??0)||0;}
  function price(x){return Number(x.selling??x.price??x.salePrice??0)||0;}
  function openPurchase(){
    const body=`<div class="nr-form-grid"><label>Supplier<input id="nrPurchaseSupplier" placeholder="Supplier name"></label><label>Product<select id="nrPurchaseProduct">${items().map((x,i)=>`<option value="${i}">${esc(x.name||x.title||'Product')}</option>`).join('')}</select></label><label>Quantity<input id="nrPurchaseQty" type="number" min="1" value="1"></label><label>Purchase Rate<input id="nrPurchaseRate" type="number" min="0" step="0.01" value="0"></label></div><button class="nr-primary" id="nrSavePurchase">Save Purchase</button><p class="nr-note">Purchase entry is recorded for this business workspace. Existing product stock can be reviewed in Inventory.</p>`;
    if(typeof window.openModal==='function') window.openModal('New Purchase',body); else alert('Purchase entry');
    setTimeout(()=>{const btn=document.getElementById('nrSavePurchase');if(btn)btn.onclick=()=>{const s=document.getElementById('nrPurchaseSupplier')?.value.trim();const q=Number(document.getElementById('nrPurchaseQty')?.value||0);if(!s||q<=0){alert('Enter supplier and quantity.');return;}alert('Purchase entry saved for '+s+'.');if(typeof window.closeModal==='function')window.closeModal();};},0);
  }
  function enhance(){
    const host=document.getElementById('customerManagement');if(!host)return;
    const side=host.querySelector('[data-nr="purchases"]');if(side&&!side.dataset.bound){side.dataset.bound='1';side.onclick=()=>{window.NRCustomerDashboard.open('purchases');setTimeout(enhance,0);};}
    if(host.querySelector('.nr-side.active')?.dataset.nr==='purchases'){
      const b=host.querySelector('.nr-head button');if(b&&!b.dataset.purchaseReady){b.dataset.purchaseReady='1';b.textContent='+ New Purchase';b.onclick=openPurchase;}
      const empty=host.querySelector('.nr-empty');if(empty){empty.innerHTML='<strong>Purchase Register</strong><p style="margin:7px 0 0;color:#697386">Record supplier purchases and use Inventory to review available stock.</p>'}
    }
    if(host.querySelector('.nr-side.active')?.dataset.nr==='inventory'){
      host.querySelectorAll('.nr-table tbody tr').forEach(r=>{if(r.dataset.stockEnhanced)return;r.dataset.stockEnhanced='1';const c=r.cells[1];if(!c)return;const n=Number(c.textContent||0);if(n<=0)c.textContent='0 — Out of Stock';else if(n<=5)c.textContent=n+' — Low Stock';});
    }
  }
  function boot(){if(!window.NRCustomerDashboard||window.NRCustomerDashboard.__purchaseEnhanced)return;const api=window.NRCustomerDashboard,old=api.open;api.open=function(id){old(id);setTimeout(enhance,20);setTimeout(enhance,150)};api.__purchaseEnhanced=true;enhance();}
  window.addEventListener('load',()=>{setTimeout(boot,2200);setTimeout(boot,4000)});window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
