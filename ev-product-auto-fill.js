// NR BizPro — EV showroom: selecting a product automatically fills its stored particulars.
(function(){
  const escA=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;','\\':'&#39;'}[m]));
  const val=(id)=>document.getElementById(id);
  let lastSelected=null;
  function isEvBill(){return !!document.getElementById('evGenerate')&&!!document.getElementById('evSearch')}
  function getItem(id){return window.state?.items?.find(i=>String(i.id)===String(id))}
  function ensureExtraFields(){
    if(!isEvBill()||document.getElementById('evAutoParticulars'))return;
    const anchor=val('evEngine')?.closest('.field'); if(!anchor)return;
    const wrap=document.createElement('div');wrap.id='evAutoParticulars';wrap.className='modal-grid';
    wrap.innerHTML='<label class="field">Battery Type / Capacity<input id="evBatteryType"></label><label class="field">Motor Power<input id="evMotorPower"></label><label class="field">Vehicle Range<input id="evRange"></label><label class="field">Top Speed<input id="evTopSpeed"></label><label class="field">Product / Serial No.<input id="evProductSerial"></label>';
    anchor.parentNode.parentNode.insertBefore(wrap,anchor.parentNode.nextSibling);
    const note=document.createElement('div');note.id='evAutoFillNote';note.className='notice';note.style.margin='10px 0';note.textContent='Select a vehicle/product to auto-fill its stored particulars.';wrap.parentNode.insertBefore(note,wrap);
  }
  function fill(item){
    if(!item||!isEvBill())return;
    lastSelected=item;
    const type=String(item.type||'').toLowerCase();
    if(val('evBrand'))val('evBrand').value=item.brand||'';
    if(val('evVehicle'))val('evVehicle').value=item.name||'';
    if(val('evVariant'))val('evVariant').value=item.variant||'';
    if(val('evColour'))val('evColour').value=item.color||item.colour||'';
    if(val('evBatteryType'))val('evBatteryType').value=item.batteryCapacity||item.battery||'';
    if(val('evMotorPower'))val('evMotorPower').value=item.motorPower||'';
    if(val('evRange'))val('evRange').value=item.range||'';
    if(val('evTopSpeed'))val('evTopSpeed').value=item.topSpeed||item.speed||'';
    if(val('evProductSerial'))val('evProductSerial').value=item.serial||'';
    if(val('evBatteryNo')&&!val('evBatteryNo').value)val('evBatteryNo').value=item.serial||'';
    if(val('evAutoFillNote'))val('evAutoFillNote').innerHTML='<b>Auto-filled:</b> '+escA(item.name)+' — '+escA(item.brand||'')+' '+escA(item.variant||'')+' '+escA(item.color||'');
  }
  function watchModal(){ensureExtraFields();}
  const observer=new MutationObserver(()=>{watchModal()});
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-add]');
    if(btn){const item=getItem(btn.dataset.add);setTimeout(()=>fill(item),0)}
    if(e.target.closest?.('#evGenerate')&&isEvBill()){
      const snapshot={batteryType:val('evBatteryType')?.value||'',motorPower:val('evMotorPower')?.value||'',range:val('evRange')?.value||'',topSpeed:val('evTopSpeed')?.value||'',productSerial:val('evProductSerial')?.value||''};
      setTimeout(()=>{
        const bills=window.state?.bills||[];const b=bills[0];
        if(b&&snapshot&&(snapshot.batteryType||snapshot.motorPower||snapshot.range||snapshot.topSpeed||snapshot.productSerial)){
          b.vehicle=b.vehicle||{};Object.assign(b.vehicle,{batteryType:snapshot.batteryType,motorPower:snapshot.motorPower,range:snapshot.range,topSpeed:snapshot.topSpeed,productSerial:snapshot.productSerial});
          if(typeof window.save==='function')window.save();
        }
      },150);
    }
  },true);
  window.addEventListener('load',()=>setTimeout(ensureExtraFields,500));
})();
