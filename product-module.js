// Business-aware Add Product form. EV showroom gets vehicle-specific fields instead of generic billing fields.
(function(){
  function categoryKey(){
    const c=String(window.currentUser?.category||window.state?.settings?.category||document.getElementById('businessCategory')?.value||'').toLowerCase();
    if(/ev two|ev 2|electric two|ev scooter|ev bike/.test(c))return'evtwo';
    if(/foot|chappal|shoe|slipper/.test(c))return'footwear';
    if(/fertil|agri/.test(c))return'fertilizer';
    if(/garage|service center/.test(c))return'garage';
    if(/spare/.test(c))return'spareparts';
    if(/retail|supermarket|grocery|general store/.test(c))return'retail';
    if(/electronics|mobile/.test(c))return'electronics';
    if(/clothing|fashion/.test(c))return'clothing';
    return'general';
  }
  const sets={
    evtwo:{title:'Add EV Two-Wheeler',save:'Save Vehicle',type:'Vehicle',fields:[['Brand','text','Ola / Ather / TVS'],['Model','text','Vehicle model'],['Variant','text','Variant'],['Battery Type & Capacity','text','Lithium-ion / kWh'],['Motor Power','text','Motor power'],['Range','text','Range in km'],['Colour','text','Vehicle colour'],['VIN / Chassis No','text','VIN / Chassis number'],['Ex-showroom Price','number','0'],['On-road Price','number','0'],['GST %','number','5'],['Opening Stock','number','0']]},
    footwear:{title:'Add Footwear Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Shoe / Chappal'],['Size / Variant','text','Size'],['Colour','text','Colour'],['Barcode','text','Scan barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
    fertilizer:{title:'Add Agriculture Product',save:'Save Product',type:'Product',fields:[['Product Name','text','Fertilizer / Seed / Pesticide'],['Brand','text','Brand'],['Batch / Lot No','text','Batch / Lot'],['Unit','text','Bag / Kg / Litre'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Expiry Date','date','']]},
    garage:{title:'Add Garage Item / Service',save:'Save Item',type:'Product',fields:[['Item / Service','text','Service or spare part'],['Vehicle Compatibility','text','Vehicle / Model'],['Part Number','text','Part number'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
    electronics:{title:'Add Electronics Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Model','text','Model'],['Serial Number','text','Serial number'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Warranty','text','Warranty period']]},
    clothing:{title:'Add Clothing Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Product'],['Size / Variant','text','Size'],['Colour','text','Colour'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
    retail:{title:'Add Retail Product',save:'Save Product',type:'Product',fields:[['Product Name','text','Product'],['Barcode','text','Barcode'],['Unit','text','Piece / Kg / Litre'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Reorder Level','number','0']]},
    general:{title:'Add Product / Service',save:'Save Product',type:'Product',fields:[['Product / Service','text','Product or service'],['Barcode','text','Scan barcode'],['Type','text','Product / Service'],['Cost Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]}
  };
  function getSet(){return sets[categoryKey()]||sets.general}
  function value(id){return document.getElementById(id)?.value?.trim()||''}
  function openBusinessProductModal(){
    const s=getSet();
    const html=`<div class="modal-grid">${s.fields.map((f,i)=>`<label class="field">${f[0]}<input id="bm${i}" type="${f[1]}" ${f[1]==='number'?'min="0" step="0.01"':''} placeholder="${f[2]||''}"></label>`).join('')}</div><div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" id="businessSaveProduct">${s.save}</button></div>`;
    openModal(s.title,html);
    document.getElementById('businessSaveProduct').onclick=()=>saveBusinessProduct(s);
    document.getElementById('bm0')?.focus();
  }
  function saveBusinessProduct(s){
    const fs=s.fields, values=fs.map((_,i)=>value('bm'+i));
    if(!values[0])return alert('Enter '+fs[0][0]);
    state.items=state.items||[];
    const codeIndex=fs.findIndex(f=>/barcode|vin|chassis/i.test(f[0]));
    const barcode=codeIndex>=0?values[codeIndex]:'';
    if(barcode&&state.items.some(i=>i.barcode===barcode))return alert('Barcode / VIN already exists');
    const find=(rx)=>fs.findIndex(f=>new RegExp(rx,'i').test(f[0]));
    const ni=find('model|product name|product / service|item / service');
    const ci=find('cost price|purchase price|ex-showroom price');
    const si=find('selling price|on-road price');
    const gi=find('gst');
    const sti=find('opening stock');
    const name=(ni>=0?values[ni]:values[0])||values[0];
    const item={id:crypto.randomUUID(),name,barcode,type:s.type,cost:ci>=0?Number(values[ci])||0:0,margin:0,marginType:'fixed',sell:si>=0?(Number(values[si])||0):(ci>=0?Number(values[ci])||0:0),gst:gi>=0?Number(values[gi])||0:0,stock:sti>=0?Number(values[sti])||0:0,businessCategory:categoryKey(),details:Object.fromEntries(fs.map((f,i)=>[f[0],values[i]]))};
    state.items.push(item);
    state.moduleData=state.moduleData||{};
    state.moduleData['Product / Vehicle Records']=state.moduleData['Product / Vehicle Records']||[];
    state.moduleData['Product / Vehicle Records'].push(item.details);
    save();closeModal();renderItems();updateStats();
  }
  function install(){window.openItemModal=openBusinessProductModal}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',install);
})();
