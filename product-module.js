// Business-specific Add Product / Vehicle form.
(function(){
  const moneySafe=n=>typeof money==='function'?money(n):'₹'+(Number(n)||0).toFixed(2);
  function categoryKey(){
    const c=String(window.currentUser?.category||window.state?.settings?.category||'').toLowerCase();
    if(/ev two|ev 2|electric two|ev scooter|ev bike/.test(c)) return 'evtwo';
    if(/foot|chappal|shoe|slipper/.test(c)) return 'footwear';
    if(/grocery|general store/.test(c)) return 'grocery';
    if(/fertil|agri/.test(c)) return 'fertilizer';
    if(/garage|service center/.test(c)) return 'garage';
    if(/spare/.test(c)) return 'spareparts';
    if(/retail|supermarket/.test(c)) return 'retail';
    if(/restaurant|bakery/.test(c)) return 'restaurant';
    if(/hardware|building/.test(c)) return 'hardware';
    if(/medical|pharmacy/.test(c)) return 'medical';
    if(/electronic|mobile/.test(c)) return 'electronics';
    if(/cloth|fashion/.test(c)) return 'clothing';
    if(/furniture/.test(c)) return 'furniture';
    if(/jewell/.test(c)) return 'jewellery';
    if(/stationery|book/.test(c)) return 'stationery';
    if(/dairy|milk/.test(c)) return 'dairy';
    if(/salon|beauty/.test(c)) return 'salon';
    if(/printing|xerox|online service/.test(c)) return 'printing';
    if(/wholesale|distributor/.test(c)) return 'wholesale';
    if(/construction/.test(c)) return 'construction';
    return 'general';
  }
  const sets={
    evtwo:{title:'Add EV Vehicle',type:'Vehicle',fields:[['Brand','text','Ola / Ather / TVS'],['Model','text','Model name'],['Variant','text','Variant'],['Battery Type & Capacity','text','Lithium-ion / kWh'],['Motor Power','text','W / kW'],['Range','text','km'],['Colour','text','Colour'],['VIN / Chassis No','text','Chassis number'],['Ex-showroom Price','number','0'],['On-road Price','number','0'],['GST %','number','5'],['Opening Stock','number','0']]},
    footwear:{title:'Add Footwear Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Shoe / Chappal name'],['Size / Variant','text','Size'],['Colour','text','Colour'],['Barcode','text','Scan barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
    fertilizer:{title:'Add Agriculture Product',type:'Product',fields:[['Product Name','text','Fertilizer / Seed / Pesticide'],['Brand','text','Brand'],['Batch / Lot No','text','Batch / Lot'],['Unit','text','Bag / Kg / Litre'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Expiry Date','date','']]},
    garage:{title:'Add Garage Item / Service',type:'Product',fields:[['Item / Service','text','Service or spare part'],['Vehicle Compatibility','text','Vehicle / Model'],['Part Number','text','Part number'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
    electronics:{title:'Add Electronics Product',type:'Product',fields:[['Brand','text','Brand'],['Model','text','Model'],['Serial Number','text','Serial number'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Warranty','text','Warranty period']]},
    clothing:{title:'Add Clothing Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Product'],['Size / Variant','text','Size'],['Colour','text','Colour'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
    retail:{title:'Add Retail Product',type:'Product',fields:[['Product Name','text','Product'],['Barcode','text','Barcode'],['Unit','text','Piece / Kg / Litre'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Reorder Level','number','0']]},
    general:{title:'Add Product / Service',type:'Product',fields:[['Product / Service','text','Product or service'],['Barcode','text','Scan barcode'],['Type','text','Product / Service'],['Cost Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]}
  };
  function getSet(){return sets[categoryKey()]||sets.general}
  function val(id){return document.getElementById(id)?.value?.trim()||''}
  function openBusinessProductModal(){
    const s=getSet();
    const fs=s.fields;
    const html=`<div class="modal-grid">${fs.map((f,i)=>`<label class="field">${f[0]}<input id="bm${i}" type="${f[1]}" ${f[1]==='number'?'min="0" step="0.01"':''} placeholder="${f[2]||''}"></label>`).join('')}</div><div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" id="businessSaveProduct">Save ${s.type}</button></div>`;
    openModal(s.title,html);
    document.getElementById('businessSaveProduct').onclick=()=>saveBusinessProduct(s);
    document.getElementById('bm0')?.focus();
  }
  function saveBusinessProduct(s){
    const fs=s.fields, values=fs.map((_,i)=>val('bm'+i));
    if(!values[0]) return alert('Enter '+fs[0][0]);
    const k=categoryKey();
    state.items=state.items||[];
    const barcode=values[fs.findIndex(f=>/barcode|vin|chassis/i.test(f[0]))]||'';
    if(barcode && state.items.some(i=>i.barcode===barcode)) return alert('Barcode / VIN already exists');
    const idx=(name)=>fs.findIndex(f=>new RegExp(name,'i').test(f[0]));
    const name=values[idx('model|product name|product / service|item / service')>=0?idx('model|product name|product / service|item / service'):0] || values[0];
    const cost=Number(values[idx('cost price|purchase price|ex-showroom price')])||0;
    const sell=Number(values[idx('selling price|on-road price')])||cost;
    const gst=Number(values[idx('gst')])||0;
    const stock=Number(values[idx('opening stock')])||0;
    const item={id:crypto.randomUUID(),name,barcode,type:s.type,cost,margin:0,marginType:'fixed',sell,gst,stock,businessCategory:k,details:Object.fromEntries(fs.map((f,i)=>[f[0],values[i]]))};
    state.items.push(item);
    state.moduleData=state.moduleData||{};
    state.moduleData['Product / Vehicle Records']=state.moduleData['Product / Vehicle Records']||[];
    state.moduleData['Product / Vehicle Records'].push(item.details);
    save();closeModal();renderItems();updateStats();
  }
  function install(){
    window.openItemModal=openBusinessProductModal;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',install);
})();
