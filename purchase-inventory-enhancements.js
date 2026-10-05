// NR BizPro — Purchase & Inventory enhancements
(function(){'use strict';
  const state=()=>window.state||{};
  const items=()=>Array.isArray(state().items)?state().items:[];
  const purchases=()=>{if(!Array.isArray(state().purchases))state().purchases=[];return state().purchases};
  const supplierPayments=()=>{if(!Array.isArray(state().supplierPayments))state().supplierPayments=[];return state().supplierPayments};
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function stock(x){return Number(x.stock??x.qty??x.quantity??0)||0;}
  function save(){try{window.save?.();window.NRBizProCloudQueueSave?.()}catch(e){}}
  function openPurchase(){
    const body=`<div class="nr-form-grid"><label>Supplier<input id="nrPurchaseSupplier" placeholder="Supplier name"></label><label>Product<select id="nrPurchaseProduct">${items().map((x,i)=>`<option value="${i}">${esc(x.name||x.title||'Product')}</option>`).join('')}</select></label><label>Quantity<input id="nrPurchaseQty" type="number" min="1" value="1"></label><label>Purchase Rate<input id="nrPurchaseRate" type="number" min="0" step="0.01" value="0"></label><label>Payment Method<select id="nrPurchaseMethod"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Credit</option><option>Other</option></select></label></div><button class="nr-primary" id="nrSavePurchase">Save Purchase</button><p class="nr-note">Purchase entries are stored in this business workspace and increase the selected product stock.</p>`;
    if(typeof window.openModal==='function')window.openModal('New Purchase',body);else alert('Purchase entry');
    setTimeout(()=>{const btn=document.getElementById('nrSavePurchase');if(!btn)return;btn.onclick=()=>{const s=document.getElementById('nrPurchaseSupplier')?.value.trim();const pi=Number(document.getElementById('nrPurchaseProduct')?.value||0);const q=Number(document.getElementById('nrPurchaseQty')?.value||0);const r=Number(document.getElementById('nrPurchaseRate')?.value||0);const method=document.getElementById('nrPurchaseMethod')?.value||'Cash';if(!s||q<=0||r<0){alert('Enter supplier, quantity and purchase rate.');return;}const item=items()[pi];const name=item?.name||item?.title||'Product';const total=q*r;const p={id:'PUR-'+Date.now(),date:new Date().toISOString(),supplier:s,productName:name,productId:item?.id||'',quantity:q,rate:r,total,paidAmount:method==='Credit'?0:total,paymentMethod:method,paymentStatus:method==='Credit'?'Credit':'Paid',businessId:window.currentUser?.id||''};
    ensureSupplierMaster(s,method==='Credit'?0:0);purchases().push(p);if(item){const current=stock(item);item.stock=current+q;item.qty=current+q;}supplierPayments();save();if(typeof window.closeModal==='function')window.closeModal();alert('Purchase saved successfully. Stock increased by '+q+'.');window.NRCustomerDashboard?.open('purchases');};},0);
  }
  function enhance(){
    const host=document.getElementById('customerManagement');if(!host)return;
    const side=host.querySelector('[data-nr="purchases"]');if(side&&!side.dataset.bound){side.dataset.bound='1';side.onclick=()=>{window.NRCustomerDashboard.open('purchases');setTimeout(enhance,0);};}
    if(host.querySelector('.nr-side.active')?.dataset.nr==='purchases'){
      const b=host.querySelector('.nr-head button');if(b&&!b.dataset.purchaseReady){b.dataset.purchaseReady='1';b.textContent='+ New Purchase';b.onclick=openPurchase;}
      const empty=host.querySelector('.nr-empty');if(empty){const ps=purchases();const total=ps.reduce((a,p)=>a+Number(p.total||0),0);empty.innerHTML='<strong>Purchase Register</strong><p style="margin:7px 0;color:#697386">Entries: '+ps.length+' · Total: '+money(total)+'</p><div class="nr-table"><table><thead><tr><th>Date</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>'+(ps.length?ps.slice().reverse().map(p=>'<tr><td>'+esc((p.date||'').slice(0,10))+'</td><td>'+esc(p.supplier)+'</td><td>'+esc(p.productName)+'</td><td>'+p.quantity+'</td><td>'+money(p.rate)+'</td><td>'+money(p.total)+'</td></tr>').join(''):'<tr><td colspan="6" class="empty">No purchases yet.</td></tr>')+'</tbody></table></div>'}
    }
    if(host.querySelector('.nr-side.active')?.dataset.nr==='purchases'){const hist=supplierPayments().slice().reverse();const wrap=host.querySelector('.nr-table');if(wrap){const h=document.createElement('div');h.className='nr-table';h.innerHTML='<h3 style="margin-top:22px">Supplier Payment History</h3><table><thead><tr><th>Date</th><th>Supplier</th><th>Amount</th><th>Method</th><th>Receipt</th></tr></thead><tbody>'+(hist.length?hist.map((p,i)=>'<tr><td>'+esc(String(p.date||'').slice(0,10))+'</td><td>'+esc(p.supplier||'—')+'</td><td>'+money(p.amount)+'</td><td>'+esc(p.method||'—')+'</td><td><button type="button" data-supplier-receipt="'+i+'">Receipt</button></td></tr>').join(''):'<tr><td colspan="5" class="empty">No supplier payments yet.</td></tr>')+'</tbody></table>';wrap.parentElement.appendChild(h);h.querySelectorAll('[data-supplier-receipt]').forEach(btn=>btn.onclick=()=>{const p=hist[Number(btn.dataset.supplierReceipt)];const w=window.open('','_blank','width=700,height=800');if(!w)return;w.document.write('<html><head><title>Supplier Payment Receipt</title><style>body{font-family:Arial;padding:32px;color:#172033}table{width:100%;border-collapse:collapse}td{padding:12px;border-bottom:1px solid #eee}.amt{font-size:24px;font-weight:800}</style></head><body><h1>NR BizPro</h1><h2>Supplier Payment Receipt</h2><table><tr><td>Supplier</td><td><b>'+esc(p.supplier)+'</b></td></tr><tr><td>Date</td><td>'+esc(String(p.date||'').slice(0,10))+'</td></tr><tr><td>Amount Paid</td><td class="amt">'+money(p.amount)+'</td></tr><tr><td>Payment Method</td><td>'+esc(p.method||'—')+'</td></tr><tr><td>Purchase</td><td>'+esc(p.purchaseId||'—')+'</td></tr></table><p>Thank you.</p><script>window.print()<\/script></body></html>');w.document.close();});}}
    if(host.querySelector('.nr-side.active')?.dataset.nr==='inventory')host.querySelectorAll('.nr-table tbody tr').forEach(r=>{if(r.dataset.stockEnhanced)return;r.dataset.stockEnhanced='1';const c=r.cells[1];if(!c)return;const n=Number(c.textContent||0);if(n<=0)c.textContent='0 — Out of Stock';else if(n<=5)c.textContent=n+' — Low Stock';});
  }
  function supplierOpeningBalance(supplier){
  const s=String(supplier||'').trim().toLowerCase();
  const list=Array.isArray(state().suppliers)?state().suppliers:[];
  const x=list.find(v=>String(v.name||'').trim().toLowerCase()===s);
  return Math.max(0,Number(x?.openingBalance||0)||0);
}
function ensureSupplierMaster(supplier,opening){
  if(!supplier)return;
  state().suppliers=Array.isArray(state().suppliers)?state().suppliers:[];
  let x=state().suppliers.find(v=>String(v.name||'').trim().toLowerCase()===String(supplier).trim().toLowerCase());
  if(!x){x={id:'SUP-'+Date.now(),name:String(supplier).trim(),openingBalance:Math.max(0,Number(opening)||0)};state().suppliers.push(x);}
  else if(Number(opening)>0)x.openingBalance=Number(opening);
}
function openSupplierLedger(supplier){
  const s=String(supplier||'').trim(); if(!s)return;
  const ps=purchases().filter(p=>String(p.supplier||'').trim().toLowerCase()===s.toLowerCase());
  const paid=ps.reduce((a,p)=>a+Number(p.paidAmount||0),0)+supplierPayments().filter(p=>String(p.supplier||'').trim().toLowerCase()===s.toLowerCase()).reduce((a,p)=>a+Number(p.amount||0),0);
  const total=ps.reduce((a,p)=>a+Number(p.total||0),0),opening=supplierOpeningBalance(s),due=Math.max(0,opening+total-paid);
  const rows=[...ps.map(p=>({d:p.date,t:'Purchase',r:p.id,de:Number(p.total||0),cr:0})),...supplierPayments().filter(p=>String(p.supplier||'').trim().toLowerCase()===s.toLowerCase()).map(p=>({d:p.date,t:'Payment',r:p.purchaseId||p.id,de:0,cr:Number(p.amount||0)}))].sort((a,b)=>String(a.d).localeCompare(String(b.d)));
  let bal=opening;
  const body=rows.map(r=>{bal+=r.de-r.cr;return '<tr><td>'+esc(String(r.d||'').slice(0,10))+'</td><td>'+esc(r.t)+'</td><td>'+esc(r.r||'—')+'</td><td>'+money(r.de)+'</td><td>'+money(r.cr)+'</td><td>'+money(bal)+'</td></tr>'}).join('');
  window.openModal?.('Supplier Ledger','<div class="nr-cards"><div><span>Opening</span><b>'+money(opening)+'</b></div><div><span>Purchases</span><b>'+money(total)+'</b></div><div><span>Paid</span><b>'+money(paid)+'</b></div><div><span>Closing Due</span><b>'+money(due)+'</b></div></div><div class="table-wrap"><table><thead><tr><th>Date</th><th>Particular</th><th>Reference</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>'+body+'</tbody></table></div>');
}
function addSupplierDashboardButton(){
  const host=document.querySelector('#purchase')||document.querySelector('[data-page="purchases"]');
  if(!host||host.querySelector('[data-open-supplier-dashboard]'))return;
  const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='Supplier Dashboard';b.dataset.openSupplierDashboard='1';b.style.margin='10px 6px 10px 0';b.onclick=openSupplierDashboard;
  const master=host.querySelector('[data-open-supplier-master]');if(master)master.after(b);else host.prepend(b);
}
function addSupplierMasterButton(){
  const host=document.querySelector('#purchase')||document.querySelector('[data-page="purchases"]');
  if(!host||host.querySelector('[data-open-supplier-master]'))return;
  const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent='Supplier Master';b.dataset.openSupplierMaster='1';b.style.margin='10px 0';b.onclick=openSupplierMaster;host.prepend(b);
}
function boot(){
  setTimeout(addSupplierLedgerButtons,300);setTimeout(addSupplierMasterButton,350);setTimeout(addSupplierDashboardButton,400);if(!window.NRCustomerDashboard||window.NRCustomerDashboard.__purchaseEnhanced)return;const api=window.NRCustomerDashboard,old=api.open;api.open=function(id){old(id);setTimeout(enhance,20);setTimeout(enhance,150)};api.__purchaseEnhanced=true;enhance();}
  window.addEventListener('load',()=>{setTimeout(boot,2200);setTimeout(boot,4000)});window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);

function openSupplierDashboard(){
  state().suppliers=Array.isArray(state().suppliers)?state().suppliers:[];
  const suppliers=state().suppliers;
  const rows=suppliers.map(s=>{
    const name=String(s.name||'').trim();
    const ps=purchases().filter(p=>String(p.supplier||'').trim().toLowerCase()===name.toLowerCase());
    const total=ps.reduce((a,p)=>a+Number(p.total||0),0);
    const paid=ps.reduce((a,p)=>a+Number(p.paidAmount||0),0)+supplierPayments().filter(p=>String(p.supplier||'').trim().toLowerCase()===name.toLowerCase()).reduce((a,p)=>a+Number(p.amount||0),0);
    const opening=Number(s.openingBalance||0),due=Math.max(0,opening+total-paid);
    return {name,opening,total,paid,due};
  });
  const html='<div class="nr-cards"><div><span>Total Suppliers</span><b>'+rows.length+'</b></div><div><span>Purchases</span><b>'+money(rows.reduce((a,r)=>a+r.total,0))+'</b></div><div><span>Paid</span><b>'+money(rows.reduce((a,r)=>a+r.paid,0))+'</b></div><div><span>Outstanding</span><b>'+money(rows.reduce((a,r)=>a+r.due,0))+'</b></div></div><div class="table-wrap"><table><thead><tr><th>Supplier</th><th>Opening</th><th>Purchases</th><th>Paid</th><th>Due</th><th>Action</th></tr></thead><tbody>'+(rows.length?rows.map((r,i)=>'<tr><td>'+esc(r.name)+'</td><td>'+money(r.opening)+'</td><td>'+money(r.total)+'</td><td>'+money(r.paid)+'</td><td><b>'+money(r.due)+'</b></td><td><button type="button" data-sdash="'+i+'">Ledger</button></td></tr>').join(''):'<tr><td colspan="6">No suppliers found.</td></tr>')+'</tbody></table></div>';
  window.openModal?.('Supplier Financial Dashboard',html);
  document.querySelectorAll('[data-sdash]').forEach(b=>b.onclick=()=>openSupplierLedger(rows[Number(b.dataset.sdash)]?.name));
}
function openSupplierMaster(){
  state().suppliers=Array.isArray(state().suppliers)?state().suppliers:[];
  const rows=state().suppliers;
  const html='<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px"><b>Supplier Master</b><button type="button" class="primary" id="nrAddSupplier">+ Add Supplier</button></div><div class="table-wrap"><table><thead><tr><th>Supplier</th><th>Mobile</th><th>GSTIN</th><th>Opening</th><th>Action</th></tr></thead><tbody>'+(rows.length?rows.map((s,i)=>'<tr><td>'+esc(s.name||'—')+'</td><td>'+esc(s.mobile||'—')+'</td><td>'+esc(s.gstin||'—')+'</td><td>'+money(s.openingBalance||0)+'</td><td><button type="button" data-sedit="'+i+'">Edit</button> <button type="button" data-sledger="'+i+'">Ledger</button></td></tr>').join(''):'<tr><td colspan="5">No suppliers added yet.</td></tr>')+'</tbody></table></div>';
  window.openModal?.('Supplier Master',html);
  const add=document.getElementById('nrAddSupplier'); if(add)add.onclick=()=>supplierForm();
  document.querySelectorAll('[data-sedit]').forEach(b=>b.onclick=()=>supplierForm(rows[Number(b.dataset.sedit)],Number(b.dataset.sedit)));
  document.querySelectorAll('[data-sledger]').forEach(b=>b.onclick=()=>openSupplierLedger(rows[Number(b.dataset.sledger)]?.name));
}
function supplierForm(existing,index){
  const s=existing||{};
  window.openModal?.(existing?'Edit Supplier':'Add Supplier','<div class="modal-grid"><label class="field">Supplier Name *<input id="nsName" value="'+esc(s.name||'')+'"></label><label class="field">Mobile<input id="nsMobile" inputmode="numeric" value="'+esc(s.mobile||'')+'"></label><label class="field">GSTIN<input id="nsGst" value="'+esc(s.gstin||'')+'"></label><label class="field">Opening Balance<input id="nsOpening" type="number" min="0" step="0.01" value="'+Number(s.openingBalance||0)+'"></label><label class="field wide">Address<textarea id="nsAddress" rows="3">'+esc(s.address||'')+'</textarea></label></div><div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button type="button" class="primary" id="nsSave">Save Supplier</button></div>');
  document.getElementById('nsSave').onclick=()=>{
    const name=document.getElementById('nsName').value.trim(),mobile=document.getElementById('nsMobile').value.trim(),gstin=document.getElementById('nsGst').value.trim(),address=document.getElementById('nsAddress').value.trim(),openingBalance=Math.max(0,Number(document.getElementById('nsOpening').value||0)||0);
    if(!name)return alert('Supplier Name is required.');
    state().suppliers=Array.isArray(state().suppliers)?state().suppliers:[];
    const dup=state().suppliers.find((x,i)=>i!==index&&String(x.name||'').trim().toLowerCase()===name.toLowerCase());
    if(dup)return alert('Supplier already exists.');
    const obj={id:s.id||'SUP-'+Date.now(),name,mobile,gstin,address,openingBalance,updatedAt:new Date().toISOString()};
    if(index>=0)state().suppliers[index]=obj; else state().suppliers.push(obj);
    save();closeModal();openSupplierMaster();
  };
}
function addSupplierLedgerButtons(){
  const host=document.querySelector('#purchase')||document.querySelector('[data-page="purchases"]')||document.body;
  if(!host||host.dataset.supplierLedgerReady)return;
  const names=[...new Set(purchases().map(p=>String(p.supplier||'').trim()).filter(Boolean))];
  if(!names.length)return;
  const box=document.createElement('div');box.dataset.supplierLedgerReady='1';box.style.cssText='margin:20px 0;padding:16px;border:1px solid #ddd;border-radius:12px';
  box.innerHTML='<b>Supplier Ledger</b> <select id="nrSupplierLedger"><option value="">Select Supplier</option>'+names.map(n=>'<option>'+esc(n)+'</option>').join('')+'</select>';
  box.querySelector('select').onchange=e=>openSupplierLedger(e.target.value);
  host.appendChild(box);
}
})();
