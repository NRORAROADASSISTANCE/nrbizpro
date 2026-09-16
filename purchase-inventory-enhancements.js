// NR BizPro — Purchase & Inventory enhancements
(function(){'use strict';
  const state=()=>window.state||{};
  const items=()=>Array.isArray(state().items)?state().items:[];
  const purchases=()=>{if(!Array.isArray(state().purchases))state().purchases=[];return state().purchases};
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function stock(x){return Number(x.stock??x.qty??x.quantity??0)||0;}
  function save(){try{window.save?.();window.NRBizProCloudQueueSave?.()}catch(e){}}
  function openPurchase(){
    const body=`<div class="nr-form-grid"><label>Supplier<input id="nrPurchaseSupplier" placeholder="Supplier name"></label><label>Product<select id="nrPurchaseProduct">${items().map((x,i)=>`<option value="${i}">${esc(x.name||x.title||'Product')}</option>`).join('')}</select></label><label>Quantity<input id="nrPurchaseQty" type="number" min="1" value="1"></label><label>Purchase Rate<input id="nrPurchaseRate" type="number" min="0" step="0.01" value="0"></label><label>Payment Method<select id="nrPurchaseMethod"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Credit</option><option>Other</option></select></label></div><button class="nr-primary" id="nrSavePurchase">Save Purchase</button><p class="nr-note">Purchase entries are stored in this business workspace and increase the selected product stock.</p>`;
    if(typeof window.openModal==='function')window.openModal('New Purchase',body);else alert('Purchase entry');
    setTimeout(()=>{const btn=document.getElementById('nrSavePurchase');if(!btn)return;btn.onclick=()=>{const s=document.getElementById('nrPurchaseSupplier')?.value.trim();const pi=Number(document.getElementById('nrPurchaseProduct')?.value||0);const q=Number(document.getElementById('nrPurchaseQty')?.value||0);const r=Number(document.getElementById('nrPurchaseRate')?.value||0);const method=document.getElementById('nrPurchaseMethod')?.value||'Cash';if(!s||q<=0||r<0){alert('Enter supplier, quantity and purchase rate.');return;}const item=items()[pi];const name=item?.name||item?.title||'Product';const total=q*r;const p={id:'PUR-'+Date.now(),date:new Date().toISOString(),supplier:s,productName:name,productId:item?.id||'',quantity:q,rate:r,total,paidAmount:method==='Credit'?0:total,paymentMethod:method,paymentStatus:method==='Credit'?'Credit':'Paid'};purchases().push(p);if(item){const current=stock(item);item.stock=current+q;item.qty=current+q;}save();if(typeof window.closeModal==='function')window.closeModal();alert('Purchase saved successfully. Stock increased by '+q+'.');window.NRCustomerDashboard?.open('purchases');};},0);
  }
  function enhance(){
    const host=document.getElementById('customerManagement');if(!host)return;
    const side=host.querySelector('[data-nr="purchases"]');if(side&&!side.dataset.bound){side.dataset.bound='1';side.onclick=()=>{window.NRCustomerDashboard.open('purchases');setTimeout(enhance,0);};}
    if(host.querySelector('.nr-side.active')?.dataset.nr==='purchases'){
      const b=host.querySelector('.nr-head button');if(b&&!b.dataset.purchaseReady){b.dataset.purchaseReady='1';b.textContent='+ New Purchase';b.onclick=openPurchase;}
      const empty=host.querySelector('.nr-empty');if(empty){const ps=purchases();const total=ps.reduce((a,p)=>a+Number(p.total||0),0);empty.innerHTML='<strong>Purchase Register</strong><p style="margin:7px 0;color:#697386">Entries: '+ps.length+' · Total: '+money(total)+'</p><div class="nr-table"><table><thead><tr><th>Date</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>'+(ps.length?ps.slice().reverse().map(p=>'<tr><td>'+esc((p.date||'').slice(0,10))+'</td><td>'+esc(p.supplier)+'</td><td>'+esc(p.productName)+'</td><td>'+p.quantity+'</td><td>'+money(p.rate)+'</td><td>'+money(p.total)+'</td></tr>').join(''):'<tr><td colspan="6" class="empty">No purchases yet.</td></tr>')+'</tbody></table></div>'}
    }
    if(host.querySelector('.nr-side.active')?.dataset.nr==='inventory')host.querySelectorAll('.nr-table tbody tr').forEach(r=>{if(r.dataset.stockEnhanced)return;r.dataset.stockEnhanced='1';const c=r.cells[1];if(!c)return;const n=Number(c.textContent||0);if(n<=0)c.textContent='0 — Out of Stock';else if(n<=5)c.textContent=n+' — Low Stock';});
  }
  function boot(){if(!window.NRCustomerDashboard||window.NRCustomerDashboard.__purchaseEnhanced)return;const api=window.NRCustomerDashboard,old=api.open;api.open=function(id){old(id);setTimeout(enhance,20);setTimeout(enhance,150)};api.__purchaseEnhanced=true;enhance();}
  window.addEventListener('load',()=>{setTimeout(boot,2200);setTimeout(boot,4000)});window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
