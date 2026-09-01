// Bill totals: subtotal, discount, GST and final net amount.
(function(){
  let originalOpen=null;
  let originalSave=null;
  let installed=false;

  function money(n){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0)}
  function num(id){return Number(document.getElementById(id)?.value)||0}
  function cartTotals(){
    const cart=window.billCart||[];
    let subtotal=0;
    let gst=0;
    cart.forEach(l=>{
      const i=window.state?.items?.find(x=>x.id===l.id);
      if(!i)return;
      const line=Number(i.sell||0)*Number(l.qty||0);
      subtotal+=line;
      gst+=line*(Number(i.gst||0)/100);
    });
    return {subtotal,gst};
  }
  function calc(){
    const t=cartTotals();
    const discountType=document.getElementById('billDiscountType')?.value||'percent';
    const discountInput=num('billDiscount');
    const discount=discountType==='percent'?t.subtotal*discountInput/100:Math.min(discountInput,t.subtotal);
    const taxable=Math.max(0,t.subtotal-discount);
    const gross=t.subtotal||0;
    const gst=t.subtotal? t.gst*(taxable/t.subtotal):0;
    const net=taxable+gst;
    const s=document.getElementById('billSummary');
    if(s)s.innerHTML=`<div><span>Subtotal</span><b>${money(gross)}</b></div><div><span>Discount</span><b>− ${money(discount)}</b></div><div><span>GST</span><b>${money(gst)}</b></div><div class="bill-net"><span>Net Amount</span><strong>${money(net)}</strong></div>`;
    const total=document.getElementById('bTotal');if(total)total.textContent=money(net);
    return {subtotal:gross,discount,gst,net,discountType,discountInput};
  }
  function installFields(){
    const lines=document.getElementById('billLines');
    if(!lines||document.getElementById('billSummary'))return;
    const wrap=document.createElement('div');
    wrap.innerHTML=`<div class="bill-adjustments"><label class="field">Discount Type<select id="billDiscountType"><option value="percent">Percentage (%)</option><option value="fixed">Fixed Amount (₹)</option></select></label><label class="field">Discount<input id="billDiscount" type="number" min="0" step="0.01" value="0"></label></div><div id="billSummary" class="bill-summary"></div>`;
    lines.insertAdjacentElement('afterend',wrap);
    ['billDiscountType','billDiscount'].forEach(id=>document.getElementById(id)?.addEventListener('input',calc));
    calc();
  }
  function patch(){
    if(typeof window.openBillModal==='function' && window.openBillModal!==originalOpen){
      originalOpen=window.openBillModal;
      window.openBillModal=function(){originalOpen.apply(this,arguments);setTimeout(installFields,0);setTimeout(calc,30)};
    }
    if(typeof window.renderCart==='function'){
      const rc=window.renderCart;
      if(!rc.__billTotalsWrapped){
        function wrapped(){const r=rc.apply(this,arguments);setTimeout(()=>{installFields();calc()},0);return r}
        wrapped.__billTotalsWrapped=true;window.renderCart=wrapped;
      }
    }
    if(typeof window.saveBill==='function' && window.saveBill!==originalSave){
      originalSave=window.saveBill;
      window.saveBill=function(){
        const totals=calc();
        const beforeCount=window.state?.bills?.length||0;
        originalSave.apply(this,arguments);
        const bills=window.state?.bills||[];
        if(bills.length>beforeCount){
          const bill=bills[0];
          const oldTotal=Number(bill.total)||0;
          bill.subtotal=totals.subtotal;
          bill.discount=totals.discount;
          bill.gstAmount=totals.gst;
          bill.netAmount=totals.net;
          bill.total=totals.net;
          const customer=window.state?.customers?.find(c=>c.mobile===bill.mobile&&bill.mobile);
          if(customer)customer.total+=(totals.net-oldTotal);
          if(typeof window.save==='function')window.save();
          if(typeof window.renderBills==='function')window.renderBills();
          if(typeof window.renderCustomers==='function')window.renderCustomers();
        }
      };
    }
  }
  function addStyles(){
    if(document.getElementById('billTotalsStyles'))return;
    const s=document.createElement('style');s.id='billTotalsStyles';
    s.textContent='.bill-adjustments{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.bill-summary{margin-top:12px;padding:13px 14px;border:1px solid #e7ebf2;border-radius:10px;background:#fbfcfe}.bill-summary>div{display:flex;justify-content:space-between;gap:15px;padding:5px 0;color:#566174;font-size:13px}.bill-summary .bill-net{margin-top:7px;padding-top:10px;border-top:1px solid #e1e6ee;color:#172033;font-size:15px}.bill-summary .bill-net strong{font-size:21px}@media(max-width:760px){.bill-adjustments{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }
  function start(){addStyles();patch();new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
