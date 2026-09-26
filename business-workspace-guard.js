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
  function modules(){var a=window.state?.settings?.modules;return Array.isArray(a)&&a.length?[...new Set(a.filter(Boolean).map(String))]:[String(window.state?.settings?.category||window.currentUser?.category||'General Business')];}
  function activeRaw(){var ms=modules(),saved=String(window.state?.settings?.activeModule||'').trim();return saved&&ms.some(function(x){return String(x)===saved})?saved:ms[0];}
  function active(){return norm(activeRaw());}
  function setActiveModule(raw){var ms=modules(),next=String(raw||'').trim();if(!next||!ms.some(function(x){return String(x)===next}))return false;window.state.settings=window.state.settings||{};window.state.settings.activeModule=next;return true;}
  function renderModuleSwitcher(){var host=document.getElementById('nrBillingModuleSwitcher');if(!host)return;var ms=modules(),cur=activeRaw();host.innerHTML='<label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600"><span>Billing Module</span><select id="nrActiveBillingModule" style="min-width:210px;padding:8px 10px;border:1px solid #d8e1ed;border-radius:8px;background:#fff">'+ms.map(function(m){return '<option value="'+String(m).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'" '+(String(m)===cur?'selected':'')+'>'+String(m).replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</option>'}).join('')+'</select></label>';var sel=document.getElementById('nrActiveBillingModule');if(sel&&!sel.__bound){sel.__bound=true;sel.addEventListener('change',async function(){var before=window.state?.settings?.activeModule||cur,next=this.value;if(!setActiveModule(next)){this.value=before;return}this.disabled=true;try{var r=await window.save?.();if(!r?.ok){window.state.settings.activeModule=before;this.value=before;alert('Billing module change was not saved. Existing data was kept safe.');return}window.renderItems?.();window.renderBills?.();window.NRBizProBillIsolation?.refreshStats?.();window.NRBizProRenderAllProducts?.();}finally{this.disabled=false}})}}
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
    // Tenant isolation is mandatory: records without an owning business are not
    // safe to expose to a logged-in business account.
    return !!id&&String(record?.businessId||'')===String(id);
  }
  function visibleItems(){return (window.state?.items||[]).filter(function(x){return accountMatch(x)&&itemMatch(x);});}
  function visibleBills(){return (window.state?.bills||[]).filter(function(x){return accountMatch(x)&&billMatch(x);});}
  window.NRBizProWorkspace={normalizeCategory:norm,activeCategory:active,activeModule:activeRaw,setActiveModule:setActiveModule,getModules:modules,itemMatches:itemMatch,billMatches:billMatch,visibleItems:visibleItems,visibleBills:visibleBills};
  window.NRBizProBusinessDataIsolation={normalizeCategory:norm,matches:itemMatch,visible:visibleItems};
  window.NRBizProBillIsolation={visible:visibleBills,matches:billMatch,refreshStats:function(){
    var bs=visibleBills(),today=bs.filter(function(b){var v=b?.billDate||b?.date||b?.createdAt;var d=v?new Date(v):null,n=new Date();return d&&!isNaN(d.getTime())&&d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();});
    var bc=document.getElementById('billCount'),ts=document.getElementById('todaySales'),money=window.money||function(v){return '₹'+Number(v||0).toFixed(2);};
    if(bc)bc.textContent=String(today.length);
    if(ts)ts.textContent=money(today.reduce(function(a,b){return a+Number(b.total||0);},0));
  }};
  window.visibleItems=visibleItems;
  window.visibleBills=visibleBills;
  setTimeout(renderModuleSwitcher,1000);
  window.addEventListener('authReady',function(){setTimeout(function(){renderModuleSwitcher();window.renderItems?.();window.renderBills?.();window.NRBizProBillIsolation.refreshStats();},50);});
  window.addEventListener('loginSuccess',function(){setTimeout(function(){renderModuleSwitcher();window.renderItems?.();window.renderBills?.();window.NRBizProBillIsolation.refreshStats();},50);});
})();
