// NR BizPro — Raw Product + Customer Address final fix
(function(){
  function categoryText(){
    const vals=[];
    try{if(window.currentUser)vals.push(window.currentUser.category||window.currentUser.businessCategory||'')}catch(e){}
    try{if(typeof currentUser!=='undefined'&&currentUser)vals.push(currentUser.category||currentUser.businessCategory||'')}catch(e){}
    try{if(typeof state!=='undefined'&&state)vals.push(state.settings?.category||state.settings?.businessCategory||'')}catch(e){}
    const el=document.getElementById('businessCategory');if(el)vals.push(el.value||'');
    try{const sid=localStorage.getItem('nr-bizpro-session-v1'),users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');const u=users.find(x=>x.id===sid);if(u)vals.push(u.category||u.businessCategory||'')}catch(e){}
    return vals.join(' | ').toLowerCase();
  }
  function isEV(){
    if(/ev two|electric two|ev 2|ev scooter|ev bike|two[- ]wheeler|electric vehicle|ev-twowheeler/i.test(categoryText()))return true;
    try{return !!(state?.items||[]).some(i=>/EV-TWO-WHEELER|electric|scooter|e[- ]?bike/i.test(String(i.businessCategory||i.industry||i.name||'')))}catch(e){return false}
  }
  function forceEVCategory(){try{if(typeof state!=='undefined'&&state){state.settings=state.settings||{};state.settings.category='EV Two-Wheeler Showroom'}}catch(e){}}
  function addRawProductOption(){
    document.querySelectorAll('#modalBody select,#mType,#evpType').forEach(s=>{
      if(!Array.from(s.options).some(o=>String(o.value||o.textContent).trim()==='Raw Product')){const o=document.createElement('option');o.value='Raw Product';o.textContent='Raw Product';s.appendChild(o)}
    });
  }
  function patchProductModal(){
    if(typeof window.openItemModal==='function'&&!window.openItemModal.__nrRawFix){const original=window.openItemModal;function wrapped(){const r=original.apply(this,arguments);setTimeout(addRawProductOption,0);setTimeout(addRawProductOption,250);return r}wrapped.__nrRawFix=true;window.openItemModal=wrapped}
  }
  function patchEVHandlers(){
    if(!isEV())return;forceEVCategory();
    if(typeof window.openEVProduct==='function')window.openItemModal=function(){forceEVCategory();const r=window.openEVProduct();setTimeout(addRawProductOption,0);setTimeout(addRawProductOption,250);return r};
    if(typeof window.openEVBill==='function'){window.launchNewBill=function(){forceEVCategory();return window.openEVBill()};window.openBillModal=window.launchNewBill}
  }
  function patchCustomers(){
    window.renderCustomers=function(){const tb=document.getElementById('customerTable');if(!tb||typeof state==='undefined'||!state)return;const cs=Array.isArray(state.customers)?state.customers:[];tb.innerHTML=cs.length?cs.map(c=>`<tr><td><b>${typeof esc==='function'?esc(c.name||'—'):c.name||'—'}</b></td><td>${typeof esc==='function'?esc(c.mobile||'—'):c.mobile||'—'}</td><td>${typeof esc==='function'?esc(c.email||'—'):c.email||'—'}</td><td>${typeof esc==='function'?esc(c.address||'—'):c.address||'—'}</td><td>${Number(c.bills)||0}</td><td><b>${typeof money==='function'?money(c.total):'₹'+(Number(c.total)||0)}</b></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No customers yet.</td></tr>'}
  }
  function patchBillAddress(){
    if(typeof window.openBillModal==='function'&&!window.openBillModal.__nrAddressFix){const original=window.openBillModal;function wrapped(){const r=original.apply(this,arguments);setTimeout(()=>{const mobile=document.getElementById('bMobile');if(mobile&&!document.getElementById('bAddress')){const label=document.createElement('label');label.className='field wide';label.innerHTML='Customer Address<textarea id="bAddress" rows="2" placeholder="Door No, Street, Village/City, District, State, PIN"></textarea>';mobile.closest('.field')?.insertAdjacentElement('afterend',label)}},0);return r}wrapped.__nrAddressFix=true;window.openBillModal=wrapped;window.launchNewBill=wrapped}
    if(typeof window.saveBill==='function'&&!window.saveBill.__nrAddressFix){const originalSave=window.saveBill;function wrappedSave(){const address=document.getElementById('bAddress')?.value?.trim()||'';originalSave.apply(this,arguments);if(state?.bills?.[0]){state.bills[0].address=address;const mobile=state.bills[0].mobile||'';const c=state.customers?.find(x=>x.mobile===mobile&&mobile);if(c&&address)c.address=address;save();renderCustomers()}}wrappedSave.__nrAddressFix=true;window.saveBill=wrappedSave}
  }
  function install(){patchEVHandlers();patchProductModal();patchCustomers();patchBillAddress();addRawProductOption()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',()=>setTimeout(install,300));window.addEventListener('authReady',()=>setTimeout(install,300));window.addEventListener('loginSuccess',()=>setTimeout(install,300));
})();