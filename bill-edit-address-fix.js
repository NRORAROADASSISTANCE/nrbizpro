// NR BizPro — Bill Edit + Business Registration Address
(function(){
  const moneySafe=n=>typeof money==='function'?money(n):new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
  const escSafe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  // Add Business Address to registration and persist it with the account.
  function patchRegistration(){
    if(typeof window.renderAuth!=='function'||window.renderAuth.__nrAddressPatch)return;
    const old=window.renderAuth;
    function wrapped(mode,message){
      old(mode,message);
      if(mode==='signup'){
        setTimeout(()=>{
          const form=document.querySelector('#authContent form');
          const gst=document.getElementById('suGst');
          if(!form||document.getElementById('suAddress'))return;
          const l=document.createElement('label');
          l.className='wide';
          l.innerHTML='Business Address<textarea id="suAddress" required rows="3" placeholder="Door No, Street, Village/Town, District, State, PIN"></textarea>';
          (gst?.closest('.auth-grid')||form).appendChild(l);
        },0);
      }
    }
    wrapped.__nrAddressPatch=true;
    window.renderAuth=wrapped;
  }

  function patchSignup(){
    if(typeof window.signup!=='function'||window.signup.__nrAddressPatch)return;
    const old=window.signup;
    function wrapped(e){
      const address=(document.getElementById('suAddress')?.value||'').trim();
      if(!address)return alert('Enter Business Address');
      old(e);
      if(typeof currentUser!=='undefined'&&currentUser){
        currentUser.address=address;
        if(typeof persistUser==='function')persistUser();
      }
    }
    wrapped.__nrAddressPatch=true;
    window.signup=wrapped;
  }

  // Keep the registration address available in Business Settings after activation/login.
  function syncAddress(){
    try{
      if(typeof currentUser==='undefined'||!currentUser||typeof state==='undefined'||!state)return;
      if(currentUser.address && !state.settings.address){state.settings.address=currentUser.address; if(typeof save==='function')save();}
    }catch(e){console.error('NR address sync',e)}
  }

  // Bill editing: restores the old stock, applies the edited quantities, and recalculates customer totals.
  function editBill(id){
    if(typeof state==='undefined'||!state)return;
    const bill=state.bills.find(b=>b.id===id); if(!bill)return;
    const rows=(bill.items||[]).map((x,idx)=>{
      const product=state.items.find(i=>i.name===x.name&&(i.barcode||'')===(x.barcode||''))||state.items.find(i=>i.name===x.name);
      return {idx,product,original:x,qty:Number(x.qty)||1};
    });
    if(typeof openModal!=='function')return;
    openModal('Edit Bill — '+bill.invoice,`
      <div class="edit-bill-form">
        <div class="modal-grid">
          <label class="field">Customer Name<input id="ebCustomer" value="${escSafe(bill.customer||'Walk-in Customer')}"></label>
          <label class="field">Customer Mobile<input id="ebMobile" value="${escSafe(bill.mobile||'')}"></label>
        </div>
        <div class="bill-lines" id="editBillLines">
          ${rows.map(r=>`<div class="bill-line" data-edit-row="${r.idx}">
            <span><b>${escSafe(r.original.name)}</b><small>${escSafe(r.original.barcode||'')}</small></span>
            <span><button type="button" onclick="changeEditQty(${r.idx},-1)">−</button> <b id="ebQty${r.idx}">${r.qty}</b> <button type="button" onclick="changeEditQty(${r.idx},1)">+</button></span>
            <b id="ebAmt${r.idx}">${moneySafe((+r.original.price||0)*r.qty)}</b>
            <button type="button" onclick="removeEditLine(${r.idx})">×</button>
          </div>`).join('') || '<div class="empty">No items in this bill.</div>'}
        </div>
        <div class="bill-total">Updated Total: <span id="ebTotal">${moneySafe(bill.total)}</span></div>
        <div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" onclick="saveEditedBill('${bill.id}')">Save Changes</button></div>
      </div>`);
    window.__nrEditRows=rows.map(r=>({name:r.original.name,barcode:r.original.barcode||'',type:r.original.type||'Product',qty:r.qty,price:+r.original.price||0,gst:+r.original.gst||0,productId:r.product?.id||null}));
    recalcEditBill();
  }

  function changeEditQty(idx,d){const r=window.__nrEditRows?.[idx];if(!r)return;r.qty=Math.max(0,(+r.qty||0)+d);const q=document.getElementById('ebQty'+idx);if(q)q.textContent=r.qty;const a=document.getElementById('ebAmt'+idx);if(a)a.textContent=moneySafe(r.price*r.qty);recalcEditBill();}
  function removeEditLine(idx){const r=window.__nrEditRows?.[idx];if(!r)return;r.qty=0;const row=document.querySelector(`[data-edit-row="${idx}"]`);if(row)row.remove();recalcEditBill();}
  function recalcEditBill(){const t=(window.__nrEditRows||[]).reduce((s,r)=>s+(+r.price||0)*(+r.qty||0),0);const el=document.getElementById('ebTotal');if(el)el.textContent=moneySafe(t);return t;}

  function rebuildCustomers(){
    if(!Array.isArray(state.customers))state.customers=[];
    const map={};
    (state.bills||[]).forEach(b=>{
      const mobile=(b.mobile||'').trim();
      const key=mobile||('name:'+String(b.customer||'Walk-in Customer').trim().toLowerCase());
      if(!map[key])map[key]={id:crypto.randomUUID(),name:b.customer||'Walk-in Customer',mobile,email:'',bills:0,total:0};
      map[key].name=b.customer||map[key].name; map[key].bills++; map[key].total+=(+b.total||0);
    });
    state.customers=Object.values(map);
  }

  function saveEditedBill(id){
    const bill=state.bills.find(b=>b.id===id);if(!bill)return;
    const rows=(window.__nrEditRows||[]).filter(r=>(+r.qty||0)>0);
    if(!rows.length)return alert('Bill must contain at least one item.');
    // Restore stock consumed by the original bill first.
    for(const oldLine of bill.items||[]){
      const p=state.items.find(i=>i.name===oldLine.name&&(i.barcode||'')===(oldLine.barcode||''))||state.items.find(i=>i.name===oldLine.name);
      if(p&&String(p.type).toLowerCase()!=='service')p.stock=(+p.stock||0)+(+oldLine.qty||0);
    }
    // Check stock before applying the edited bill.
    for(const r of rows){
      const p=r.productId?state.items.find(i=>i.id===r.productId):state.items.find(i=>i.name===r.name&&(i.barcode||'')===(r.barcode||''));
      if(p&&String(p.type).toLowerCase()!=='service'&&(+p.stock||0)<r.qty){
        // Put the original stock back exactly as it was.
        for(const oldLine of bill.items||[]){const op=state.items.find(i=>i.name===oldLine.name&&(i.barcode||'')===(oldLine.barcode||''))||state.items.find(i=>i.name===oldLine.name);if(op&&String(op.type).toLowerCase()!=='service')op.stock=Math.max(0,(+op.stock||0)-(+oldLine.qty||0));}
        return alert('Insufficient stock for '+r.name+'.');
      }
    }
    const lines=rows.map(r=>{const p=r.productId?state.items.find(i=>i.id===r.productId):state.items.find(i=>i.name===r.name);if(p&&String(p.type).toLowerCase()!=='service')p.stock=Math.max(0,(+p.stock||0)-r.qty);return{name:r.name,barcode:r.barcode||'',qty:r.qty,price:r.price,gst:r.gst,type:r.type};});
    bill.customer=(document.getElementById('ebCustomer')?.value||'Walk-in Customer').trim()||'Walk-in Customer';
    bill.mobile=(document.getElementById('ebMobile')?.value||'').trim();
    bill.items=lines;bill.total=lines.reduce((s,x)=>s+(+x.price||0)*(+x.qty||0),0);
    // Preserve EV/other extra bill fields (vehicle, RTO, insurance, payments, etc.).
    rebuildCustomers();
    if(typeof save==='function')save();
    if(typeof closeModal==='function')closeModal();
    if(typeof renderBills==='function')renderBills();
    if(typeof renderItems==='function')renderItems();
    if(typeof renderCustomers==='function')renderCustomers();
    if(typeof updateStats==='function')updateStats();
  }

  function patchBillTable(){
    if(typeof window.renderBills!=='function'||window.renderBills.__nrEditPatch)return;
    const old=window.renderBills;
    function wrapped(){
      old();
      setTimeout(()=>{
        const tb=document.getElementById('billTable');if(!tb)return;
        Array.from(tb.querySelectorAll('tr')).forEach(tr=>{
          const first=tr.querySelector('td');if(!first)return;
          const invoice=first.textContent.trim();const b=(state?.bills||[]).find(x=>x.invoice===invoice);if(!b)return;
          const actions=tr.lastElementChild;if(!actions)return;
          if(actions.querySelector('[data-edit-bill]'))return;
          const btn=document.createElement('button');btn.className='secondary';btn.type='button';btn.textContent='Edit';btn.setAttribute('data-edit-bill',b.id);btn.onclick=()=>editBill(b.id);actions.insertBefore(btn,actions.firstChild);actions.insertBefore(document.createTextNode(' '),btn.nextSibling);
        });
      },0);
    }
    wrapped.__nrEditPatch=true;window.renderBills=wrapped;
  }

  function run(){patchRegistration();patchSignup();patchBillTable();syncAddress();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  window.addEventListener('load',()=>{run();setTimeout(run,300);setTimeout(run,1000);});
  setInterval(run,1000);
  window.editBill=editBill;window.changeEditQty=changeEditQty;window.removeEditLine=removeEditLine;window.saveEditedBill=saveEditedBill;window.recalcEditBill=recalcEditBill;
})();
