// Credit sales + due-date reminders for NR BizPro.
(function(){
  const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#39;'}[m]));
  const originalOpen=window.openBillModal;
  const originalSave=window.saveBill;

  function dueSummary(){
    if(!window.state?.bills)return {overdue:[],today:[],upcoming:[]};
    const now=new Date();now.setHours(0,0,0,0);
    const overdue=[],today=[],upcoming=[];
    window.state.bills.forEach(b=>{
      if(!b.credit||!b.dueDate||Number(b.balance||b.total)<=0)return;
      const d=new Date(b.dueDate+'T00:00:00'); if(Number.isNaN(d.getTime()))return;
      const item={...b,balance:Number(b.balance??b.total)};
      if(d<now)overdue.push(item);else if(d.getTime()===now.getTime())today.push(item);else if((d-now)<=7*86400000)upcoming.push(item);
    });
    return {overdue,today,upcoming};
  }

  function patchBillModal(){
    if(typeof originalOpen!=='function'||window.__nrCreditPatched)return;
    window.__nrCreditPatched=true;
    window.openBillModal=function(){
      originalOpen();
      const box=document.getElementById('billLines'); if(!box)return;
      const wrap=document.createElement('div');wrap.id='creditOptions';wrap.style.cssText='margin-top:12px;padding:12px;border:1px solid #d8dee9;border-radius:12px;background:#f8fafc';
      wrap.innerHTML='<label style="display:flex;gap:8px;align-items:center;font-weight:700"><input id="bCredit" type="checkbox"> Credit Sale / Customer Due</label><div id="creditFields" style="display:none;margin-top:10px;display:none"><label class="field">Due Date<input id="bDueDate" type="date"></label><label class="field">Initial Payment (₹)<input id="bPaid" type="number" min="0" value="0"></label><p class="muted" style="margin:6px 0 0">Remaining amount will be tracked against this customer and shown in Due Reminders.</p></div>';
      box.parentNode.insertBefore(wrap,box);
      const cb=document.getElementById('bCredit'),fields=document.getElementById('creditFields'),due=document.getElementById('bDueDate');
      const today=new Date();today.setDate(today.getDate()+7);due.value=today.toISOString().slice(0,10);
      cb.addEventListener('change',()=>fields.style.display=cb.checked?'block':'none');
    };
  }

  window.saveBill=function(){
    const cb=document.getElementById('bCredit');
    if(!cb?.checked)return originalSave();
    if(!window.billCart?.length)return alert('Add at least one product');
    const due=document.getElementById('bDueDate')?.value;
    if(!due)return alert('Select a due date');
    let total=0;const lines=window.billCart.map(l=>{const i=state.items.find(x=>x.id===l.id);if(!i)return null;i.stock=Math.max(0,(+i.stock||0)-l.qty);total+=i.sell*l.qty;return{name:i.name,barcode:i.barcode||'',qty:l.qty,price:i.sell,gst:i.gst}}).filter(Boolean);
    if(!lines.length)return alert('Add at least one product');
    let paid=Math.max(0,Number(document.getElementById('bPaid')?.value)||0);paid=Math.min(paid,total);
    const balance=+(total-paid).toFixed(2);
    if(balance<=0)return alert('Remaining amount is ₹0. Use a normal paid sale instead.');
    const no=`INV-${String(state.bills.length+1).padStart(4,'0')}`,customer=document.getElementById('bCustomer').value.trim()||'Walk-in Customer',mobile=document.getElementById('bMobile').value.trim();
    state.bills.unshift({id:crypto.randomUUID(),invoice:no,date:new Date().toISOString(),customer,mobile,items:lines,total,credit:true,paid,balance,dueDate:due,paymentStatus:'due'});
    let c=state.customers.find(x=>x.mobile===mobile&&mobile);
    if(!c){c={id:crypto.randomUUID(),name:customer,mobile,email:'',bills:0,total:0,credit:0,due:0,lastDueDate:''};state.customers.push(c)}
    c.bills++;c.total+=total;c.credit=+(Number(c.credit||0)+total).toFixed(2);c.due=+(Number(c.due||0)+balance).toFixed(2);c.lastDueDate=due;
    save();closeModal();renderBills();renderCustomers();renderItems();updateStats();showTab('bills');renderDueReminders();
  };

  function renderDueReminders(){
    const host=document.getElementById('creditReminderPanel');if(!host)return;
    const d=dueSummary(),all=[...d.overdue,...d.today,...d.upcoming];
    host.innerHTML='<div class="panel-head"><div><p class="eyebrow">PAYMENT FOLLOW-UP</p><h2>💳 Credit & Due Reminders</h2><p class="muted">Track customer credit balances and remind customers on or before the due date.</p></div><div><b>'+all.length+'</b> pending</div></div>'+(all.length?'<div class="table-wrap"><table><thead><tr><th>Customer</th><th>Invoice</th><th>Due Date</th><th>Balance</th><th>Status</th><th>Reminder</th></tr></thead><tbody>'+all.sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)).map(b=>{const overdue=d.overdue.some(x=>x.id===b.id),today=d.today.some(x=>x.id===b.id);const phone=String(b.mobile||'').replace(/\D/g,'');const msg=encodeURIComponent('Hello '+b.customer+', reminder from '+(state.settings.name||'NR BizPro')+'. Invoice '+b.invoice+' has pending amount '+money(b.balance)+'. Due date: '+new Date(b.dueDate+'T00:00:00').toLocaleDateString('en-IN')+'. Thank you.');return '<tr><td><b>'+esc(b.customer)+'</b><br><small>'+esc(b.mobile||'')+'</small></td><td>'+esc(b.invoice)+'</td><td>'+new Date(b.dueDate+'T00:00:00').toLocaleDateString('en-IN')+'</td><td><b>'+money(b.balance)+'</b></td><td>'+(overdue?'🔴 Overdue':today?'🟠 Due Today':'🟡 Upcoming')+'</td><td>'+(phone?'<a class="secondary" target="_blank" href="https://wa.me/91'+phone+'?text='+msg+'">WhatsApp</a>':'<span class="muted">No mobile</span>')+'</td></tr>'}).join('')+'</tbody></table></div>':'<div class="empty">No pending customer dues. Credit sales with a due date will appear here.</div>');
  }

  function addPanel(){
    const app=document.getElementById('app');if(!app||document.getElementById('creditReminderPanel'))return;
    const panel=document.createElement('section');panel.id='creditReminderPanel';panel.className='card';panel.style.marginTop='18px';
    const tabs=document.querySelector('.tabs');if(tabs)tabs.parentNode.insertBefore(panel,tabs);else app.insertBefore(panel,app.firstChild);
    renderDueReminders();
  }

  const oldShow=window.showTab;
  window.showTab=function(id){const r=oldShow?.(id);if(id==='customers'||id==='bills')renderDueReminders();return r};
  function boot(){patchBillModal();addPanel();renderDueReminders();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
  setInterval(()=>{patchBillModal();addPanel();renderDueReminders()},10000);
})();
