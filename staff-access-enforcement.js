// NR BizPro — Staff access enforcement (client-side UI guard)
(function(){'use strict';
  const KEY='staffPermissions';
  const defaults={dashboard:true,billing:true,products:true,customers:true,sales:true,purchases:false,inventory:true,payments:false,expenses:false,reports:false,staff:false,audit:false,profile:false};
  function perms(){const s=window.state||{};const p=s.settings?.[KEY];return {...defaults,...(p&&typeof p==='object'?p:{})}}
  function role(){return String(window.currentUser?.role||window.currentUser?.userType||window.currentUser?.type||'owner').toLowerCase()}
  function isStaff(){return ['staff','cashier','sales staff','sales_staff','manager'].includes(role())}
  function allowed(id){if(!isStaff())return true;return perms()[id]!==false}
  function guard(id){if(allowed(id))return true;alert('Access denied. Your staff account does not have permission for this module.');return false}
  function applyNav(){document.querySelectorAll('[data-nr]').forEach(b=>{const id=b.dataset.nr;if(isStaff()&&!allowed(id)){b.style.display='none'}})}
  function boot(){window.NRBizProAccess={allowed,guard,applyNav};const old=window.NRCustomerDashboard?.open;if(old&&!window.__nrStaffGuard){window.__nrStaffGuard=true;window.NRCustomerDashboard.open=function(id){if(!guard(id))return;old(id);setTimeout(applyNav,20)}}setTimeout(applyNav,100)}
  window.addEventListener('load',()=>setTimeout(boot,3500));window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
