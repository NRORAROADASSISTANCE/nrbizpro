// NR BizPro — server-authoritative business branding + business data/bill isolation loader
(function(){'use strict';
 const DEFAULTS=new Set(['','your business','your business name','fast billing for every business.']);
 function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
 function valid(v){const x=String(v??'').trim();return x&&!DEFAULTS.has(x.toLowerCase())?x:''}
 function pick(){const u=window.currentUser||{};return valid(u.business)||valid(u.tradeName)||valid(u.businessName)||valid(window.state?.settings?.name)||'';}
 function paint(){const h=document.getElementById('businessWelcomeTitle'),p=document.getElementById('businessWelcomeText'),name=pick();if(!h||!name)return;h.innerHTML='Welcome to <strong>'+esc(name)+'</strong>';if(p)p.textContent='Your business workspace — billing, customers, inventory and reports, all in one place.';}
 function loadIsolation(){/* Legacy isolation scripts intentionally disabled. The single workspace guard is authoritative. */}
 function boot(){paint();setTimeout(paint,200);}
 window.NRBizProWelcomeBrand={apply:paint,boot,loadIsolation};window.addEventListener('load',boot);window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);window.addEventListener('businessProfileSaved',boot);
})();
