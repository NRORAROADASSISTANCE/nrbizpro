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
  const candidates=[u.tradeName,u.business,u.businessName,settings.tradeName,settings.businessName,settings.name];
  const name=String(candidates.find(v=>{const x=String(v??'').trim();return x&&x.toLowerCase()!=='your business'&&x.toLowerCase()!=='your business name';})||'Your Business').trim();
  h.innerHTML='Welcome to <strong>'+esc(name)+'</strong>';
  if(p)p.textContent='Your business workspace — billing, customers, inventory and reports, all in one place.';
 }
 window.addEventListener('load',()=>setTimeout(apply,0));
 window.addEventListener('authReady',()=>setTimeout(apply,0));
 window.addEventListener('loginSuccess',()=>setTimeout(apply,0));
 window.NRBizProWelcomeBrand={apply};
})();
