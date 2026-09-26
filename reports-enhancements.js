// NR BizPro — stable Reports module
(function(){
  'use strict';
  const state=()=>window.state||{};
  const arr=k=>Array.isArray(state()[k])?state()[k]:[];
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const dateOf=x=>{const v=x?.date??x?.billDate??x?.invoiceDate??x?.createdAt??x?.created_at??'';const d=v?new Date(v):null;return d&&!Number.isNaN(d.getTime())?d:null;};
  const key=d=>d?d.toISOString().slice(0,10):'';
  const inRange=(x,from,to)=>{const k=key(dateOf(x));return (!from||!k||k>=from)&&(!to||!k||k<=to);};
  const amount=b=>Number(b?.total??b?.grandTotal??b?.amount??0)||0;
  const paid=b=>{const v=b?.paidAmount??b?.amountPaid??b?.receivedAmount??b?.received??b?.paid;return v!==undefined&&v!==''?Math.max(0,Number(v)||0):/paid|settled|complete/i.test(String(b?.paymentStatus||b?.status||''))?amount(b):0;};
  const due=b=>Math.max(0,amount(b)-paid(b));
  const visibleBills=()=>typeof window.NRBizProBillIsolation?.visible==='function'?window.NRBizProBillIsolation.visible():arr('bills');
  function renderReport(type,from='',to=''){
    const host=document.getElementById('customerManagement');if(!host)return;
    const bs=visibleBills().filter(x=>inRange(x,from,to)),purchases=arr('purchases').filter(x=>inRange(x,from,to)),expenses=arr('expenses').filter(x=>inRange(x,from,to)),items=arr('items');
    let title='Sales Report',html='';
    if(type==='sales'){const total=bs.reduce((a,b)=>a+amount(b),0),col=bs.reduce((a,b)=>a+paid(b),0),out=bs.reduce((a,b)=>a+due(b),0);html='<div class="nr-cards"><div><span>Total Sales</span><b>'+money(total)+'</b></div><div><span>Collected</span><b>'+money(col)+'</b></div><div><span>Outstanding</span><b>'+money(out)+'</b></div><div><span>Invoices</span><b>'+bs.length+'</b></div></div>';}
    else if(type==='collection'){title='Collection Report';html='<div class="nr-cards"><div><span>Collections</span><b>'+money(bs.reduce((a,b)=>a+paid(b),0))+'</b></div><div><span>Invoices</span><b>'+bs.length+'</b></div></div>';}
    else if(type==='purchases'||type==='supplier'){title=type==='supplier'?'Supplier Outstanding':'Purchase Report';const total=purchases.reduce((a,p)=>a+Number(p.total??(Number(p.quantity||p.qty||0)*Number(p.rate||p.purchaseRate||0))||0),0);html='<div class="nr-cards"><div><span>Total Purchases</span><b>'+money(total)+'</b></div><div><span>Entries</span><b>'+purchases.length+'</b></div></div>';}
    else if(type==='expenses'){title='Expense Report';html='<div class="nr-cards"><div><span>Total Expenses</span><b>'+money(expenses.reduce((a,e)=>a+Number(e.amount||0),0))+'</b></div><div><span>Entries</span><b>'+expenses.length+'</b></div></div>';}
    else if(type==='customers'){title='Customer Outstanding';const groups={};bs.forEach(b=>{const n=b.customerName??b.customer??b.partyName??'Walk-in Customer';groups[n]=(groups[n]||0)+due(b);});html='<div class="nr-cards"><div><span>Total Outstanding</span><b>'+money(Object.values(groups).reduce((a,n)=>a+n,0))+'</b></div><div><span>Customers</span><b>'+Object.keys(groups).length+'</b></div></div>';}
    else if(type==='stock'){title='Stock Report';html='<div class="nr-cards"><div><span>Products</span><b>'+items.length+'</b></div></div>';}
    else if(type==='pl'){title='Profit & Loss';const sales=bs.reduce((a,b)=>a+amount(b),0),purch=purchases.reduce((a,p)=>a+Number(p.total??(Number(p.quantity||p.qty||0)*Number(p.rate||p.purchaseRate||0))||0),0),exp=expenses.reduce((a,e)=>a+Number(e.amount||0),0);html='<div class="nr-cards"><div><span>Sales</span><b>'+money(sales)+'</b></div><div><span>Purchases</span><b>'+money(purch)+'</b></div><div><span>Expenses</span><b>'+money(exp)+'</b></div><div><span>Net (simple)</span><b>'+money(sales-purch-exp)+'</b></div></div>';}
    const rows=bs.slice().sort((a,b)=>(dateOf(b)?.getTime()||0)-(dateOf(a)?.getTime()||0)).map(b=>'<tr><td>'+esc(key(dateOf(b))||'—')+'</td><td>'+esc(b.invoice||b.invoiceNo||b.invoiceNumber||b.id||'Bill')+'</td><td>'+esc(b.customer||b.customerName||'Walk-in Customer')+'</td><td>'+money(amount(b))+'</td><td>'+money(paid(b))+'</td><td>'+money(due(b))+'</td></tr>').join('');
    if(type==='sales'||type==='collection'||type==='customers')html+='<div class="nr-table"><table><thead><tr><th>Date</th><th>Invoice</th><th>Customer</th><th>Total</th><th>Paid</th><th>Due</th></tr></thead><tbody>'+(rows||'<tr><td colspan="6" class="empty">No records for the selected period.</td></tr>')+'</tbody></table></div>';
    host.innerHTML='<div class="nr-head"><div><h3>'+title+'</h3><p>Report data from current business records.</p></div><div class="nr-actions"><button id="nrBackReports">← Reports</button></div></div><div class="nr-report-filters"><label>Report<select id="nrReportType"><option value="sales">Sales Report</option><option value="purchases">Purchase Report</option><option value="pl">Profit & Loss</option><option value="customers">Customer Outstanding</option><option value="supplier">Supplier Outstanding</option><option value="stock">Stock Report</option><option value="expenses">Expense Report</option><option value="collection">Collection Report</option></select></label><label>From<input id="nrReportFrom" type="date" value="'+esc(from)+'"></label><label>To<input id="nrReportTo" type="date" value="'+esc(to)+'"></label><button id="nrApplyReport">Apply</button></div>'+html;
    host.querySelector('#nrReportType').value=type;
    host.querySelector('#nrBackReports').onclick=()=>window.NRCustomerDashboard?.open('reports');
    host.querySelector('#nrApplyReport').onclick=()=>renderReport(host.querySelector('#nrReportType').value,host.querySelector('#nrReportFrom').value,host.querySelector('#nrReportTo').value);
  }
  function openReports(){const host=document.getElementById('customerManagement');if(!host)return;host.innerHTML='<div class="nr-head"><div><h3>Reports</h3><p>Business reports based on stored records.</p></div></div><div class="nr-report-grid">'+[['sales','Sales Report'],['purchases','Purchase Report'],['pl','Profit & Loss'],['customers','Customer Outstanding'],['supplier','Supplier Outstanding'],['stock','Stock Report'],['expenses','Expense Report'],['collection','Collection Report']].map(x=>'<button data-report="'+x[0]+'"><b>'+x[1]+'</b><span>Open report →</span></button>').join('')+'</div>';host.querySelectorAll('[data-report]').forEach(b=>b.onclick=()=>renderReport(b.dataset.report,key(new Date()),key(new Date())));}
  function boot(){const api=window.NRCustomerDashboard;if(!api||api.__reportsEnhanced)return;const old=api.open;api.open=function(id){if(id==='reports'){openReports();return;}old(id);};api.__reportsEnhanced=true;}
  window.NRBizProReports={open:openReports,render:renderReport};
  window.addEventListener('load',()=>setTimeout(boot,500));window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
