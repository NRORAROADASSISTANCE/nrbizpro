// NR BizPro — remove legacy cross-business data from the active account view/state.
// Important: this is a compatibility cleanup for old shared/demo records. New records are tagged with businessCategory.
(function(){'use strict';
 const norm=v=>{const c=String(v||'').toLowerCase();if(/ev|electric/.test(c))return'ev';if(/paint/.test(c))return'paint';if(/plumb|pipe/.test(c))return'plumbing';if(/medical|pharmacy|chemist|drug/.test(c))return'medical';if(/garage|service center/.test(c))return'garage';if(/electronic|mobile/.test(c))return'electronics';if(/furniture/.test(c))return'furniture';if(/jewel/.test(c))return'jewellery';if(/clothing|fashion|garment/.test(c))return'clothing';if(/stationery|book/.test(c))return'stationery';if(/footwear|shoe|chappal|slipper/.test(c))return'footwear';if(/fertil|agri/.test(c))return'fertilizer';if(/spare/.test(c))return'spareparts';if(/grocery|general store|retail|supermarket/.test(c))return'retail';if(/restaurant|bakery/.test(c))return'restaurant';if(/hardware|building|construction/.test(c))return'hardware';if(/dairy|milk/.test(c))return'dairy';if(/salon|beauty/.test(c))return'salon';if(/printing|xerox|online/.test(c))return'printing';return'general'};
 const paintRx=/paint|asian paints|berger|dulux|birla|wall ?care|putty|primer|emulsion|distemper|apcolite|tractor emulsion|paint brush|paint roller|wall filler|shade card/i;
 const categoryOf=x=>norm(x?.businessCategory||x?.businessModule||x?.businessType||x?.industry||x?.category||'');
 const raw=x=>{try{return JSON.stringify(x).toLowerCase()}catch{return ''}};
 function belongsToCurrent(x, current){
  const c=categoryOf(x);
  if(c&&c!==current)return false;
  if(current==='ev' && !c && paintRx.test(raw(x)))return false;
  return true;
 }
 function billBelongs(b,current){
  const c=categoryOf(b);if(c&&c!==current)return false;
  const lines=Array.isArray(b?.items)?b.items:(Array.isArray(b?.lines)?b.lines:[]);
  if(lines.length){
   const tagged=lines.filter(x=>categoryOf(x));
   if(tagged.length && tagged.some(x=>categoryOf(x)!==current))return false;
   if(current==='ev'&&!tagged.length&&lines.some(x=>paintRx.test(raw(x))))return false;
  }
  if(current==='ev'&&!c&&!lines.length&&paintRx.test(raw(b)))return false;
  return true;
 }
 function clean(){
  const u=window.currentUser,s=window.state;if(!u||!s)return;
  const current=norm(s.settings?.category||u.category||'');
  if(current!=='ev')return;
  let changed=false;
  if(Array.isArray(s.items)){const before=s.items.length;s.items=s.items.filter(x=>belongsToCurrent(x,current));changed ||= before!==s.items.length;}
  if(Array.isArray(s.bills)){const before=s.bills.length;s.bills=s.bills.filter(x=>billBelongs(x,current));changed ||= before!==s.bills.length;}
  if(Array.isArray(s.customers)){
   const before=s.customers.length;
   s.customers=s.customers.filter(x=>belongsToCurrent(x,current));
   changed ||= before!==s.customers.length;
  }
  // Other business modules may store category-tagged purchase/expense/inventory records.
  ['purchases','expenses','suppliers','leads','jobs','vehicles','testDrives','bookings','rtoRecords','deliveries'].forEach(k=>{
   if(Array.isArray(s[k])){const before=s[k].length;s[k]=s[k].filter(x=>belongsToCurrent(x,current));changed ||= before!==s[k].length;}
  });
  if(changed){try{window.save?.()}catch{}}
  setTimeout(()=>{window.renderItems?.();window.renderBills?.();window.renderCustomers?.();window.updateStats?.();window.NRBizProBusinessV2?.recover?.()},50);
 }
 window.NRBizProAccountSanitizer={clean};
 window.addEventListener('load',()=>setTimeout(clean,350));
 window.addEventListener('authReady',()=>setTimeout(clean,100));
 window.addEventListener('loginSuccess',()=>setTimeout(clean,100));
})();
