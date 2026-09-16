// NR BizPro — Payments & Outstanding enhancements
(function(){'use strict';
  const S=()=>window.state||{};
  const bills=()=>Array.isArray(S().bills)?S().bills:[];
  const money=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const amount=b=>Number(b?.total??b?.grandTotal??b?.amount??0)||0;
  const paid=b=>{const v=b?.paidAmount??b?.amountPaid??b?.receivedAmount??b?.received??b?.paid; if(v!==undefined&&v!=='')return Math.max(0,Number(v)||0); const st=String(b?.paymentStatus??b?.status??'').toLowerCase(); return /paid|settled|complete/.test(st)?amount(b):0};
  const due=b=>Math.max(0,Number(b?.dueAmount??b?.balance??(amount(b)-paid(b)))||0);
  const label=b=>b?.invoiceNo??b?.invoiceNumber??b?.billNo??b?.number??b?.id??'Bill';
  const customer=b=>b?.customerName??b?.customer??b?.partyName??'Walk-in Customer';
  const save=()=>{try{window.save?.();}catch(e){}}
  function render(){
    const host=document.getElementById('customerManagement');if(!host)return;
    const active=host.querySelector('.nr-side.active');if(!active||active.dataset.nr!=='payments')return;
    const bs=bills(), total=bs.reduce((x,b)=>x+amount(b),0), collected=bs.reduce((x,b)=>x+paid(b),0), outstanding=bs.reduce((x,b)=>x+due(b),0);
    const cards=host.querySelectorAll('.nr-cards>div');
    if(cards[0])cards[0].innerHTML='<span>Receivables</span><b>'+money(outstanding)+'</b>';
    if(cards[1])cards[1].innerHTML='<span>Payables</span><b>₹0</b>';
    if(cards[2])cards[2].innerHTML='<span>Collected Today</span><b>'+money(collected)+'</b>';
    const old=host.querySelector('.nr-empty');
    const box=document.createElement('div');box.className='nr-payment-list';
    box.innerHTML='<div class="nr-head"><div><h3>Invoice Payments</h3><p>Track received amount and customer outstanding.</p></div></div>'+
      '<div class="nr-table"><table><thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Action</th></tr></thead><tbody>'+
      (bs.length?bs.map((b,i)=>'<tr><td>'+esc(label(b))+'</td><td>'+esc(customer(b))+'</td><td>'+money(amount(b))+'</td><td>'+money(paid(b))+'</td><td><b>'+money(due(b))+'</b></td><td><button type="button" data-pay-index="'+i+'">Record Payment</button></td></tr>').join(''):'<tr><td colspan="6" class="empty">No invoices yet.</td></tr>')+
      '</tbody></table></div>';
    if(old)old.replaceWith(box);else{const tables=host.querySelector('.nr-table');(tables?.parentElement||host.querySelector('.nr-content')||host).appendChild(box)}
    box.querySelectorAll('[data-pay-index]').forEach(btn=>btn.onclick=()=>openPayment(Number(btn.dataset.payIndex)));
  }
  function openPayment(i){
    const b=bills()[i];if(!b)return;const d=due(b);if(d<=0)return alert('This invoice has no outstanding amount.');
    const body='<div class="modal-grid"><label class="field">Invoice<input value="'+esc(label(b))+'" disabled></label><label class="field">Customer<input value="'+esc(customer(b))+'" disabled></label><label class="field">Outstanding<input value="'+money(d)+'" disabled></label><label class="field">Payment Amount<input id="nrPayAmount" type="number" min="0.01" max="'+d.toFixed(2)+'" step="0.01" value="'+d.toFixed(2)+'"></label><label class="field">Payment Method<select id="nrPayMethod"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Other</option></select></label></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="nrSavePayment">Save Payment</button></div>';
    if(typeof window.openModal!=='function')return alert('Payment module is ready.');
    window.openModal('Record Customer Payment',body);
    document.getElementById('nrSavePayment').onclick=()=>{
      const p=Math.min(d,Math.max(0,Number(document.getElementById('nrPayAmount').value)||0));if(!p)return alert('Enter payment amount.');
      const oldPaid=paid(b);b.paidAmount=oldPaid+p;b.amountPaid=b.paidAmount;b.paymentMethod=document.getElementById('nrPayMethod').value;b.paymentDate=new Date().toISOString();b.paymentStatus=b.paidAmount>=amount(b)?'Paid':'Partial';
      save();window.closeModal?.();render();alert('Payment recorded successfully.');
    };
  }
  function boot(){
    const api=window.NRCustomerDashboard;if(!api||api.__financeEnhanced)return;
    const original=api.open;api.open=function(id){original(id);setTimeout(render,0);setTimeout(render,120)};api.__financeEnhanced=true;render();
  }
  window.addEventListener('load',()=>{setTimeout(boot,2200);setTimeout(boot,3600)});
  window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
