// NR BizPro — Universal customer demo showcase (DEMO ONLY)
(function(){
  function isDemo(){
    return window.nrBizProDemoMode===true && window.currentUser?.plan==='demo' && window.currentUser?.id==='nr-bizpro-demo';
  }
  function api(){return window.NRBizProBusinessModules}
  function categories(){
    const a=api(); if(!a?.profiles)return [];
    const labels={footwear:'Footwear / Chappal Shop',grocery:'Grocery / General Store',fertilizer:'Fertilizer / Agriculture',garage:'Garage / Service Center',spareparts:'Spare Parts',evtwo:'EV Two-Wheeler Showroom',retail:'Retail / Supermarket',restaurant:'Restaurant / Bakery',hardware:'Hardware / Building Materials',medical:'Medical / Pharmacy',electronics:'Electronics / Mobile',wholesale:'Wholesale / Distributor',clothing:'Clothing / Fashion',furniture:'Furniture',jewellery:'Jewellery',stationery:'Stationery / Book Store',dairy:'Dairy / Milk Products',salon:'Salon / Beauty Parlour',printing:'Printing / Xerox / Online Services',professional:'Professional Services',construction:'Construction / Building Materials',paint:'Paint Shop',plumbing:'Plumbing Business',paintplumbing:'Paint Shop + Plumbing Business',general:'General Business'};
    return Object.keys(a.profiles).filter(k=>k!=='general').map(k=>({key:k,label:labels[k]||k,features:a.profiles[k]}));
  }
  function removeFromRealAccount(){
    const tab=document.getElementById('industryTab'); if(tab)tab.remove();
    const panel=document.getElementById('industryModule'); if(panel)panel.remove();
    const cards=document.getElementById('demoUniversalCategoryCards'); if(cards)cards.remove();
  }
  function renderUniversalDemo(){
    if(!isDemo()){removeFromRealAccount();return;}
    const a=api(); if(!a?.profiles)return;
    const cats=categories();
    const panel=document.getElementById('industryModule');
    if(panel){
      panel.innerHTML=`<div class="panel-head"><div><p class="eyebrow">CUSTOMER DEMO</p><h2>NR BizPro — All Business Categories</h2><p class="muted">Explore the user interface and workflows available for every supported business category. Demo only — no real business data is created.</p></div><button class="secondary" type="button" id="featureTest">Feature Test</button></div><div class="quick-grid" id="demoCategoryGrid">${cats.map((c,i)=>`<button type="button" class="industry-feature" data-demo-category="${i}"><b>✓ ${String(c.label).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}</b><span>${c.features.length} modules • Open demo</span></button>`).join('')}</div><div id="industryWorkspace"></div>`;
      panel.querySelectorAll('[data-demo-category]').forEach(b=>b.onclick=()=>openCategory(cats[+b.dataset.demoCategory]));
      const test=document.getElementById('featureTest'); if(test)test.onclick=()=>alert(`Universal Demo Feature Test\n\nBusiness categories: ${cats.length}\nTotal category modules: ${cats.reduce((n,c)=>n+c.features.length,0)}\n\nSelect any category above to explore its modules.`);
    }
    const tab=document.getElementById('industryTab');
    if(tab){tab.textContent='All Business Categories';tab.style.display='';}
    renderDemoDashboardCards(cats);
  }
  function openCategory(category){
    const box=document.getElementById('industryWorkspace'); if(!box)return;
    box.innerHTML=`<div class="panel-head"><div><p class="eyebrow">DEMO CATEGORY</p><h2>${esc(category.label)}</h2><p class="muted">All ${category.features.length} modules for this business type.</p></div><button class="secondary" type="button" id="closeWorkspace">Back to Categories</button></div><div class="quick-grid">${category.features.map((x,i)=>`<button type="button" class="industry-feature" data-demo-feature="${i}"><b>✓ ${esc(x)}</b><span>Open demo workspace</span></button>`).join('')}</div><div id="demoFeatureWorkspace"></div>`;
    document.getElementById('closeWorkspace').onclick=()=>renderUniversalDemo();
    box.querySelectorAll('[data-demo-feature]').forEach(b=>b.onclick=()=>openFeature(category.features[+b.dataset.demoFeature],category.label));
    box.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function openFeature(name,categoryLabel){
    const box=document.getElementById('demoFeatureWorkspace')||document.getElementById('industryWorkspace'); if(!box)return;
    box.innerHTML=`<div class="panel" style="margin-top:16px"><div class="panel-head"><div><p class="eyebrow">DEMO WORKSPACE</p><h2>${esc(name)}</h2><p class="muted">${esc(categoryLabel||'Business')} — interface preview only. Sample records are not connected to real accounts or payments.</p></div><button class="secondary" type="button" id="closeDemoFeature">Close</button></div><div class="quick-grid"><div class="industry-feature"><b>✓ ${esc(name)}</b><span>Demo form / workflow preview</span></div><div class="industry-feature"><b>✓ Sample data</b><span>Safe demo-only workspace</span></div><div class="industry-feature"><b>✓ No real account changes</b><span>Nothing is registered or billed</span></div></div></div>`;
    document.getElementById('closeDemoFeature').onclick=()=>openCategory(categories().find(c=>c.label===categoryLabel)||categories()[0]);
    box.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function renderDemoDashboardCards(cats){
    const d=document.getElementById('dashboard'); if(!d)return;
    let box=document.getElementById('demoUniversalCategoryCards');
    if(!box){box=document.createElement('section');box.id='demoUniversalCategoryCards';box.className='panel tab-panel';d.parentNode?.insertBefore(box,d.nextSibling)}
    box.innerHTML=`<div class="panel-head"><div><p class="eyebrow">DEMO SHOWCASE</p><h2>All Business Categories</h2><p class="muted">Choose any category to preview its complete user interface and business modules.</p></div></div><div class="quick-grid">${cats.map((c,i)=>`<button type="button" class="industry-feature" data-demo-dash-category="${i}"><b>✓ ${esc(c.label)}</b><span>${c.features.length} modules available</span></button>`).join('')}</div>`;
    box.querySelectorAll('[data-demo-dash-category]').forEach(b=>b.onclick=()=>{const c=cats[+b.dataset.demoDashCategory];window.showTab?.('industryModule');setTimeout(()=>openCategory(c),50)});
  }
  function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
  function hook(){
    const original=window.startDemo;
    if(typeof original==='function'&&!original.__universalDemo){
      const wrapped=function(){
        original();
        window.nrBizProDemoMode=true;
        setTimeout(()=>{api()?.sync?.();setTimeout(renderUniversalDemo,100)},150);
      };
      wrapped.__universalDemo=true;
      window.startDemo=wrapped;
    }
    renderUniversalDemo();
  }
  window.addEventListener('load',()=>setTimeout(hook,150));
  setInterval(hook,700);
})();
