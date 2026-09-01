// NR BizPro — ensure customer address is captured in New Bill and printed
(function(){
  function addAddressField(){
    const mobile=document.getElementById('bMobile');
    if(!mobile||document.getElementById('bAddress'))return;
    const label=document.createElement('label');label.className='field wide';label.innerHTML='Customer Address<textarea id="bAddress" rows="2" placeholder="Door No, Street, Village/Town, District, State, PIN"></textarea>';
    mobile.closest('.modal-grid')?.appendChild(label) || document.getElementById('modalBody')?.insertBefore(label,document.getElementById('modalBody').firstChild);
  }
  function patchSave(){
    if(typeof window.saveBill!=='function'||window.saveBill.__nrCustomerAddress)return;
    const old=window.saveBill;
    function wrapped(){
      const address=(document.getElementById('bAddress')?.value||'').trim();
      old();
      const bill=state?.bills?.[0];
      if(bill){bill.customerAddress=address;if(typeof save==='function')save();}
      const mobile=(document.getElementById('bMobile')?.value||'').trim();
      if(mobile&&Array.isArray(state?.customers)){const c=state.customers.find(x=>x.mobile===mobile);if(c){c.address=address;if(typeof save==='function')save();}}
    }
    wrapped.__nrCustomerAddress=true;window.saveBill=wrapped;
  }
  function patch(){addAddressField();patchSave();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch);else patch();
  window.addEventListener('load',()=>{patch();setTimeout(patch,300);setTimeout(patch,1000)});
  setInterval(patch,1000);
})();
