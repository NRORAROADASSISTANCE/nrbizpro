// NR BizPro — complete EV showroom navigation/workspaces
(function(){
  const isEV=()=>/ev two|electric two|ev 2|ev scooter|ev bike/i.test(String(window.currentUser?.category||window.state?.settings?.category||''));
  if(!isEV()) return;
  const features=[
    ['🚗','Vehicle Management','Brand, Model, Variant, Battery Type & Capacity, Motor Power, Range, Colour, Vehicle Price, On-Road Price, Vehicle Stock'],
    ['👥','Customer & Enquiry','Customer Registration, Customer History, New Enquiries / Leads, Follow-up, Salesperson Assignment, Reminders'],
    ['🏍️','Test Drive','Booking, Customer & Vehicle Details, Date/Time, Test Drive History'],
    ['📝','Sales','Quotation, Vehicle Booking, Advance Payment, Sales Invoice / Billing, Discount, Payment History, Pending Amount'],
    ['💰','Finance','Finance Company, Loan Amount, Down Payment, EMI, Loan Tenure, Finance Status'],
    ['📋','RTO & Insurance','RTO / Registration Status, Insurance Details, Registration Tracking'],
    ['🎁','Accessories','Accessories Management, Stock, Accessory Billing, Accessories linked with Vehicle Sale'],
    ['🔧','Service & Warranty','Vehicle Service History, Service Reminders, Warranty Tracking, Battery Warranty, Customer Vehicle History'],
    ['🚚','Delivery','Delivery Management, Delivery Checklist, Delivery Date, Delivery Confirmation'],
    ['📊','Reports','Daily/Monthly Sales, Vehicle Stock, Model-wise Sales, Salesperson Performance, Enquiry, Test Drive, Booking, Pending Payment, Finance, Delivery Reports']
  ];
  function addNav(){
    const nav=document.querySelector('.tabs'); if(!nav||document.getElementById('evShowroomTab'))return;
    const b=document.createElement('button');b.className='tab';b.id='evShowroomTab';b.dataset.tab='evShowroom';b.textContent='EV Showroom';b.onclick=()=>showTab('evShowroom');nav.appendChild(b);
    const main=document.querySelector('.shell');const s=document.createElement('section');s.id='evShowroom';s.className='panel tab-panel';s.innerHTML='<div class="panel-head"><div><p class="eyebrow">EV TWO-WHEELER SHOWROOM</p><h2>Showroom Management</h2><p class="muted">Business-specific modules configured for your EV showroom.</p></div><button class="secondary" type="button" id="evFeatureTest">Feature Overview</button></div><div class="quick-grid">'+features.map((f,i)=>'<button type="button" class="ev-module-card" data-i="'+i+'"><b>'+f[0]+' '+f[1]+'</b><span>'+f[2]+'</span></button>').join('')+'</div><div id="evModuleDetails"></div>';main.appendChild(s);
    s.querySelectorAll('.ev-module-card').forEach(b=>b.onclick=()=>openDetails(+b.dataset.i));document.getElementById('evFeatureTest').onclick=()=>alert('NRBIZPRO EV Showroom\n\n10 business-specific module groups are available. Vehicle billing, accessories, finance, insurance, RTO, service, warranty, delivery and reports are included.');
  }
  function openDetails(i){const d=document.getElementById('evModuleDetails');const f=features[i];d.innerHTML='<div class="panel" style="margin-top:16px"><div class="panel-head"><div><p class="eyebrow">MODULE</p><h3>'+f[0]+' '+f[1]+'</h3><p class="muted">'+f[2]+'</p></div><button class="secondary" id="evCloseDetail">Close</button></div><p class="muted">This module is part of the EV showroom workflow. Use the dedicated buttons and billing screens to enter records.</p></div>';document.getElementById('evCloseDetail').onclick=()=>d.innerHTML='';d.scrollIntoView({behavior:'smooth',block:'nearest'})}
  function boot(){addNav()}
  window.addEventListener('load',boot);setTimeout(boot,1200);
})();
