// NR BizPro — Business-aware Add Product (stable direct-save version)
(function(){
 'use strict';
 function categoryKey(){
  let c='';
  try{if(window.currentUser)c=window.currentUser.category||window.currentUser.businessCategory||'';}catch(e){}
  try{if(!c&&typeof state!=='undefined'&&state)c=state.settings?.category||state.settings?.businessCategory||'';}catch(e){}
  try{if(!c&&typeof currentUser!=='undefined'&&currentUser)c=currentUser.category||currentUser.businessCategory||'';}catch(e){}
  if(!c)c=document.getElementById('businessCategory')?.value||'';
  c=String(c).toLowerCase();
  if(/paint shop \+ plumbing/.test(c))return'paintplumbing';
  if(/paint/.test(c))return'paint';
  if(/plumb/.test(c))return'plumbing';
  if(/ev two|ev 2|electric two|ev scooter|ev bike|electric vehicle/.test(c))return'evtwo';
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
  evtwo:{title:'Add EV / Two-Wheeler Product',save:'Save Product',type:'Vehicle',fields:[['Product Type','select','Vehicle|Raw Product|Helmet|Battery|Accessory|Spare Part|Service|Other'],['Brand','text','Ola / Ather / TVS'],['Model','text','Vehicle model / product name'],['Variant','text','Variant'],['Battery Type & Capacity','text','Lithium-ion / 60V 20Ah'],['Motor Power','text','Motor power'],['Speed','text','45 km/h'],['Range','text','Range in km'],['Colour','text','Vehicle colour'],['Motor / Engine No','text','Motor number'],['Chassis No','text','Chassis number'],['Battery No','text','Battery number'],['Ex-showroom Price','number','0'],['On-road Price','number','0'],['Barcode / SKU','text','Barcode'],['Cost Price','number','0'],['Selling Price','number','0'],['GST %','number','5'],['Opening Stock','number','0'],['Warranty','text','Battery / vehicle warranty']]},
  footwear:{title:'Add Footwear Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Shoe / Chappal'],['Size / Variant','text','Size'],['Colour','text','Colour'],['Barcode','text','Scan barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
  fertilizer:{title:'Add Agriculture Product',save:'Save Product',type:'Product',fields:[['Product Name','text','Fertilizer / Seed'],['Brand','text','Brand'],['Batch / Lot No','text','Batch / Lot'],['Unit','text','Bag / Kg / Litre'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Expiry Date','date','']]},
  garage:{title:'Add Garage Item / Service',save:'Save Item',type:'Product',fields:[['Item / Service','text','Service or spare part'],['Vehicle Compatibility','text','Vehicle / Model'],['Part Number','text','Part number'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
  electronics:{title:'Add Electronics Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Model','text','Model'],['Serial Number','text','Serial number'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Warranty','text','Warranty period']]},
  clothing:{title:'Add Clothing Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Product'],['Size / Variant','text','Size'],['Colour','text','Colour'],['Barcode','text','Barcode'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]},
  retail:{title:'Add Retail Product',save:'Save Product',type:'Product',fields:[['Product Name','text','Product'],['Barcode','text','Scan barcode'],['Unit','text','Piece / Kg / Litre'],['Purchase Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0'],['Reorder Level','number','0']]},
  paint:{title:'Add Paint Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Product'],['Color / Shade','text','Shade'],['Pack Size','text','1 L / 5 L / 20 L'],['Barcode / SKU','text','Barcode'],['Cost Price','number','0'],['Selling Price','number','0'],['GST %','number','18'],['Opening Stock','number','0']]},
  plumbing:{title:'Add Plumbing Product',save:'Save Product',type:'Product',fields:[['Brand','text','Brand'],['Product Name','text','Product'],['Pipe Type','text','Pipe type'],['Size','text','Size'],['Length / Pack','text','Length / pack'],['Class / Pressure','text','Class / pressure'],['Unit','text','Piece / metre'],['Cost Price','number','0'],['Selling Price','number','0'],['GST %','number','18'],['Opening Stock','number','0']]},
  paintplumbing:{title:'Add Paint / Plumbing Product',save:'Save Product',type:'Product',fields:[['Product Type','select','Paint|Plumbing|Accessory|Other'],['Brand','text','Brand'],['Product Name','text','Product'],['Shade / Pipe Type','text','Shade / pipe type'],['Size / Pack','text','Size / pack'],['Unit','text','Piece / Litre / metre'],['Cost Price','number','0'],['Selling Price','number','0'],['GST %','number','18'],['Opening Stock','number','0']]},
  general:{title:'Add Product / Service',save:'Save Product',type:'Product',fields:[['Product / Service','text','Product or service'],['Barcode','text','Scan barcode'],['Type','select','Product|Raw Product|Service'],['Cost Price','number','0'],['Selling Price','number','0'],['GST %','number','0'],['Opening Stock','number','0']]}
 };
 function getSet(){return sets[categoryKey()]||sets.general}
 function getSafeState(){
  let st=null;
  try{if(typeof state!=='undefined'&&state)st=state}catch(e){}
  if(!st)st=window.state||null;
  if(!st){try{const u=window.currentUser;if(u?.id)st=JSON.parse(localStorage.getItem('nr-bizpro-data-v2:'+u.id)||'null')}catch(e){}}
  if(!st)st={};
  st.items=Array.isArray(st.items)?st.items:[];
  st.bills=Array.isArray(st.bills)?st.bills:[];
  st.customers=Array.isArray(st.customers)?st.customers:[];
  st.settings=st.settings&&typeof st.settings==='object'?st.settings:{};
  st.moduleData=st.moduleData&&typeof st.moduleData==='object'?st.moduleData:{};
  st.moduleData['Product / Vehicle Records']=Array.isArray(st.moduleData['Product / Vehicle Records'])?st.moduleData['Product / Vehicle Records']:[];
  window.state=st;try{state=st}catch(e){}
  return st;
 }
 function openBusinessProductModal(){
  const s=getSet();
  const html='<div class="modal-grid">'+s.fields.map((f,i)=>f[1]==='select'?'<label class="field">'+f[0]+'<select id="bm'+i+'">'+f[2].split('|').map(x=>'<option>'+x+'</option>').join('')+'</select></label>':'<label class="field">'+f[0]+'<input id="bm'+i+'" type="'+f[1]+'" '+(f[1]==='number'?'min="0" step="0.01"':'')+' placeholder="'+f[2]+'"></label>').join('')+'</div><div class="modal-actions"><button class="secondary" type="button" id="businessCancelProduct">Cancel</button><button class="primary" type="button" id="businessSaveProduct">'+s.save+'</button></div>';
  if(typeof openModal!=='function'){alert('NR BizPro: product window is not ready. Please refresh once.');return}
  openModal(s.title,html);
  const btn=document.getElementById('businessSaveProduct');
  if(btn)btn.onclick=function(e){e.preventDefault();e.stopPropagation();saveBusinessProduct(s)};
  document.getElementById('businessCancelProduct')?.addEventListener('click',()=>closeModal());
  document.getElementById('bm0')?.focus();
 }
 function saveBusinessProduct(s){
  const btn=document.getElementById('businessSaveProduct');
  if(btn){btn.disabled=true;btn.textContent='Saving...'}
  try{
   const values=s.fields.map((_,i)=>document.getElementById('bm'+i)?.value?.trim()||'');
   if(!values[0])throw Error('Enter '+s.fields[0][0]);
   const st=getSafeState();
   const idx=label=>s.fields.findIndex(f=>f[0].toLowerCase().includes(label));
   const read=labels=>{const i=s.fields.findIndex(f=>labels.some(x=>f[0].toLowerCase().includes(x)));return i>=0?values[i]:''};
   const barcode=read(['barcode','sku']);
   if(barcode&&st.items.some(i=>String(i?.barcode||'')===barcode))throw Error('Barcode already exists');
   const name=read(['model','product name','product / service','item / service'])||values[0];
   const type=read(['product type','type'])||s.type;
   const category=String(st.settings.category||st.settings.businessCategory||window.currentUser?.category||window.currentUser?.businessCategory||categoryKey()||'general');
   const item={id:(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():'item-'+Date.now(),name,barcode,type,cost:Number(read(['cost price','purchase price','wholesale price','ex-showroom price']))||0,sell:Number(read(['selling price','on-road price','fee / selling price']))||0,gst:Number(read(['gst']))||0,stock:Number(read(['opening stock']))||0,businessCategory:category,details:Object.fromEntries(s.fields.map((f,i)=>[f[0],values[i]]))};
   st.items.push(item);
   st.moduleData['Product / Vehicle Records'].push(item.details);
   const u=window.currentUser||(typeof currentUser!=='undefined'?currentUser:null);
   if(!u?.id)throw Error('User session missing');
   localStorage.setItem('nr-bizpro-data-v2:'+u.id,JSON.stringify(st));
   window.state=st;try{state=st}catch(e){}
   if(typeof closeModal==='function')closeModal();
   if(typeof renderItems==='function')renderItems();
   if(typeof updateStats==='function')updateStats();
  }catch(e){console.error('NR BizPro product save',e);alert('Product save failed: '+(e?.message||'Please try again.'))}
  finally{if(btn){btn.disabled=false;btn.textContent=s.save}}
 }
 window.openBusinessProductModal=openBusinessProductModal;window.__nrProductModuleReady=true;
 function install(){window.openItemModal=openBusinessProductModal}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
 window.addEventListener('load',install);window.addEventListener('authReady',install);window.addEventListener('loginSuccess',install);
})();