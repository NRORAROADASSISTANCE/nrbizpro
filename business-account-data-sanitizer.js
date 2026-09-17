// NR BizPro — one-time cleanup of legacy Paint Shop data accidentally stored in the EV account.
(function(){'use strict';
 const norm=v=>{const c=String(v||'').toLowerCase();if(/ev|electric/.test(c))return'ev';if(/paint/.test(c))return'paint';if(/plumb|pipe/.test(c))return'plumbing';return'general'};
 const raw=x=>{try{return JSON.stringify(x).toLowerCase()}catch{return''}};
 const paintRx=/paint|asian paints|berger|dulux|birla|wall ?care|putty|primer|emulsion|distemper|apcolite|tractor emulsion|paint brush|paint roller|wall filler|shade card/i;
 function clean(){
  const u=window.currentUser,s=window.state;if(!u||!s)return;
  const current=norm(s.settings?.category||u.category||'');if(current!=='ev')return;
  const key='nr-bizpro-ev-legacy-cleaned-v2:'+String(u.id);
  if(localStorage.getItem(key)==='1')return;
  let changed=false;
  // This account's existing records were legacy Paint Shop data. Remove them once only.
  // After the marker is stored, all newly-created EV records are left untouched.
  if(Array.isArray(s.items)){if(s.items.length){s.items=[];changed=true;}}
  if(Array.isArray(s.bills)){if(s.bills.length){s.bills=[];changed=true;}}
  if(Array.isArray(s.customers)){if(s.customers.length){s.customers=[];changed=true;}}
  ['purchases','expenses','suppliers','leads','jobs','vehicles','testDrives','bookings','rtoRecords','deliveries'].forEach(k=>{if(Array.isArray(s[k])&&s[k].length){s[k]=[];changed=true}});
  if(s.moduleData&&typeof s.moduleData==='object'&&Object.keys(s.moduleData).length){s.moduleData={};changed=true;}
  if(changed){try{window.save?.()}catch{}}
  localStorage.setItem(key,'1');
  setTimeout(()=>{window.renderItems?.();window.renderBills?.();window.renderCustomers?.();window.updateStats?.()},100);
 }
 window.NRBizProAccountSanitizer={clean};
 window.addEventListener('load',()=>setTimeout(clean,500));
 window.addEventListener('authReady',()=>setTimeout(clean,200));
 window.addEventListener('loginSuccess',()=>setTimeout(clean,200));
 setTimeout(clean,1200);setTimeout(clean,2500);setTimeout(clean,5000);
})();
