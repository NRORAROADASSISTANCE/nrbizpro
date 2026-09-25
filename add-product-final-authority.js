// NR BizPro — final Add Product authority
(function(){
 'use strict';
 function getState(){ return window.state || null; }
 function category(){
  const u=window.currentUser||{},s=getState()||{};
  return String(u.category||s.settings?.category||'General Business');
 }
 function openAddProduct(){
  const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');
  if(!modal||!title||!body){ alert('Product window is not ready. Please refresh once.'); return; }
  title.textContent='Add Product / Service';
  body.innerHTML='<div class="modal-grid">'+
   '<label class="field wide">Business Module<input id="finalPmModule" value="'+category().replace(/"/g,'&quot;')+'" readonly></label>'+
   '<label class="field">Product / Service<input id="finalPmName" required placeholder="Product name"></label>'+
   '<label class="field">Barcode / SKU<input id="finalPmBarcode" placeholder="Barcode / SKU"></label>'+
   '<label class="field">Type<select id="finalPmType"><option>Product</option><option>Service</option></select></label>'+
   '<label class="field">Cost Price<input id="finalPmCost" type="number" min="0" step="0.01" value="0"></label>'+
   '<label class="field">Selling Price<input id="finalPmSell" type="number" min="0" step="0.01" value="0"></label>'+
   '<label class="field">GST %<input id="finalPmGst" type="number" min="0" step="0.01" value="0"></label>'+
   '<label class="field">Opening Stock<input id="finalPmStock" type="number" min="0" step="0.01" value="0"></label>'+
   '</div><div class="modal-actions"><button class="secondary" type="button" id="finalPmCancel">Cancel</button><button class="primary" type="button" id="finalPmSave">Save Product</button></div>';
  modal.classList.remove('hidden');
  document.getElementById('finalPmName')?.focus();
  document.getElementById('finalPmCancel').onclick=()=>modal.classList.add('hidden');
  document.getElementById('finalPmSave').onclick=saveProduct;
 }
 async function saveProduct(){
  const st=getState(),u=window.currentUser;
  if(!st||!u?.id){alert('Business session is not ready. Please login again.');return;}
  const name=document.getElementById('finalPmName')?.value.trim()||'';
  if(!name){alert('Enter product name');return;}
  const barcode=document.getElementById('finalPmBarcode')?.value.trim()||'';
  if(barcode&&Array.isArray(st.items)&&st.items.some(x=>String(x.barcode||'')===barcode)){alert('Barcode / SKU already exists');return;}
  const btn=document.getElementById('finalPmSave');if(btn){btn.disabled=true;btn.textContent='Saving...';}
  try{
   st.items=Array.isArray(st.items)?st.items:[];
   st.items.push({
    id:(crypto.randomUUID?crypto.randomUUID():'item-'+Date.now()),
    name,barcode,type:document.getElementById('finalPmType')?.value||'Product',
    cost:Number(document.getElementById('finalPmCost')?.value)||0,
    sell:Number(document.getElementById('finalPmSell')?.value)||0,
    gst:Number(document.getElementById('finalPmGst')?.value)||0,
    stock:Number(document.getElementById('finalPmStock')?.value)||0,
    businessId:u.id,businessCategory:category()
   });
   window.state=st;
   if(typeof window.save!=='function')throw Error('Database save is not ready');
   await window.save();
   modal.classList.add('hidden');
   if(typeof window.renderItems==='function')window.renderItems();
   if(typeof window.updateStats==='function')window.updateStats();
   alert('Product saved successfully');
  }catch(e){
   console.error('Final Add Product save failed:',e);
   alert('Product save failed: '+(e?.message||'Please try again.'));
  }finally{if(btn){btn.disabled=false;btn.textContent='Save Product';}}
 }
 function bind(){
  window.openItemModal=openAddProduct;
  window.__NRFinalAddProduct=openAddProduct;
  document.querySelectorAll('button').forEach(b=>{
   if((b.textContent||'').trim().toLowerCase().includes('add product')){
    b.type='button';
    b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();openAddProduct();};
   }
  });
 }
 window.addEventListener('load',()=>setTimeout(bind,100));
 window.addEventListener('authReady',()=>setTimeout(bind,100));
 window.addEventListener('loginSuccess',()=>setTimeout(bind,100));
 setTimeout(bind,500);
 setTimeout(bind,1500);
 setTimeout(bind,3000);
})();