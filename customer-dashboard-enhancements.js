// NR BizPro — Customer Dashboard Enhancements
(function(){'use strict';
  function state(){return window.state||{};}
  function bills(){return Array.isArray(state().bills)?state().bills:[];}
  function customers(){return Array.isArray(state().customers)?state().customers:[];}
  function money(n){return '₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function billAmount(b){return Number(b.total??b.grandTotal??b.amount??0)||0;}
  function paidAmount(b){const v=b.paidAmount??b.amountPaid??b.receivedAmount??b.received??b.paid;return v!==undefined&&v!==''?Math.max(0,Number(v)||0):0;}
  function dueAmount(b){return Math.max(0,Number(b.dueAmount??b.balance??(billAmount(b)-paidAmount(b)))||0);}
  function billDateValue(b){return b.date??b.billDate??b.invoiceDate??b.createdAt??b.created_at??b.timestamp??'';}
  function isToday(b){const raw=billDateValue(b);if(!raw)return false;const d=new Date(raw);if(Number.isNaN(d.getTime()))return false;const n=new Date();return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();}
  function customerName(b){return b.customerName??b.customer??b.name??b.partyName??'';}
  function customerMobile(b){return b.mobile??b.customerMobile??b.phone??'';}
  function billLabel(b){return b.invoiceNo??b.invoiceNumber??b.billNo??b.number??b.id??'Bill';}
  function customerKey(name,mobile){const m=String(mobile||'').trim();const n=String(name||'').trim().toLowerCase();return m?`m:${m}`:`n:${n}`;}
  function todaySales(){return bills().filter(isToday).reduce((a,b)=>a+billAmount(b),0);}

  function buildCustomerRows(){
    const map=new Map();
    const add=(name,mobile,registeredId)=>{
      const cleanName=String(name||'').trim()||'Walk-in Customer';
      const cleanMobile=String(mobile||'').trim();
      const isWalk=/^walk[ -]?in customer$/i.test(cleanName)&&!cleanMobile;
      if(isWalk)return;
      const key=customerKey(cleanName,cleanMobile);
      if(!map.has(key))map.set(key,{key,name:cleanName,mobile:cleanMobile,bills:[],balance:0});
      const row=map.get(key);if(registeredId)row.registeredId=registeredId;
    };
    customers().forEach(c=>add(c.name??c.customer??c.partyName??'',c.mobile??c.phone??'',c.id));
    bills().forEach(b=>{
      const name=customerName(b),mobile=customerMobile(b);
      if(!String(name||'').trim()&&!String(mobile||'').trim())return;
      add(name,mobile);
      const key=customerKey(name,mobile),row=map.get(key);if(row){row.bills.push(b);row.balance+=dueAmount(b);}
    });
    return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name));
  }

  function showLedgerByRow(key){
    const row=buildCustomerRows().find(x=>x.key===String(key));if(!row)return;
    const rows=row.bills.slice().sort((a,b)=>new Date(billDateValue(b)||0)-new Date(billDateValue(a)||0));
    const total=rows.reduce((a,b)=>a+billAmount(b),0),paid=rows.reduce((a,b)=>a+paidAmount(b),0),due=rows.reduce((a,b)=>a+dueAmount(b),0);
    const body=`<div class="nr-ledger-head"><div><h3>${esc(row.name)}</h3><p>${esc(row.mobile||'Customer Ledger')}</p></div><strong>${money(due)} Due</strong></div><div class="nr-cards" style="grid-template-columns:repeat(3,minmax(0,1fr));margin:12px 0"><div><span>Total Bills</span><b>${rows.length}</b></div><div><span>Total Billed</span><b>${money(total)}</b></div><div><span>Due Amount</span><b>${money(due)}</b></div></div><div class="nr-table"><table><thead><tr><th>Invoice</th><th>Bill Date</th><th>Total</th><th>Paid</th><th>Due</th><th>Due Date</th></tr></thead><tbody>${rows.length?rows.map(b=>`<tr><td>${esc(billLabel(b))}</td><td>${esc(String(billDateValue(b)||'—').slice(0,10))}</td><td>${money(billAmount(b))}</td><td>${money(paidAmount(b))}</td><td><b>${money(dueAmount(b))}</b></td><td>${esc(b.dueDate||'—')}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">No bills found for this customer.</td></tr>'}</tbody></table></div>`;
    if(typeof window.openModal==='function')window.openModal('Customer Ledger',body);else alert(`${row.name} — ${money(due)} due`);
  }

  function renderCustomers(){
    const host=document.getElementById('customerManagement');if(!host)return;
    const active=host.querySelector('.nr-side.active');if(!active||active.dataset.nr!=='customers')return;
    const content=host.querySelector('.nr-content');if(!content)return;
    const oldTable=content.querySelector('.nr-table');if(!oldTable)return;
    const input=content.querySelector('.nr-search');
    const rows=buildCustomerRows();
    const table=`<div class="nr-table"><table><thead><tr><th>Customer</th><th>Mobile</th><th>Total Bills</th><th>Total</th><th>Due Amount</th><th>Action</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr data-customer-row="${esc(r.key)}"><td><b>${esc(r.name)}</b></td><td>${esc(r.mobile||'—')}</td><td>${r.bills.length}</td><td>${money(r.bills.reduce((a,b)=>a+billAmount(b),0))}</td><td><b>${money(r.balance)}</b></td><td><button type="button" data-customer-ledger="${esc(r.key)}">Ledger</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No named customers yet. Walk-in bills are kept in Bill History and are not added as duplicate customer accounts.</td></tr>'}</tbody></table></div>`;
    oldTable.outerHTML=table;
    if(input){input.oninput=function(){filterCustomers(this.value);};}
    content.querySelectorAll('[data-customer-ledger]').forEach(btn=>{btn.onclick=()=>showLedgerByRow(btn.dataset.customerLedger);});
  }

  function decorate(){
    const host=document.getElementById('customerManagement');if(!host)return;
    const active=host.querySelector('.nr-side.active');if(!active)return;
    const section=active.dataset.nr;
    if(section==='overview'||section==='sales'){
      const card=Array.from(host.querySelectorAll('.nr-cards>div')).find(x=>/Today Sales|Total Sales/.test(x.querySelector('span')?.textContent||''));
      if(card){const b=card.querySelector('b');if(b)b.textContent=money(todaySales());}
    }
    if(section==='customers')renderCustomers();
  }

  function filterCustomers(q){const needle=String(q||'').trim().toLowerCase();document.querySelectorAll('#customerManagement .nr-table tbody tr').forEach(row=>{if(row.querySelector('.empty'))return;row.style.display=!needle||row.textContent.toLowerCase().includes(needle)?'':'none';});}

  function run(){decorate();}
  function boot(){
    const api=window.NRCustomerDashboard;if(!api||api.__enhanced)return;
    const original=api.open;
    api.open=function(id){original(id);setTimeout(run,0);setTimeout(run,100);setTimeout(run,300);};
    api.__enhanced=true;run();
  }
  window.addEventListener('load',()=>{setTimeout(boot,1800);setTimeout(boot,3200);setTimeout(run,4200);});
  window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
