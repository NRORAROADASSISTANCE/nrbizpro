// NR BizPro — complete EV showroom navigation/workspaces
(function(){
 const getCategory=()=>{const d=document.getElementById('businessCategory');if(d&&d.value)return d.value;try{if(typeof currentUser!=='undefined'&&currentUser?.category)return currentUser.category}catch(e){}try{if(typeof state!=='undefined'&&state?.settings?.category)return state.settings.category}catch(e){}return window.currentUser?.category||window.state?.settings?.category||''};
 const isEV=()=>/ev two|electric two|ev 2|ev scooter|ev bike/i.test(String(getCategory()));
 const features=[['🚗','Vehicle Management','Brand, Model, Variant, Battery Type & Capacity, Motor Power, Range, Colour, Vehicle Price, On-Road Price, Vehicle Stock'],['👥','Customer & Enquiry','Customer Registration, Customer History, New Enquiries / Leads, Follow-up, Salesperson Assignment, Reminders'],['🏍️','Test Drive','Booking, Customer & Vehicle Details, Date/Time, Test Drive History'],['📝','Sales','Quotation, Vehicle Booking, Advance Payment, Sales Invoice / Billing, Discount, Payment History, Pending Amount'],['💰','Finance','Finance Company, Loan Amount, Down Payment, EMI, Loan Tenure, Finance Status'],['📋','RTO & Insurance','RTO / Registration Status, Insurance Details, Registration Tracking'],['🎁','Accessories','Accessories Management, Stock, Accessory Billing, Accessories linked with Vehicle Sale'],['🔧','Service & Warranty','Vehicle Service History, Service Reminders, Warranty Tracking, Battery Warranty, Customer Vehicle History'],['🚚','Delivery','Delivery Management, Delivery Checklist, Delivery Date, Delivery Confirmation'],['📊','Reports','Daily/Monthly Sales, Vehicle Stock, Model-wise Sales, Salesperson Performance, Enquiry, Test Drive, Booking, Pending Payment, Finance, Delivery Reports']];
 function installBillingRouter(){
  const normalBill=window._normalOpenBillModal||window._oldLaunchNewBill||window.openBillModal;
  const normalItem=window._oldOpenItemModal||window.openItemModal;
  if(typeof normalBill==='function')window.launchNewBill=()=>isEV()?(typeof window.openEVBill==='function'?window.openEVBill():normalBill()):normalBill();
  if(typeof normalItem==='function')window.openItemModal=()=>isEV()?(typeof window.openEVProduct==='function'?window.openEVProduct():normalItem()):normalItem();
 }
 function syncNavVisibility(){
  const ev=isEV();
  const tab=document.getElementById('evShowroomTab');
  const panel=document.getElementById('evShowroom');
  if(tab)tab.style.display=ev?'':'none';
  if(panel)panel.style.display=ev?'':'none';
  if(!ev && document.querySelector('.tab.active')===tab){
   const first=document.querySelector('.tabs .tab:not(#evShowroomTab)');
   if(first)first.click();
  }
 }
 function addNav(){
  const nav=document.querySelector('.tabs'),main=document.querySelector('.shell');
  if(!nav||!main)return;
  if(!isEV()){syncNavVisibility();return;}
  if(document.getElementById('evShowroomTab')){syncNavVisibility();return;}
  const b=document.createElement('button');b.className='tab';b.id='evShowroomTab';b.dataset.tab='evShowroom';b.textContent='EV Showroom';b.onclick=()=>showTab('evShowroom');nav.appendChild(b);
  const s=document.createElement('section');s.id='evShowroom';s.className='panel tab-panel';s.innerHTML='<div class="panel-head"><div><p class="eyebrow">EV TWO-WHEELER SHOWROOM</p><h2>Showroom Management</h2><p class="muted">Business-specific modules configured for your EV showroom.</p></div></div><div class="quick-grid">'+features.map((f,i)=>'<button type="button" class="ev-module-card" data-i="'+i+'"><b>'+f[0]+' '+f[1]+'</b><span>'+f[2]+'</span></button>').join('')+'</div><div id="evModuleDetails"></div>';main.appendChild(s);s.querySelectorAll('.ev-module-card').forEach(x=>x.onclick=()=>openDetails(+x.dataset.i));syncNavVisibility();
 }
 function openDetails(i){const d=document.getElementById('evModuleDetails'),f=features[i];if(!d)return;d.innerHTML='<div class="panel" style="margin-top:16px"><div class="panel-head"><div><p class="eyebrow">MODULE</p><h3>'+f[0]+' '+f[1]+'</h3><p class="muted">'+f[2]+'</p></div></div></div>';d.scrollIntoView({behavior:'smooth',block:'nearest'})}
 function boot(){installBillingRouter();addNav();syncNavVisibility()} window.addEventListener('load',boot);setTimeout(boot,1200);setTimeout(boot,2500);setTimeout(boot,4000);window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);document.addEventListener('change',e=>{if(e.target?.id==='businessCategory'||e.target?.id==='businessCategorySettings')setTimeout(()=>{installBillingRouter();addNav();syncNavVisibility()},0)});
})();