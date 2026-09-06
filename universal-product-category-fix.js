// NR BizPro — Universal Add Product fields for every business category
(function(){
 const MAP=[
  ['Grocery / General Store','grocery','Add Grocery Product',[['Product Name','text'],['Barcode','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Reorder Level','number']]],
  ['Footwear / Chappal Shop','footwear','Add Footwear Product',[['Brand','text'],['Product Name','text'],['Size / Variant','text'],['Colour','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Fertilizer / Agriculture','fertilizer','Add Agriculture Product',[['Product Name','text'],['Brand','text'],['Batch / Lot No','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Expiry Date','date']]],
  ['Garage / Service Center','garage','Add Garage Item / Service',[['Item / Service','text'],['Vehicle Compatibility','text'],['Part Number','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Spare Parts','spareparts','Add Spare Part',[['Part Name','text'],['Part Number / SKU','text'],['Vehicle Compatibility','text'],['Brand','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['EV Two-Wheeler Showroom','evtwo','Add EV / Two-Wheeler Product',[['Product Type','select:Vehicle|Raw Product|Helmet|Battery|Accessory|Spare Part|Service|Other'],['Brand','text'],['Model','text'],['Variant','text'],['Battery Type & Capacity','text'],['Motor Power','text'],['Speed','text'],['Range','text'],['Colour','text'],['Motor / Engine No','text'],['Chassis No','text'],['Battery No','text'],['Ex-showroom Price','number'],['On-road Price','number'],['Barcode / SKU','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Warranty','text']]],
  ['Retail / Supermarket','retail','Add Retail Product',[['Product Name','text'],['Barcode','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Reorder Level','number']]],
  ['Restaurant / Bakery','restaurant','Add Menu / Product',[['Item Name','text'],['Item Type','select:Menu Item|Raw Material|Bakery Item|Service'],['Unit','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Hardware / Building Materials','hardware','Add Hardware Product',[['Item Name','text'],['SKU / Barcode','text'],['Unit','text'],['Brand','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Medical / Pharmacy','medical','Add Medicine',[['Medicine Name','text'],['Batch No','text'],['Expiry Date','date'],['Barcode','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Electronics / Mobile','electronics','Add Electronics Product',[['Brand','text'],['Model','text'],['Serial Number','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Warranty','text']]],
  ['Clothing / Fashion','clothing','Add Clothing Product',[['Brand','text'],['Product Name','text'],['Size / Variant','text'],['Colour','text'],['Barcode','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Furniture','furniture','Add Furniture Product',[['Product Name','text'],['Material','text'],['Dimensions','text'],['Barcode / SKU','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Jewellery','jewellery','Add Jewellery Item',[['Item Name','text'],['Purity','text'],['Weight','text'],['Making Charges','number'],['Barcode / SKU','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Stationery / Book Store','stationery','Add Book / Stationery Item',[['Book / Item Name','text'],['Barcode','text'],['Author / Publisher','text'],['Unit','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Dairy / Milk Products','dairy','Add Dairy Product',[['Product Name','text'],['Unit','text'],['Batch / Lot No','text'],['Expiry Date','date'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Salon / Beauty Parlour','salon','Add Service / Product',[['Service / Product Name','text'],['Type','select:Service|Product|Package'],['Duration','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Printing / Xerox / Online Services','printing','Add Printing Service',[['Service Name','text'],['Unit','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number']]],
  ['Wholesale / Distributor','wholesale','Add Wholesale Product',[['Product Name','text'],['SKU / Barcode','text'],['Unit','text'],['Wholesale Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number'],['Reorder Level','number']]],
  ['Professional Services','professional','Add Professional Service',[['Service Name','text'],['Service Type','text'],['Cost / Expense','number'],['Fee / Selling Price','number'],['GST %','number']]],
  ['Construction / Building Materials','construction','Add Construction Material',[['Material Name','text'],['Unit','text'],['Brand','text'],['Purchase Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Paint Shop','paint','Add Paint Product',[['Brand','text'],['Product Name','text'],['Color / Shade','text'],['Pack Size','text'],['Barcode / SKU','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Plumbing Business','plumbing','Add Plumbing Product',[['Brand','text'],['Product Name','text'],['Pipe Type','text'],['Size','text'],['Length / Pack','text'],['Class / Pressure','text'],['Unit','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Paint Shop + Plumbing Business','paintplumbing','Add Paint / Plumbing Product',[['Product Type','select:Paint|Plumbing|Accessory|Other'],['Brand','text'],['Product Name','text'],['Shade / Pipe Type','text'],['Size / Pack','text'],['Unit','text'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['General Business','general','Add Product / Service',[['Product / Service','text'],['Barcode','text'],['Type','select:Product|Raw Product|Service'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]],
  ['Other Business','general','Add Product / Service',[['Product / Service','text'],['Barcode','text'],['Type','select:Product|Raw Product|Service'],['Cost Price','number'],['Selling Price','number'],['GST %','number'],['Opening Stock','number']]]
 ];
 function category(){return String(window.currentUser?.category||window.currentUser?.businessCategory||window.state?.settings?.category||document.getElementById('businessCategory')?.value||'General Business')}
 function config(){const c=category().trim().toLowerCase();return MAP.find(x=>x[0].toLowerCase()===c)||MAP.find(x=>c.includes(x[0].toLowerCase()))||MAP[MAP.length-2]}
 function open(){
   const [label,key,title,fields]=config();
   const html='<div class="modal-grid">'+fields.map((f,i)=>{const parts=f[1].split(':');if(parts[0]==='select')return '<label class="field">'+f[0]+'<select id="ucm'+i+'">'+parts[1].split('|').map(x=>'<option>'+x+'</option>').join('')+'</select></label>';return '<label class="field">'+f[0]+'<input id="ucm'+i+'" type="'+f[1]+'" '+(f[1]==='number'?'min="0" step="0.01"':'')+'></label>'}).join('')+'</div><div class="modal-actions"><button class="secondary" type="button" id="universalCancelProduct">Cancel</button><button class="primary" type="button" id="universalSaveProduct">Save Product</button></div>';
   if(typeof openModal!=='function'){alert('NR BizPro: product window is not ready. Please refresh once.');return}
   openModal(title,html);
   const saveBtn=document.getElementById('universalSaveProduct');
   const cancelBtn=document.getElementById('universalCancelProduct');
   if(saveBtn)saveBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();saveProduct(fields,key)},{once:true});
   if(cancelBtn)cancelBtn.addEventListener('click',function(e){e.preventDefault();closeModal()},{once:true});
   document.getElementById('ucm0')?.focus();
 }
 function saveProduct(fields,key){
   try{
     const values=fields.map((_,i)=>document.getElementById('ucm'+i)?.value?.trim()||'');
     if(!values[0]){alert('Enter '+fields[0][0]);return}
     const st=window.state;
     if(!st){alert('Business data is not ready. Please refresh once and try again.');return}
     st.items=Array.isArray(st.items)?st.items:[];
     const idx=label=>fields.findIndex(f=>f[0].toLowerCase().includes(label));
     const b=idx('barcode')>=0?values[idx('barcode')]:idx('sku')>=0?values[idx('sku')]:'';
     if(b&&st.items.some(x=>x.barcode===b)){alert('Barcode / SKU already exists');return}
     const find=words=>{const i=fields.findIndex(f=>words.some(w=>f[0].toLowerCase().includes(w)));return i>=0?values[i]:''};
     const name=find(['product name','product / service','item name','medicine name','book / item','material name','service / product name','service name','model'])||values[0];
     const type=find(['product type','type'])||'Product';
     const item={id:crypto.randomUUID(),name,barcode:b,type,cost:Number(find(['cost price','purchase price','wholesale price','ex-showroom price']))||0,sell:Number(find(['selling price','on-road price','fee / selling price']))||0,gst:Number(find(['gst']))||0,stock:Number(find(['opening stock']))||0,businessCategory:key,details:Object.fromEntries(fields.map((f,i)=>[f[0],values[i]]))};
     st.items.push(item);
     st.moduleData=st.moduleData||{};
     st.moduleData['Product / Vehicle Records']=st.moduleData['Product / Vehicle Records']||[];
     st.moduleData['Product / Vehicle Records'].push(item.details);
     // IMPORTANT: call the persistence function from app.js, not this product handler.
     if(typeof save==='function')save();
     closeModal();
     try{if(typeof renderItems==='function')renderItems();if(typeof updateStats==='function')updateStats()}catch(e){console.warn('NR BizPro refresh warning',e)}
   }catch(e){console.error('NR BizPro product save failed',e);alert('Product save failed: '+(e?.message||'Please try again.'))}
 }
 window.openUniversalProductModal=open;
 function install(){window.openItemModal=open}
 window.addEventListener('load',install);
 window.addEventListener('authReady',install);
 window.addEventListener('loginSuccess',install);
 install();
})();
