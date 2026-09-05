// NR BizPro — universal product visibility/search + EV serial edit fix
(function(){
  const norm=s=>String(s||'').toLowerCase().trim();
  const category=()=>norm((window.currentUser&& (currentUser.category||currentUser.businessCategory)) || (window.state&&state.settings&&state.settings.category) || '').replace(/\s+/g,' ');
  function catKey(){const c=category(); if(/paint/.test(c))return 'paint'; if(/plumb|pipe/.test(c))return 'plumbing'; if(/paint.*plumb|plumb.*paint/.test(c))return 'paint-plumbing'; if(/ev|electric/.test(c))return 'ev'; if(/foot|shoe|chappal|slipper/.test(c))return 'footwear'; if(/fertil|agri/.test(c))return 'fertilizer'; if(/garage|service center/.test(c))return 'garage'; if(/spare/.test(c))return 'spareparts'; if(/retail|grocery|supermarket|general store/.test(c))return 'retail'; return 'general';}
  function belongs(i){
    const k=catKey(), raw=norm(i.businessCategory||i.businessType||i.industry);
    if(!raw)return true;
    if(k==='paint-plumbing')return /paint|plumb|pipe/.test(raw);
    if(k==='paint')return /paint/.test(raw);
    if(k==='plumbing')return /plumb|pipe/.test(raw);
    if(k==='ev')return /ev|electric/.test(raw);
    if(k==='footwear')return /foot|shoe|chappal|slipper/.test(raw);
    if(k==='fertilizer')return /fertil|agri/.test(raw);
    if(k==='garage')return /garage|service|spare/.test(raw);
    if(k==='spareparts')return /spare/.test(raw);
    if(k==='retail')return /retail|grocery|supermarket|general/.test(raw);
    return true;
  }
  const visible=()=> (window.state&&state.items||[]).filter(belongs);

  // Paint / Plumbing categories were previously saved as "general" by the older product module,
  // which made the product disappear immediately after saving. Give these categories a reliable saver.
  function openUniversalPaintProduct(){
    if(typeof openModal!=='function')return;
    openModal('Add Product / Service',`<div class="modal-grid">
      <label class="field">Product Name<input id="fixName" placeholder="Paint / Primer / Putty / Pipe"></label>
      <label class="field">Product Code / Barcode<input id="fixBarcode" placeholder="Barcode / SKU"></label>
      <label class="field">Type<select id="fixType"><option>Product</option><option>Raw Product</option><option>Service</option></select></label>
      <label class="field">Brand<input id="fixBrand" placeholder="Brand"></label>
      <label class="field">Unit<input id="fixUnit" placeholder="Piece / Litre / Kg / Box"></label>
      <label class="field">Cost Price<input id="fixCost" type="number" min="0" step="0.01" value="0"></label>
      <label class="field">Selling Price<input id="fixSell" type="number" min="0" step="0.01" value="0"></label>
      <label class="field">GST %<input id="fixGst" type="number" min="0" step="0.01" value="0"></label>
      <label class="field">Opening Stock<input id="fixStock" type="number" min="0" step="1" value="0"></label>
      <label class="field wide">Notes<input id="fixNotes" placeholder="Shade / size / specification"></label>
    </div><div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" id="fixSaveProduct">Save Product</button></div>`);
    document.getElementById('fixSaveProduct').onclick=function(){
      const name=document.getElementById('fixName').value.trim(); if(!name)return alert('Enter product name');
      const barcode=document.getElementById('fixBarcode').value.trim();
      if(barcode&&state.items.some(x=>norm(x.barcode)===norm(barcode)))return alert('Barcode already exists');
      const key=catKey();
      const item={id:crypto.randomUUID(),name,barcode,type:document.getElementById('fixType').value,cost:+document.getElementById('fixCost').value||0,sell:+document.getElementById('fixSell').value||0,gst:+document.getElementById('fixGst').value||0,stock:+document.getElementById('fixStock').value||0,businessCategory:key==='paint-plumbing'?'paint':key,details:{Brand:document.getElementById('fixBrand').value.trim(),Unit:document.getElementById('fixUnit').value.trim(),Notes:document.getElementById('fixNotes').value.trim()}};
      state.items=state.items||[]; state.items.push(item); save(); closeModal(); if(typeof renderItems==='function')renderItems(); if(typeof updateStats==='function')updateStats();
    };
    document.getElementById('fixName').focus();
  }

  const originalOpenItem=window.openItemModal;
  window.openItemModal=function(){
    const k=catKey();
    if(k==='paint'||k==='plumbing'||k==='paint-plumbing')return openUniversalPaintProduct();
    return originalOpenItem&&originalOpenItem.apply(this,arguments);
  };

  // Always render the actual stock count and expose an Edit button for product master records.
  const originalRenderItems=window.renderItems;
  window.renderItems=function(){
    if(!document.getElementById('itemTable'))return originalRenderItems&&originalRenderItems();
    const tb=document.getElementById('itemTable'),items=visible();
    if(!items.length){tb.innerHTML='<tr><td colspan="8" class="empty">No products for this business yet.</td></tr>';return;}
    tb.innerHTML=items.map(i=>`<tr><td><b>${esc(i.name)}</b></td><td>${esc(i.barcode||'—')}</td><td>${esc(i.type||'Product')}</td><td>${money(i.cost)}</td><td><b>${money(i.sell)}</b></td><td>${Number(i.gst||0)}%</td><td><b>${Number(i.stock||0)}</b></td><td><button class="secondary" onclick="window.editProductMaster('${i.id}')">Edit</button> <button class="secondary" onclick="deleteItem('${i.id}')">Delete</button></td></tr>`).join('');
  };
  window.editProductMaster=function(id){
    const i=(state.items||[]).find(x=>x.id===id);if(!i)return;
    const d=i.details||{};
    openModal('Edit Product / Stock',`<div class="modal-grid"><label class="field">Product Name<input id="epName" value="${esc(i.name)}"></label><label class="field">Barcode / SKU<input id="epBarcode" value="${esc(i.barcode||'')}"></label><label class="field">Cost Price<input id="epCost" type="number" min="0" step="0.01" value="${Number(i.cost||0)}"></label><label class="field">Selling Price<input id="epSell" type="number" min="0" step="0.01" value="${Number(i.sell||0)}"></label><label class="field">GST %<input id="epGst" type="number" min="0" step="0.01" value="${Number(i.gst||0)}"></label><label class="field">Stock<input id="epStock" type="number" min="0" step="1" value="${Number(i.stock||0)}"></label>${catKey()==='ev'?'<label class="field">Product / Serial No<input id="epSerial" value="'+esc(d['Product / Serial No']||d['Serial Number']||'')+'"></label>':''}</div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="epSave">Save Changes</button></div>`);
    document.getElementById('epSave').onclick=function(){
      const b=document.getElementById('epBarcode').value.trim();if(b&&b!==i.barcode&&(state.items||[]).some(x=>x.id!==id&&norm(x.barcode)===norm(b)))return alert('Barcode already exists');
      i.name=document.getElementById('epName').value.trim()||i.name;i.barcode=b;i.cost=+document.getElementById('epCost').value||0;i.sell=+document.getElementById('epSell').value||0;i.gst=+document.getElementById('epGst').value||0;i.stock=Math.max(0,+document.getElementById('epStock').value||0);if(document.getElementById('epSerial')){i.details=i.details||{};i.details['Product / Serial No']=document.getElementById('epSerial').value.trim();}save();closeModal();renderItems();updateStats();
    };
  };

  // Product search: name, barcode, SKU, brand, model and serial-related details.
  window.searchBillProducts=function(){
    const input=document.getElementById('bSearch'),box=document.getElementById('billSuggestions');if(!input||!box)return;
    const q=norm(input.value);if(!q){box.innerHTML='';return;}
    const found=visible().filter(i=>{const d=i.details||{};const hay=[i.name,i.barcode,i.type,i.businessCategory,...Object.values(d)].map(norm).join(' ');return hay.includes(q)}).slice(0,12);
    box.innerHTML=found.map(i=>`<button type="button" class="suggestion" onclick="addToCart('${i.id}')"><b>${esc(i.name)}</b><span>${esc(i.barcode||'No barcode')} • ${money(i.sell)} • Stock ${Number(i.stock||0)}</span></button>`).join('')||'<div class="empty">No product found</div>';
  };

  // Add a vehicle's changing serial/product number at sale time; it is bill-specific, not a master-product value.
  const originalOpenBill=window.openBillModal;
  window.openBillModal=function(){
    const r=originalOpenBill&&originalOpenBill.apply(this,arguments);
    if(catKey()==='ev'){
      const search=document.getElementById('bSearch'); if(search&&!document.getElementById('evSaleDetails')){
        const box=document.createElement('div');box.id='evSaleDetails';box.className='modal-grid';box.innerHTML='<label class="field">Product / Serial No<input id="saleSerial" placeholder="Enter this vehicle serial / product number"></label><label class="field">Colour<input id="saleColour" placeholder="Vehicle colour"></label><label class="field">Battery No<input id="saleBattery" placeholder="Battery number"></label><label class="field">Chassis No<input id="saleChassis" placeholder="Chassis number"></label><label class="field">Motor / Engine No<input id="saleMotor" placeholder="Motor / Engine number"></label><label class="field">Top Speed<input id="saleSpeed" placeholder="45 km/h"></label>';
        search.parentNode.insertBefore(box,document.getElementById('billSuggestions'));
      }
    }
    return r;
  };

  const originalSaveBill=window.saveBill;
  window.saveBill=function(){
    const before=(state&&state.bills&&state.bills.length)||0;
    const r=originalSaveBill&&originalSaveBill.apply(this,arguments);
    if(catKey()==='ev'&&state&&state.bills&&state.bills.length>before){const b=state.bills[0];b.vehicleDetails={productSerial:document.getElementById('saleSerial')?.value?.trim()||'',colour:document.getElementById('saleColour')?.value?.trim()||'',batteryNo:document.getElementById('saleBattery')?.value?.trim()||'',chassisNo:document.getElementById('saleChassis')?.value?.trim()||'',motorNo:document.getElementById('saleMotor')?.value?.trim()||'',topSpeed:document.getElementById('saleSpeed')?.value?.trim()||''};save();}
    return r;
  };

  const originalOpenEdit=window.openEditBill;
  window.openEditBill=function(id){
    const r=originalOpenEdit&&originalOpenEdit.apply(this,arguments); if(catKey()==='ev'){
      const b=(state.bills||[]).find(x=>x.id===id),v=b&&b.vehicleDetails||{};if(b&&document.getElementById('editCustomer')){
        const host=document.getElementById('editCustomer').closest('.modal-card')?.querySelector('#modalBody');
        if(host&&!document.getElementById('editVehicleDetails')){const box=document.createElement('div');box.id='editVehicleDetails';box.className='modal-grid';box.innerHTML='<label class="field">Product / Serial No<input id="editSerial" value="'+esc(v.productSerial||'')+'"></label><label class="field">Colour<input id="editColour" value="'+esc(v.colour||'')+'"></label><label class="field">Battery No<input id="editBattery" value="'+esc(v.batteryNo||'')+'"></label><label class="field">Chassis No<input id="editChassis" value="'+esc(v.chassisNo||'')+'"></label><label class="field">Motor / Engine No<input id="editMotor" value="'+esc(v.motorNo||'')+'"></label><label class="field">Top Speed<input id="editSpeed" value="'+esc(v.topSpeed||'')+'"></label>';host.appendChild(box);}
      }
    }return r;
  };
  const originalSaveEdited=window.saveEditedBill;
  window.saveEditedBill=function(id){const r=originalSaveEdited&&originalSaveEdited.apply(this,arguments);if(catKey()==='ev'){const b=(state.bills||[]).find(x=>x.id===id);if(b){b.vehicleDetails={productSerial:document.getElementById('editSerial')?.value?.trim()||'',colour:document.getElementById('editColour')?.value?.trim()||'',batteryNo:document.getElementById('editBattery')?.value?.trim()||'',chassisNo:document.getElementById('editChassis')?.value?.trim()||'',motorNo:document.getElementById('editMotor')?.value?.trim()||'',topSpeed:document.getElementById('editSpeed')?.value?.trim()||''};save();}}return r;};

  const originalRender=window.renderItems; window.addEventListener('load',()=>{if(typeof window.renderItems==='function')window.renderItems();});
})();