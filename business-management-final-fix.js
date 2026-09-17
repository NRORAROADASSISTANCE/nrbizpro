// NR BizPro — Business Management final interaction + customer recovery fix (performance optimized)
(function(){'use strict';
  const S=()=>window.state||{};
  function save(){try{window.save?.()}catch(e){}}
  function customerName(b){return String(b?.customerName??b?.customer??b?.partyName??b?.customer?.name??'').trim()}
  function customerMobile(b){return String(b?.mobile??b?.customerMobile??b?.phone??b?.customer?.mobile??'').trim()}
  let recoveredSignature='';
  function recoverCustomers(){
    const s=S();if(!Array.isArray(s.bills))return;
    if(!Array.isArray(s.customers))s.customers=[];
    const bs=s.bills,cs=s.customers,sig=bs.length+'|'+cs.length+'|'+(bs[bs.length-1]?.id||bs[bs.length-1]?.invoiceNo||'');
    if(sig===recoveredSignature)return;
    const existing=new Set(cs.map(c=>(customerMobile(c)||String(c.name??c.customer??c.partyName??'')).trim().toLowerCase()).filter(Boolean));
    let changed=false;
    for(const b of bs){const name=customerName(b),mobile=customerMobile(b);if(!name&&!mobile)continue;if(/^walk[- ]?in customer$/i.test(name)&&!mobile)continue;const key=(mobile||name).toLowerCase();if(existing.has(key))continue;s.customers.push({id:'cust-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:name||'Customer',mobile,createdAt:b.date||b.billDate||b.createdAt||new Date().toISOString()});existing.add(key);changed=true;}
    recoveredSignature=sig;
    if(changed)save();
  }
  function bind(){const host=document.getElementById('customerManagement');if(!host||host.dataset.finalFixOptimized==='1')return;host.dataset.finalFixOptimized='1';host.addEventListener('click',function(e){const side=e.target.closest('[data-nr]');if(side&&host.contains(side)){e.preventDefault();e.stopImmediatePropagation();const id=side.dataset.nr;if(id==='reports'&&window.NRBizProReports?.open){window.NRBizProReports.open();return}if(id==='customers')recoverCustomers();window.NRCustomerDashboard?.open?.(id);return;}const report=e.target.closest('[data-report]');if(report&&host.contains(report)){e.preventDefault();e.stopImmediatePropagation();window.NRBizProReports?.render?.(report.dataset.report,new Date().toISOString().slice(0,10),new Date().toISOString().slice(0,10));}},true);}
  function boot(){bind();recoverCustomers();}
  window.NRBizProBusinessFix={recoverCustomers,boot};
  window.addEventListener('load',boot);window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
