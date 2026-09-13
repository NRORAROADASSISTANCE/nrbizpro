// NR BizPro — Business Settings + module-based product creation
(function(){
  'use strict';
  const MODULES=[
    'Grocery / Supermarket','Fruits & Vegetables','Dairy / Milk Center','Bakery / Sweets','General Store','Meat / Chicken / Fish','Water Can / Mineral Water','Wine / Liquor Store','Medical / Pharmacy','Ayurvedic / Herbal Store','Surgical & Medical Equipment','Optical Store','Dental Clinic / Medical Clinic','Pant / Clothing Shop','Readymade Garments','Ladies Wear','Kids Wear','Footwear','Tailoring','Two Wheeler Showroom','Four Wheeler Showroom','EV Showroom','Two Wheeler Service / Garage','Four Wheeler Service / Garage','Auto Spare Parts','Tyre & Battery','Hardware','Plumbing','Electrical','Paint Shop','Sanitary & Bathroom','Building Materials','Furniture','Mobile Shop','Mobile Service / Repair','Computer / Laptop','Electronics Shop','CCTV / Security Systems','Seeds','Fertilizers / Pesticides','Agriculture Equipment','Dairy / Cattle Feed','Wholesale Business','Distributor','Dealer','Restaurant','Hotel / Lodge','Tiffin Center','Fast Food','Cafe / Tea Shop','Catering','Printing Press','Xerox / DTP','Photo Studio','Advertising / Flex Printing','Salon','Beauty Parlour','Spa','Real Estate','Transport / Logistics','Travel Agency','Education / Coaching Centre','Repair / Service Business','Manufacturing','E-commerce / Online Store'
  ];
  const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#39;'}[m]));
  function getState(){
    if(!window.state)return null;
    window.state.settings=window.state.settings||{};
    return window.state;
  }
  function selectedModules(){
    const st=getState();
    const saved=Array.isArray(st?.settings?.modules)?st.settings.modules:[];
    if(saved.length)return saved;
    const cat=String(window.currentUser?.category||st?.settings?.category||'').trim();
    return cat && cat!=='General Business' ? [cat] : [];
  }
  function saveState(){try{window.save?.()}catch(e){}}
  function renderSettings(){
    const panel=document.getElementById('settings');
    if(!panel||!window.state)return;
    const st=getState(), selected=selectedModules();
    panel.innerHTML=`<div class="panel-head"><div><p class="eyebrow">BUSINESS SETTINGS</p><h2>Business Modules</h2><p class="muted">Select all business modules you operate. Products are assigned to one selected module when added.</p></div></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-top:16px">${MODULES.map((m,i)=>`<label style="display:flex;gap:10px;align-items:center;padding:12px;border:1px solid #dfe5ef;border-radius:10px;background:#fff;cursor:pointer"><input type="checkbox" class="biz-module-check" value="${esc(m)}" ${selected.includes(m)?'checked':''}> <span>${esc(m)}</span></label>`).join('')}</div>
      <div style="margin-top:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="primary" id="saveBusinessModules">Save Business Modules</button><span id="moduleSaveStatus" class="muted"></span></div>`;
    document.getElementById('saveBusinessModules').onclick=()=>{
      const values=[...document.querySelectorAll('.biz-module-check:checked')].map(x=>x.value);
      if(!values.length)return alert('Select at least one business module.');
      st.settings.modules=values;
      st.settings.category=values[0];
      if(window.currentUser)window.currentUser.category=values[0];
      saveState();
      document.getElementById('moduleSaveStatus').textContent='Saved. Product selection is now based on these modules.';
      window.NRBizProBusinessModules?.sync?.();
    };
  }
  function productModules(){
    const list=selectedModules();
    return list.length?list:['General Business'];
  }
  function openProductModal(){
    const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');
    if(!modal||!title||!body)return;
    const mods=productModules();
    title.textContent='Add Product / Service';
    body.innerHTML=`<div class="modal-grid">
      <label class="field wide">Business Module<select id="pmModule">${mods.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('')}</select></label>
      <label class="field">Product / Service<input id="pmName" required placeholder="Engine Oil"></label>
      <label class="field">Barcode<input id="pmBarcode" placeholder="Scan barcode here"></label>
      <label class="field">Type<select id="pmType"><option>Product</option><option>Service</option></select></label>
      <label class="field">Cost Price<input id="pmCost" type="number" min="0" value="0"></label>
      <label class="field">Margin Type<select id="pmMarginType"><option value="percent">Percentage</option><option value="fixed">Fixed Amount</option></select></label>
      <label class="field">Margin<input id="pmMargin" type="number" min="0" value="0"></label>
      <label class="field">GST %<input id="pmGst" type="number" min="0" value="0"></label>
      <label class="field">Opening Stock<input id="pmStock" type="number" min="0" value="0"></label>
      <label class="field wide">Selling Price<input id="pmSell" type="number" min="0" value="0"></label>
    </div><div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" id="pmSave">Save Product</button></div>`;
    const calc=()=>{const c=+document.getElementById('pmCost').value||0,m=+document.getElementById('pmMargin').value||0,t=document.getElementById('pmMarginType').value;document.getElementById('pmSell').value=(c+(t==='percent'?c*m/100:m)).toFixed(2)};
    ['pmCost','pmMargin','pmMarginType'].forEach(id=>document.getElementById(id).addEventListener('input',calc));
    document.getElementById('pmSave').onclick=saveProduct;
    modal.classList.remove('hidden');
    document.getElementById('pmName').focus();
    calc();
  }
  function saveProduct(){
    const st=getState();if(!st)return;
    const name=document.getElementById('pmName').value.trim(),barcode=document.getElementById('pmBarcode').value.trim(),module=document.getElementById('pmModule').value;
    if(!name)return alert('Enter product name');
    if(barcode&&st.items.some(i=>i.barcode===barcode))return alert('Barcode already exists');
    st.items=st.items||[];
    st.items.push({id:crypto.randomUUID(),name,barcode,type:document.getElementById('pmType').value,cost:+document.getElementById('pmCost').value||0,margin:+document.getElementById('pmMargin').value||0,marginType:document.getElementById('pmMarginType').value,sell:+document.getElementById('pmSell').value||0,gst:+document.getElementById('pmGst').value||0,stock:+document.getElementById('pmStock').value||0,businessModule:module,businessCategory:module});
    saveState();
    document.getElementById('modal').classList.add('hidden');
    window.renderItems?.();window.updateStats?.();
  }
  function install(){
    renderSettings();
    window.openItemModal=openProductModal;
  }
  window.NRBizProModuleSettings={MODULES,renderSettings,openProductModal,saveProduct};
  window.addEventListener('load',()=>setTimeout(install,300));
  window.addEventListener('authReady',()=>setTimeout(install,100));
  window.addEventListener('loginSuccess',()=>setTimeout(install,100));
  window.addEventListener('demoStarted',()=>setTimeout(install,250));
  setTimeout(install,1200);
  setTimeout(install,3000);
})();
