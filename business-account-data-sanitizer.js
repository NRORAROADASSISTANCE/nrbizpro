// NR BizPro — one-time cleanup of legacy Paint Shop data accidentally stored in the EV account.
(function(){'use strict';
 const norm=v=>{const c=String(v||'').toLowerCase();if(/ev|electric/.test(c))return'ev';if(/paint/.test(c))return'paint';if(/plumb|pipe/.test(c))return'plumbing';return'general'};
 const raw=x=>{try{return JSON.stringify(x).toLowerCase()}catch{return''}};
 const paintRx=/paint|asian paints|berger|dulux|birla|wall ?care|putty|primer|emulsion|distemper|apcolite|tractor emulsion|paint brush|paint roller|wall filler|shade card/i;
 let done=false;
 function clean(){
  const u=window.currentUser,s=window.state;if(!u||!s||done)return;
  const current=norm(s.settings?.category||u.category||'');if(current!=='ev')return;
  let changed=false;
  const hasPaint=x=>paintRx.test(raw(x));
  if(Array.isArray(s.items)){const before=s.items.length;s.items=s.items.filter(x=>{const c=norm(x?.businessCategory||x?.businessModule||x?.businessType||x?.industry||x?.category||'');return c==='ev'&&!hasPaint(x)});changed ||= before!==s.items.length;}
  if(Array.isArray(s.bills)){const before=s.bills.length;s.bills=s.bills.filter(x=>{const c=norm(x?.businessCategory||x?.businessModule||x?.businessType||x?.industry||x?.category||'');return c==='ev' || (c==='general'&&!hasPaint(x)&&Array.isArray(x?.items)&&x.items.length>0&&!x.items.some(hasPaint))});changed ||= before!==s.bills.length;}
  if(Array.isArray(s.customers)){const before=s.customers.length;s.customers=s.customers.filter(x=>!hasPaint(x));changed ||= before!==s.customers.length;}
  ['purchases','expenses','suppliers','leads','jobs','vehicles','testDrives','bookings','rtoRecords','deliveries'].forEach(k=>{if(Array.isArray(s[k])){const before=s[k].length;s[k]=s[k].filter(x=>!hasPaint(x));changed ||= before!==s[k].length}});
  if(s.moduleData&&typeof s.moduleData==='object'){const before=Object.keys(s.moduleData).length;s.moduleData={};changed ||= before!==s.moduleData.length;}
  if(Array.isArray(s.bills)&&s.bills.some(x=>!x?.businessCategory&&!x?.businessType&&!x?.category)){s.bills=s.bills.filter(x=>x?.businessCategory||x?.businessType||x?.category);changed=true;}
  if(changed){try{window.save?.()}catch{}}
  done=true;
  setTimeout(()=>{window.renderItems?.();window.renderBills?.();window.renderCustomers?.();window.updateStats?.()},100);
 }
 window.NRBizProAccountSanitizer={clean};
 window.addEventListener('load',()=>setTimeout(clean,500));
 window.addEventListener('authReady',()=>setTimeout(clean,200));
 window.addEventListener('loginSuccess',()=>setTimeout(clean,200));
 setTimeout(clean,1200);setTimeout(clean,2500);setTimeout(clean,5000);
})();
