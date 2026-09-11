// NR BizPro — polished universal customer demo showcase (DEMO ONLY)
(function(){
  const META={
    footwear:['Footwear / Chappal Shop','Barcode billing, sizes, variants, stock & sales'],
    grocery:['Grocery / General Store','Barcode billing, units, purchases, suppliers & offers'],
    fertilizer:['Fertilizer / Agriculture','Fertilizer, seeds, pesticides, farmer ledger & stock'],
    garage:['Garage / Service Center','Vehicle customers, job cards, labour, spares & reminders'],
    spareparts:['Spare Parts','SKU, vehicle compatibility, brands, stock & warranty'],
    evtwo:['EV Two-Wheeler Showroom','Vehicles, leads, test drives, bookings, finance, RTO & delivery'],
    retail:['Retail / Supermarket','Barcode billing, stock, purchases, loyalty & returns'],
    restaurant:['Restaurant / Bakery','Tables, orders, kitchen, menu, recipes & takeaway'],
    hardware:['Hardware / Building Materials','SKU, units, stock, suppliers, credit & sales'],
    medical:['Medical / Pharmacy','Medicine stock, batch/expiry, suppliers, ledger & alerts'],
    electronics:['Electronics / Mobile','Serial numbers, warranty, models, stock & customer history'],
    wholesale:['Wholesale / Distributor','Bulk pricing, party ledger, stock, dues & delivery'],
    clothing:['Clothing / Fashion','Sizes, colours, barcode billing, stock & returns'],
    furniture:['Furniture','Dimensions, material, stock, delivery, customers & billing'],
    jewellery:['Jewellery','Purity, weight, making charges, stock & billing'],
    stationery:['Stationery / Book Store','Books, barcode, author/publisher, stock & billing'],
    dairy:['Dairy / Milk Products','Products, daily stock, credit/due & billing'],
    salon:['Salon / Beauty Parlour','Services, customers, appointments, staff & packages'],
    printing:['Printing / Xerox / Online Services','Print orders, Xerox, scanning, jobs & payments'],
    professional:['Professional Services','Clients, appointments, estimates, invoices & expenses'],
    construction:['Construction / Building Materials','Materials, units, stock, projects, suppliers & delivery'],
    paint:['Paint Shop','Brands, shades, pack sizes, GST, stock & billing'],
    plumbing:['Plumbing Business','Pipe types, sizes, lengths, units, stock & billing'],
    paintplumbing:['Paint Shop + Plumbing Business','Paint + plumbing products, stock, purchases & billing']
  };
  function isDemo(){return window.nrBizProDemoMode===true&&window.currentUser?.plan==='demo'&&window.currentUser?.id==='nr-bizpro-demo'}
  function api(){return window.NRBizProBusinessModules}
  function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#39;'}[m]))}
  function categories(){const a=api();if(!a?.profiles)return[];return Object.keys(a.profiles).filter(k=>k!=='general').map(k=>({key:k,label:(META[k]||[k])[0],desc:(META[k]||[k,'Explore business workflow'])[1],features:a.profiles[k]}))}
  function removeFromRealAccount(){document.getElementById('industryTab')?.remove();document.getElementById('industryModule')?.remove();document.getElementById('demoUniversalCategoryCards')?.remove()}
  function demoHeader(){return `<div class="panel-head"><div><p class="eyebrow">NR BIZPRO CUSTOMER DEMO</p><h2>One Platform • Every Business</h2><p class="muted">Explore billing, stock, customers and business-specific workflows in one safe demo. No real account, payment or business data is changed.</p></div><span class="badge" style="padding:7px 10px;border-radius:999px">DEMO ONLY</span></div>`}
  function renderUniversalDemo(){
    if(!isDemo()){removeFromRealAccount();return}
    const a=api();if(!a?.profiles)return;
    const cats=categories(),panel=document.getElementById('industryModule'),tab=document.getElementById('industryTab');
    if(panel){panel.style.display='';panel.classList.remove('hidden')}
    if(tab){tab.textContent='All Business Categories';tab.style.display='';tab.classList.remove('hidden')}
    if(panel){panel.innerHTML=`${demoHeader()}<div class="stats" style="margin:0 0 16px"><div class="stat"><span>Categories</span><strong>${cats.length}</strong></div><div class="stat"><span>Modules</span><strong>${cats.reduce((n,c)=>n+c.features.length,0)}</strong></div><div class="stat"><span>Demo Products</span><strong>3</strong></div><div class="stat"><span>Real Data</span><strong>0</strong></div></div><div class="panel-head"><div><h3>Choose a Business</h3><p class="muted">Open any category to see its dedicated modules.</p></div></div><div class="quick-grid" id="demoCategoryGrid">${cats.map((c,i)=>`<button type="button" class="industry-feature" data-demo-category="${i}"><b>✓ ${esc(c.label)}</b><span>${c.features.length} modules • ${esc(c.desc)}</span></button>`).join('')}</div><div id="industryWorkspace"></div>`;panel.querySelectorAll('[data-demo-category]').forEach(b=>b.onclick=()=>openCategory(cats[+b.dataset.demoCategory]));}
    renderDemoDashboardCards(cats)
  }
  function openCategory(category){const box=document.getElementById('industryWorkspace');if(!box)return;box.innerHTML=`<div class="panel" style="margin-top:16px"><div class="panel-head"><div><p class="eyebrow">DEMO CATEGORY</p><h2>${esc(category.label)}</h2><p class="muted">${esc(category.desc)} • ${category.features.length} available modules</p></div><button class="secondary" type="button" id="closeWorkspace">← All Categories</button></div><div class="quick-grid">${category.features.map((x,i)=>`<button type="button" class="industry-feature" data-demo-feature="${i}"><b>✓ ${esc(x)}</b><span>Open safe preview</span></button>`).join('')}</div><div id="demoFeatureWorkspace"></div></div>`;document.getElementById('closeWorkspace').onclick=()=>renderUniversalDemo();box.querySelectorAll('[data-demo-feature]').forEach(b=>b.onclick=()=>openFeature(category.features[+b.dataset.demoFeature],category.label));box.scrollIntoView({behavior:'smooth',block:'start'})}
  function openFeature(name,categoryLabel){const box=document.getElementById('demoFeatureWorkspace');if(!box)return;box.innerHTML=`<div class="panel" style="margin-top:16px"><div class="panel-head"><div><p class="eyebrow">WORKFLOW PREVIEW</p><h2>${esc(name)}</h2><p class="muted">${esc(categoryLabel)} — interactive UI preview using demo-only information.</p></div><button class="secondary" type="button" id="closeDemoFeature">← Back</button></div><div class="quick-grid"><div class="industry-feature"><b>✓ Form & Workflow</b><span>Preview the fields and workflow for this module.</span></div><div class="industry-feature"><b>✓ Sample Records</b><span>Demo records only — not connected to a real business.</span></div><div class="industry-feature"><b>✓ Safe Testing</b><span>No real payments, registrations or account changes.</span></div></div><div class="panel" style="margin-top:16px;padding:16px"><p class="eyebrow">DEMO NOTE</p><p class="muted">This preview is designed to help a customer understand how NR BizPro fits ${esc(categoryLabel)}. Real businesses get their own selected features after registration.</p></div></div>`;document.getElementById('closeDemoFeature').onclick=()=>openCategory(categories().find(c=>c.label===categoryLabel)||categories()[0]);box.scrollIntoView({behavior:'smooth',block:'start'})}
  function renderDemoDashboardCards(cats){const d=document.getElementById('dashboard');if(!d)return;let box=document.getElementById('demoUniversalCategoryCards');if(!box){box=document.createElement('section');box.id='demoUniversalCategoryCards';box.className='panel tab-panel';d.parentNode?.insertBefore(box,d.nextSibling)}box.innerHTML=`<div class="panel-head"><div><p class="eyebrow">DEMO SHOWCASE</p><h2>Explore Every Business</h2><p class="muted">${cats.length} business categories • ${cats.reduce((n,c)=>n+c.features.length,0)} business-specific modules</p></div></div><div class="quick-grid">${cats.map((c,i)=>`<button type="button" class="industry-feature" data-demo-dash-category="${i}"><b>✓ ${esc(c.label)}</b><span>${c.features.length} modules • Explore</span></button>`).join('')}</div>`;box.querySelectorAll('[data-demo-dash-category]').forEach(b=>b.onclick=()=>{const c=cats[+b.dataset.demoDashCategory];window.showTab?.('industryModule');setTimeout(()=>openCategory(c),50)})}
  window.renderUniversalDemo=renderUniversalDemo;
  function hook(){if(!isDemo())return;try{window.currentUser={...window.currentUser,category:'Universal Demo',plan:'demo',status:'active'};window.state=window.state||{items:[],bills:[],customers:[],settings:{}};window.state.settings={...(window.state.settings||{}),category:'Universal Demo',businessCategory:'Universal Demo',name:'NR BizPro Demo Showroom'};window.renderItems?.();window.updateStats?.();api()?.sync?.()}catch(e){}renderUniversalDemo()}
  window.addEventListener('demoStarted',()=>setTimeout(hook,100));
  window.addEventListener('load',()=>setTimeout(hook,250));
  window.addEventListener('authReady',()=>setTimeout(hook,100));
  window.addEventListener('loginSuccess',()=>setTimeout(hook,100));
  setTimeout(hook,900);setTimeout(hook,1800);setTimeout(hook,3000);
})();
