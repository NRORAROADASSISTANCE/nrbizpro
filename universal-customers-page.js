// NR BizPro — Universal Customers page for every business
// Paint Shop / Fertilizer / EV Showroom / Garage / Retail / any category
(function(){'use strict';
 const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
 const money=v=>typeof window.money==='function'?window.money(v):'₹'+Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2});
 const S=()=>window.state||{};
 const customers=()=>Array.isArray(S().customers)?S().customers:[];
 const bills=()=>Array.isArray(S().bills)?S().bills:[];

 function billTotalForCustomer(c){
   const m=String(c.mobile||'').trim();
   const n=String(c.name||'').trim().toLowerCase();
   return bills().filter(b=>{
     const bm=String(b.mobile||b.customerMobile||'').trim();
     const bn=String(b.customer||b.customerName||'').trim().toLowerCase();
     return (m&&bm===m)||(n&&bn===n);
   }).reduce((a,b)=>a+Number(b.total||b.grandTotal||0),0);
 }
 function dueForCustomer(c){
   const m=String(c.mobile||'').trim(), n=String(c.name||'').trim().toLowerCase();
   return bills().filter(b=>{
     const bm=String(b.mobile||b.customerMobile||'').trim();
     const bn=String(b.customer||b.customerName||'').trim().toLowerCase();
     return (m&&bm===m)||(n&&bn===n);
   }).reduce((a,b)=>a+Math.max(0,Number(b.dueAmount??(Number(b.total||0)-Number(b.amountReceived||0)))||0),0);
 }
 function normalized(){
   const map=new Map();
   customers().forEach(c=>{
     const name=String(c.name||c.customer||'').trim(),mobile=String(c.mobile||c.phone||'').trim();
     if(!name&&!mobile)return;
     const key=mobile?'m:'+mobile:'n:'+name.toLowerCase();
     const prev=map.get(key);
     if(!prev)map.set(key,{...c,name:name||'Customer',mobile});
     else{prev.name=prev.name||name;prev.mobile=prev.mobile||mobile;}
   });
   return Array.from(map.values()).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
 }
 function save(){window.save?.();}

 function render(){
   const panel=document.getElementById('customers'); if(!panel)return;
   if(!panel.classList.contains('active'))return;
   const rows=normalized();
   panel.innerHTML='<div class="panel-head"><div><p class="eyebrow">CUSTOMER MANAGEMENT</p><h2>Customers / Parties</h2><p class="muted">Search existing customers by mobile number or name. Customer data is saved to the logged-in business cloud.</p></div><button class="primary" id="nrCustomerAdd">+ Add Customer</button></div>'+
     '<div style="display:flex;gap:10px;align-items:center;margin:12px 0;flex-wrap:wrap"><input id="nrCustomerSearch" class="search" style="flex:1;min-width:260px" placeholder="Search by mobile number or customer name"><button class="secondary" id="nrCustomerClear">Clear</button><span id="nrCustomerCount" class="muted">'+rows.length+' customer'+(rows.length===1?'':'s')+'</span></div>'+
     '<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Mobile</th><th>Email</th><th>Bills</th><th>Total</th><th>Outstanding</th><th>Action</th></tr></thead><tbody id="nrCustomerRows">'+
     (rows.length?rows.map(c=>'<tr data-mobile="'+esc(c.mobile)+'" data-name="'+esc(c.name)+'"><td><b>'+esc(c.name)+'</b></td><td>'+esc(c.mobile||'—')+'</td><td>'+esc(c.email||'—')+'</td><td>'+esc(c.bills||0)+'</td><td>'+money(c.total??billTotalForCustomer(c))+'</td><td><b>'+money(dueForCustomer(c))+'</b></td><td><button type="button" class="secondary" data-customer-view="'+esc(c.mobile||c.id||'')+'">View</button></td></tr>').join(''):'<tr><td colspan="7" class="empty">No customers yet. Add a customer or create a bill with a customer mobile number.</td></tr>')+
     '</tbody></table></div>';
   const search=document.getElementById('nrCustomerSearch');
   const filter=()=>{const q=(search.value||'').trim().toLowerCase();let count=0;document.querySelectorAll('#nrCustomerRows tr[data-mobile]').forEach(tr=>{const ok=!q||tr.dataset.mobile.toLowerCase().includes(q)||tr.dataset.name.toLowerCase().includes(q);tr.style.display=ok?'':'none';if(ok)count++});document.getElementById('nrCustomerCount').textContent=count+' customer'+(count===1?'':'s')};
   search?.addEventListener('input',filter);
   document.getElementById('nrCustomerClear')?.addEventListener('click',()=>{search.value='';filter();search.focus()});
   document.getElementById('nrCustomerAdd')?.addEventListener('click',openAdd);
   document.querySelectorAll('[data-customer-view]').forEach(btn=>btn.addEventListener('click',()=>openView(btn.dataset.customerView)));
 }
 function openAdd(){
   window.openModal?.('Add Customer','<div class="modal-grid"><label class="field">Customer Name *<input id="ncName" required></label><label class="field">Mobile Number *<input id="ncMobile" required inputmode="numeric"></label><label class="field">Email<input id="ncEmail" type="email"></label><label class="field">GSTIN<input id="ncGst"></label><label class="field wide">Address<textarea id="ncAddress" rows="3"></textarea></label></div><div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button type="button" class="primary" id="ncSave">Save Customer</button></div>');
   document.getElementById('ncSave').onclick=()=>{
     const name=document.getElementById('ncName').value.trim(),mobile=document.getElementById('ncMobile').value.trim(),email=document.getElementById('ncEmail').value.trim(),gst=document.getElementById('ncGst').value.trim(),address=document.getElementById('ncAddress').value.trim();
     if(!name||!mobile)return alert('Customer Name and Mobile Number are required.');
     S().customers=S().customers||[];
     const existing=S().customers.find(c=>String(c.mobile||'').trim()===mobile);
     if(existing){existing.name=name;existing.email=email;existing.gst=gst;existing.address=address;save();closeModal();render();alert('Existing customer updated successfully.');return;}
     S().customers.push({id:crypto.randomUUID(),name,mobile,email,gst,address,bills:0,total:0,createdAt:new Date().toISOString()});
     save();closeModal();render();alert('Customer saved to cloud successfully.');
   };
 }
 function openView(mobileOrId){
   const c=S().customers.find(x=>String(x.mobile||'')===String(mobileOrId)||String(x.id||'')===String(mobileOrId))||normalized().find(x=>String(x.mobile||'')===String(mobileOrId));
   if(!c)return;
   const m=String(c.mobile||''), n=String(c.name||'').toLowerCase();
   const rows=bills().filter(b=>{const bm=String(b.mobile||b.customerMobile||'');const bn=String(b.customer||b.customerName||'').toLowerCase();return (m&&bm===m)||(n&&bn===n)}).slice().reverse();
   const total=rows.reduce((a,b)=>a+Number(b.total||0),0),due=rows.reduce((a,b)=>a+Math.max(0,Number(b.dueAmount??(Number(b.total||0)-Number(b.amountReceived||0)))||0),0);
   window.openModal?.('Customer Details','<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px"><div><b>Name</b><div>'+esc(c.name)+'</div></div><div><b>Mobile</b><div>'+esc(c.mobile)+'</div></div><div><b>Email</b><div>'+esc(c.email||'—')+'</div></div><div><b>GSTIN</b><div>'+esc(c.gst||'—')+'</div></div><div style="grid-column:1/-1"><b>Address</b><div>'+esc(c.address||'—')+'</div></div></div><hr><div class="nr-cards" style="grid-template-columns:repeat(3,minmax(0,1fr));margin:12px 0"><div><span>Bills</span><b>'+rows.length+'</b></div><div><span>Total</span><b>'+money(total)+'</b></div><div><span>Outstanding</span><b>'+money(due)+'</b></div></div><div class="table-wrap"><table><thead><tr><th>Invoice</th><th>Date</th><th>Total</th><th>Due</th></tr></thead><tbody>'+ (rows.length?rows.map(b=>'<tr><td>'+esc(b.invoice||'—')+'</td><td>'+esc(String(b.billDate||b.date||'').slice(0,10))+'</td><td>'+money(b.total)+'</td><td>'+money(b.dueAmount??Math.max(0,Number(b.total||0)-Number(b.amountReceived||0)))+'</td></tr>').join(''):'<tr><td colspan="4" class="empty">No bills for this customer.</td></tr>') +'</tbody></table></div>');
 }
 function hook(){
   document.querySelectorAll('.tab[data-tab="customers"]').forEach(btn=>{
     btn.onclick=function(e){e.preventDefault();document.querySelectorAll('.tab,.tab-panel').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.getElementById('customers')?.classList.add('active');render();};
   });
   if(document.getElementById('customers')?.classList.contains('active'))render();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
 window.addEventListener('load',()=>setTimeout(hook,200));
 window.addEventListener('authReady',()=>setTimeout(hook,100));
 window.addEventListener('loginSuccess',()=>setTimeout(hook,100));
 window.NRBizProUniversalCustomers={render,openAdd,openView};
})();