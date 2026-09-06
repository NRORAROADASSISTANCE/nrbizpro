// NR BizPro — Universal Add Product fields + hardened Save Product
(function(){
 const MAP={
  'grocery':['Add Grocery Product',[['Product Name','text'],['Barcode','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Reorder Level','number']]],
  'footwear':['Add Footwear Product',[['Brand','text'],['Product Name','text'],['Size / Variant','text'],['Colour','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'fertilizer':['Add Agriculture Product',[['Product Name','text'],['Brand','text'],['Batch / Lot No','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Expiry Date','date']]],
  'garage':['Add Garage Item / Service',[['Item / Service','text'],['Vehicle Compatibility','text'],['Part Number','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'spareparts':['Add Spare Part',[['Part Name','text'],['Part Number / SKU','text'],['Vehicle Compatibility','text'],['Brand','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'evtwo':['Add EV / Two-Wheeler Product',[['Product Type','select:Vehicle|Raw Product|Helmet|Battery|Accessory|Spare Part|Service|Other'],['Brand','text'],['Model','text'],['Variant','text'],['Battery Type & Capacity','text'],['Motor Power','text'],['Speed','text'],['Range','text'],['Colour','text'],['Motor / Engine No','text'],['Chassis No','text'],['Battery No','text'],['Ex-showroom Price','number'],['On-road Price','number'],['Barcode / SKU','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Warranty','text']]],
  'retail':['Add Retail Product',[['Product Name','text'],['Barcode','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Reorder Level','number']]],
  'restaurant':['Add Menu / Product',[['Item Name','text'],['Item Type','select:Menu Item|Raw Material|Bakery Item|Service'],['Unit','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'hardware':['Add Hardware Product',[['Item Name','text'],['SKU / Barcode','text'],['Unit','text'],['Brand','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'medical':['Add Medicine',[['Medicine Name','text'],['Batch No','text'],['Expiry Date','date'],['Barcode','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'electronics':['Add Electronics Product',[['Brand','text'],['Model','text'],['Serial Number','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Warranty','text']]],
  'clothing':['Add Clothing Product',[['Brand','text'],['Product Name','text'],['Size / Variant','text'],['Colour','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'furniture':['Add Furniture Product',[['Product Name','text'],['Material','text'],['Dimensions','text'],['Barcode / SKU','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'jewellery':['Add Jewellery Item',[['Item Name','text'],['Purity','text'],['Weight','text'],['Making Charges','number'],['Barcode / SKU','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'stationery':['Add Book / Stationery Item',[['Book / Item Name','text'],['Barcode','text'],['Author / Publisher','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'dairy':['Add Dairy Product',[['Product Name','text'],['Unit','text'],['Batch / Lot No','text'],['Expiry Date','date'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'salon':['Add Service / Product',[['Service / Product Name','text'],['Type','select:Service|Product|Package'],['Duration','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'printing':['Add Printing Service',[['Service Name','text'],['Unit','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number']]],
  'wholesale':['Add Wholesale Product',[['Product Name','text'],['SKU / Barcode','text'],['Unit','text'],['Wholesale Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Reorder Level','number']]],
  'professional':['Add Professional Service',[['Service Name','text'],['Service Type','text'],['Cost / Expense','number'],['Fee / Selling Price','number'],['GST %','number']]],
  'construction':['Add Construction Material',[['Material Name','text'],['Unit','text'],['Brand','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'paint':['Add Paint Product',[['Brand','text'],['Product Name','text'],['Color / Shade','text'],['Pack Size','text'],['Barcode / SKU','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'plumbing':['Add Plumbing Product',[['Brand','text'],['Product Name','text'],['Pipe Type','text'],['Size','text'],['Length / Pack','text'],['Class / Pressure','text'],['Unit','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'paintplumbing':['Add Paint / Plumbing Product',[['Product Type','select:Paint|Plumbing|Accessory|Other'],['Brand','text'],['Product Name','text'],['Shade / Pipe Type','text'],['Size / Pack','text'],['Unit','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  'general':['Add Product / Service',[['Product / Service','text'],['Barcode','text'],['Type','select:Product|Raw Product|Service'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]]
 };
 function categoryKey(){
  let c='';
  try{if(typeof currentUser!=='undefined'&&currentUser)c=currentUser.category||currentUser.businessCategory||'';}catch(e){}
  try{if(!c&&typeof state!=='undefined'&&state)c=state.settings?.category||state.settings?.businessCategory||'';}catch(e){}
  if(!c)c=document.getElementById('businessCategory')?.value||'General Business';
  c=String(c).trim().toLowerCase();
  if(c.includes('paint shop + plumbing'))return'paintplumbing';
  if(c.includes('paint'))return'paint';
  if(c.includes('plumb'))return'plumbing';
  if(c.includes('ev')||c.includes('electric'))return'evtwo';
  if(c.includes('footwear')||c.includes('shoe')||c.includes('chappal'))return'footwear';
  if(c.includes('fertil')||c.includes('agri'))return'fertilizer';
  if(c.includes('spare'))return'spareparts';
  if(c.includes('garage')||c.includes('service center'))return'garage';
  if(c.includes('grocery')||c.includes('general store'))return'grocery';
  if(c.includes('retail')||c.includes('supermarket'))return'retail';
  if(c.includes('restaurant')||c.includes('bakery'))return'restaurant';
  if(c.includes('hardware')||c.includes('building')||c.includes('construction'))return'hardware';
  if(c.includes('medical')||c.includes('pharmacy'))return'medical';
  if(c.includes('electronics')||c.includes('mobile'))return'electronics';
  if(c.includes('clothing')||c.includes('fashion'))return'clothing';
  if(c.includes('furniture'))return'furniture';
  if(c.includes('jewel'))return'jewellery';
  if(c.includes('stationery')||c.includes('book'))return'stationery';
  if(c.includes('dairy')||c.includes('milk'))return'dairy';
  if(c.includes('salon')||c.includes('beauty'))return'salon';
  if(c.includes('printing')||c.includes('xerox')||c.includes('online services'))return'printing';
  if(c.includes('wholesale')||c.includes('distributor'))return'wholesale';
  if(c.includes('professional'))return'professional';
  return'general';
 }
 function getState(){try{if(typeof state!=='undefined'&&state)return state}catch(e){}return window.state||null}
 function cfg(){const k=categoryKey();return [k,...(MAP[k]||MAP.general)]}
 function open(){
  const [key,title,fields]=cfg();
  const html='<div class="modal-grid">'+fields.map((f,i)=>{const p=f[1].split(':');if(p[0]==='select')return '<label class="field">'+f[0]+'<select id="ucm'+i+'">'+p[1].split('|').map(x=>'<option>'+x+'</option>').join('')+'</select></label>';return '<label class="field">'+f[0]+'<input id="ucm'+i+'" type="'+f[1]+'" '+(f[1]==='number'?'min="0" step="0.01"':'')+'></label>'}).join('')+'</div><div class="modal-actions"><button class="secondary" type="button" id="universalCancelProduct">Cancel</button><button class="primary" type="button" id="universalSaveProduct">Save Product</button></div>';
  if(typeof openModal!=='function'){alert('NR BizPro: product window is not ready. Please refresh once.');return}
  openModal(title,html);
  document.getElementById('ucm0')?.focus();
 }
 function saveProduct(){
  const btn=document.getElementById('universalSaveProduct');
  if(btn){btn.disabled=true;btn.textContent='Saving...'}
  try{
   const [key,title,fields]=cfg();
   const values=fields.map((_,i)=>document.getElementById('ucm'+i)?.value?.trim()||'');
   if(!values[0]){alert('Enter '+fields[0][0]);return}
   const st=getState();
   if(!st){alert('Business data is not ready. Please login again.');return}
   st.items=Array.isArray(st.items)?st.items:[];
   const idx=words=>fields.findIndex(f=>words.some(w=>f[0].toLowerCase().includes(w)));
   const read=words=>{const i=idx(words);return i>=0?values[i]:''};
   const barcode=read(['barcode','sku']);
   if(barcode&&st.items.some(x=>String(x.barcode||'')===barcode)){alert('Barcode / SKU already exists');return}
   const name=read(['product name','product / service','item name','medicine name','book / item','material name','service / product name','service name','model','part name'])||values[0];
   const type=read(['product type','item type','type'])||'Product';
   const uid=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():('item-'+Date.now()+'-'+Math.random().toString(36).slice(2));
   const item={id:uid,name,barcode,type,cost:Number(read(['cost price','purchase price','wholesale price','ex-showroom price','cost / expense']))||0,sell:Number(read(['selling price','on-road price','fee / selling price']))||0,gst:Number(read(['gst']))||0,stock:Number(read(['opening stock']))||0,businessCategory:key,details:Object.fromEntries(fields.map((f,i)=>[f[0],values[i]]))};
   st.items.push(item);
   st.moduleData=st.moduleData||{};
   st.moduleData['Product / Vehicle Records']=st.moduleData['Product / Vehicle Records']||[];
   st.moduleData['Product / Vehicle Records'].push(item.details);
   if(typeof save==='function')save();
   else {const u=(typeof currentUser!=='undefined'&&currentUser)?currentUser:window.currentUser;if(!u?.id)throw Error('User session missing');localStorage.setItem('nr-bizpro-data-v2:'+u.id,JSON.stringify(st));}
   if(typeof closeModal==='function')closeModal();
   if(typeof renderItems==='function')renderItems();
   if(typeof updateStats==='function')updateStats();
  }catch(e){console.error(e);alert('Product save failed: '+(e&&e.message?e.message:'Please try again.'))}
  finally{if(btn){btn.disabled=false;btn.textContent='Save Product'}}
 }
 window.openUniversalProductModal=open;
 window.__nrUniversalProductSave=saveProduct;
 function install(){window.openItemModal=open}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
 window.addEventListener('load',install);
 window.addEventListener('authReady',install);
 window.addEventListener('loginSuccess',install);
 // Delegated click handler: survives modal HTML replacement and prevents other modules from stealing the Save click.
 document.addEventListener('click',function(e){
  const t=e.target&&e.target.closest?e.target.closest('#universalSaveProduct'):null;
  if(t){e.preventDefault();e.stopImmediatePropagation();saveProduct()}
  const c=e.target&&e.target.closest?e.target.closest('#universalCancelProduct'):null;
  if(c){e.preventDefault();e.stopImmediatePropagation();if(typeof closeModal==='function')closeModal()}
 },true);
})();
