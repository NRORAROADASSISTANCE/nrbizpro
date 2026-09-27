// NR BizPro — CEO-style dashboard UI (read-only)
// This layer changes presentation only. It does not mutate business data.
(function(){
  'use strict';
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const state=()=>window.state||{};
  const bills=()=>Array.isArray(state().bills)?state().bills:[];
  const customers=()=>Array.isArray(state().customers)?state().customers:[];
  const items=()=>Array.isArray(state().items)?state().items:[];
  const amount=b=>Number(b?.total??b?.grandTotal??b?.amount??0)||0;
  const dateOf=b=>b?.billDate??b?.date??b?.createdAt??b?.created_at??'';
  const isToday=b=>{const d=new Date(dateOf(b)),n=new Date();return !Number.isNaN(d.getTime())&&d.toDateString()===n.toDateString()};
  const currentBills=()=>window.NRBizProWorkspace?.visibleBills?.()||bills().filter(b=>!b?.businessId||b.businessId===window.currentUser?.id);
  const currentItems=()=>window.NRBizProWorkspace?.visibleItems?.()||items().filter(i=>!i?.businessId||i.businessId===window.currentUser?.id);
  const currentCustomers=()=>customers().filter(c=>!c?.businessId||c.businessId===window.currentUser?.id);
  function metricCards(bs,it,cu){
    const today=bs.filter(isToday),todaySales=today.reduce((a,b)=>a+amount(b),0),totalSales=bs.reduce((a,b)=>a+amount(b),0);
    const due=bs.reduce((a,b)=>a+Math.max(0,Number(b?.dueAmount??b?.balance??(amount(b)-(Number(b?.paidAmount??b?.amountPaid??b?.receivedAmount??0)||0)))||0),0);
    return `<div class="nr-ceo-kpis">
      <div class="nr-ceo-kpi"><div><span>Today's Sales</span><strong>${money(todaySales)}</strong><small>${today.length} bill${today.length===1?'':'s'} today</small></div><i>₹</i></div>
      <div class="nr-ceo-kpi"><div><span>Total Sales</span><strong>${money(totalSales)}</strong><small>${bs.length} invoice${bs.length===1?'':'s'} recorded</small></div><i>↗</i></div>
      <div class="nr-ceo-kpi"><div><span>Customers</span><strong>${cu.length}</strong><small>Customer records</small></div><i>👥</i></div>
      <div class="nr-ceo-kpi"><div><span>Products</span><strong>${it.length}</strong><small>Products / services</small></div><i>📦</i></div>
      <div class="nr-ceo-kpi nr-ceo-wide"><div><span>Outstanding</span><strong>${money(due)}</strong><small>Amount currently due</small></div><i>₹</i></div>
    </div>`;
  }
  function recent(bs){
    const rows=bs.slice().sort((a,b)=>new Date(dateOf(b)||0)-new Date(dateOf(a)||0)).slice(0,8);
    return `<section class="nr-ceo-card"><div class="nr-ceo-head"><div><h3>Recent Bills</h3><p>Latest billing activity from this business</p></div><button type="button" id="nrCeoBills">View Bill History</button></div>
      <div class="nr-ceo-table"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Status</th><th class="r">Amount</th></tr></thead><tbody>
      ${rows.length?rows.map(b=>`<tr><td><b>${esc(b.invoiceNo??b.invoiceNumber??b.billNo??b.number??b.id??'Bill')}</b></td><td>${esc(b.customerName??b.customer??b.partyName??'Walk-in Customer')}</td><td>${esc(String(dateOf(b)||'—').slice(0,10))}</td><td><span class="nr-ceo-status">${Number(b?.dueAmount??b?.balance??0)>0?'Pending':'Completed'}</span></td><td class="r"><b>${money(amount(b))}</b></td></tr>`).join(''):'<tr><td colspan="5" class="empty">No billing records yet.</td></tr>'}
      </tbody></table></div></section>`;
  }
  function weekly(bs){
    const days=[],now=new Date();
    for(let i=6;i>=0;i--){const d=new Date(now);d.setHours(0,0,0,0);d.setDate(now.getDate()-i);const total=bs.filter(b=>{const x=new Date(dateOf(b));return !Number.isNaN(x.getTime())&&x.toDateString()===d.toDateString()}).reduce((a,b)=>a+amount(b),0);days.push({label:d.toLocaleDateString('en-IN',{weekday:'short'}),total})}
    const max=Math.max(1,...days.map(x=>x.total));
    return `<section class="nr-ceo-card"><div class="nr-ceo-head"><div><h3>Sales — Last 7 Days</h3><p>Read-only summary from existing invoices</p></div></div><div class="nr-ceo-bars">${days.map(x=>`<div class="nr-ceo-bar-col"><div class="nr-ceo-bar-value">${x.total?money(x.total):'₹0'}</div><div class="nr-ceo-bar-track"><div class="nr-ceo-bar" style="height:${Math.max(6,Math.round(x.total/max*100))}%"></div></div><small>${x.label}</small></div>`).join('')}</div></section>`;
  }
  function render(){
    const host=document.getElementById('customerManagement'); if(!host)return;
    const content=host.querySelector('.nr-content'); if(!content)return;
    const active=host.querySelector('.nr-side.active'); if(active?.dataset.nr!=='overview')return;
    const bs=currentBills(),it=currentItems(),cu=currentCustomers();
    content.innerHTML=`<div class="nr-ceo-title"><div><p>CEO DASHBOARD</p><h2>${esc(window.currentUser?.business||state().settings?.name||'NR BizPro')}</h2><span>Business performance at a glance</span></div><div class="nr-ceo-actions"><button type="button" id="nrCeoNewBill">+ New Bill</button><button type="button" id="nrCeoReports">Reports</button></div></div>${metricCards(bs,it,cu)}<div class="nr-ceo-grid">${recent(bs)}${weekly(bs)}</div>`;
    document.getElementById('nrCeoNewBill')?.addEventListener('click',()=>window.launchNewBill?.());
    document.getElementById('nrCeoReports')?.addEventListener('click',()=>window.NRCustomerDashboard?.open?.('reports'));
    document.getElementById('nrCeoBills')?.addEventListener('click',()=>window.showTab?.('bills'));
  }
  const css=`
    .nr-ceo-title{display:flex;justify-content:space-between;gap:18px;align-items:center;margin-bottom:18px}.nr-ceo-title p{margin:0;color:#1264f5;font-size:11px;letter-spacing:2px;font-weight:900}.nr-ceo-title h2{margin:6px 0 5px;font-size:28px;color:#15233b}.nr-ceo-title span{color:#718096}.nr-ceo-actions{display:flex;gap:9px}.nr-ceo-actions button,.nr-ceo-head button{border:0;border-radius:9px;padding:10px 13px;background:#1264f5;color:#fff;font-weight:700;cursor:pointer}.nr-ceo-actions button:last-child{background:#edf4ff;color:#1264f5;border:1px solid #d7e5fb}.nr-ceo-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}.nr-ceo-kpi{min-height:122px;padding:17px;border:1px solid #e5e9f0;border-radius:14px;background:#fff;display:flex;justify-content:space-between;gap:10px;box-shadow:0 5px 20px rgba(23,54,92,.05)}.nr-ceo-kpi span,.nr-ceo-kpi small{display:block;color:#718096}.nr-ceo-kpi strong{display:block;color:#15233b;font-size:25px;margin:7px 0 5px}.nr-ceo-kpi i{font-style:normal;width:38px;height:38px;border-radius:11px;background:#edf4ff;color:#1264f5;display:grid;place-items:center;font-weight:900}.nr-ceo-wide{display:none}.nr-ceo-grid{display:grid;grid-template-columns:1.35fr .85fr;gap:14px}.nr-ceo-card{border:1px solid #e5e9f0;border-radius:14px;background:#fff;padding:17px;box-shadow:0 5px 20px rgba(23,54,92,.05)}.nr-ceo-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.nr-ceo-head h3{margin:0;color:#15233b}.nr-ceo-head p{margin:4px 0 0;color:#718096;font-size:12px}.nr-ceo-table{overflow:auto}.nr-ceo-table table{width:100%;border-collapse:collapse;min-width:580px}.nr-ceo-table th,.nr-ceo-table td{padding:11px 8px;border-bottom:1px solid #edf0f4;text-align:left;font-size:12px}.nr-ceo-table th{font-size:10px;text-transform:uppercase;color:#8a96a8;letter-spacing:.5px}.nr-ceo-table .r{text-align:right}.nr-ceo-status{display:inline-block;padding:4px 8px;border-radius:999px;background:#e9f8f0;color:#147a4a;font-size:10px;font-weight:800}.nr-ceo-bars{height:245px;display:flex;align-items:flex-end;gap:10px;padding-top:10px}.nr-ceo-bar-col{height:100%;flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px}.nr-ceo-bar-value{font-size:9px;color:#718096;white-space:nowrap;transform:rotate(-45deg);height:25px}.nr-ceo-bar-track{height:155px;width:100%;max-width:32px;display:flex;align-items:flex-end;background:#f1f5f9;border-radius:8px;overflow:hidden}.nr-ceo-bar{width:100%;background:#1264f5;border-radius:8px 8px 0 0}.nr-ceo-bar-col small{color:#718096;font-size:10px}.nr-ceo-grid .empty{color:#718096;text-align:center;padding:25px}.nr-ceo-card:has(.nr-ceo-bars){min-width:0}@media(max-width:1000px){.nr-ceo-kpis{grid-template-columns:repeat(2,1fr)}.nr-ceo-grid{grid-template-columns:1fr}}@media(max-width:600px){.nr-ceo-title{align-items:flex-start;flex-direction:column}.nr-ceo-actions{width:100%}.nr-ceo-actions button{flex:1}.nr-ceo-kpis{grid-template-columns:1fr}.nr-ceo-kpi{min-height:105px}}`;
  function boot(){
    if(!document.getElementById('nrCeoDashboardCss')){const s=document.createElement('style');s.id='nrCeoDashboardCss';s.textContent=css;document.head.appendChild(s)}
    const api=window.NRCustomerDashboard;if(!api||api.__ceoUiHook)return;api.__ceoUiHook=true;
    const old=api.open;api.open=function(id){old(id);setTimeout(render,20);setTimeout(render,220)};
    window.addEventListener('authReady',render);window.addEventListener('loginSuccess',render);
    setTimeout(render,300);
  }
  window.NRBizProCeoDashboard={render};
  window.addEventListener('load',()=>{setTimeout(boot,1800);setTimeout(boot,3500)});
})();