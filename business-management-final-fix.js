// NR BizPro — Business Management final interaction + customer recovery fix
(function(){'use strict';
  const S=()=>window.state||{};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function save(){try{window.save?.()}catch(e){}}
  function customerName(b){return String(b?.customerName??b?.customer??b?.partyName??b?.customer?.name??'').trim()}
  function customerMobile(b){return String(b?.mobile??b?.customerMobile??b?.phone??b?.customer?.mobile??'').trim()}
  function recoverCustomers(){
    const s=S(); if(!Array.isArray(s.bills))return;
    if(!Array.isArray(s.customers))s.customers=[];
    const existing=new Set(s.customers.map(c=>(customerMobile(c)||customerName(c)).toLowerCase()).filter(Boolean));
    let changed=false;
    s.bills.forEach(b=>{const name=customerName(b),mobile=customerMobile(b);if(!name&&!mobile)return;const key=(mobile||name).toLowerCase();if(existing.has(key))return;s.customers.push({id:'cust-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:name||'Customer',mobile,createdAt:b.date||b.billDate||b.createdAt||new Date().toISOString()});existing.add(key);changed=true});
    if(changed)save();
  }
  function bind(){
    const host=document.getElementById('customerManagement');if(!host)return;
    recoverCustomers();
    if(host.dataset.finalFix==='1')return;
    host.dataset.finalFix='1';
    host.addEventListener('click',function(e){
      const side=e.target.closest('[data-nr]');
      if(side&&host.contains(side)){e.preventDefault();e.stopImmediatePropagation();const id=side.dataset.nr;if(id==='reports'&&window.NRBizProReports?.open){window.NRBizProReports.open();return}if(id==='customers')recoverCustomers();window.NRCustomerDashboard?.open?.(id);return}
      const report=e.target.closest('[data-report]');
      if(report&&host.contains(report)){e.preventDefault();e.stopImmediatePropagation();window.NRBizProReports?.render?.(report.dataset.report,new Date().toISOString().slice(0,10),new Date().toISOString().slice(0,10));return}
    },true);
  }
  function patchOpen(){const api=window.NRCustomerDashboard;if(!api||api.__finalBusinessFix)return;const old=api.open;api.open=function(id){if(id==='customers')recoverCustomers();old(id);setTimeout(bind,20)};api.__finalBusinessFix=true}
  function boot(){patchOpen();bind();recoverCustomers()}
  window.NRBizProBusinessFix={recoverCustomers,boot};
  window.addEventListener('load',()=>{setTimeout(boot,5500);setTimeout(boot,8000)});window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
