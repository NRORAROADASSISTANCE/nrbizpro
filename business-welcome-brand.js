// NR BizPro — dynamic business welcome branding
(function(){'use strict';
 function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
 function apply(){
  const h=document.getElementById('businessWelcomeTitle');
  const p=document.getElementById('businessWelcomeText');
  if(!h)return;
  const u=window.currentUser||{};
  const s=window.state||{};
  const settings=s.settings||{};
  const name=String(settings.tradeName||settings.businessName||settings.name||u.tradeName||u.business||'Your Business').trim()||'Your Business';
  h.innerHTML='Welcome to <strong>'+esc(name)+'</strong>';
  if(p)p.textContent='Your business workspace — billing, customers, inventory and reports, all in one place.';
 }
 window.addEventListener('load',()=>setTimeout(apply,0));
 window.addEventListener('authReady',()=>setTimeout(apply,0));
 window.addEventListener('loginSuccess',()=>setTimeout(apply,0));
 window.NRBizProWelcomeBrand={apply};
})();
