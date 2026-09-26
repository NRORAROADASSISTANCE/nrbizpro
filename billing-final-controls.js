// NR BizPro — final billing controls: discount at bill time + edit + delete
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>typeof window.money==='function'?window.money(v):'₹'+(Number(v)||0).toFixed(2);
  const stateNow=()=>window.state||{};
  const items=()=>{const all=Array.isArray(stateNow().items)?stateNow().items:[];const guard=window.NRBizProWorkspace?.visibleItems;return typeof guard==='function'?guard():all;};
  const bills=()=>Array.isArray(stateNow().bills)?stateNow().bills:[];
  const billDateKey=b=>{const v=String(b?.billDate||b?.date||'');const m=v.match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return m[1]+'-'+m[2]+'-'+m[3];const d=new Date(v);return Number.isNaN(d.getTime())?'':d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const todayKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const isTodayBill=b=>billDateKey(b)===todayKey();
  function calc(lines,type,value){
    let sub=0,gst=0;
    lines.forEach(x=>{const a=(Number(x.price)||0)*(Number(x.qty)||0);sub+=a;gst+=a*(Number(x.gst)||0)/100;});
    const disc=type==='percent'?Math.min(sub,Math.max(0,sub*Number(value||0)/100)):Math.min(sub,Math.max(0,Number(value||0)));
    const taxable=Math.max(0,sub-disc); gst=sub?gst*(taxable/sub):0;
    return {sub,disc,gst,total:taxable+gst};
  }
  function openNewBill(){
    const s=stateNow(); window.__nrBillCart=[];
    const now=new Date(), local=new Date(now.getTime()-now.getTimezoneOffset()*60000);
    window.openModal('Create New Bill',`
      <div class="modal-grid">
        <label class="field">Customer Name<input id="fbCustomer" value="Walk-in Customer"></label>
        <label class="field">Customer Mobile<input id="fbMobile" placeholder="Mobile number"></label>
        <label class="field wide">Customer Address<textarea id="fbAddress" rows="2"></textarea></label>
        <label class="field">Customer GSTIN<input id="fbGstin" placeholder="Optional GSTIN"></label>
        <label class="field">Bill Date *<input id="fbDate" type="date" value="${local.toISOString().slice(0,10)}"></label>
        <label class="field">Bill Time *<input id="fbTime" type="time" value="${local.toISOString().slice(11,16)}"></label>
        <label class="field wide">Search Product / Barcode<input id="fbSearch" autocomplete="off" placeholder="Type product name or scan barcode"></label>
      </div>
      <div id="fbSuggestions" class="suggestions"></div>
      <div id="fbLines" class="bill-lines"></div>
      <div class="modal-grid" style="margin-top:14px">
        <label class="field"><b>Discount</b><select id="fbDiscountType"><option value="percent">Percentage (%)</option><option value="amount">Amount (₹)</option></select></label>
        <label class="field"><b>Discount Value</b><input id="fbDiscountValue" type="number" min="0" step="0.01" value="0" placeholder="Enter discount"></label>
      </div>
      <div class="bill-total" style="margin-top:12px;padding:12px;border:1px solid #dfe5ef;border-radius:10px">
        <span>Subtotal: <b id="fbSub">₹0.00</b></span> &nbsp;
        <span>Discount: <b id="fbDisc">₹0.00</b></span> &nbsp;
        <span>GST: <b id="fbGst">₹0.00</b></span> &nbsp;
        <b>Grand Total: <span id="fbTotal">₹0.00</span></b>
      </div>

      <div style="margin-top:16px;padding:14px;border:1px solid #dfe5ef;border-radius:10px">
        <h3 style="margin:0 0 12px">Payment Details</h3>
        <div class="modal-grid">
          <label class="field">Payment Mode<select id="fbPaymentMode">
            <option value="Cash">Cash</option>
            <option value="UPI / Online">UPI / Online</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Finance / EMI">Finance / EMI</option>
            <option value="Credit / Due">Credit / Due</option>
            <option value="Mixed">Mixed</option>
          </select></label>
          <label class="field">Amount Received<input id="fbReceived" type="number" min="0" step="0.01" value="0"></label>
          <label class="field">Transaction / Reference No.<input id="fbPaymentRef" placeholder="UPI ref / transaction no."></label>
          <label class="field">Payment Status<select id="fbPaymentStatus"><option value="Paid">Paid</option><option value="Partial">Partial</option><option value="Due">Due</option></select></label>
        </div>
        <div id="fbMixedBox" style="display:none;margin-top:10px">
          <div class="modal-grid">
            <label class="field">Cash Amount<input id="fbCashAmount" type="number" min="0" step="0.01" value="0"></label>
            <label class="field">Online / UPI Amount<input id="fbOnlineAmount" type="number" min="0" step="0.01" value="0"></label>
          </div>
        </div>
        <div id="fbFinanceBox" style="display:none;margin-top:10px">
          <div class="modal-grid">
            <label class="field">Finance Company<input id="fbFinanceCompany" placeholder="Bajaj / HDFC / TVS Credit / etc."></label>
            <label class="field">Loan / Agreement No.<input id="fbLoanNo" placeholder="Loan reference number"></label>
            <label class="field">Down Payment<input id="fbDownPayment" type="number" min="0" step="0.01" value="0"></label>
            <label class="field">Finance Amount<input id="fbFinanceAmount" type="number" min="0" step="0.01" value="0"></label>
            <label class="field">EMI Amount<input id="fbEmi" type="number" min="0" step="0.01" value="0"></label>
            <label class="field">Tenure<input id="fbTenure" placeholder="12 / 24 / 36 months"></label>
          </div>
        </div>
        <div id="fbBalanceBox" class="bill-summary" style="margin-top:10px"></div>
      </div>

      <div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button type="button" class="secondary" id="fbPrint">Generate &amp; Print</button><button type="button" class="primary" id="fbSave">Generate Bill</button></div>`);
    const search=document.getElementById('fbSearch');
    const paymentMode=document.getElementById('fbPaymentMode'),received=document.getElementById('fbReceived'),status=document.getElementById('fbPaymentStatus');
    const financeBox=document.getElementById('fbFinanceBox'),mixedBox=document.getElementById('fbMixedBox');

    const updatePaymentUI=()=>{
      const mode=paymentMode.value,total=calc(window.__nrBillCart,document.getElementById('fbDiscountType').value,document.getElementById('fbDiscountValue').value).total;
      financeBox.style.display=mode==='Finance / EMI'?'block':'none';
      mixedBox.style.display=mode==='Mixed'?'block':'none';
      if(mode==='Credit / Due'){received.value='0';status.value='Due'}
      else if(mode==='Finance / EMI'){received.value=Number(document.getElementById('fbDownPayment')?.value||0).toFixed(2);status.value=Number(received.value)>=total?'Paid':Number(received.value)>0?'Partial':'Due'}
      else if(mode!=='Mixed'&&status.value==='Due'&&Number(received.value)>=total)status.value='Paid';
      updateBalance();
    };
    const updateBalance=()=>{
      const total=calc(window.__nrBillCart,document.getElementById('fbDiscountType').value,document.getElementById('fbDiscountValue').value).total;
      let got=Number(received.value)||0;
      if(paymentMode.value==='Finance / EMI')got=Number(document.getElementById('fbDownPayment')?.value)||0;
      if(paymentMode.value==='Mixed')got=(Number(document.getElementById('fbCashAmount')?.value)||0)+(Number(document.getElementById('fbOnlineAmount')?.value)||0);
      const balance=Math.max(0,total-got);
      document.getElementById('fbBalanceBox').innerHTML='<div><span>Grand Total</span><b>'+money(total)+'</b></div><div><span>Paid / Received</span><b>'+money(got)+'</b></div><div class="bill-net"><span>Balance Due</span><strong>'+money(balance)+'</strong></div>';
      if(paymentMode.value!=='Credit / Due'&&paymentMode.value!=='Finance / EMI'&&paymentMode.value!=='Mixed'){
        status.value=got>=total?'Paid':got>0?'Partial':'Due';
      }
    };

    const draw=()=>{
      const lines=window.__nrBillCart, box=document.getElementById('fbLines');
      box.innerHTML=lines.map((l,n)=>{const i=items().find(x=>x.id===l.id);return i?`<div class="bill-line"><span><b>${esc(i.name)}</b><small>${esc(i.unit||'')}</small></span><span><button type="button" onclick="window.__fbQty(${n},-1)">−</button> ${l.qty} <button type="button" onclick="window.__fbQty(${n},1)">+</button></span><b>${money((Number(i.sell)||0)*l.qty)}</b><button type="button" onclick="window.__fbRemove(${n})">×</button></div>`:''}).join('')||'<div class="empty">Add products or scan a barcode.</div>';
      const c=calc(lines,document.getElementById('fbDiscountType').value,document.getElementById('fbDiscountValue').value);
      document.getElementById('fbSub').textContent=money(c.sub);document.getElementById('fbDisc').textContent=money(c.disc);document.getElementById('fbGst').textContent=money(c.gst);document.getElementById('fbTotal').textContent=money(c.total);
      updatePaymentUI();
    };
    window.__fbQty=(n,d)=>{const l=window.__nrBillCart[n];if(l){l.qty=Math.max(1,l.qty+d);draw()}};
    window.__fbRemove=n=>{window.__nrBillCart.splice(n,1);draw()};
    search.oninput=()=>{const q=search.value.trim().toLowerCase(),box=document.getElementById('fbSuggestions');if(!q){box.innerHTML='';return}const a=items().filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase()===q).slice(0,10);box.innerHTML=a.map(i=>`<button type="button" class="suggestion" data-id="${esc(i.id)}"><b>${esc(i.name)}</b><span>${money(i.sell)} • Stock ${esc(i.stock??0)}</span></button>`).join('')||'<div class="empty">No product found</div>';box.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const i=items().find(x=>x.id===b.dataset.id);if(!i)return;if(i.type!=='Service'&&Number(i.stock)<=0)return alert('Out of stock');const l=window.__nrBillCart.find(x=>x.id===i.id);if(l)l.qty++;else window.__nrBillCart.push({id:i.id,qty:1});search.value='';box.innerHTML='';draw()})};
    search.onkeydown=e=>{if(e.key==='Enter'){const q=search.value.trim().toLowerCase(),i=items().find(x=>String(x.barcode||'').toLowerCase()===q);if(i){e.preventDefault();if(i.type!=='Service'&&Number(i.stock)<=0)return alert('Out of stock');const l=window.__nrBillCart.find(x=>x.id===i.id);if(l)l.qty++;else window.__nrBillCart.push({id:i.id,qty:1});search.value='';document.getElementById('fbSuggestions').innerHTML='';draw()}}};
    document.getElementById('fbDiscountType').onchange=draw;document.getElementById('fbDiscountValue').oninput=draw;
    paymentMode.onchange=updatePaymentUI;received.oninput=updateBalance;status.onchange=updateBalance;
    ['fbCashAmount','fbOnlineAmount','fbDownPayment','fbFinanceAmount'].forEach(id=>document.getElementById(id)?.addEventListener('input',updatePaymentUI));

    const saveBill=(print)=>{
      const d=document.getElementById('fbDate').value,t=document.getElementById('fbTime').value;
      if(!d||!t)return alert('Bill Date and Time are compulsory.');
      if(!window.__nrBillCart.length)return alert('Add at least one product');
      const lines=window.__nrBillCart.map(l=>{const i=items().find(x=>x.id===l.id);return {id:i.id,name:i.name,type:i.type||'Product',qty:l.qty,price:Number(i.sell)||0,gst:Number(i.gst)||0,amount:(Number(i.sell)||0)*l.qty,vehicleDetails:i.vehicleDetails||null}});
      const typ=document.getElementById('fbDiscountType').value,val=Number(document.getElementById('fbDiscountValue').value)||0,c=calc(lines,typ,val);
      const mode=paymentMode.value;let paid=Number(received.value)||0;
      if(mode==='Finance / EMI')paid=Number(document.getElementById('fbDownPayment').value)||0;
      if(mode==='Mixed')paid=(Number(document.getElementById('fbCashAmount').value)||0)+(Number(document.getElementById('fbOnlineAmount').value)||0);
      const balance=Math.max(0,c.total-paid);
      if(paid>c.total)return alert('Received amount cannot exceed grand total.');
      if(mode==='Finance / EMI' && Number(document.getElementById('fbFinanceAmount').value||0)>c.total)return alert('Finance amount cannot exceed grand total.');
      lines.forEach(x=>{const i=items().find(y=>y.id===x.id);if(i&&i.type!=='Service')i.stock=Math.max(0,(Number(i.stock)||0)-x.qty)});
      const arr=bills(),b={id:crypto.randomUUID(),invoice:'INV-'+String(arr.length+1).padStart(4,'0'),date:new Date(d+'T'+t).toISOString(),billDate:d,billTime:t,billDateTime:d+'T'+t,customer:document.getElementById('fbCustomer').value.trim()||'Walk-in Customer',mobile:document.getElementById('fbMobile').value.trim(),customerAddress:document.getElementById('fbAddress').value.trim(),customerGstin:document.getElementById('fbGstin').value.trim(),items:lines,businessId:window.currentUser?.id||'',businessType:window.currentUser?.category||stateNow().settings?.category||'',businessCategory:window.currentUser?.category||stateNow().settings?.category||'',businessCategoryKey:window.NRBizProWorkspace?.normalizeCategory?.(window.currentUser?.category||stateNow().settings?.category||'General Business')||'general',subtotal:c.sub,discount:c.disc,discountType:typ,discountValue:val,gstAmount:c.gst,total:c.total,paymentMode:mode,paymentStatus:document.getElementById('fbPaymentStatus').value,amountReceived:paid,balanceDue:balance,paymentReference:document.getElementById('fbPaymentRef').value.trim(),cashAmount:mode==='Mixed'?Number(document.getElementById('fbCashAmount').value)||0:0,onlineAmount:mode==='Mixed'?Number(document.getElementById('fbOnlineAmount').value)||0:0,finance:mode==='Finance / EMI'?{company:document.getElementById('fbFinanceCompany').value.trim(),loanNo:document.getElementById('fbLoanNo').value.trim(),downPayment:Number(document.getElementById('fbDownPayment').value)||0,financeAmount:Number(document.getElementById('fbFinanceAmount').value)||0,emi:Number(document.getElementById('fbEmi').value)||0,tenure:document.getElementById('fbTenure').value.trim()}:null};
      arr.push(b);s.bills=arr;
      // Auto-create/update customer master from every bill so customer mapping never gets lost.
      if(!/^walk-in customer$/i.test(String(b.customer||''))){
        s.customers=Array.isArray(s.customers)?s.customers:[];
        const keyMobile=String(b.mobile||'').trim(), keyName=String(b.customer||'').trim().toLowerCase();
        let cst=s.customers.find(x=>keyMobile&&String(x.mobile||'').trim()===keyMobile)||s.customers.find(x=>!keyMobile&&String(x.name||'').trim().toLowerCase()===keyName);
        if(!cst){cst={id:crypto.randomUUID(),name:b.customer,mobile:b.mobile||'',email:b.customerEmail||'',gst:b.customerGstin||'',address:b.customerAddress||'',bills:0,total:0,createdAt:new Date().toISOString()};s.customers.push(cst)}
        cst.name=b.customer||cst.name;cst.mobile=b.mobile||cst.mobile;cst.gst=b.customerGstin||cst.gst;cst.address=b.customerAddress||cst.address;cst.bills=Number(cst.bills||0)+1;cst.total=Number(cst.total||0)+Number(b.total||0);
      }
      if(typeof window.save==='function')window.save();closeModal();if(typeof window.renderBills==='function')window.renderBills();if(typeof window.renderCustomers==='function')window.renderCustomers();if(typeof window.NRBizProUniversalCustomers?.render==='function')window.NRBizProUniversalCustomers.render();if(typeof window.updateStats==='function')window.updateStats();if(print&&typeof window.NRBillPrint==='function')window.NRBillPrint(b.id);else if(print&&typeof window.printBill==='function')window.printBill(b.id);else alert('Bill generated successfully: '+b.invoice);
    };
    document.getElementById('fbSave').onclick=()=>saveBill(false);document.getElementById('fbPrint').onclick=()=>saveBill(true);draw();search.focus();
  }
  function editBill(id){
    const b=bills().find(x=>x.id===id);if(!b)return alert('Bill not found');if(!isTodayBill(b))return alert("Only today's bills can be edited. Old bills are view/print/delete only.");const its=items();window.__nrEditCart=(b.items||[]).map(x=>({id:x.id,qty:Number(x.qty)||1,price:Number(x.price)||0,gst:Number(x.gst)||0,name:x.name||''}));
    window.openModal('Edit Bill',`<div class="modal-grid"><label class="field">Customer Name<input id="feCustomer" value="${esc(b.customer||'Walk-in Customer')}"></label><label class="field">Customer Mobile<input id="feMobile" value="${esc(b.mobile||'')}"></label><label class="field wide">Customer Address<textarea id="feAddress" rows="2">${esc(b.customerAddress||'')}</textarea></label><label class="field">Customer GSTIN<input id="feGstin" value="${esc(b.customerGstin||'')}"></label><label class="field wide">Add Item<select id="feItem"><option value="">Select product</option>${its.map(i=>`<option value="${esc(i.id)}">${esc(i.name)} — ${money(i.sell)}</option>`).join('')}</select></label></div><div id="feLines" class="bill-lines"></div><div class="modal-grid"><label class="field"><b>Discount</b><select id="feDiscountType"><option value="percent">Percentage (%)</option><option value="amount">Amount (₹)</option></select></label><label class="field"><b>Discount Value</b><input id="feDiscountValue" type="number" min="0" step="0.01"></label></div><div class="bill-total">Subtotal: <b id="feSub">₹0.00</b> &nbsp; Discount: <b id="feDisc">₹0.00</b> &nbsp; GST: <b id="feGst">₹0.00</b> &nbsp; Grand Total: <b id="feTotal">₹0.00</b></div><div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button type="button" class="primary" id="feSave">Save Changes</button></div>`);
    document.getElementById('feDiscountType').value=b.discountType||'percent';document.getElementById('feDiscountValue').value=Number(b.discountValue)||0;
    const draw=()=>{const lines=window.__nrEditCart,box=document.getElementById('feLines');box.innerHTML=lines.map((l,n)=>`<div class="bill-line"><span><b>${esc(l.name||(its.find(i=>i.id===l.id)?.name||'Item'))}</b></span><span><button type="button" onclick="window.__feQty(${n},-1)">−</button> ${l.qty} <button type="button" onclick="window.__feQty(${n},1)">+</button></span><b>${money(l.price*l.qty)}</b><button type="button" onclick="window.__feRemove(${n})">×</button></div>`).join('')||'<div class="empty">No items</div>';const c=calc(lines,document.getElementById('feDiscountType').value,document.getElementById('feDiscountValue').value);document.getElementById('feSub').textContent=money(c.sub);document.getElementById('feDisc').textContent=money(c.disc);document.getElementById('feGst').textContent=money(c.gst);document.getElementById('feTotal').textContent=money(c.total)};
    window.__feQty=(n,d)=>{const l=window.__nrEditCart[n];if(l){l.qty=Math.max(1,l.qty+d);draw()}};window.__feRemove=n=>{window.__nrEditCart.splice(n,1);draw()};document.getElementById('feItem').onchange=e=>{const i=its.find(x=>x.id===e.target.value);if(i)window.__nrEditCart.push({id:i.id,qty:1,price:Number(i.sell)||0,gst:Number(i.gst)||0,name:i.name});e.target.value='';draw()};document.getElementById('feDiscountType').onchange=draw;document.getElementById('feDiscountValue').oninput=draw;
    document.getElementById('feSave').onclick=()=>{const lines=window.__nrEditCart.map(l=>{const i=its.find(x=>x.id===l.id);return{id:l.id,name:i?.name||l.name,type:i?.type||'Product',qty:l.qty,price:Number(l.price)||Number(i?.sell)||0,gst:Number(i?.gst)||Number(l.gst)||0,amount:(Number(l.price)||Number(i?.sell)||0)*l.qty}});const c=calc(lines,document.getElementById('feDiscountType').value,document.getElementById('feDiscountValue').value);Object.assign(b,{customer:document.getElementById('feCustomer').value.trim()||'Walk-in Customer',mobile:document.getElementById('feMobile').value.trim(),customerAddress:document.getElementById('feAddress').value.trim(),customerGstin:document.getElementById('feGstin').value.trim(),items:lines,subtotal:c.sub,discount:c.disc,discountType:document.getElementById('feDiscountType').value,discountValue:Number(document.getElementById('feDiscountValue').value)||0,gstAmount:c.gst,total:c.total});if(typeof window.save==='function')window.save();closeModal();if(typeof window.renderBills==='function')window.renderBills();if(typeof window.updateStats==='function')window.updateStats();alert('Bill updated successfully')};draw();
  }
  function deleteBill(id){const b=bills().find(x=>x.id===id);if(!b)return;if(!confirm('Delete invoice '+(b.invoice||'')+'? This cannot be undone.'))return;stateNow().bills=bills().filter(x=>x.id!==id);if(typeof window.save==='function')window.save();if(typeof window.renderBills==='function')window.renderBills();if(typeof window.updateStats==='function')window.updateStats();alert('Bill deleted successfully');}
  function render(){const tb=document.getElementById('billTable');if(!tb)return;const q=(document.getElementById('billSearch')?.value||'').trim().toLowerCase();const list=bills().slice().reverse().filter(b=>!q||`${b.invoice||''} ${b.customer||''} ${b.mobile||''}`.toLowerCase().includes(q));tb.innerHTML=list.length?list.map(b=>`<tr><td><b>${esc(b.invoice||'—')}</b></td><td>${esc(b.billDate||new Date(b.date||Date.now()).toLocaleDateString('en-IN'))}<br><small>${esc(b.billTime||'')}</small></td><td>${esc(b.customer||'Walk-in Customer')}<br><small>${esc(b.mobile||'')}</small></td><td>${(b.items||[]).length}</td><td><b>${money(b.total)}</b><br><small>Discount: ${money(b.discount||0)}</small></td><td><button type="button" class="secondary" onclick="window.NRBillEdit('${b.id}')">Edit</button> <button type="button" class="secondary" onclick="window.NRBillPrint('${b.id}')">Print</button> <button type="button" class="danger" onclick="window.NRBillDelete('${b.id}')">Delete</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No bills found.</td></tr>'}
  function install(){window.openBillModal=openNewBill;window.launchNewBill=openNewBill;window.NRBillEdit=editBill;window.NRBillDelete=deleteBill;window.renderBills=render;}
  install();window.addEventListener('load',install);setInterval(install,1500);
})();
