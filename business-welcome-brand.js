// NR BizPro — dynamic welcome + business isolation + EV billing details + profile sync loader
(function(){'use strict';
 const DEFAULTS=new Set(['','your business','your business name','fast billing for every business.']);
 function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;' }[m]));}
 function pick(u){const keys=['business','tradeName','businessName','trade_name','business_name','companyName','company_name','shopName','shop_name'];for(const k of keys){const v=String(u?.[k]??'').trim();if(v&&!DEFAULTS.has(v.toLowerCase()))return v}return ''}
 function paint(name){const h=document.getElementById('businessWelcomeTitle'),p=document.getElementById('businessWelcomeText');if(h&&name){h.innerHTML='Welcome to <strong>'+esc(name)+'</strong>';if(p)p.textContent='Your business workspace — billing, customers, inventory and reports, all in one place.'}}
 async function apply(){let name=pick(window.currentUser||{});if(!name){try{const r=await fetch('/api/auth?action=me',{credentials:'include',cache:'no-store'}),d=await r.json().catch(()=>({}));if(r.ok&&d.user){window.currentUser={...(window.currentUser||{}),...d.user};name=pick(d.user)}}catch{}}if(name)paint(name)}
 function load(src,attr){if(document.querySelector('script['+attr+']'))return;const s=document.createElement('script');s.src=src;s.setAttribute(attr,'1');document.body.appendChild(s)}
 function boot(){setTimeout(apply,50);setTimeout(()=>load('business-data-isolation-fix.js?v=20260917-4','data-nr-business-isolation'),100);setTimeout(()=>load('business-bill-isolation-fix.js?v=20260917-2','data-nr-bill-isolation'),130);setTimeout(()=>load('ev-billing-details-fix.js?v=20260917-2','data-nr-ev-billing'),160);setTimeout(()=>load('business-profile-account-sync.js?v=20260917-1','data-nr-profile-sync'),190)}
 window.addEventListener('load',boot);window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
 window.NRBizProWelcomeBrand={apply,boot};
})();
