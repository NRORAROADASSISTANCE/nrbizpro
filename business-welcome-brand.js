// NR BizPro — server-authoritative business branding + business data/bill isolation loader
(function(){'use strict';
 const DEFAULTS=new Set(['','your business','your business name','fast billing for every business.']);
 function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
 function valid(v){const x=String(v??'').trim();return x&&!DEFAULTS.has(x.toLowerCase())?x:''}
 function pick(){const u=window.currentUser||{};return valid(u.business)||valid(u.tradeName)||valid(u.businessName)||valid(window.state?.settings?.name)||'';}
 function paint(){const h=document.getElementById('businessWelcomeTitle'),p=document.getElementById('businessWelcomeText'),name=pick();if(!h||!name)return;h.innerHTML='Welcome to <strong>'+esc(name)+'</strong>';if(p)p.textContent='Your business workspace — billing, customers, inventory and reports, all in one place.';}
 function load(src,attr){if(document.querySelector('script['+attr+']'))return;const s=document.createElement('script');s.src=src;s.setAttribute(attr,'1');document.body.appendChild(s);}
 async function refreshServerUser(){try{const r=await fetch('/api/auth?action=me',{credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'}}),d=await r.json().catch(()=>({}));if(r.ok&&d.user){window.currentUser={...(window.currentUser||{}),...d.user};return true;}}catch{}return false;}
 function loadIsolation(){load('business-data-isolation-fix.js?v=20260918-1','data-nr-business-isolation');load('business-bill-isolation-fix.js?v=20260918-1','data-nr-bill-isolation');load('business-account-data-sanitizer.js?v=20260918-1','data-nr-account-sanitizer');}
 function boot(){paint();loadIsolation();setTimeout(paint,200);setTimeout(()=>{loadIsolation();paint()},800);}
 window.NRBizProWelcomeBrand={apply:paint,boot,loadIsolation};window.addEventListener('load',boot);window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);window.addEventListener('businessProfileSaved',boot);
})();
