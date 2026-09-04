// NR BizPro Demo — Customer Address in New Bill
(function(){
  function addAddressField(){
    const mobile=document.getElementById('bMobile');
    if(!mobile || document.getElementById('bAddress')) return;
    const label=document.createElement('label');
    label.className='field wide';
    label.innerHTML='Customer Address<textarea id="bAddress" rows="3" placeholder="Door No, Street, Village/Town, District, State, PIN"></textarea>';
    const parent=mobile.closest('.modal-grid') || mobile.parentElement?.parentElement || document.getElementById('modalBody');
    if(parent) parent.appendChild(label);
  }
  function patchOpenBill(){
    if(typeof window.openBillModal!=='function' || window.openBillModal.__nrAddressDemoPatch) return;
    const old=window.openBillModal;
    function wrapped(){
      const result=old.apply(this,arguments);
      setTimeout(addAddressField,0);
      setTimeout(addAddressField,50);
      return result;
    }
    wrapped.__nrAddressDemoPatch=true;
    window.openBillModal=wrapped;
  }
  function patchSaveBill(){
    if(typeof window.saveBill!=='function' || window.saveBill.__nrAddressDemoPatch) return;
    const old=window.saveBill;
    function wrapped(){
      const address=(document.getElementById('bAddress')?.value||'').trim();
      const customer=(document.getElementById('bCustomer')?.value||'Walk-in Customer').trim()||'Walk-in Customer';
      const mobile=(document.getElementById('bMobile')?.value||'').trim();
      old.apply(this,arguments);
      try{
        if(!Array.isArray(state?.bills)) return;
        let bill=state.bills.find(b=>b.customer===customer && (b.mobile||'')===mobile && !b.customerAddress);
        if(!bill) bill=state.bills[0];
        if(bill){ bill.customerAddress=address; }
        if(mobile && Array.isArray(state.customers)){
          const c=state.customers.find(x=>(x.mobile||'')===mobile);
          if(c) c.address=address;
        }
        if(typeof save==='function') save();
      }catch(e){console.error('NR demo customer address',e)}
    }
    wrapped.__nrAddressDemoPatch=true;
    window.saveBill=wrapped;
  }
  function run(){patchOpenBill();patchSaveBill();addAddressField();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  window.addEventListener('load',()=>{run();setTimeout(run,100);setTimeout(run,500);});
  setInterval(run,1000);
})();
