// NR BizPro — EV CRM left-side navigation
(function(){
  const isEV=()=>/ev two|electric two|ev 2|ev scooter|ev bike/i.test(String(window.currentUser?.category||window.state?.settings?.category||''));
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
  function ensure(){if(!window.state)return;state.enquiries=Array.isArray(state.enquiries)?state.enquiries:[];state.testDrives=Array.isArray(state.testDrives)?state.testDrives:[];state.quotations=Array.isArray(state.quotations)?state.quotations:[];state.bookings=Array.isArray(state.bookings)?state.bookings:[];state.payments=Array.isArray(state.payments)?state.payments:[];}
  function render(){
    if(!isEV())return; const p=document.getElementById('evcrm'); if(!p)return; ensure();
    p.innerHTML=`<div class="ev-crm-layout">
      <aside class="ev-crm-sidebar">
        <div class="ev-crm-side-title">EV CRM &amp; Sales</div>
        <button class="ev-crm-side-btn active" data-pane="overview">📊 <span>CRM Dashboard</span></button>
        <button class="ev-crm-side-btn" data-action="customer">👥 <span>Customer Registration</span></button>
        <button class="ev-crm-side-btn" data-action="lead">📌 <span>New Enquiry / Leads</span></button>
        <button class="ev-crm-side-btn" data-action="follow">🔔 <span>Follow-up Management</span></button>
        <button class="ev-crm-side-btn" data-action="test">🏍️ <span>Test Drive Booking</span></button>
        <button class="ev-crm-side-btn" data-action="quote">📝 <span>Quotation</span></button>
        <button class="ev-crm-side-btn" data-action="booking">📋 <span>Vehicle Booking</span></button>
        <button class="ev-crm-side-btn" data-pane="payments">💰 <span>Payment History</span></button>
        <button class="ev-crm-side-btn" data-pane="enquiries">📋 <span>Recent Enquiries</span></button>
        <button class="ev-crm-side-btn" data-pane="tests">🛵 <span>Test Drive History</span></button>
      </aside>
      <section class="ev-crm-main"><div id="evCrmPane"></div></section>
    </div>`;
    p.querySelectorAll('.ev-crm-side-btn').forEach(b=>b.onclick=()=>{
      p.querySelectorAll('.ev-crm-side-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');
      if(b.dataset.action){const f={customer:'openCustomer',lead:'openLead',follow:'openFollow',test:'openTestDrive',quote:'openQuotation',booking:'openBooking'}[b.dataset.action];if(f&&typeof window[f]==='function')window[f]();}
      else pane(b.dataset.pane||'overview');
    });
    pane('overview');
  }
  function pane(kind){
    ensure(); const d=document.getElementById('evCrmPane'); if(!d)return;
    if(kind==='payments') return d.innerHTML=table('Payment History','Type','Customer','Amount','Mode','Date',state.payments.map(x=>`<tr><td>${esc(x.type||'Payment')}</td><td>${esc(x.customer)}</td><td>${money(x.amount)}</td><td>${esc(x.mode||'—')}</td><td>${esc(x.date?new Date(x.date).toLocaleString('en-IN'):'—')}</td></tr>`).join(''));
    if(kind==='enquiries') return d.innerHTML=table('Recent Enquiries / Leads','Customer','Mobile','Vehicle','Status','Follow-up',state.enquiries.slice(0,50).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.vehicle||'—')}</td><td>${esc(x.status||'New')}</td><td>${esc(x.followUp||'—')}</td></tr>`).join(''));
    if(kind==='tests') return d.innerHTML=table('Test Drive History','Customer','Mobile','Vehicle','Date / Time','Status',state.testDrives.slice(0,50).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.vehicle)} ${esc(x.variant||'')}</td><td>${esc(x.date||'—')} ${esc(x.time||'')}</td><td>${esc(x.status||'Booked')}</td></tr>`).join(''));
    const leads=state.enquiries.length,td=state.testDrives.length,q=state.quotations.length,b=state.bookings.length,p=state.payments.length;
    d.innerHTML=`<div class="panel-head"><div><p class="eyebrow">EV CRM &amp; SALES</p><h2>CRM Dashboard</h2><p class="muted">Select any option from the left menu to manage the complete showroom sales cycle.</p></div><button class="primary" onclick="openLead()">+ New Enquiry</button></div><div class="stats ev-crm-stats"><div class="stat"><span>Enquiries / Leads</span><strong>${leads}</strong></div><div class="stat"><span>Test Drives</span><strong>${td}</strong></div><div class="stat"><span>Quotations</span><strong>${q}</strong></div><div class="stat"><span>Bookings</span><strong>${b}</strong></div><div class="stat"><span>Payments</span><strong>${p}</strong></div></div><div class="panel-head"><div><h3>Recent Enquiries</h3></div></div>${state.enquiries.length?`<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Mobile</th><th>Vehicle</th><th>Status</th><th>Follow-up</th></tr></thead><tbody>${state.enquiries.slice(0,10).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.mobile)}</td><td>${esc(x.vehicle||'—')}</td><td>${esc(x.status||'New')}</td><td>${esc(x.followUp||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">No enquiries yet. Use New Enquiry / Leads from the left menu.</div>'}`;
  }
  function table(title,a,b,c,d,e,rows){return `<div class="panel-head"><div><p class="eyebrow">EV CRM &amp; SALES</p><h2>${title}</h2></div></div><div class="table-wrap"><table><thead><tr><th>${a}</th><th>${b}</th><th>${c}</th><th>${d}</th><th>${e}</th></tr></thead><tbody>${rows||`<tr><td colspan="5" class="empty">No records yet.</td></tr>`}</tbody></table></div>`;}
  function boot(){if(isEV()&&document.getElementById('evcrm'))render();}
  window.addEventListener('load',boot);window.addEventListener('loginSuccess',boot);window.addEventListener('authReady',boot);setTimeout(boot,500);setTimeout(boot,1500);setTimeout(boot,3000);
})();
