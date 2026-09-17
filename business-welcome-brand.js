// NR BizPro — dashboard welcome must follow the same business profile source
(function(){'use strict';
 const DEFAULTS=new Set(['','your business','your business name','fast billing for every business.']);
 function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
 function valid(v){const x=String(v??'').trim();return x&&!DEFAULTS.has(x.toLowerCase())?x:''}
 function pick(){
  // Business Profile is the source of truth for the active account.
  const s=window.state?.settings||{};
  const u=window.currentUser||{};
  return valid(s.name)||valid(u.business)||valid(u.tradeName)||valid(u.businessName)||'';
 }
 function paint(){const h=document.getElementById('businessWelcomeTitle'),p=document.getElementById('businessWelcomeText');const name=pick();if(!h||!name)return;h.innerHTML='Welcome to <strong>'+esc(name)+'</strong>';if(p)p.textContent='Your business workspace — billing, customers, inventory and reports, all in one place.'}
 function boot(){setTimeout(paint,0);setTimeout(paint,250);setTimeout(paint,800)}
 window.NRBizProWelcomeBrand={apply:paint,boot};
 window.addEventListener('load',boot);window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);window.addEventListener('businessProfileSaved',boot);
})();
