// NR BizPro — Stable multi-module selection persistence
(function(){
  'use strict';
  const MODULES=(window.NRBizProModuleSettings&&window.NRBizProModuleSettings.MODULES)||[
    'Grocery / Supermarket','Fruits & Vegetables','Dairy / Milk Center','Bakery / Sweets','General Store','Meat / Chicken / Fish','Water Can / Mineral Water','Wine / Liquor Store','Medical / Pharmacy','Ayurvedic / Herbal Store','Surgical & Medical Equipment','Optical Store','Dental Clinic / Medical Clinic','Pant / Clothing Shop','Readymade Garments','Ladies Wear','Kids Wear','Footwear','Tailoring','Two Wheeler Showroom','Four Wheeler Showroom','EV Showroom','Two Wheeler Service / Garage','Four Wheeler Service / Garage','Auto Spare Parts','Tyre & Battery','Hardware','Plumbing','Electrical','Paint Shop','Sanitary & Bathroom','Building Materials','Furniture','Mobile Shop','Mobile Service / Repair','Computer / Laptop','Electronics Shop','CCTV / Security Systems','Seeds','Fertilizers / Pesticides','Agriculture Equipment','Dairy / Cattle Feed','Wholesale Business','Distributor','Dealer','Restaurant','Hotel / Lodge','Tiffin Center','Fast Food','Cafe / Tea Shop','Catering','Printing Press','Xerox / DTP','Photo Studio','Advertising / Flex Printing','Salon','Beauty Parlour','Spa','Real Estate','Transport / Logistics','Travel Agency','Education / Coaching Centre','Repair / Service Business','Manufacturing','E-commerce / Online Store'
  ];
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  function state(){return window.state||null}
  function getModules(){
    const st=state();
    const a=st?.settings?.modules;
    if(Array.isArray(a)&&a.length)return [...new Set(a)];
    const cat=String(st?.settings?.category||window.currentUser?.category||'').trim();
    return cat&&cat!=='General Business'?[cat]:[];
  }
  function saveState(){if(typeof window.save==='function')window.save();}
  function render(){
    const panel=document.getElementById('settings'),st=state();if(!panel||!st)return;
    const selected=new Set(getModules());
    panel.innerHTML=`<div class="panel-head"><div><p class="eyebrow">BUSINESS SETTINGS</p><h2>Business Modules</h2><p class="muted">Select all modules your business operates. You can select multiple modules and keep them all together.</p></div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-top:16px">${MODULES.map(m=>`<label style="display:flex;gap:10px;align-items:center;padding:12px;border:1px solid #dfe5ef;border-radius:10px;background:#fff;cursor:pointer"><input type="checkbox" class="biz-module-check-stable" value="${esc(m)}" ${selected.has(m)?'checked':''}> <span>${esc(m)}</span></label>`).join('')}</div><div style="margin-top:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="primary" id="saveBusinessModulesStable">Save All Selected Modules</button><span id="moduleSaveStatusStable" class="muted"></span></div>`;
    document.getElementById('saveBusinessModulesStable').onclick=function(){
      const values=[...panel.querySelectorAll('.biz-module-check-stable:checked')].map(x=>x.value);
      if(!values.length)return alert('Select at least one business module.');
      st.settings=st.settings||{};
      st.settings.modules=[...new Set(values)];
      // Keep the first module only as legacy compatibility; never replace modules.
      st.settings.category=st.settings.modules[0];
      if(window.currentUser)window.currentUser.category=st.settings.modules[0];
      saveState();
      document.getElementById('moduleSaveStatusStable').textContent=values.length+' modules saved successfully.';
      if(typeof window.NRBizProRenderAllProducts==='function')window.NRBizProRenderAllProducts();
      if(typeof window.renderItems==='function')window.renderItems();
      if(typeof window.updateStats==='function')window.updateStats();
    };
  }
  function install(){
    if(!state())return;
    window.NRBizProStableModules={getModules,render};
    window.NRBizProModuleSettings=Object.assign(window.NRBizProModuleSettings||{},{MODULES,renderSettings:render,openProductModal:window.openItemModal});
    render();
  }
  window.addEventListener('load',()=>setTimeout(install,3500));
  window.addEventListener('authReady',()=>setTimeout(install,800));
  window.addEventListener('loginSuccess',()=>setTimeout(install,800));
})();
