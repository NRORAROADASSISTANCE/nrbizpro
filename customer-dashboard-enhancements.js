// NR BizPro — Customer Dashboard Enhancements
(function(){'use strict';
  function state(){return window.state||{};}
  function bills(){return Array.isArray(state().bills)?state().bills:[];}
  function customers(){return Array.isArray(state().customers)?state().customers:[];}
  function money(n){return '₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function billAmount(b){return Number(b.total??b.grandTotal??b.amount??0)||0;}
  function billDateValue(b){return b.date??b.billDate??b.invoiceDate??b.createdAt??b.created_at??b.timestamp??'';}
  function isToday(b){
    const raw=billDateValue(b); if(!raw)return false;
    const d=new Date(raw); if(Number.isNaN(d.getTime()))return false;
    const n=new Date();
    return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();
  }
  function customerName(b){return b.customerName??b.customer??b.name??b.partyName??'';}
  function customerMobile(b){return b.mobile??b.customerMobile??b.phone??'';}
  function billLabel(b){return b.invoiceNo??b.invoiceNumber??b.billNo??b.number??b.id??'Bill';}
  function todaySales(){return bills().filter(isToday).reduce((a,b)=>a+billAmount(b),0);}
  function decorate(){
    const host=document.getElementById('customerManagement'); if(!host)return;
    const active=host.querySelector('.nr-side.active'); if(!active)return;
    const section=active.dataset.nr;
    if(section==='overview'||section==='sales'){
      const card=Array.from(host.querySelectorAll('.nr-cards>div')).find(x=>/Today Sales|Total Sales/.test(x.querySelector('span')?.textContent||''));
      if(card){const b=card.querySelector('b');if(b)b.textContent=money(todaySales());}
    }
    if(section==='customers'){
      const input=host.querySelector('.nr-search');
      if(input&&!input.dataset.enhanced){
        input.dataset.enhanced='1';
        input.addEventListener('input',function(){filterCustomers(this.value);});
      }
      host.querySelectorAll('[data-customer-ledger]').forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='1';btn.onclick=()=>showLedger(btn.dataset.customerLedger);});
    }
  }
  function filterCustomers(q){
    const needle=String(q||'').trim().toLowerCase();
    document.querySelectorAll('#customerManagement .nr-table tbody tr').forEach(row=>{
      if(row.querySelector('.empty'))return;
      row.style.display=!needle||row.textContent.toLowerCase().includes(needle)?'':'none';
    });
  }
  function showLedger(customerKey){
    const cu=customers().find(x=>String(x.id??x.name??x.mobile??'')===String(customerKey));
    const name=cu?.name??cu?.customer??cu?.mobile??customerKey;
    const mobile=cu?.mobile??'';
    const key=String(name||'').trim().toLowerCase(), mob=String(mobile||'').trim();
    const rows=bills().filter(b=>{
      const bn=String(customerName(b)).trim().toLowerCase(), bm=String(customerMobile(b)).trim();
      return (key&&bn===key)||(mob&&bm===mob)||(String(customerName(b)).trim().toLowerCase()===key);
    });
    const total=rows.reduce((a,b)=>a+billAmount(b),0);
    const body=`<div class="nr-ledger-head"><div><h3>${esc(name)}</h3><p>${esc(mobile||'Customer Ledger')}</p></div><strong>${money(total)}</strong></div><div class="nr-table"><table><thead><tr><th>Invoice</th><th>Date</th><th>Amount</th></tr></thead><tbody>${rows.length?rows.map(b=>`<tr><td>${esc(billLabel(b))}</td><td>${esc(billDateValue(b)||'—')}</td><td>${money(billAmount(b))}</td></tr>`).join(''):'<tr><td colspan="3" class="empty">No bills found for this customer.</td></tr>'}</tbody></table></div>`;
    if(typeof window.openModal==='function')window.openModal('Customer Ledger',body);else alert(name+' — '+money(total));
  }
  function patchCustomerButtons(){
    const host=document.getElementById('customerManagement');if(!host)return;
    host.querySelectorAll('.nr-table tbody tr').forEach(row=>{
      const btn=row.querySelector('button');if(!btn||btn.dataset.ledgerReady)return;
      const customer=customers().find(x=>String(x.name??x.customer??x.mobile??'')===String(row.cells[0]?.textContent||'')||String(x.mobile||'')===String(row.cells[1]?.textContent||''));
      const key=customer?.id??customer?.name??customer?.mobile??row.cells[0]?.textContent??'';
      btn.dataset.customerLedger=key;btn.dataset.ledgerReady='1';btn.textContent='Ledger';
      btn.onclick=()=>showLedger(key);
    });
  }
  function run(){decorate();patchCustomerButtons();}
  function boot(){
    const api=window.NRCustomerDashboard;if(!api||api.__enhanced)return;
    const original=api.open;
    api.open=function(id){original(id);setTimeout(run,0);setTimeout(run,100);};
    api.__enhanced=true;run();
  }
  window.addEventListener('load',()=>{setTimeout(boot,1800);setTimeout(boot,3200);});
  window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
