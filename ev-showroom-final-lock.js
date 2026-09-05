// NR BizPro — FINAL LOCK: EV bill product particulars must persist and remain editable per vehicle.
(function(){
  const $=id=>document.getElementById(id);
  const getState=()=>window.state;
  function ev(){return !!$('evGenerate')||!!$('evSearch')}
  function itemFromValue(){
    const q=String($('evSearch')?.value||'').trim().toLowerCase();
    if(!q)return null;
    return (getState()?.items||[]).find(i=>String(i.id||'').toLowerCase()===q)||
      (getState()?.items||[]).find(i=>String(i.name||'').toLowerCase()===q)||
      (getState()?.items||[]).find(i=>String(i.barcode||i.sku||'').toLowerCase()===q);
  }
  function fillFromItem(i){
    if(!i||!ev())return;
    const map={evBrand:i.brand,evVehicle:i.name,evVariant:i.variant,evColour:i.color||i.colour,evBatteryType:i.batteryCapacity||i.battery,evMotorPower:i.motorPower,evRange:i.range,evTopSpeed:i.topSpeed||i.speed};
    Object.entries(map).forEach(([id,v])=>{if($(id)&&v!=null)$(id).value=v});
  }
  function selected(){return itemFromValue()}
  document.addEventListener('change',e=>{if(e.target?.id==='evSearch')setTimeout(()=>fillFromItem(selected()),0)},true);
  document.addEventListener('input',e=>{if(e.target?.id==='evSearch')setTimeout(()=>{const i=selected();if(i)fillFromItem(i)},0)},true);
  // Do not overwrite individual vehicle identifiers with master-product serial data.
  document.addEventListener('focusin',()=>{},true);
  window.addEventListener('load',()=>setTimeout(()=>fillFromItem(selected()),800));
})();
