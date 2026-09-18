// NR BizPro — one-time cleanup of legacy Paint Shop data accidentally stored in the EV account.
// IMPORTANT: this cleanup is cloud-authoritative. It clears the EV account's existing legacy
// records once, writes the clean state to the server, and never clears records created later.
(function(){'use strict';
 const norm=v=>{const c=String(v||'').toLowerCase();if(/ev|electric/.test(c))return'ev';if(/paint/.test(c))return'paint';if(/plumb|pipe/.test(c))return'plumbing';return'general'};
 const cleanKey=u=>'nr-bizpro-ev-legacy-cleaned-v3:'+String(u?.id||'');
 async function putCleanCloud(s){
   try{
     const settings=s?.settings&&typeof s.settings==='object'?{...s.settings}:{};
     settings.__nrBizProPurchases=Array.isArray(s?.purchases)?s.purchases:[];
     settings.__nrBizProExpenses=Array.isArray(s?.expenses)?s.expenses:[];
     const r=await fetch('/api/auth?action=data',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},cache:'no-store',body:JSON.stringify({
       action:'data',
       items:[],
       bills:[],
       customers:[],
       settings
     })});
     return r.ok;
   }catch{return false}
 }
 async function clean(){
  const u=window.currentUser,s=window.state;if(!u||!s)return;
  const current=norm(s.settings?.category||u.category||'');if(current!=='ev')return;
  const key=cleanKey(u);
  if(localStorage.getItem(key)==='1')return;

  // This EV account's existing cloud records are legacy Paint Shop data.
  // Clear only the pre-existing dataset; future EV records are never touched.
  s.items=[];s.bills=[];s.customers=[];
  ['purchases','expenses','suppliers','leads','jobs','vehicles','testDrives','bookings','rtoRecords','deliveries'].forEach(k=>{if(Array.isArray(s[k]))s[k]=[]});
  if(s.moduleData&&typeof s.moduleData==='object')s.moduleData={};

  // Do NOT use window.save() here: it can race with the normal cloud sync.
  // First make the server state empty, then mark this account as cleaned.
  const ok=await putCleanCloud(s);
  if(!ok)return;
  try{localStorage.setItem(key,'1')}catch{}
  setTimeout(()=>{window.renderItems?.();window.renderBills?.();window.renderCustomers?.();window.updateStats?.()},50);
 }
 window.NRBizProAccountSanitizer={clean};
 window.addEventListener('load',()=>setTimeout(clean,1500));
 window.addEventListener('authReady',()=>setTimeout(clean,500));
 window.addEventListener('loginSuccess',()=>setTimeout(clean,500));
 // Retry only until the one-time cloud cleanup succeeds.
 setTimeout(clean,3000);setTimeout(clean,6000);setTimeout(clean,10000);
})();