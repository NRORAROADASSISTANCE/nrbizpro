// NR BizPro — stable Reports module
(function(){
  'use strict';
  function getState(){return window.state||{};}
  function bills(){if(window.NRBizProBillIsolation&&typeof window.NRBizProBillIsolation.visible==='function')return window.NRBizProBillIsolation.visible();return Array.isArray(getState().bills)?getState().bills:[];}
  function list(k){return Array.isArray(getState()[k])?getState()[k]:[];}
  function money(n){return '₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function dateValue(x){var v=x&&((x.date)||(x.billDate)||(x.invoiceDate)||(x.createdAt)||(x.created_at));var d=v?new Date(v):null;return d&&!isNaN(d.getTime())?d:null;}
  function dateKey(x){var d=dateValue(x);return d?d.toISOString().slice(0,10):'';}
  function inRange(x,from,to){var k=dateKey(x);return (!from||!k||k>=from)&&(!to||!k||k<=to);}
  function amount(b){return Number(b&&((b.total)||(b.grandTotal)||(b.amount)||0))||0;}
  function paid(b){var v=b&&(b.paidAmount!=null?b.paidAmount:b.amountPaid!=null?b.amountPaid:b.receivedAmount!=null?b.receivedAmount:b.received);if(v!=null&&v!=='')return Math.max(0,Number(v)||0);return /paid|settled|complete/i.test(String(b&&b.paymentStatus||''))?amount(b):0;}
  function due(b){return Math.max(0,amount(b)-paid(b));}
  function render(type,from,to){
    var host=document.getElementById('customerManagement');if(!host)return;
    var bs=bills().filter(function(x){return inRange(x,from,to);});
    var ps=list('purchases').filter(function(x){return inRange(x,from,to);});
    var es=list('expenses').filter(function(x){return inRange(x,from,to);});
    var title='Sales Report',total=bs.reduce(function(a,b){return a+amount(b);},0),html='';
    if(type==='sales'){title='Sales Report';html='<div class="nr-cards"><div><span>Total Sales</span><b>'+money(total)+'</b></div><div><span>Collected</span><b>'+money(bs.reduce(function(a,b){return a+paid(b);},0))+'</b></div><div><span>Outstanding</span><b>'+money(bs.reduce(function(a,b){return a+due(b);},0))+'</b></div><div><span>Invoices</span><b>'+bs.length+'</b></div></div>';}
    else if(type==='collection'){title='Collection Report';html='<div class="nr-cards"><div><span>Collections</span><b>'+money(bs.reduce(function(a,b){return a+paid(b);},0))+'</b></div><div><span>Invoices</span><b>'+bs.length+'</b></div></div>';}
    else if(type==='purchases'||type==='supplier'){title=type==='supplier'?'Supplier Outstanding':'Purchase Report';var pt=ps.reduce(function(a,p){return a+Number(p.total||(Number(p.quantity||p.qty||0)*Number(p.rate||p.purchaseRate||0))||0);},0);html='<div class="nr-cards"><div><span>Total Purchases</span><b>'+money(pt)+'</b></div><div><span>Entries</span><b>'+ps.length+'</b></div></div>';}
    else if(type==='expenses'){title='Expense Report';html='<div class="nr-cards"><div><span>Total Expenses</span><b>'+money(es.reduce(function(a,e){return a+Number(e.amount||0);},0))+'</b></div><div><span>Entries</span><b>'+es.length+'</b></div></div>';}
    else if(type==='customers'){title='Customer Outstanding';var groups={};bs.forEach(function(b){var n=b.customerName||b.customer||b.partyName||'Walk-in Customer';groups[n]=(groups[n]||0)+due(b);});html='<div class="nr-cards"><div><span>Total Outstanding</span><b>'+money(Object.keys(groups).reduce(function(a,n){return a+groups[n];},0))+'</b></div><div><span>Customers</span><b>'+Object.keys(groups).length+'</b></div></div>';}
    else if(type==='stock'){title='Stock Report';var its=list('items');html='<div class="nr-cards"><div><span>Products</span><b>'+its.length+'</b></div></div>';}
    else if(type==='pl'){title='Profit & Loss';var pur=ps.reduce(function(a,p){return a+Number(p.total||(Number(p.quantity||p.qty||0)*Number(p.rate||p.purchaseRate||0))||0);},0),exp=es.reduce(function(a,e){return a+Number(e.amount||0);},0);html='<div class="nr-cards"><div><span>Sales</span><b>'+money(total)+'</b></div><div><span>Purchases</span><b>'+money(pur)+'</b></div><div><span>Expenses</span><b>'+money(exp)+'</b></div><div><span>Net</span><b>'+money(total-pur-exp)+'</b></div></div>';}
    var rows=bs.slice().sort(function(a,b){return (dateValue(b)||0)-(dateValue(a)||0);}).map(function(b){return '<tr><td>'+esc(dateKey(b)||'—')+'</td><td>'+esc(b.invoice||b.invoiceNo||b.invoiceNumber||b.id||'Bill')+'</td><td>'+esc(b.customer||b.customerName||'Walk-in Customer')+'</td><td>'+money(amount(b))+'</td><td>'+money(paid(b))+'</td><td>'+money(due(b))+'</td></tr>';}).join('');
    if(type==='sales'||type==='collection'||type==='customers')html+='<div class="nr-table"><table><thead><tr><th>Date</th><th>Invoice</th><th>Customer</th><th>Total</th><th>Paid</th><th>Due</th></tr></thead><tbody>'+(rows||'<tr><td colspan="6" class="empty">No records for selected period.</td></tr>')+'</tbody></table></div>';
    host.innerHTML='<div class="nr-head"><div><h3>'+title+'</h3><p>Report data from current business records.</p></div><div class="nr-actions"><button id="nrBackReports">← Reports</button></div></div><div class="nr-report-filters"><label>Report<select id="nrReportType"><option value="sales">Sales Report</option><option value="purchases">Purchase Report</option><option value="pl">Profit & Loss</option><option value="customers">Customer Outstanding</option><option value="supplier">Supplier Outstanding</option><option value="stock">Stock Report</option><option value="expenses">Expense Report</option><option value="collection">Collection Report</option></select></label><label>From<input id="nrReportFrom" type="date" value="'+esc(from||'')+'"></label><label>To<input id="nrReportTo" type="date" value="'+esc(to||'')+'"></label><button id="nrApplyReport">Apply</button></div>'+html;
    document.getElementById('nrReportType').value=type;
    document.getElementById('nrBackReports').onclick=function(){if(window.NRCustomerDashboard)window.NRCustomerDashboard.open('reports');};
    document.getElementById('nrApplyReport').onclick=function(){render(document.getElementById('nrReportType').value,document.getElementById('nrReportFrom').value,document.getElementById('nrReportTo').value);};
  }
  function openReports(){
    var host=document.getElementById('customerManagement');if(!host)return;
    var cards=[['sales','Sales Report'],['purchases','Purchase Report'],['pl','Profit & Loss'],['customers','Customer Outstanding'],['supplier','Supplier Outstanding'],['stock','Stock Report'],['expenses','Expense Report'],['collection','Collection Report']];
    host.innerHTML='<div class="nr-head"><div><h3>Reports</h3><p>Business reports based on stored records.</p></div></div><div class="nr-report-grid">'+cards.map(function(c){return '<button data-report="'+c[0]+'"><b>'+c[1]+'</b><span>Open report →</span></button>';}).join('')+'</div>';
    host.querySelectorAll('[data-report]').forEach(function(b){b.onclick=function(){var d=new Date().toISOString().slice(0,10);render(b.dataset.report,d,d);};});
  }
  function boot(){var api=window.NRCustomerDashboard;if(!api||api.__reportsEnhanced)return;var old=api.open;api.open=function(id){if(id==='reports'){openReports();return;}old(id);};api.__reportsEnhanced=true;}
  window.NRBizProReports={open:openReports,render:render};
  window.addEventListener('load',function(){setTimeout(boot,500);});
  window.addEventListener('authReady',boot);
  window.addEventListener('loginSuccess',boot);
})();
