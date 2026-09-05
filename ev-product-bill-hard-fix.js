// NR BizPro — EV product persistence + billing search hard fix
(function(){
  const isEV=()=>{try{return /ev two|electric two|ev 2|ev scooter|ev bike/i.test(String(currentUser?.category||state?.settings?.category||''))}catch(e){return false}};
  const moneyX=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
  const escX=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function saveState(){try{if(typeof save==='function')save();else if(typeof currentUser!=='undefined'&&currentUser&&typeof state!=='undefined')localStorage.setItem('nr-bizpro-data-v2:'+currentUser.id,JSON.stringify(state));}catch(e){console.error(e)}}
  function render(){try{if(typeof renderItems==='function')renderItems();if(typeof updateStats==='function')updateStats()}catch(e){console.error(e)}}
  function openEVProductHard(){
    openModal('Add EV / Two-Wheeler Product',`<div class="modal-grid">
      <label class="field">Product Type<select id="hfType"><option>Vehicle</option><option>Raw Product</option><option>Helmet</option><option>Battery</option><option>Accessory</option><option>Spare Part</option><option>Service</option><option>Other</option></select></label>
      <label class="field">Brand<input id="hfBrand"></label>
      <label class="field">Product / Model<input id="hfName" required placeholder="Vehicle / Helmet / Battery"></label>
      <label class="field">Variant<input id="hfVariant"></label>
      <label class="field">Colour<input id="hfColor"></label>
      <label class="field">Battery Type / Capacity<input id="hfBattery"></label>
      <label class="field">Motor Power<input id="hfMotor"></label>
      <label class="field">Speed<input id="hfSpeed" placeholder="45 km/h"></label>
      <label class="field">Range<input id="hfRange" placeholder="90 km"></label>
      <label class="field">Motor / Engine No<input id="hfEngine"></label>
      <label class="field">Chassis No<input id="hfChassis"></label>
      <label class="field">Battery No<input id="hfBatteryNo"></label>
      <label class="field">Barcode / SKU<input id="hfBarcode"></label>
      <label class="field">Cost Price<input id="hfCost" type="number" min="0" value="0"></label>
      <label class="field">Selling Price<input id="hfSell" type="number" min="0" value="0"></label>
      <label class="field">GST %<input id="hfGst" type="number" min="0" value="0"></label>
      <label class="field">Opening Stock<input id="hfStock" type="number" min="0" value="0"></label>
      <label class="field">Warranty / Notes<textarea id="hfNotes"></textarea></label>
    </div><div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" id="hfSave">Save Product</button></div>`);
    document.getElementById('hfSave').onclick=function(){
      const name=document.getElementById('hfName').value.trim();if(!name){alert('Enter product / model name');return}
      state.items=Array.isArray(state.items)?state.items:[];const barcode=document.getElementById('hfBarcode').value.trim();
      if(barcode&&state.items.some(i=>String(i.barcode||'').toLowerCase()===barcode.toLowerCase())){alert('Barcode already exists');return}
      const item={id:crypto.randomUUID(),name,barcode,type:document.getElementById('hfType').value,cost:+document.getElementById('hfCost').value||0,sell:+document.getElementById('hfSell').value||0,gst:+document.getElementById('hfGst').value||0,stock:+document.getElementById('hfStock').value||0,brand:document.getElementById('hfBrand').value.trim(),variant:document.getElementById('hfVariant').value.trim(),color:document.getElementById('hfColor').value.trim(),batteryCapacity:document.getElementById('hfBattery').value.trim(),motorPower:document.getElementById('hfMotor').value.trim(),speed:document.getElementById('hfSpeed').value.trim(),range:document.getElementById('hfRange').value.trim(),engineNo:document.getElementById('hfEngine').value.trim(),chassisNo:document.getElementById('hfChassis').value.trim(),batteryNo:document.getElementById('hfBatteryNo').value.trim(),notes:document.getElementById('hfNotes').value.trim(),industry:'EV-TWO-WHEELER',businessCategory:'EV-TWO-WHEELER'};
      state.items.push(item);state.moduleData=state.moduleData||{};state.moduleData['Product / Vehicle Records']=state.moduleData['Product / Vehicle Records']||[];state.moduleData['Product / Vehicle Records'].push(item);saveState();closeModal();render();alert('Product saved successfully');
    };
    document.getElementById('hfName').focus();
  }
  function patchBillSearch(){
    const input=document.getElementById('evSearch')||document.getElementById('bSearch');if(!input||input.__hardSearch)return;input.__hardSearch=true;
    input.addEventListener('input',function(){
      const q=this.value.trim().toLowerCase(),box=document.getElementById('evSuggestions')||document.getElementById('billSuggestions');if(!box)return;
      if(!q){box.innerHTML='';return}
      const items=(state?.items||[]).filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase()===q||String(i.brand||'').toLowerCase().includes(q)||String(i.type||'').toLowerCase().includes(q)).slice(0,15);
      box.innerHTML=items.map(i=>`<button type="button" class="suggestion" data-hard-add="${i.id}"><b>${escX(i.name)}</b><span>${escX(i.type||'Product')} • ${moneyX(i.sell)} • Stock ${Number(i.stock)||0}</span></button>`).join('')||'<div class="empty">No product found</div>';
      box.querySelectorAll('[data-hard-add]').forEach(b=>b.onclick=function(){const id=this.dataset.hardAdd;window.billCart=window.billCart||[];const l=window.billCart.find(x=>x.id===id);if(l)l.qty++;else window.billCart.push({id,qty:1});this.parentElement.innerHTML='';if(typeof window.renderCart==='function')window.renderCart();if(typeof input.__evRender==='function')input.__evRender();input.value='';input.focus()});
    });
  }
  function install(){if(!isEV())return;window.openItemModal=openEVProductHard;patchBillSearch();setTimeout(patchBillSearch,300);setTimeout(patchBillSearch,1000)}
  window.addEventListener('load',()=>{setTimeout(install,500);setInterval(()=>{if(isEV()){if(window.openItemModal!==openEVProductHard)window.openItemModal=openEVProductHard;patchBillSearch()}},2000)});
})();
