(function(){'use strict';
const UNIT_OPTIONS=['pcs','kg','g','ltr','ml','pack','box','set','pair','dozen','meter','cm','sq.ft','sq.m','ton','bag','bottle','piece','service'];
const unitOptionsHtml=()=>UNIT_OPTIONS.map(u=>`<option value="${u}">${u}</option>`).join('');
const getState=()=>{try{if(typeof state!=='undefined'&&state)return state}catch(e){};return window.state||null};
function ensureState(){let s=getState();if(s?.items)return s;try{if(window.currentUser?.id&&typeof window.loadData==='function'){s=window.loadData(window.currentUser.id);window.state=s;return s}}catch(e){};return null}
const getUnit=i=>String(i?.unit||'pcs');
function saveUnits(){try{if(typeof save==='function')save()}catch(e){}}
function addUnitToExisting(){const s=ensureState();if(!s?.items)return;let changed=false;s.items.forEach(i=>{if(!i.unit){i.unit='pcs';changed=true}});if(changed)saveUnits()}
function getBillInput(){return document.getElementById('bSearch')||document.getElementById('nbSearch')||document.getElementById('bSearchFinal')}
function getBillBox(){return document.getElementById('billSuggestions')||document.getElementById('nbSuggestions')||document.getElementById('billSuggestionsFinal')}
function addBillItemDirect(id){
  const s=ensureState(),item=(s?.items||[]).find(x=>String(x.id)===String(id));
  if(!item)return;
  if(!Array.isArray(window.billCart))window.billCart=[];
  const line=window.billCart.find(x=>String(x.id)===String(item.id));
  if(line)line.qty=Number(line.qty||0)+1;else window.billCart.push({id:item.id,qty:1});
  const input=getBillInput(),box=getBillBox();
  if(input)input.value='';
  if(box)box.innerHTML='';
  if(typeof window.renderCart==='function')window.renderCart();
  else if(typeof window.NRVehicleFixRenderBill==='function')window.NRVehicleFixRenderBill();
  if(input)input.focus();
}
window.NRBizProAddBillItem=addBillItemDirect;
function install(){
  if(typeof openModal!=='function')return;
  window.openItemModal=function(){
    ensureState();
    openModal('Add Product / Service',`<div class="modal-grid"><label class="field">Product / Service<input id="mName" required placeholder="Engine Oil"></label><label class="field">Barcode<input id="mBarcode" placeholder="Scan barcode here"></label><label class="field">Type<select id="mType"><option>Product</option><option>Service</option></select></label><label class="field">Unit<select id="mUnit">${unitOptionsHtml()}</select></label><label class="field">Cost Price<input id="mCost" type="number" min="0" value="0"></label><label class="field">Margin Type<select id="mMarginType"><option value="percent">Percentage</option><option value="fixed">Fixed Amount</option></select></label><label class="field">Margin<input id="mMargin" type="number" min="0" value="0"></label><label class="field">GST %<input id="mGst" type="number" min="0" value="0"></label><label class="field">Opening Stock<input id="mStock" type="number" min="0" value="0"></label><label class="field wide">Selling Price<input id="mSell" type="number" min="0" value="0"></label></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" onclick="addItem()">Save Product</button></div>`);
    ['mCost','mMargin','mMarginType'].forEach(id=>document.getElementById(id)?.addEventListener('input',typeof calcSell==='function'?calcSell:()=>{}));
    if(typeof calcSell==='function')calcSell();
    document.getElementById('mBarcode')?.focus();
  };
  window.addItem=function(){
    const s=ensureState();
    const name=document.getElementById('mName')?.value.trim();if(!name)return alert('Enter product name');
    const barcode=document.getElementById('mBarcode')?.value.trim()||'';
    if(!s?.items)return alert('Billing data is not ready. Refresh and try again.');
    if(barcode&&s.items.some(i=>i.barcode===barcode))return alert('Barcode already exists');
    s.items.push({id:crypto.randomUUID(),name,barcode,type:document.getElementById('mType')?.value||'Product',unit:document.getElementById('mUnit')?.value||'pcs',cost:+document.getElementById('mCost')?.value||0,margin:+document.getElementById('mMargin')?.value||0,marginType:document.getElementById('mMarginType')?.value||'percent',sell:+document.getElementById('mSell')?.value||0,gst:+document.getElementById('mGst')?.value||0,stock:+document.getElementById('mStock')?.value||0,businessCategory:window.currentUser?.category||s?.settings?.category||'General Business'});
    window.state=s;saveUnits();closeModal();if(typeof window.renderItems==='function')window.renderItems();if(typeof updateStats==='function')updateStats();
  };
  window.searchBillProducts=function(){
    addUnitToExisting();const s=ensureState(),input=getBillInput(),box=getBillBox();if(!input||!box)return;const q=(input.value||'').trim().toLowerCase();if(!q){box.innerHTML='';return}
    const items=(s?.items||[]);const found=items.filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase()===q).slice(0,10);
    box.innerHTML=found.map(i=>`<button type="button" class="suggestion" data-unit-id="${esc(i.id)}"><b>${esc(i.name)}</b><span>${esc(i.barcode||'No barcode')} • ${money(i.sell)} • ${esc(getUnit(i))} • Stock ${i.stock||0}</span></button>`).join('')||'<div class="empty">No product found</div>';
    box.querySelectorAll('[data-unit-id]').forEach(btn=>{
      const select=()=>window.NRBizProAddBillItem(btn.dataset.unitId);
      btn.onclick=e=>{e.preventDefault();e.stopPropagation();select()};
      btn.onpointerdown=e=>{e.preventDefault();e.stopPropagation();select()};
    });
  };
  window.renderCart=function(){
    const box=document.getElementById('billLines'),totalEl=document.getElementById('bTotal');if(!box)return;const cart=window.billCart||[];if(!cart.length){box.innerHTML='<div class="empty">Scan a barcode or search for a product.</div>';if(totalEl)totalEl.textContent=money(0);return}
    const s=ensureState();let total=0;box.innerHTML=cart.map(l=>{const i=(s?.items||[]).find(x=>String(x.id)===String(l.id));if(!i)return '';const amt=(+i.sell||0)*(+l.qty||0);total+=amt;return `<div class="bill-line"><span><b>${esc(i.name)}</b><small>${esc(getUnit(i))} • ${esc(i.barcode||'')}</small></span><span><button type="button" onclick="changeQty('${i.id}',-1)">−</button> ${l.qty} <button type="button" onclick="changeQty('${i.id}',1)">+</button></span><b>${money(amt)}</b><button type="button" onclick="removeCart('${i.id}')">×</button></div>`}).join('');if(totalEl)totalEl.textContent=money(total);
  };
  bindBillSearch();
}
function bindBillSearch(){
  const input=getBillInput();
  if(!input||input.dataset.unitSearchBound==='1')return;
  input.dataset.unitSearchBound='1';
  input.addEventListener('input',()=>window.searchBillProducts());
  input.addEventListener('keydown',e=>{if(e.key!=='Enter')return;e.preventDefault();const q=input.value.trim().toLowerCase(),s=ensureState(),items=s?.items||[],i=items.find(x=>String(x.barcode||'').toLowerCase()===q);if(i){window.NRBizProAddBillItem(i.id)}});
}
const originalOpenBillModal=window.openBillModal;
if(typeof originalOpenBillModal==='function'){
  window.openBillModal=function(){const r=originalOpenBillModal.apply(this,arguments);setTimeout(bindBillSearch,0);setTimeout(bindBillSearch,150);setTimeout(()=>window.searchBillProducts(),0);return r};
}
addUnitToExisting();
setTimeout(install,3500);
setTimeout(install,6000);
setTimeout(bindBillSearch,7000);
setInterval(bindBillSearch,1000);
})();