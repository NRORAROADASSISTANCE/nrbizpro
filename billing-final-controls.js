// NR BizPro — final billing controls: discount at bill time + edit + delete
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>typeof window.money==='function'?window.money(v):'₹'+(Number(v)||0).toFixed(2);
  const stateNow=()=>window.state||{};
  const items=()=>Array.isArray(stateNow().items)?stateNow().items:[];
  const bills=()=>Array.isArray(stateNow().bills)?stateNow().bills:[];
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
      <div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button type="button" class="secondary" id="fbPrint">Generate &amp; Print</button><button type="button" class="primary" id="fbSave">Generate Bill</button></div>`);
    const search=document.getElementById('fbSearch');
    const draw=()=>{
      const lines=window.__nrBillCart, box=document.getElementById('fbLines');
      box.innerHTML=lines.map((l,n)=>{const i=items().find(x=>x.id===l.id);return i?`<div class="bill-line"><span><b>${esc(i.name)}</b><small>${esc(i.unit||'')}</small></span><span><button type="button" onclick="window.__fbQty(${n},-1)">−</button> ${l.qty} <button type="button" onclick="window.__fbQty(${n},1)">+</button></span><b>${money((Number(i.sell)||0)*l.qty)}</b><button type="button" onclick="window.__fbRemove(${n})">×</button></div>`:''}).join('')||'<div class="empty">Add products or scan a barcode.</div>';
      const c=calc(lines,document.getElementById('fbDiscountType').value,document.getElementById('fbDiscountValue').value);
      document.getElementById('fbSub').textContent=money(c.sub);document.getElementById('fbDisc').textContent=money(c.disc);document.getElementById('fbGst').textContent=money(c.gst);document.getElementById('fbTotal').textContent=money(c.total);
    };
    window.__fbQty=(n,d)=>{const l=window.__nrBillCart[n];if(l){l.qty=Math.max(1,l.qty+d);draw()}};
    window.__fbRemove=n=>{window.__nrBillCart.splice(n,1);draw()};
    search.oninput=()=>{const q=search.value.trim().toLowerCase(),box=document.getElementById('fbSuggestions');if(!q){box.innerHTML='';return}const a=items().filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase()===q).slice(0,10);box.innerHTML=a.map(i=>`<button type="button" class="suggestion" data-id="${esc(i.id)}"><b>${esc(i.name)}</b><span>${money(i.sell)} • Stock ${esc(i.stock??0)}</span></button>`).join('')||'<div class="empty">No product found</div>';box.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const i=items().find(x=>x.id===b.dataset.id);if(!i)return;if(i.type!=='Service'&&Number(i.stock)<=0)return alert('Out of stock');const l=window.__nrBillCart.find(x=>x.id===i.id);if(l)l.qty++;else window.__nrBillCart.push({id:i.id,qty:1});search.value='';box.innerHTML='';draw()})};
    search.onkeydown=e=>{if(e.key==='Enter'){const q=search.value.trim().toLowerCase(),i=items().find(x=>String(x.barcode||'').toLowerCase()===q);if(i){e.preventDefault();if(i.type!=='Service'&&Number(i.stock)<=0)return alert('Out of stock');const l=window.__nrBillCart.find(x=>x.id===i.id);if(l)l.qty++;else window.__nrBillCart.push({id:i.id,qty:1});search.value='';document.getElementById('fbSuggestions').innerHTML='';draw()}}};
    document.getElementById('fbDiscountType').onchange=draw;document.getElementById('fbDiscountValue').oninput=draw;
    const saveBill=(print)=>{const d=document.getElementById('fbDate').value,t=document.getElementById('fbTime').value;if(!d||!t)return alert('Bill Date and Time are compulsory.');if(!window.__nrBillCart.length)return alert('Add at least one product');const lines=window.__nrBillCart.map(l=>{const i=items().find(x=>x.id===l.id);return {id:i.id,name:i.name,type:i.type||'Product',qty:l.qty,price:Number(i.sell)||0,gst:Number(i.gst)||0,amount:(Number(i.sell)||0)*l.qty}});const typ=document.getElementById('fbDiscountType').value,val=Number(document.getElementById('fbDiscountValue').value)||0,c=calc(lines,typ,val);lines.forEach(x=>{const i=items().find(y=>y.id===x.id);if(i&&i.type!=='Service')i.stock=Math.max(0,(Number(i.stock)||0)-x.qty)});const arr=bills(),b={id:crypto.randomUUID(),invoice:'INV-'+String(arr.length+1).padStart(4,'0'),date:new Date(d+'T'+t).toISOString(),billDate:d,billTime:t,billDateTime:d+'T'+t,customer:document.getElementById('fbCustomer').value.trim()||'Walk-in Customer',mobile:document.getElementById('fbMobile').value.trim(),customerAddress:document.getElementById('fbAddress').value.trim(),customerGstin:document.getElementById('fbGstin').value.trim(),items:lines,subtotal:c.sub,discount:c.disc,discountType:typ,discountValue:val,gstAmount:c.gst,total:c.total};arr.push(b);s.bills=arr;if(typeof window.save==='function')window.save();closeModal();if(typeof window.renderBills==='function')window.renderBills();if(typeof window.updateStats==='function')window.updateStats();if(print&&typeof window.NRBillPrint==='function')window.NRBillPrint(b.id);else if(print&&typeof window.printBill==='function')window.printBill(b.id);else alert('Bill generated successfully: '+b.invoice)};
    document.getElementById('fbSave').onclick=()=>saveBill(false);document.getElementById('fbPrint').onclick=()=>saveBill(true);draw();search.focus();
  }
  function editBill(id){
    const b=bills().find(x=>x.id===id);if(!b)return alert('Bill not found');const its=items();window.__nrEditCart=(b.items||[]).map(x=>({id:x.id,qty:Number(x.qty)||1,price:Number(x.price)||0,gst:Number(x.gst)||0,name:x.name||''}));
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
