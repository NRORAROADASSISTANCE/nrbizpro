(function(){'use strict';
  const escP=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const moneyP=v=>typeof window.money==='function'?window.money(v):('₹'+(Number(v)||0).toFixed(2));
  const getBills=()=>Array.isArray(window.state?.bills)?window.state.bills:[];
  const getItems=()=>Array.isArray(window.state?.items)?window.state.items:[];

  function renderBillsRestore(){
    const tb=document.getElementById('billTable'); if(!tb)return;
    const q=(document.getElementById('billSearch')?.value||'').trim().toLowerCase();
    let bills=getBills().slice().reverse();
    if(q)bills=bills.filter(b=>String(b.invoice||'').toLowerCase().includes(q)||String(b.customer||'').toLowerCase().includes(q)||String(b.mobile||'').toLowerCase().includes(q));
    if(!bills.length){tb.innerHTML='<tr><td colspan="6" class="empty">No bills found.</td></tr>';return;}
    tb.innerHTML=bills.map(b=>`<tr><td><b>${escP(b.invoice||'—')}</b></td><td>${b.date?new Date(b.date).toLocaleString('en-IN'):'—'}</td><td>${escP(b.customer||'Walk-in Customer')}<br><small>${escP(b.mobile||'')}</small></td><td>${(b.items||[]).length}</td><td><b>${moneyP(b.total)}</b></td><td><button type="button" class="secondary" onclick="window.NRBillEdit('${b.id}')">Edit</button> <button type="button" class="secondary" onclick="window.NRBillPrint('${b.id}')">Print</button></td></tr>`).join('');
  }

  function printBillRestore(id){
    const b=getBills().find(x=>x.id===id); if(!b)return alert('Bill not found');
    if(typeof window.printBill==='function')return window.printBill(id);
    const s=window.state?.settings||{};
    const rows=(b.items||[]).map(x=>`<tr><td>${escP(x.name)}</td><td>${x.qty||1}</td><td>${moneyP(x.price)}</td><td>${moneyP((Number(x.qty)||1)*(Number(x.price)||0))}</td></tr>`).join('');
    const w=window.open('','_blank'); if(!w)return alert('Allow pop-ups to print the bill.');
    w.document.write(`<html><head><title>${escP(b.invoice||'Invoice')}</title><style>body{font-family:Arial;padding:25px;max-width:800px;margin:auto}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}.r{text-align:right}</style></head><body><h2>${escP(s.name||window.currentUser?.business||'NR BizPro')}</h2><p>Invoice: <b>${escP(b.invoice||'')}</b><br>Date: ${escP(new Date(b.date||Date.now()).toLocaleString('en-IN'))}</p><hr><p><b>Customer:</b> ${escP(b.customer||'Walk-in Customer')}<br><b>Mobile:</b> ${escP(b.mobile||'')}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><h3 class="r">Grand Total: ${moneyP(b.total)}</h3></body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),200);
  }

  function editBill(id){
    const b=getBills().find(x=>x.id===id); if(!b)return alert('Bill not found');
    const items=getItems(); window.NREditingBillId=id;
    const options=items.map(i=>`<option value="${escP(i.id)}">${escP(i.name)} — ${moneyP(i.sell)}</option>`).join('');
    window.openModal('Edit Bill',`<div class="modal-grid"><label class="field">Customer Name<input id="ebCustomer" value="${escP(b.customer||'Walk-in Customer')}"></label><label class="field">Customer Mobile<input id="ebMobile" value="${escP(b.mobile||'')}"></label><label class="field wide">Customer Address<textarea id="ebAddress" rows="2">${escP(b.customerAddress||'')}</textarea></label><label class="field">Customer GSTIN<input id="ebGstin" value="${escP(b.customerGstin||'')}"></label><label class="field wide">Add Item<select id="ebItem"><option value="">Select product</option>${options}</select></label></div><div id="ebLines" class="bill-lines"></div><div class="bill-total">Grand Total: <b id="ebTotal">${moneyP(b.total)}</b></div><div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button type="button" class="secondary" onclick="window.NRBillPrint('${b.id}')">Print</button><button type="button" class="primary" onclick="window.NRBillSaveEdit()">Save Changes</button></div>`);
    window.NREditCart=(b.items||[]).map(x=>({id:x.id,qty:Number(x.qty)||1,price:Number(x.price)||0}));
    const render=()=>{const box=document.getElementById('ebLines');if(!box)return;let total=0;box.innerHTML=window.NREditCart.map((l,n)=>{const src=items.find(i=>i.id===l.id),name=src?.name||b.items?.[n]?.name||'Item',rate=Number(l.price)||Number(src?.sell)||0,amt=rate*l.qty;total+=amt;return `<div class="bill-line"><span><b>${escP(name)}</b></span><span><button type="button" onclick="window.NREditQty(${n},-1)">−</button> ${l.qty} <button type="button" onclick="window.NREditQty(${n},1)">+</button></span><b>${moneyP(amt)}</b><button type="button" onclick="window.NREditRemove(${n})">×</button></div>`}).join('')||'<div class="empty">No items</div>';document.getElementById('ebTotal').textContent=moneyP(total)};
    window.NREditRender=render;
    document.getElementById('ebItem')?.addEventListener('change',function(){if(this.value){const i=items.find(x=>x.id===this.value);if(i)window.NREditCart.push({id:i.id,qty:1,price:Number(i.sell)||0});this.value='';render()}}); render();
  }
  window.NREditQty=(n,d)=>{const l=window.NREditCart?.[n];if(!l)return;l.qty=Math.max(1,l.qty+d);window.NREditRender?.()};
  window.NREditRemove=n=>{if(!window.NREditCart)return;window.NREditCart.splice(n,1);window.NREditRender?.()};
  window.NRBillSaveEdit=function(){const id=window.NREditingBillId,b=getBills().find(x=>x.id===id);if(!b)return;const items=getItems();const lines=(window.NREditCart||[]).map(l=>{const i=items.find(x=>x.id===l.id),old=(b.items||[]).find(x=>x.id===l.id);return {id:l.id,name:i?.name||old?.name||'Item',type:i?.type||old?.type||'Product',qty:l.qty,price:Number(l.price)||Number(i?.sell)||Number(old?.price)||0,gst:Number(i?.gst)||Number(old?.gst)||0,amount:(Number(l.price)||Number(i?.sell)||Number(old?.price)||0)*l.qty}});let sub=0,gst=0;lines.forEach(x=>{sub+=x.amount;gst+=x.amount*(x.gst||0)/100});b.customer=document.getElementById('ebCustomer')?.value.trim()||'Walk-in Customer';b.mobile=document.getElementById('ebMobile')?.value.trim()||'';b.customerAddress=document.getElementById('ebAddress')?.value.trim()||'';b.customerGstin=document.getElementById('ebGstin')?.value.trim()||'';b.items=lines;b.subtotal=sub;b.gstAmount=gst;b.total=sub+gst;if(typeof window.save==='function')window.save();closeModal();renderBillsRestore();if(typeof window.updateStats==='function')window.updateStats();alert('Bill updated successfully');};

  function injectNewBillControls(){
    const search=document.getElementById('nbSearch'); if(!search)return;
    if(!document.getElementById('nrBillDateTime')){
      const wrap=document.createElement('div');wrap.id='nrBillDateTime';wrap.className='modal-grid';wrap.style.marginTop='8px';
      wrap.innerHTML='<label class="field">Bill Date *<input id="nrBillDate" type="date" required></label><label class="field">Bill Time *<input id="nrBillTime" type="time" required></label>';
      search.closest('.modal-grid')?.after(wrap);
      const now=new Date(),local=new Date(now.getTime()-now.getTimezoneOffset()*60000);
      document.getElementById('nrBillDate').value=local.toISOString().slice(0,10);
      document.getElementById('nrBillTime').value=local.toISOString().slice(11,16);
    }
    if(!document.getElementById('nrAddItemBtn')){
      const btn=document.createElement('button');btn.id='nrAddItemBtn';btn.type='button';btn.className='secondary';btn.textContent='+ Add Item';btn.style.marginTop='8px';
      btn.onclick=()=>{search.value='';document.getElementById('nbSuggestions')?.replaceChildren();search.focus()};
      search.closest('.modal-grid')?.after(btn);
    }
    if(!document.getElementById('nrGeneratePrintBtn')){
      const actions=document.querySelector('#modalBody .modal-actions');
      const gen=actions?.querySelector('button.primary');
      if(actions&&gen){
        const p=document.createElement('button');p.id='nrGeneratePrintBtn';p.type='button';p.className='secondary';p.textContent='Generate & Print';
        p.onclick=()=>{const before=getBills().length;const fn=window.NRVehicleSaveBill;if(typeof fn!=='function')return alert('Billing function not ready');fn();setTimeout(()=>{const bills=getBills();if(bills.length>before)printBillRestore(bills[bills.length-1].id)},250)};
        actions.insertBefore(p,gen);
      }
    }
    if(!document.getElementById('nrDateGuardBound')){
      const actions=document.querySelector('#modalBody .modal-actions');const gen=actions?.querySelector('button.primary');
      if(gen){
        gen.addEventListener('click',()=>{const d=document.getElementById('nrBillDate'),t=document.getElementById('nrBillTime');if(!d?.value||!t?.value){event?.preventDefault?.();alert('Bill Date and Time are compulsory.');return false}},true);
        document.getElementById('nrDateGuardBound').value='1';
      }
    }
  }

  function patchNewBill(){
    const fn=window.openBillModal;
    if(typeof fn!=='function')return;
    if(!fn.__nrRestore){
      function wrapped(){fn.apply(this,arguments);setTimeout(injectNewBillControls,30);setTimeout(injectNewBillControls,200);}
      wrapped.__nrRestore=true; window.openBillModal=wrapped; window.launchNewBill=wrapped;
    }
    setTimeout(injectNewBillControls,50);
  }
  function patch(){window.renderBills=renderBillsRestore;window.NRBillEdit=editBill;window.NRBillPrint=printBillRestore;patchNewBill();}
  patch();window.addEventListener('load',()=>{patch();setTimeout(patch,500);setTimeout(patch,1500)});setInterval(patch,1000);
})();
