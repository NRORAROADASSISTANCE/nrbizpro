// NR BizPro — Business-aware Add Product
(function(){
 function categoryKey(){
   let c='';
   try{if(typeof currentUser!=='undefined'&&currentUser)c=currentUser.category||'';}catch(e){}
   try{if(!c&&typeof state!=='undefined'&&state)c=state.settings?.category||'';}catch(e){}
   if(!c)c=document.getElementById('businessCategory')?.value||'';
   c=String(c).toLowerCase();
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
  evtwo:{title:'Add EV / Two-Wheeler Product',save:'Save Product',type:'Vehicle',fields:[['Product Type','select','Vehicle|Helmet|Battery|Accessory|Spare Part|Service|Other'],['Brand','text','Ola / Ather / TVS'],['Model','text','Vehicle model'],['Variant','text','Variant'],['Battery Type & Capacity','text','Lithium-ion / 60V 20Ah'],['Motor Power','text','Motor power'],['Speed','text','45 km/h'],['Range','text','Range in km'],['Colour','text','Vehicle colour'],['Motor / Engine No','text','Motor number'],['Chassis No','text','Chassis number'],['Battery No','text','Battery number'],['Ex-showroom Price','number','0'],['On-road Price','number','0'],['Barcode / SKU','text','Barcode'],['Cost Price','number','0'],['Selling Price','number','0'],['GST %','number','5'],['Opening Stock','number','0'],['Warranty','text','Battery / vehicle warranty']]},
  footwear:{title:'Add Footwear Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Shoe / Chappal'],['Size / Variant','text','Size'],['Colour','text','Colour'],['Barcode','text','Scan barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
  fertilizer:{title:'Add Agriculture Product',save:'Save Product',type:'Product',fields:[['Product Name','text','Fertilizer / Seed'],['Brand','text','Brand'],['Batch / Lot No','text','Batch / Lot'],['Unit','text','Bag / Kg / Litre'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Expiry Date','date','']]},
  garage:{title:'Add Garage Item / Service',save:'Save Item',type:'Product',fields:[['Item / Service','text','Service or spare part'],['Vehicle Compatibility','text','Vehicle / Model'],['Part Number','text','Part number'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
  electronics:{title:'Add Electronics Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Model','text','Model'],['Serial Number','text','Serial number'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Warranty','text','Warranty period']]},
  clothing:{title:'Add Clothing Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Product'],['Size / Variant','text','Size'],['Colour','text','Colour'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
  retail:{title:'Add Retail Product',save:'Save Product',type:'Product',fields:[['Product Name','text','Product'],['Barcode','text','Barcode'],['Unit','text','Piece / Kg / Litre'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Reorder Level','number','0']]},
  general:{title:'Add Product / Service',save:'Save Product',type:'Product',fields:[['Product / Service','text','Product or service'],['Barcode','text','Scan barcode'],['Type','select','Product|Service'],['Cost Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]}
 };
 function getSet(){return sets[categoryKey()]||sets.general}
 function openBusinessProductModal(){
   const s=getSet();
   const html='<div class="modal-grid">'+s.fields.map((f,i)=>{if(f[1]==='select'){const opts=f[2].split('|').map(x=>'<option>'+x+'</option>').join('');return '<label class="field">'+f[0]+'<select id="bm'+i+'">'+opts+'</select></label>'}return '<label class="field">'+f[0]+'<input id="bm'+i+'" type="'+f[1]+'" '+(f[1]==='number'?'min="0" step="0.01"':'')+' placeholder="'+f[2]+'"></label>'}).join('')+'</div><div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" id="businessSaveProduct">'+s.save+'</button></div>';
   openModal(s.title,html);document.getElementById('businessSaveProduct').onclick=()=>saveBusinessProduct(s);document.getElementById('bm0')?.focus();
 }
 function saveBusinessProduct(s){
   const values=s.fields.map((_,i)=>document.getElementById('bm'+i)?.value?.trim()||'');if(!values[0])return alert('Enter '+s.fields[0][0]);state.items=state.items||[];
   const idx=label=>s.fields.findIndex(f=>f[0].toLowerCase().includes(label));const b=idx('barcode')>=0?values[idx('barcode')]:'';if(b&&state.items.some(i=>i.barcode===b))return alert('Barcode already exists');
   const val=(labels)=>{const i=s.fields.findIndex(f=>labels.some(x=>f[0].toLowerCase().includes(x)));return i>=0?values[i]:''};
   const name=val(['model','product name','product / service','item / service'])||values[0];
   const item={id:crypto.randomUUID(),name,barcode:b,type:s.type,cost:Number(val(['cost price','purchase price','ex-showroom price']))||0,sell:Number(val(['selling price','on-road price']))||0,gst:Number(val(['gst']))||0,stock:Number(val(['opening stock']))||0,businessCategory:'evtwo'===categoryKey()?'EV-TWO-WHEELER':categoryKey(),details:Object.fromEntries(s.fields.map((f,i)=>[f[0],values[i]]))};
   state.items.push(item);state.moduleData=state.moduleData||{};state.moduleData['Product / Vehicle Records']=state.moduleData['Product / Vehicle Records']||[];state.moduleData['Product / Vehicle Records'].push(item.details);save();closeModal();renderItems();updateStats();
 }
 window.openBusinessProductModal=openBusinessProductModal;window.__nrProductModuleReady=true;
 function install(){window.openItemModal=openBusinessProductModal}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();window.addEventListener('load',install);
})();