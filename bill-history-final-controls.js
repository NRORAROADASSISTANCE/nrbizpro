// NR BizPro — final Bill History Edit/Delete controls
(function(){'use strict';
  const escH=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const moneyH=v=>typeof window.money==='function'?window.money(v):'₹'+(Number(v)||0).toFixed(2);
  const bills=()=>Array.isArray(window.state?.bills)?window.state.bills:[];
  const items=()=>Array.isArray(window.state?.items)?window.state.items:[];
  function render(){
    const tb=document.getElementById('billTable');if(!tb)return;
    const q=(document.getElementById('billSearch')?.value||'').trim().toLowerCase();
    let a=bills().slice().reverse();
    if(q)a=a.filter(b=>(String(b.invoice||'')+' '+String(b.customer||'')+' '+String(b.mobile||'')).toLowerCase().includes(q));
    tb.innerHTML=a.length?a.map(b=>`<tr><td><b>${escH(b.invoice||'—')}</b></td><td>${escH(b.billDate||b.date||'—')}<br><small>${escH(b.billTime||'')}</small></td><td>${escH(b.customer||'Walk-in Customer')}<br><small>${escH(b.mobile||'')}</small></td><td>${(b.items||[]).length}</td><td><b>${moneyH(b.total)}</b><br>${Number(b.discount||0)>0?`<small>Discount: ${moneyH(b.discount)}</small>`:''}</td><td><button type="button" class="secondary" onclick="window.NRBillEdit('${b.id}')">Edit</button> <button type="button" class="secondary" onclick="window.NRBillPrint('${b.id}')">Print</button> <button type="button" class="danger" onclick="window.NRBillDelete('${b.id}')">Delete</button></td></tr>`).join(''):'<tr><td colspan="6" class="empty">No bills found.</td></tr>';
  }
  function edit(id){
    const b=bills().find(x=>x.id===id);if(!b)return alert('Bill not found');
    const list=items(),cart=(b.items||[]).map(x=>({id:x.id,name:x.name,qty:Number(x.qty)||1,price:Number(x.price)||0,gst:Number(x.gst)||0}));
    window.NRHEditCart=cart;window.NRHEditId=id;
    const opts=list.map(i=>`<option value="${escH(i.id)}">${escH(i.name)} — ${moneyH(i.sell)}</option>`).join('');
    window.openModal('Edit Bill',`<div class="modal-grid"><label class="field">Customer Name<input id="rhCustomer" value="${escH(b.customer||'Walk-in Customer')}"></label><label class="field">Customer Mobile<input id="rhMobile" value="${escH(b.mobile||'')}"></label><label class="field wide">Customer Address<textarea id="rhAddress" rows="2">${escH(b.customerAddress||'')}</textarea></label><label class="field">Customer GSTIN<input id="rhGstin" value="${escH(b.customerGstin||'')}"></label><label class="field wide">Add Item<select id="rhItem"><option value="">Select product</option>${opts}</select></label><label class="field">Discount Type<select id="rhDiscType"><option value="percent" ${b.discountType==='percent'?'selected':''}>Percentage (%)</option><option value="amount" ${b.discountType==='amount'?'selected':''}>Amount (₹)</option></select></label><label class="field">Discount Value<input id="rhDiscValue" type="number" min="0" step="0.01" value="${Number(b.discountValue)||0}"></label></div><div id="rhLines" class="bill-lines"></div><div class="bill-total" style="margin-top:10px"><span>Subtotal: <b id="rhSub">₹0.00</b></span> &nbsp; <span>Discount: <b id="rhDisc">₹0.00</b></span> &nbsp; <span>GST: <b id="rhGst">₹0.00</b></span> &nbsp; <b>Grand Total: <span id="rhTotal">₹0.00</span></b></div><div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button type="button" class="secondary" onclick="window.NRBillPrint('${b.id}')">Print</button><button type="button" class="primary" onclick="window.NRHSaveEdit()">Save Changes</button></div>`);
    function draw(){
      let sub=0,gst=0;const box=document.getElementById('rhLines');
      box.innerHTML=window.NRHEditCart.map((l,n)=>{const i=list.find(x=>x.id===l.id),rate=Number(l.price)||Number(i?.sell)||0,g=Number(l.gst)||Number(i?.gst)||0,amt=rate*l.qty;sub+=amt;gst+=amt*g/100;return `<div class="bill-line"><span><b>${escH(i?.name||l.name||'Item')}</b></span><span><button type="button" onclick="window.NRHQty(${n},-1)">−</button> ${l.qty} <button type="button" onclick="window.NRHQty(${n},1)">+</button></span><b>${moneyH(amt)}</b><button type="button" onclick="window.NRHRemove(${n})">×</button></div>`}).join('')||'<div class="empty">No items</div>';
      const type=document.getElementById('rhDiscType').value,val=Number(document.getElementById('rhDiscValue').value)||0,disc=type==='percent'?Math.min(sub,sub*val/100):Math.min(sub,val),taxable=Math.max(0,sub-disc);gst=sub?gst*(taxable/sub):0;
      document.getElementById('rhSub').textContent=moneyH(sub);document.getElementById('rhDisc').textContent=moneyH(disc);document.getElementById('rhGst').textContent=moneyH(gst);document.getElementById('rhTotal').textContent=moneyH(taxable+gst);
    }
    window.NRHQty=(n,d)=>{if(window.NRHEditCart[n]){window.NRHEditCart[n].qty=Math.max(1,window.NRHEditCart[n].qty+d);draw()}};
    window.NRHRemove=n=>{window.NRHEditCart.splice(n,1);draw()};
    document.getElementById('rhItem').onchange=function(){if(!this.value)return;const i=list.find(x=>x.id===this.value);if(i)window.NRHEditCart.push({id:i.id,name:i.name,qty:1,price:Number(i.sell)||0,gst:Number(i.gst)||0});this.value='';draw()};
    document.getElementById('rhDiscType').onchange=draw;document.getElementById('rhDiscValue').oninput=draw;draw();
  }
  window.NRHSaveEdit=function(){
    const b=bills().find(x=>x.id===window.NRHEditId);if(!b)return;
    const list=items(),lines=window.NRHEditCart||[];let sub=0,gst=0;
    b.items=lines.map(l=>{const i=list.find(x=>x.id===l.id),rate=Number(l.price)||Number(i?.sell)||0,g=Number(l.gst)||Number(i?.gst)||0,amt=rate*(Number(l.qty)||1);sub+=amt;gst+=amt*g/100;return{id:l.id,name:i?.name||l.name||'Item',type:i?.type||'Product',qty:Number(l.qty)||1,price:rate,gst:g,amount:amt}});
    const type=document.getElementById('rhDiscType').value,val=Number(document.getElementById('rhDiscValue').value)||0,disc=type==='percent'?Math.min(sub,sub*val/100):Math.min(sub,val),taxable=Math.max(0,sub-disc);gst=sub?gst*(taxable/sub):0;
    Object.assign(b,{customer:document.getElementById('rhCustomer').value.trim()||'Walk-in Customer',mobile:document.getElementById('rhMobile').value.trim(),customerAddress:document.getElementById('rhAddress').value.trim(),customerGstin:document.getElementById('rhGstin').value.trim(),subtotal:sub,discount:disc,discountType:type,discountValue:val,gstAmount:gst,total:taxable+gst});
    if(typeof window.save==='function')window.save();closeModal();render();window.updateStats?.();alert('Bill updated successfully');
  };
  window.NRBillDelete=function(id){const b=bills().find(x=>x.id===id);if(!b)return alert('Bill not found');if(!confirm('Delete '+(b.invoice||'this bill')+'? This cannot be undone.'))return;window.state.bills=bills().filter(x=>x.id!==id);if(typeof window.save==='function')window.save();render();window.updateStats?.();alert('Bill deleted successfully');};
  window.NRBillEdit=edit;window.NRBillPrint=window.NRBillPrint||function(id){const b=bills().find(x=>x.id===id);if(!b)return alert('Bill not found');if(typeof window.printBill==='function')return window.printBill(id);alert('Print function not available');};
  window.renderBills=render;
  document.addEventListener('input',e=>{if(e.target?.id==='billSearch')render()});
  window.addEventListener('load',()=>{setTimeout(render,300);setTimeout(render,1200)});
  setInterval(()=>{if(document.getElementById('billTable'))render()},1500);
})();
