// NR BizPro — final business workspace isolation guard
(function(){
  'use strict';
  function norm(v){
    var c=String(v||'').toLowerCase();
    if(/ev|electric/.test(c))return'ev';
    if(/paint/.test(c))return'paint';
    if(/plumb|pipe/.test(c))return'plumbing';
    if(/medical|pharmacy|chemist|drug/.test(c))return'medical';
    if(/garage|service center/.test(c))return'garage';
    if(/electronic|mobile/.test(c))return'electronics';
    if(/furniture/.test(c))return'furniture';
    if(/jewel/.test(c))return'jewellery';
    if(/clothing|fashion|garment/.test(c))return'clothing';
    if(/stationery|book/.test(c))return'stationery';
    if(/footwear|shoe|chappal|slipper/.test(c))return'footwear';
    if(/fertil|agri/.test(c))return'fertilizer';
    if(/spare/.test(c))return'spareparts';
    if(/grocery|general store|retail|supermarket/.test(c))return'retail';
    if(/restaurant|bakery/.test(c))return'restaurant';
    if(/hardware|building|construction/.test(c))return'hardware';
    if(/dairy|milk/.test(c))return'dairy';
    if(/salon|beauty/.test(c))return'salon';
    if(/printing|xerox|online/.test(c))return'printing';
    if(/wholesale|distributor/.test(c))return'wholesale';
    return'general';
  }
  function active(){return norm(window.currentUser?.category||window.state?.settings?.category||'General Business');}
  function itemMatch(item){
    var c=active(),raw=String(item?.businessCategory||item?.businessModule||item?.businessType||item?.industry||'').trim();
    if(c==='general')return !raw||norm(raw)==='general';
    if(raw)return norm(raw)===c;
    return false;
  }
  function billMatch(b){
    var c=active(),raw=String(b?.businessCategoryKey||b?.businessModule||b?.businessCategory||b?.businessType||b?.category||'').trim();
    if(raw)return norm(raw)===c;
    var lines=Array.isArray(b?.items)?b.items:(Array.isArray(b?.lines)?b.lines:[]);
    if(lines.length)return lines.every(itemMatch);
    return c==='general';
  }
  function accountMatch(record){
    var id=window.currentUser?.id;
    return !record?.businessId||!id||record.businessId===id;
  }
  function visibleItems(){return (window.state?.items||[]).filter(function(x){return accountMatch(x)&&itemMatch(x);});}
  function visibleBills(){return (window.state?.bills||[]).filter(function(x){return accountMatch(x)&&billMatch(x);});}
  window.NRBizProWorkspace={normalizeCategory:norm,activeCategory:active,itemMatches:itemMatch,billMatches:billMatch,visibleItems:visibleItems,visibleBills:visibleBills};
  window.NRBizProBusinessDataIsolation={normalizeCategory:norm,matches:itemMatch,visible:visibleItems};
  window.NRBizProBillIsolation={visible:visibleBills,matches:billMatch,refreshStats:function(){
    var bs=visibleBills(),today=bs.filter(function(b){var v=b?.billDate||b?.date||b?.createdAt;var d=v?new Date(v):null,n=new Date();return d&&!isNaN(d.getTime())&&d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();});
    var bc=document.getElementById('billCount'),ts=document.getElementById('todaySales'),money=window.money||function(v){return '₹'+Number(v||0).toFixed(2);};
    if(bc)bc.textContent=String(today.length);
    if(ts)ts.textContent=money(today.reduce(function(a,b){return a+Number(b.total||0);},0));
  }};
  window.visibleItems=visibleItems;
  window.visibleBills=visibleBills;
  window.addEventListener('authReady',function(){setTimeout(function(){window.renderItems?.();window.renderBills?.();window.NRBizProBillIsolation.refreshStats();},50);});
  window.addEventListener('loginSuccess',function(){setTimeout(function(){window.renderItems?.();window.renderBills?.();window.NRBizProBillIsolation.refreshStats();},50);});
})();
