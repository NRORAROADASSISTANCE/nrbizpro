// NR BizPro — Reports module
(function(){'use strict';
  const S=()=>window.state||{};
  const arr=(k)=>Array.isArray(S()[k])?S()[k]:[];
  const bills=()=>arr('bills'), purchases=()=>arr('purchases'), expenses=()=>arr('expenses'), items=()=>arr('items');
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const amount=b=>Number(b?.total??b?.grandTotal??b?.amount??0)||0;
  const paid=b=>{const v=b?.paidAmount??b?.amountPaid??b?.receivedAmount??b?.received??b?.paid;if(v!==undefined&&v!=='')return Math.max(0,Number(v)||0);return /paid|settled|complete/i.test(String(b?.paymentStatus||b?.status||''))?amount(b):0};
  const due=b=>Math.max(0,amount(b)-paid(b));
  const dateOf=x=>{const v=x?.date??x?.billDate??x?.invoiceDate??x?.paymentDate??x?.createdAt??x?.created_at;const d=v?new Date(v):null;return d&&!isNaN(d)?d:null};
  const iso=d=>d.toISOString().slice(0,10);
  const today=iso(new Date());
  function inRange(x,from,to){const d=dateOf(x);if(!d)return true;const k=iso(d);return (!from||k>=from)&&(!to||k<=to)}
  function setRange(){const host=document.getElementById('customerManagement');if(!host)return;const from=host.querySelector('#nrReportFrom')?.value||'';const to=host.querySelector('#nrReportTo')?.value||'';const type=host.querySelector('#nrReportType')?.value||'sales';renderReport(type,from,to)}
  function rows(type,from,to){
    if(type==='sales'||type==='collection')return bills().filter(x=>inRange(x,from,to));
    if(type==='purchases'||type==='supplier')return purchases().filter(x=>inRange(x,from,to));
    if(type==='expenses')return expenses().filter(x=>inRange(x,from,to));
    return [];
  }
  function renderReport(type,from='',to=''){
    const host=document.getElementById('customerManagement');if(!host)return;
    const bs=rows(type,from,to), ps=type==='purchases'||type==='supplier'?bs:purchases().filter(x=>inRange(x,from,to)), es=expenses().filter(x=>inRange(x,from,to));
    let title='Sales Report', html='';
    if(type==='sales'){
      const total=bs.reduce((a,b)=>a+amount(b),0), collected=bs.reduce((a,b)=>a+paid(b),0), out=bs.reduce((a,b)=>a+due(b),0);
      title='Sales Report';html=`<div class="nr-cards"><div><span>Total Sales</span><b>${money(total)}</b></div><div><span>Collected</span><b>${money(collected)}</b></div><div><span>Outstanding</span><b>${money(out)}</b></div><div><span>Invoices</span><b>${bs.length}</b></div></div><div class="nr-table"><table><thead><tr><th>Date</th><th>Invoice</th><th>Customer</th><th>Total</th><th>Paid</th><th>Due</th></tr></thead><tbody>${bs.length?bs.map(b=>`<tr><td>${dateOf(b)?esc(iso(dateOf(b))):'—'}</td><td>${esc(b.invoiceNo??b.invoiceNumber??b.billNo??b.number??b.id??'Bill')}</td><td>${esc(b.customerName??b.customer??b.partyName??'Walk-in Customer')}</td><td>${money(amount(b))}</td><td>${money(paid(b))}</td><td>${money(due(b))}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">No sales for the selected period.</td></tr>'}</tbody></table></div>`;
    }else if(type==='collection'){
      const total=bs.reduce((a,b)=>a+paid(b),0);title='Collection Report';html=`<div class="nr-cards"><div><span>Collections</span><b>${money(total)}</b></div><div><span>Invoices</span><b>${bs.length}</b></div></div><div class="nr-table"><table><thead><tr><th>Date</th><th>Invoice</th><th>Customer</th><th>Paid</th><th>Method</th><th>Status</th></tr></thead><tbody>${bs.length?bs.map(b=>`<tr><td>${dateOf(b)?esc(iso(dateOf(b))):'—'}</td><td>${esc(b.invoiceNo??b.invoiceNumber??b.billNo??b.id??'Bill')}</td><td>${esc(b.customerName??b.customer??b.partyName??'Walk-in Customer')}</td><td>${money(paid(b))}</td><td>${esc(b.paymentMethod||'—')}</td><td>${esc(b.paymentStatus||'—')}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">No collections for the selected period.</td></tr>'}</tbody></table></div>`;
    }else if(type==='purchases'){
      const total=ps.reduce((a,p)=>a+Number(p.total??(Number(p.quantity||0)*Number(p.rate||p.purchaseRate||0))||0),0);title='Purchase Report';html=`<div class="nr-cards"><div><span>Total Purchases</span><b>${money(total)}</b></div><div><span>Entries</span><b>${ps.length}</b></div></div><div class="nr-table"><table><thead><tr><th>Date</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>${ps.length?ps.map(p=>{const q=Number(p.quantity??p.qty??0)||0,r=Number(p.rate??p.purchaseRate??0)||0,t=Number(p.total??q*r)||0;return `<tr><td>${dateOf(p)?esc(iso(dateOf(p))):'—'}</td><td>${esc(p.supplier||'—')}</td><td>${esc(p.productName||p.product||'—')}</td><td>${q}</td><td>${money(r)}</td><td>${money(t)}</td></tr>`}).join(''):'<tr><td colspan="6" class="empty">No purchase records for the selected period.</td></tr>'}</tbody></table></div>`;
    }else if(type==='supplier'){
      const groups={};ps.forEach(p=>{const n=p.supplier||'Unknown Supplier';const t=Number(p.total??(Number(p.quantity||0)*Number(p.rate||p.purchaseRate||0))||0);groups[n]=(groups[n]||0)+t});title='Supplier Outstanding';html=`<div class="nr-table"><table><thead><tr><th>Supplier</th><th>Purchase Amount</th><th>Paid</th><th>Outstanding</th></tr></thead><tbody>${Object.keys(groups).length?Object.keys(groups).map(n=>{const p=ps.filter(x=>(x.supplier||'Unknown Supplier')===n),total=groups[n],pay=p.reduce((a,x)=>a+Number(x.paidAmount||x.amountPaid||0),0);return `<tr><td>${esc(n)}</td><td>${money(total)}</td><td>${money(pay)}</td><td>${money(Math.max(0,total-pay))}</td></tr>`}).join(''):'<tr><td colspan="4" class="empty">No supplier purchase records.</td></tr>'}</tbody></table></div>`;
    }else if(type==='customers'){
      const groups={};bills().filter(x=>inRange(x,from,to)).forEach(b=>{const n=b.customerName??b.customer??b.partyName??'Walk-in Customer';groups[n]=(groups[n]||0)+due(b)});title='Customer Outstanding';html=`<div class="nr-cards"><div><span>Total Outstanding</span><b>${money(Object.values(groups).reduce((a,n)=>a+n,0))}</b></div><div><span>Customers</span><b>${Object.keys(groups).length}</b></div></div><div class="nr-table"><table><thead><tr><th>Customer</th><th>Outstanding</th></tr></thead><tbody>${Object.keys(groups).length?Object.keys(groups).map(n=>`<tr><td>${esc(n)}</td><td><b>${money(groups[n])}</b></td></tr>`).join(''):'<tr><td colspan="2" class="empty">No outstanding customer balances.</td></tr>'}</tbody></table></div>`;
    }else if(type==='stock'){
      title='Stock Report';html=`<div class="nr-table"><table><thead><tr><th>Product</th><th>Stock</th><th>Cost</th><th>Selling</th><th>Stock Value</th></tr></thead><tbody>${items().length?items().map(x=>{const q=Number(x.stock??x.qty??x.quantity??0)||0,c=Number(x.cost??x.purchaseRate??0)||0,s=Number(x.selling??x.price??x.salePrice??0)||0;return `<tr><td>${esc(x.name||x.title||'—')}</td><td>${q}</td><td>${money(c)}</td><td>${money(s)}</td><td>${money(q*c)}</td></tr>`}).join(''):'<tr><td colspan="5" class="empty">No products available.</td></tr>'}</tbody></table></div>`;
    }else if(type==='expenses'){
      const total=es.reduce((a,e)=>a+Number(e.amount||0),0);title='Expense Report';html=`<div class="nr-cards"><div><span>Total Expenses</span><b>${money(total)}</b></div><div><span>Entries</span><b>${es.length}</b></div></div><div class="nr-table"><table><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Payment</th><th>Description</th></tr></thead><tbody>${es.length?es.map(e=>`<tr><td>${dateOf(e)?esc(iso(dateOf(e))):'—'}</td><td>${esc(e.category||'Other')}</td><td>${money(e.amount)}</td><td>${esc(e.paymentMethod||'—')}</td><td>${esc(e.description||'')}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No expense records for the selected period.</td></tr>'}</tbody></table></div>`;
    }else if(type==='pl'){
      const sales=bills().filter(x=>inRange(x,from,to)).reduce((a,b)=>a+amount(b),0),purch=ps.reduce((a,p)=>a+Number(p.total??(Number(p.quantity||0)*Number(p.rate||p.purchaseRate||0))||0),0),exp=es.reduce((a,e)=>a+Number(e.amount||0),0),result=sales-purch-exp;title='Profit & Loss';html=`<div class="nr-cards"><div><span>Sales</span><b>${money(sales)}</b></div><div><span>Purchases</span><b>${money(purch)}</b></div><div><span>Expenses</span><b>${money(exp)}</b></div><div><span>Net (simple)</span><b>${money(result)}</b></div></div><div class="nr-box"><p style="margin:0;color:#697386">Simple management view: Sales − recorded Purchases − recorded Expenses. This is not a formal accounting or inventory-costing statement.</p></div>`;
    }
    host.innerHTML=`<div class="nr-head"><div><h3>${title}</h3><p>Report data from your NR BizPro business records.</p></div><div class="nr-actions"><button id="nrBackReports">← Reports</button><button id="nrExportReport">Export CSV</button></div></div><div class="nr-report-filters"><label>Report<select id="nrReportType"><option value="sales">Sales Report</option><option value="purchases">Purchase Report</option><option value="pl">Profit & Loss</option><option value="customers">Customer Outstanding</option><option value="supplier">Supplier Outstanding</option><option value="stock">Stock Report</option><option value="expenses">Expense Report</option><option value="collection">Collection Report</option></select></label><label>From<input id="nrReportFrom" type="date" value="${esc(from)}"></label><label>To<input id="nrReportTo" type="date" value="${esc(to)}"></label><button id="nrApplyReport">Apply</button></div>${html}`;
    host.querySelector('#nrReportType').value=type;
    host.querySelector('#nrBackReports').onclick=()=>window.NRCustomerDashboard.open('reports');
    host.querySelector('#nrApplyReport').onclick=setRange;
    host.querySelector('#nrExportReport').onclick=()=>exportCSV(type,from,to);
  }
  function exportCSV(type,from,to){
    let data=[];if(type==='sales'||type==='collection')data=rows(type,from,to);else if(type==='purchases'||type==='supplier')data=rows(type,from,to);else if(type==='expenses')data=rows(type,from,to);else if(type==='stock')data=items();
    if(!data.length)return alert('No report data to export.');
    const keys=type==='stock'?['name','stock','cost','selling']:Object.keys(data[0]).filter(k=>typeof data[0][k]!=='object');
    const csv=[keys.join(','),...data.map(o=>keys.map(k=>`"${String(o[k]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='NR-BizPro-'+type+'-'+today+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function openReports(){
    const host=document.getElementById('customerManagement');if(!host)return;
    const cards=[['sales','Sales Report','Invoices, sales value, collections and due'],['purchases','Purchase Report','Supplier purchases and purchase value'],['pl','Profit & Loss','Sales, purchases and expenses summary'],['customers','Customer Outstanding','Customer-wise pending balances'],['supplier','Supplier Outstanding','Supplier-wise recorded purchase balances'],['stock','Stock Report','Product stock and stock value'],['expenses','Expense Report','Expense entries and totals'],['collection','Collection Report','Payments received by invoice']];
    host.innerHTML=`<div class="nr-head"><div><h3>Reports</h3><p>Business reports based on the records currently stored in NR BizPro.</p></div></div><div class="nr-report-grid">${cards.map(c=>`<button data-report="${c[0]}"><b>${c[1]}</b><span>${c[2]}</span><em>Open report →</em></button>`).join('')}</div>`;
    host.querySelectorAll('[data-report]').forEach(b=>b.onclick=()=>renderReport(b.dataset.report,today,today));
  }
  function boot(){const api=window.NRCustomerDashboard;if(!api||api.__reportsEnhanced)return;const old=api.open;api.open=function(id){if(id==='reports'){openReports();return}old(id)};api.__reportsEnhanced=true;if(document.querySelector('#customerManagement .nr-side.active')?.dataset.nr==='reports')openReports();}
  const css=`.nr-report-filters{display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin:0 0 16px;padding:14px;border:1px solid #e5e9f0;border-radius:12px;background:#fff}.nr-report-filters label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:#697386;font-weight:600}.nr-report-filters input,.nr-report-filters select{padding:9px 10px;border:1px solid #d8dde6;border-radius:8px;background:#fff;color:#172033}.nr-report-filters button{padding:10px 14px;border:0;border-radius:8px;background:#1264f5;color:#fff;cursor:pointer}.nr-report-grid em{display:block;margin-top:10px;color:#1264f5;font-style:normal;font-size:12px;font-weight:700}`;
  function start(){const s=document.createElement('style');s.textContent=css;document.head.appendChild(s);boot()}
  window.NRBizProReports={open:openReports,render:renderReport};window.addEventListener('load',()=>{setTimeout(start,2400);setTimeout(start,4200)});window.addEventListener('authReady',start);window.addEventListener('loginSuccess',start);
})();
