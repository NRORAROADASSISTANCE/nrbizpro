// NR BizPro — Demo business category switcher
(function(){
  const CATEGORIES=[
    ['General Business','general'],['Grocery / General Store','grocery'],['Footwear / Chappal Shop','footwear'],['Fertilizer / Agriculture','fertilizer'],['Garage / Service Center','garage'],['Spare Parts','spareparts'],['EV Two-Wheeler Showroom','evtwo'],['Retail / Supermarket','retail'],['Restaurant / Bakery','restaurant'],['Hardware / Building Materials','hardware'],['Medical / Pharmacy','medical'],['Electronics / Mobile','electronics'],['Clothing / Fashion','clothing'],['Furniture','furniture'],['Jewellery','jewellery'],['Stationery / Book Store','stationery'],['Dairy / Milk Products','dairy'],['Salon / Beauty Parlour','salon'],['Printing / Xerox / Online Services','printing'],['Wholesale / Distributor','wholesale'],['Professional Services','professional'],['Construction / Building Materials','construction'],['Paint Shop','paint'],['Plumbing Business','plumbing'],['Paint Shop + Plumbing Business','paintplumbing'],['Other Business','general']
  ];
  function isDemo(){return window.nrBizProDemoMode===true && window.currentUser?.plan==='demo' && window.currentUser?.id==='nr-bizpro-demo'}
  function keyFromLabel(v){const x=String(v||'').toLowerCase();const found=CATEGORIES.find(([l,k])=>l.toLowerCase()===x);return found?found[1]:'general'}
  function addSwitcher(){
    if(!isDemo())return;
    const dashboard=document.getElementById('dashboard'); if(!dashboard)return;
    let box=document.getElementById('demoCategorySwitcher');
    if(!box){
      box=document.createElement('section');box.id='demoCategorySwitcher';box.className='panel';
      const first=dashboard.firstElementChild; dashboard.insertBefore(box,first||null);
    }
    const current=window.currentUser?.category||window.state?.settings?.category||'EV Two-Wheeler Showroom';
    const oldSel=document.getElementById('demoBusinessCategory');
    // IMPORTANT: never rebuild the select on every timer tick. Replacing a focused
    // native select causes Chrome to reopen/close it and scroll the page repeatedly.
    if(oldSel && oldSel.value===current && box.dataset.ready==='1') return;
    if(box.dataset.ready==='1' && oldSel){
      oldSel.value=current;
      return;
    }
    box.innerHTML=`<div class="panel-head"><div><p class="eyebrow">DEMO BUSINESS SELECTOR</p><h2>Choose Business Category</h2><p class="muted">Switch categories to preview the correct Products, Billing and business modules. Demo only.</p></div><label style="min-width:280px">Business Category<select id="demoBusinessCategory">${CATEGORIES.map(([label])=>`<option value="${esc(label)}" ${label===current?'selected':''}>${esc(label)}</option>`).join('')}</select></label></div>`;
    const sel=document.getElementById('demoBusinessCategory');
    if(!sel)return;
    box.dataset.ready='1';
    sel.onchange=()=>switchCategory(sel.value);
  }
  function switchCategory(label){
    if(!isDemo())return;
    const k=keyFromLabel(label);
    window.currentUser={...(window.currentUser||{}),category:label,businessCategory:label};
    window.state=window.state||{};window.state.settings=window.state.settings||{};window.state.settings.category=label;
    window.state.settings.businessCategory=label;
    try{localStorage.setItem('nr-bizpro-demo-category',label)}catch(e){}
    try{window.NRBizProBusinessModules?.sync?.()}catch(e){}
    try{window.renderItems?.()}catch(e){}
    try{window.updateStats?.()}catch(e){}
    try{if(window.openBusinessProductModal)window.openItemModal=window.openBusinessProductModal}catch(e){}
    const industry=document.getElementById('industryModule');
    if(industry && window.NRBizProBusinessModules?.render)window.NRBizProBusinessModules.render();
    const cards=document.getElementById('demoUniversalCategoryCards');
    if(cards){const buttons=cards.querySelectorAll('[data-demo-dash-category]');buttons.forEach(b=>b.classList.remove('active'));}
    const settingsSel=document.getElementById('businessCategory');if(settingsSel)settingsSel.value=label;
    const demoSel=document.getElementById('demoBusinessCategory');if(demoSel)demoSel.value=label;
    // No alert: it steals focus and can make the page appear to jump after selection.
  }
  function restore(){
    if(!isDemo())return;
    let saved='';try{saved=localStorage.getItem('nr-bizpro-demo-category')||''}catch(e){}
    if(saved&&CATEGORIES.some(([l])=>l===saved)){window.currentUser={...(window.currentUser||{}),category:saved,businessCategory:saved};window.state=window.state||{};window.state.settings=window.state.settings||{};window.state.settings.category=saved;window.state.settings.businessCategory=saved}
    addSwitcher();
  }
  window.NRBizProDemoCategory={switchCategory,restore,CATEGORIES};
  window.addEventListener('load',()=>setTimeout(restore,300));
  window.addEventListener('authReady',()=>setTimeout(restore,100));
  window.addEventListener('loginSuccess',()=>setTimeout(restore,100));
  // Keep the existing selector stable. This check only repairs the box if some
  // other module removes it; it does not rewrite its DOM while it is focused.
  setInterval(()=>{if(isDemo() && !document.getElementById('demoCategorySwitcher'))addSwitcher()},1000);
  function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
})();
