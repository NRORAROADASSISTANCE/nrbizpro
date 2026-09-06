// NR BizPro — ultimate product + billing stability fix
(function(){
'use strict';
const DATA_PREFIX='nr-bizpro-data-v2:';
function user(){try{return window.currentUser||null}catch(e){return null}}
function getState(){
  try{if(typeof state!=='undefined'&&state)return state}catch(e){}
  const u=user();
  if(u?.id){try{const x=JSON.parse(localStorage.getItem(DATA_PREFIX+u.id)||'null');if(x){x.items=Array.isArray(x.items)?x.items:[];x.bills=Array.isArray(x.bills)?x.bills:[];x.customers=Array.isArray(x.customers)?x.customers:[];x.settings=x.settings&&typeof x.settings==='object'?x.settings:{};window.state=x;try{state=x}catch(e){}return x}}catch(e){}}
  return null;
}
function ensure(){const s=getState()||{};s.items=Array.isArray(s.items)?s.items:[];s.bills=Array.isArray(s.bills)?s.bills:[];s.customers=Array.isArray(s.customers)?s.customers:[];s.settings=s.settings&&typeof s.settings==='object'?s.settings:{};s.moduleData=s.moduleData&&typeof s.moduleData==='object'?s.moduleData:{};if(!Array.isArray(s.moduleData['Product / Vehicle Records']))s.moduleData['Product / Vehicle Records']=[];window.state=s;try{state=s}catch(e){}return s}
function persist(s){const u=user();if(!u?.id)throw Error('User session missing');localStorage.setItem(DATA_PREFIX+u.id,JSON.stringify(s));window.state=s;try{state=s}catch(e){}}
function val(label){const c=label.querySelector('input,select,textarea');return String(c?.value||'').trim()}
function saveProduct(){
 const s=ensure(), body=document.getElementById('modalBody');if(!body)throw Error('Product form is not ready');
 const labels=[...body.querySelectorAll('label.field')];if(!labels.length)throw Error('Product form is not ready');
 const fs=labels.map(l=>({name:(l.childNodes[0]?.textContent||'Field').trim(),value:val(l)}));if(!fs[0].value){alert('Enter '+fs[0].name);return}
 const find=words=>{const f=fs.find(x=>words.some(w=>x.name.toLowerCase().includes(w)));return f?.value||''};
 const barcode=find(['barcode','sku']);if(barcode&&s.items.some(x=>String(x?.barcode||'')===barcode)){alert('Barcode / SKU already exists');return}
 const name=find(['product name','product / service','item / service','item name','model','material name','service name'])||fs[0].value;
 const type=find(['product type','item type','type'])||'Product';
 const category=s.settings.category||s.settings.businessCategory||user()?.category||'General Business';
 const item={id:(globalThis.crypto?.randomUUID?crypto.randomUUID():'item-'+Date.now()),name,barcode,type,cost:Number(find(['cost price','purchase price','wholesale price','ex-showroom price']))||0,sell:Number(find(['selling price','on-road price']))||0,gst:Number(find(['gst']))||0,stock:Number(find(['opening stock']))||0,businessCategory:category,details:Object.fromEntries(fs.map(x=>[x.name,x.value]))};
 s.items.push(item);s.moduleData['Product / Vehicle Records'].push(item.details);persist(s);
 if(typeof closeModal==='function')closeModal();if(typeof renderItems==='function')renderItems();if(typeof updateStats==='function')updateStats();
}
function itemList(){const s=ensure();return Array.isArray(s.items)?s.items:[]}
function openBill(){
 const modal=document.getElementById('modal'),title=document.getElementById('modalTitle'),body=document.getElementById('modalBody');if(!modal||!body)return;
 title.textContent='Create New Bill';
 body.innerHTML='<div class="modal-grid"><label class="field wide">Customer Address<textarea id="bAddress" rows="2" placeholder="Door No, Street, Village/Town, District, State, PIN"></textarea></label><label class="field">Customer Name<input id="bCustomer" placeholder="Walk-in Customer"></label><label class="field">Customer Mobile<input id="bMobile" inputmode="tel"></label><label class="field wide">🔎 Search Product / 📷 Barcode Scan<input id="bSearch" autocomplete="off" placeholder="Type product name or scan barcode"></label><div id="billSuggestions" class="suggestions wide"></div><div id="billLines" class="bill-lines wide"></div><div id="billSummary" class="bill-summary wide"></div></div><div class="modal-actions"><button class="secondary" type="button" id="cancelBill">Cancel</button><button class="primary" type="button" id="generateBillStable">Generate Bill</button></div>';
 modal.classList.remove('hidden');window.billCart=[];
 const render=()=>{const q=(document.getElementById('bSearch')?.value||'').trim().toLowerCase(),box=document.getElementById('billSuggestions');if(!box)return;const all=itemList();const found=q?all.filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase().includes(q)).slice(0,12):all.slice(0,12);box.innerHTML=found.length?found.map(i=>'<button type="button" class="suggestion" data-id="'+String(i.id).replace(/"/g,'&quot;')+'"><b>'+esc(i.name)+'</b><span>'+esc(i.barcode||'No barcode')+' • ₹'+Number(i.sell||0).toFixed(2)+' • Stock '+Number(i.stock||0)+'</span></button>').join(''):(q?'<div class="empty">No product found</div>':'<div class="empty">No products available. Add a product first.</div>');box.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const id=b.dataset.id,existing=window.billCart.find(x=>String(x.id)===String(id));if(existing)existing.qty++;else window.billCart.push({id,qty:1});document.getElementById('bSearch').value='';render();renderCart()})};
 const renderCart=()=>{const box=document.getElementById('billLines');if(!box)return;let total=0;if(!window.billCart.length){box.innerHTML='<div class="empty">Search a product above to add it.</div>';return}box.innerHTML=window.billCart.map(l=>{const i=itemList().find(x=>String(x.id)===String(l.id));if(!i)return '';const a=Number(i.sell||0)*l.qty;total+=a;return '<div class="bill-line"><span><b>'+esc(i.name)+'</b><small>'+esc(i.barcode||'')+'</small></span><span>'+l.qty+'</span><b>₹'+a.toFixed(2)+'</b></div>'}).join('');const sm=document.getElementById('billSummary');if(sm)sm.textContent='Total: ₹'+total.toFixed(2)};
 window.__nrStableRenderCart=renderCart;window.__nrStableRenderSearch=render;
 document.getElementById('bSearch').oninput=render;document.getElementById('bSearch').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const q=e.target.value.trim().toLowerCase(),i=itemList().find(x=>String(x.barcode||'').toLowerCase()===q);if(i){window.billCart.push({id:i.id,qty:1});e.target.value='';render();renderCart()}}};document.getElementById('cancelBill').onclick=()=>closeModal();document.getElementById('generateBillStable').onclick=()=>{if(typeof window.saveBillFixed==='function')window.saveBillFixed();else if(typeof window.saveBill==='function')window.saveBill();else alert('Billing function is not ready. Please refresh once.')};
 render();renderCart();setTimeout(()=>document.getElementById('bSearch')?.focus(),50);
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function install(){
 ensure();
 window.openItemModal=window.openBusinessProductModal||window.openItemModal;
 window.openBillModal=openBill;window.launchNewBill=openBill;
 document.querySelectorAll('button').forEach(b=>{if(b.dataset.nrStableBound==='1')return;const t=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(t.includes('add product')){b.dataset.nrStableBound='1';b.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();(window.openBusinessProductModal||window.openItemModal)()}}});
}
document.addEventListener('click',function(e){const b=e.target?.closest?.('button');if(!b)return;const t=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();if(t==='save product'||t==='save item'){const body=document.getElementById('modalBody');if(body&&body.querySelector('label.field')){e.preventDefault();e.stopImmediatePropagation();try{saveProduct()}catch(err){console.error(err);alert('Product save failed: '+(err?.message||'Please try again.'))}}}else if(t.includes('new bill')||t.includes('create bill')){e.preventDefault();e.stopImmediatePropagation();openBill()}},true);
window.addEventListener('load',()=>{install();setTimeout(install,500);setTimeout(install,1500)});setInterval(()=>{if(!document.getElementById('modal')?.classList.contains('hidden'))return;install()},3000);
var s=document.createElement('script');s.src='bill-search-final.js?v=20260906-1';document.body.appendChild(s);
})();
