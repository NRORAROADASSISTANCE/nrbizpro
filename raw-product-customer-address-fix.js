// NR BizPro — Raw Product + Customer Address final fix
(function(){
  function addRawProductOption(){
    const s=document.getElementById('mType');
    if(s && !Array.from(s.options).some(o=>o.value==='Raw Product')){
      const o=document.createElement('option');
      o.value='Raw Product';
      o.textContent='Raw Product';
      s.appendChild(o);
    }
  }

  function patchProductModal(){
    if(typeof window.openItemModal!=='function' || window.openItemModal.__nrRawFix)return;
    const original=window.openItemModal;
    function wrapped(){
      const r=original.apply(this,arguments);
      setTimeout(addRawProductOption,0);
      return r;
    }
    wrapped.__nrRawFix=true;
    window.openItemModal=wrapped;
  }

  function patchCustomers(){
    window.renderCustomers=function(){
      const tb=document.getElementById('customerTable');
      if(!tb || typeof state==='undefined' || !state)return;
      const customers=Array.isArray(state.customers)?state.customers:[];
      tb.innerHTML=customers.length?customers.map(c=>`<tr><td><b>${typeof esc==='function'?esc(c.name||'—'):String(c.name||'—')}</b></td><td>${typeof esc==='function'?esc(c.mobile||'—'):String(c.mobile||'—')}</td><td>${typeof esc==='function'?esc(c.email||'—'):String(c.email||'—')}</td><td>${typeof esc==='function'?esc(c.address||'—'):String(c.address||'—')}</td><td>${Number(c.bills)||0}</td><td><b>${typeof money==='function'?money(c.total):'₹'+(Number(c.total)||0)}</b></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No customers yet.</td></tr>';
    };
  }

  function patchBill(){
    if(typeof window.openBillModal==='function' && !window.openBillModal.__nrAddressFix){
      const originalOpen=window.openBillModal;
      function wrappedOpen(){
        const r=originalOpen.apply(this,arguments);
        setTimeout(()=>{
          const mobile=document.getElementById('bMobile');
          if(mobile && !document.getElementById('bAddress')){
            const label=document.createElement('label');
            label.className='field wide';
            label.innerHTML='Customer Address<textarea id="bAddress" rows="2" placeholder="Door No, Street, Village/City, District, State, PIN"></textarea>';
            mobile.closest('.field')?.insertAdjacentElement('afterend',label);
          }
        },0);
        return r;
      }
      wrappedOpen.__nrAddressFix=true;
      window.openBillModal=wrappedOpen;
      window.launchNewBill=wrappedOpen;
    }

    if(typeof window.saveBill==='function' && !window.saveBill.__nrAddressFix){
      const originalSave=window.saveBill;
      function wrappedSave(){
        const address=document.getElementById('bAddress')?.value?.trim()||'';
        originalSave.apply(this,arguments);
        if(typeof state!=='undefined' && state?.bills?.[0]){
          state.bills[0].address=address;
          const mobile=state.bills[0].mobile||'';
          const c=state.customers?.find(x=>x.mobile===mobile&&mobile);
          if(c && address)c.address=address;
          if(typeof save==='function')save();
          if(typeof renderCustomers==='function')renderCustomers();
        }
      }
      wrappedSave.__nrAddressFix=true;
      window.saveBill=wrappedSave;
    }
  }

  function install(){
    patchProductModal();
    patchCustomers();
    patchBill();
    addRawProductOption();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',()=>setTimeout(install,100));
  window.addEventListener('authReady',()=>setTimeout(install,100));
  window.addEventListener('loginSuccess',()=>setTimeout(install,100));
})();