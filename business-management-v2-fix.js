// NR BizPro — final Business Management interaction + customer recovery
(function(){'use strict';
  const S=()=>window.state||{};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
  const bills=()=>Array.isArray(S().bills)?S().bills:[];
  const customers=()=>Array.isArray(S().customers)?S().customers:[];
  const nameOf=b=>String(b?.customerName??b?.customer??b?.partyName??b?.customer?.name??'').trim();
  const mobileOf=b=>String(b?.mobile??b?.customerMobile??b?.phone??b?.customer?.mobile??'').trim();
  function save(){try{window.save?.();window.NRBizProCloudQueueSave?.()}catch(e){}}
  function recover(){
    const s=S();if(!Array.isArray(s.bills))return;
    if(!Array.isArray(s.customers))s.customers=[];
    const map=new Map();s.customers.forEach(c=>{const k=String(c.mobile||c.name||c.customer||'').trim().toLowerCase();if(k)map.set(k,c)});
    let changed=false;
    s.bills.forEach(b=>{const n=nameOf(b),m=mobileOf(b);if(!n&&!m)return;if(/^walk[- ]?in customer$/i.test(n)&&!m)return;const k=(m||n).toLowerCase();if(map.has(k))return;const c={id:crypto.randomUUID(),name:n||'Customer',mobile:m,email:String(b.email??b.customerEmail??b.customer?.email??''),address:String(b.address??b.customerAddress??b.customer?.address??''),bills:0,total:0,createdAt:b.date||b.createdAt||new Date().toISOString()};s.customers.push(c);map.set(k,c);changed=true});
    s.customers.forEach(c=>{let count=0,total=0;s.bills.forEach(b=>{const n=nameOf(b).toLowerCase(),m=mobileOf(b);if((c.mobile&&m===String(c.mobile))||(c.name&&n===String(c.name).toLowerCase())){count++;total+=Number(b.total??b.grandTotal??b.amount??0)||0}});if(count){c.bills=count;c.total=total}});
    if(changed)save();
  }
  function openAddCustomer(){
    if(typeof window.openModal!=='function')return;
    window.openModal('Add Customer',`<div class="modal-grid"><label class="field">Customer Name<input id="nrNewCustName" required placeholder="Customer name"></label><label class="field">Mobile<input id="nrNewCustMobile" inputmode="tel" placeholder="Mobile number"></label><label class="field">Email<input id="nrNewCustEmail" type="email" placeholder="Email"></label><label class="field wide">Address<input id="nrNewCustAddress" placeholder="Address"></label></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="nrSaveCustomer">Save Customer</button></div>`);
    document.getElementById('nrSaveCustomer').onclick=()=>{const n=document.getElementById('nrNewCustName')?.value.trim();const m=document.getElementById('nrNewCustMobile')?.value.trim();if(!n)return alert('Enter customer name.');if(m&&customers().some(c=>String(c.mobile||'')===m))return alert('Customer mobile already exists.');customers().push({id:crypto.randomUUID(),name:n,mobile:m,email:document.getElementById('nrNewCustEmail')?.value.trim()||'',address:document.getElementById('nrNewCustAddress')?.value.trim()||'',bills:0,total:0,createdAt:new Date().toISOString()});save();window.closeModal?.();openCustomers();};
  }
  function openLedger(id){const c=customers().find(x=>String(x.id)===String(id));if(!c)return;const rows=bills().filter(b=>(c.mobile&&mobileOf(b)===String(c.mobile))||(c.name&&nameOf(b).toLowerCase()===String(c.name).toLowerCase()));const total=rows.reduce((a,b)=>a+(Number(b.total??b.grandTotal??b.amount??0)||0),0);window.openModal?.('Customer Ledger',`<div class="nr-ledger-head"><div><h3>${esc(c.name)}</h3><p>${esc(c.mobile||c.email||'')}</p></div><strong>${money(total)}</strong></div><div class="nr-table"><table><thead><tr><th>Invoice</th><th>Date</th><th>Amount</th></tr></thead><tbody>${rows.length?rows.map(b=>`<tr><td>${esc(b.invoice??b.invoiceNo??b.billNo??b.id??'Bill')}</td><td>${esc((b.date||b.createdAt||'').slice(0,10))}</td><td>${money(b.total??b.grandTotal??b.amount)}</td></tr>`).join(''):'<tr><td colspan="3" class="empty">No bills found.</td></tr>'}</tbody></table></div>`)}
  function openCustomers(){
    recover();const host=document.getElementById('customerManagement');if(!host)return;const list=customers();
    const rows=list.map(c=>`<tr><td><b>${esc(c.name||c.customer||'Customer')}</b></td><td>${esc(c.mobile||'—')}</td><td>${money(c.total||0)}</td><td>${Number(c.bills||0)}</td><td><button type="button" data-ledger="${esc(c.id)}">Ledger</button></td></tr>`).join('');
    const box=host.querySelector('.nr-content');if(!box)return;box.innerHTML=`<div class="nr-head"><div><h3>Customers / Parties</h3><p>Customer master, ledger and bill history.</p></div><button type="button" id="nrAddCustomerFinal">+ Add Customer</button></div><input class="nr-search" id="nrCustomerSearchFinal" placeholder="Search customer / mobile"><div class="nr-table"><table><thead><tr><th>Customer</th><th>Mobile</th><th>Total Sales</th><th>Bills</th><th>Action</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="empty">No customers yet. Create a customer or enter customer details while billing.</td></tr>'}</tbody></table></div>`;
    document.getElementById('nrAddCustomerFinal').onclick=openAddCustomer;document.getElementById('nrCustomerSearchFinal').oninput=e=>{const q=e.target.value.toLowerCase();box.querySelectorAll('tbody tr').forEach(r=>{if(!r.querySelector('[data-ledger]'))return;r.style.display=r.textContent.toLowerCase().includes(q)?'':'none'})};box.querySelectorAll('[data-ledger]').forEach(b=>b.onclick=()=>openLedger(b.dataset.ledger));
  }
  function bind(){const host=document.getElementById('customerManagement');if(!host)return;recover();host.querySelectorAll('[data-nr]').forEach(b=>{if(b.dataset.v2bound)return;b.dataset.v2bound='1';b.onclick=()=>{const id=b.dataset.nr;if(id==='customers')openCustomers();else if(id==='reports')window.NRBizProReports?.open?.();else window.NRCustomerDashboard?.open?.(id)}})}
  function patch(){const api=window.NRCustomerDashboard;if(!api||api.__v2fixed)return;const old=api.open;api.open=function(id){if(id==='customers')recover();old(id);setTimeout(()=>{bind();if(id==='customers')openCustomers()},50);setTimeout(()=>{if(id==='customers')openCustomers()},250)};api.__v2fixed=true}
  function boot(){patch();bind();recover();if(document.querySelector('#customerManagement .nr-side.active')?.dataset.nr==='customers')openCustomers()}
  window.NRBizProBusinessV2={recover,openCustomers,openAddCustomer,openLedger,boot};window.addEventListener('load',()=>{setTimeout(boot,5000);setTimeout(boot,8000)});window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
