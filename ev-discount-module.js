// NR BizPro — EV Showroom Bill Discount addon
(function(){
  const DISCOUNT_ID='__NR_EV_BILL_DISCOUNT__';
  const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
  function isEV(){
    const c=String((typeof currentUser!=='undefined'&&currentUser?.category)||state?.settings?.category||'').toLowerCase();
    return /ev two|electric two|ev 2|ev scooter|ev bike/.test(c);
  }
  function refreshDiscount(){
    if(!window.billCart||!Array.isArray(window.billCart)) return;
    const type=document.getElementById('evDiscountType');
    const input=document.getElementById('evDiscountValue');
    if(!type||!input) return;
    const raw=Math.max(0,Number(input.value)||0);
    const base=window.billCart.filter(l=>l.id!==DISCOUNT_ID).reduce((s,l)=>{
      const i=state.items.find(x=>x.id===l.id); return s+(i?(Number(i.sell)||0)*(Number(l.qty)||0):0);
    },0);
    const discount=Math.min(base,type.value==='percent'?base*raw/100:raw);
    window.billCart=window.billCart.filter(l=>l.id!==DISCOUNT_ID);
    if(discount>0){
      let item=state.items.find(i=>i.id===DISCOUNT_ID);
      if(!item){
        item={id:DISCOUNT_ID,name:'Discount',barcode:'',type:'Discount',cost:0,margin:0,marginType:'fixed',sell:-discount,gst:0,stock:999999,brand:'',variant:'',color:'',batteryCapacity:'',serial:'',notes:'',industry:'EV-TWO-WHEELER'};
        state.items.push(item);
      }else item.sell=-discount;
      window.billCart.push({id:DISCOUNT_ID,qty:1});
    }
    const gst=window.billCart.reduce((s,l)=>{const i=state.items.find(x=>x.id===l.id);const a=i?(Number(i.sell)||0)*(Number(l.qty)||0):0;return s+a*(Number(i?.gst)||0)/100},0);
    const subtotal=window.billCart.reduce((s,l)=>{const i=state.items.find(x=>x.id===l.id);return s+(i?(Number(i.sell)||0)*(Number(l.qty)||0):0)},0);
    const total=Math.max(0,subtotal+gst);
    const paid=Math.min(total,Math.max(0,Number(document.getElementById('evPaid')?.value)||0));
    const due=Math.max(0,total-paid);
    const dueEl=document.getElementById('evDue'); if(dueEl) dueEl.value=due.toFixed(2);
    const ps=document.getElementById('evPayStatus'); if(ps) ps.value=due<=0&&total>0?'Paid':paid>0?'Partially Paid':'Due';
    const sm=document.getElementById('evSummary');
    if(sm) sm.innerHTML=`<div><span>Subtotal</span><b>${money(subtotal)}</b></div><div><span>GST</span><b>${money(gst)}</b></div><div><span>Discount</span><b>${money(discount)}</b></div><div class="bill-net"><span>Net Amount</span><strong>${money(total)}</strong></div><div><span>Paid</span><b>${money(paid)}</b></div><div><span>Due</span><b>${money(due)}</b></div>`;
  }
  function attach(){
    if(!isEV()||!document.getElementById('evGenerate')||document.getElementById('evDiscountValue')) return;
    const summary=document.getElementById('evSummary');
    const wrap=document.createElement('div');
    wrap.className='modal-grid';
    wrap.style.margin='14px 0 0';
    wrap.innerHTML=`<label class="field">Discount Type<select id="evDiscountType"><option value="amount">Fixed Amount (₹)</option><option value="percent">Percentage (%)</option></select></label><label class="field">Discount Value<input id="evDiscountValue" type="number" min="0" step="0.01" value="0" placeholder="Enter discount"></label>`;
    summary?.parentNode?.insertBefore(wrap,summary);
    document.getElementById('evDiscountValue').addEventListener('input',refreshDiscount);
    document.getElementById('evDiscountType').addEventListener('change',refreshDiscount);
    const btn=document.getElementById('evGenerate');
    const original=btn.onclick;
    btn.onclick=function(){
      refreshDiscount();
      const had=state.items.find(i=>i.id===DISCOUNT_ID);
      try{return original.call(this)}finally{
        state.items=state.items.filter(i=>i.id!==DISCOUNT_ID);
        save();
      }
    };
    refreshDiscount();
  }
  const originalLaunch=window.launchNewBill;
  if(typeof originalLaunch==='function'){
    window.launchNewBill=function(){
      const result=originalLaunch.apply(this,arguments);
      setTimeout(attach,0);
      setTimeout(attach,50);
      return result;
    };
  }
})();
