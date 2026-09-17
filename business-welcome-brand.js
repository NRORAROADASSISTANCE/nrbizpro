// NR BizPro — dynamic business welcome branding + category data isolation loader
(function(){'use strict';
 const DEFAULTS=new Set(['','your business','your business name','fast billing for every business.']);
 function esc(v){return String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
 function pick(u){
  const keys=['business','tradeName','businessName','trade_name','business_name','companyName','company_name','shopName','shop_name'];
  for(const k of keys){const v=String(u?.[k]??'').trim();if(v&&!DEFAULTS.has(v.toLowerCase()))return v;}
  return '';
 }
 function paint(name){
  const h=document.getElementById('businessWelcomeTitle');
  const p=document.getElementById('businessWelcomeText');
  if(!h)return;
  if(name){h.innerHTML='Welcome to <strong>'+esc(name)+'</strong>';if(p)p.textContent='Your business workspace — billing, customers, inventory and reports, all in one place.';}
 }
 async function apply(){
  let name=pick(window.currentUser||{});
  if(!name){try{const r=await fetch('/api/auth?action=me',{credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'}});const d=await r.json().catch(()=>({}));if(r.ok&&d.user){window.currentUser={...(window.currentUser||{}),...d.user};name=pick(d.user);}}catch{}}
  if(name)paint(name);
 }
 function loadIsolation(){
  if(document.querySelector('script[data-nr-business-isolation]'))return;
  const s=document.createElement('script');s.src='business-data-isolation-fix.js?v=20260917-1';s.dataset.nrBusinessIsolation='1';document.body.appendChild(s);
 }
 window.addEventListener('load',()=>{setTimeout(apply,100);setTimeout(loadIsolation,150);});
 window.addEventListener('authReady',()=>{setTimeout(apply,50);setTimeout(loadIsolation,100);});
 window.addEventListener('loginSuccess',()=>{setTimeout(apply,50);setTimeout(loadIsolation,100);});
 window.NRBizProWelcomeBrand={apply,loadIsolation};
})();
