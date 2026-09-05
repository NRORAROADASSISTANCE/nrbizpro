// NR BizPro — consolidated stability layer
// Loaded last so product/billing fixes do not replace each other.
(function(){
  const oldRenderAuth=window.renderAuth;
  const oldOpenItemModal=window.openItemModal;
  const oldOpenBillModal=window.openBillModal;
  const oldOpenEVBill=window.openEVBill;
  const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));
  const isEV=()=>/ev two|electric two|ev 2|ev scooter|ev bike/i.test(String(window.currentUser?.category||window.state?.settings?.category||''));

  // Registration: keep Business Address without changing the existing login/plan/payment flow.
  window.renderAuth=function(mode='login',message=''){
    if(mode!=='signup') return oldRenderAuth?.(mode,message);
    const el=document.getElementById('authContent'); if(!el)return;
    el.innerHTML=`<div class="auth-title"><h1>Create your business account</h1><p>Setup your business and start billing.</p></div><form onsubmit="signup(event)"><div class="auth-grid"><label>Business Name<input id="suBusiness" required></label><label>Owner Name<input id="suOwner" required></label><label>Mobile<input id="suMobile" required inputmode="tel"></label><label>Email<input id="suEmail" required type="email"></label><label>Business Category<input id="suCategory" required placeholder="Garage / Retail / Service..."></label><label>GSTIN <span>(optional)</span><input id="suGst"></label><label class="wide">Business Address<textarea id="suAddress" rows="3" required placeholder="Door No, Street, Village/City, District, State, PIN"></textarea></label></div><label>Password<input id="suPassword" required minlength="6" type="password"></label><button class="primary auth-btn">Continue to Plans</button></form><p class="auth-switch">Already registered? <button onclick="renderAuth('login')">Login</button></p>`;
  };
  const oldSignup=window.signup;
  window.signup=function(e){
    e.preventDefault();
    const business=suBusiness.value.trim(),owner=suOwner.value.trim(),mobile=suMobile.value.trim(),email=suEmail.value.trim().toLowerCase(),category=suCategory.value.trim(),gst=suGst.value.trim(),address=suAddress.value.trim(),password=suPassword.value;
    const users=readUsers();
    if(users.some(u=>u.email===email||u.mobile===mobile)){renderAuth('login','Account already exists.');return}
    currentUser={id:crypto.randomUUID(),business,owner,mobile,email,category,gst,address,password,status:'pending',plan:null,subscriptionEnds:null,pendingPlan:null,pendingAmount:0,lastPaymentId:null};
    users.push(currentUser);writeUsers(users);renderAuth('plans');
  };
  const oldActivate=window.activateAfterVerifiedPayment;
  window.activateAfterVerifiedPayment=function(paymentId){
    oldActivate?.(paymentId);
    if(window.state&&window.currentUser){state.settings.address=currentUser.address||state.settings.address||'';save();}
  };

  // Universal product modal for non-EV businesses. This bypasses conflicting category patches.
  function openUniversalProduct(){
    openModal('Add Product / Service',`<div class="modal-grid"><label class="field">Product / Service<input id="fsName" required placeholder="Product name"></label><label class="field">Barcode / SKU<input id="fsBarcode" placeholder="Barcode or SKU"></label><label class="field">Type<select id="fsType"><option>Product</option><option>Service</option></select></label><label class="field">Cost Price<input id="fsCost" type="number" min="0" value="0"></label><label class="field">Selling Price<input id="fsSell" type="number" min="0" value="0"></label><label class="field">GST %<input id="fsGst" type="number" min="0" value="0"></label><label class="field">Opening Stock<input id="fsStock" type="number" min="0" value="0"></label><label class="field">Brand / Make<input id="fsBrand"></label><label class="field wide">Notes<textarea id="fsNotes" rows="2"></textarea></label></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="fsSave">Save Product</button></div>`);
    document.getElementById('fsSave').onclick=function(){
      const name=document.getElementById('fsName').value.trim(); if(!name)return alert('Enter product name');
      const barcode=document.getElementById('fsBarcode').value.trim();
      state.items=state.items||[];
      if(barcode&&state.items.some(i=>String(i.barcode||'').toLowerCase()===barcode.toLowerCase()))return alert('Barcode already exists');
      state.items.push({id:crypto.randomUUID(),name,barcode,type:document.getElementById('fsType').value,cost:+document.getElementById('fsCost').value||0,sell:+document.getElementById('fsSell').value||0,gst:+document.getElementById('fsGst').value||0,stock:+document.getElementById('fsStock').value||0,brand:document.getElementById('fsBrand').value.trim(),notes:document.getElementById('fsNotes').value.trim(),businessCategory:currentUser?.category||state.settings?.category||'General Business'});
      save();closeModal();renderItems();updateStats();
    };
    document.getElementById('fsName').focus();
  }

  // Universal non-EV billing: customer address + discount + payment + robust product search.
  function openUniversalBill(){
    openModal('Create New Bill',`<label class="field">Customer Name<input id="fbCustomer" placeholder="Walk-in Customer"></label><label class="field">Customer Mobile<input id="fbMobile"></label><label class="field wide">Customer Address<textarea id="fbAddress" rows="2" placeholder="Door No, Street, Village/City, District, State, PIN"></textarea></label><label class="field wide">Search Product / Barcode<input id="fbSearch" placeholder="Type product name, SKU or barcode" autocomplete="off"></label><div id="fbSuggestions" class="suggestions"></div><div id="fbLines" class="bill-lines"></div><div class="modal-grid"><label class="field">Discount Type<select id="fbDiscType"><option>Fixed Amount</option><option>Percentage</option></select></label><label class="field">Discount<input id="fbDisc" type="number" min="0" value="0"></label><label class="field">Payment Mode<select id="fbPayMode"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Other</option></select></label><label class="field">Payment Status<select id="fbPayStatus"><option>Paid</option><option>Due</option><option>Partially Paid</option></select></label><label class="field">Customer Paid<input id="fbPaid" type="number" min="0" value="0"></label><label class="field">Due Amount<input id="fbDue" readonly></label></div><div class="bill-summary" id="fbSummary"></div><div class="modal-actions"><button class="secondary" onclick="closeModal()">Cancel</button><button class="primary" id="fbGenerate">Generate Bill</button></div>`);
    window.billCart=[];
    const qel=document.getElementById('fbSearch'),box=document.getElementById('fbSuggestions');
    function visible(){return (state.items||[]);}
    function calc(){let sub=0,gst=0;billCart.forEach(l=>{const i=state.items.find(x=>x.id===l.id);if(i){const a=(+i.sell||0)*l.qty;sub+=a;gst+=a*(+i.gst||0)/100}});let d=+fbDisc.value||0;if(fbDiscType.value==='Percentage')d=sub*d/100;d=Math.min(sub,Math.max(0,d));const taxable=Math.max(0,sub-d),total=taxable+gst,paid=Math.min(total,Math.max(0,+fbPaid.value||0)),due=Math.max(0,total-paid);fbDue.value=due.toFixed(2);fbPayStatus.value=due<=0&&total>0?'Paid':paid>0?'Partially Paid':'Due';fbSummary.innerHTML=`<div><span>Subtotal</span><b>${money(sub)}</b></div><div><span>Discount</span><b>-${money(d)}</b></div><div><span>GST</span><b>${money(gst)}</b></div><div class="bill-net"><span>Net Amount</span><strong>${money(total)}</strong></div><div><span>Paid</span><b>${money(paid)}</b></div><div><span>Due</span><b>${money(due)}</b></div>`;return{sub,gst,d,total,paid,due};}
    function render(){fbLines.innerHTML=!billCart.length?'<div class="empty">Search and select a product.</div>':billCart.map(l=>{const i=state.items.find(x=>x.id===l.id);return `<div class="bill-line"><span><b>${esc(i.name)}</b><small>${esc(i.barcode||i.brand||'')}</small></span><span>${l.qty}</span><b>${money((+i.sell||0)*l.qty)}</b><button type="button" data-r="${i.id}">×</button></div>`}).join('');fbLines.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{billCart=billCart.filter(x=>x.id!==b.dataset.r);render();calc()});calc();}
    qel.oninput=function(){const q=qel.value.trim().toLowerCase();if(!q){box.innerHTML='';return}const found=visible().filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase().includes(q)||String(i.brand||'').toLowerCase().includes(q)).slice(0,10);box.innerHTML=found.map(i=>`<button type="button" class="suggestion" data-add="${i.id}"><b>${esc(i.name)}</b><span>${esc(i.barcode||'No barcode')} • ${money(i.sell)} • Stock ${i.stock}</span></button>`).join('')||'<div class="empty">No product found</div>';box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const l=billCart.find(x=>x.id===b.dataset.add);if(l)l.qty++;else billCart.push({id:b.dataset.add,qty:1});qel.value='';box.innerHTML='';render();qel.focus()});};
    ['fbDisc','fbDiscType','fbPaid'].forEach(id=>document.getElementById(id).addEventListener('input',calc));document.getElementById('fbDiscType').addEventListener('change',calc);
    document.getElementById('fbGenerate').onclick=function(){if(!billCart.length)return alert('Add at least one product');const t=calc();const lines=billCart.map(l=>{const i=state.items.find(x=>x.id===l.id);i.stock=Math.max(0,(+i.stock||0)-l.qty);return{name:i.name,barcode:i.barcode||'',qty:l.qty,price:+i.sell||0,gst:+i.gst||0,type:i.type}});const no=`INV-${String((state.bills||[]).length+1).padStart(4,'0')}`,customer=fbCustomer.value.trim()||'Walk-in Customer',mobile=fbMobile.value.trim(),address=fbAddress.value.trim();const bill={id:crypto.randomUUID(),invoice:no,date:new Date().toISOString(),customer,mobile,address,items:lines,total:t.total,subtotal:t.sub,discount:t.d,gstTotal:t.gst,paid:t.paid,due:t.due,paymentMode:fbPayMode.value,paymentStatus:fbPayStatus.value};state.bills.unshift(bill);let c=state.customers.find(x=>mobile&&x.mobile===mobile);if(!c){c={id:crypto.randomUUID(),name:customer,mobile,email:'',address,bills:0,total:0};state.customers.push(c)}else{c.name=customer;if(address)c.address=address}c.bills++;c.total+=t.total;save();closeModal();renderBills();renderCustomers();renderItems();updateStats();showTab('bills');};
    render();qel.focus();
  }

  // EV: after a product is selected, fill only stable vehicle master particulars; serial remains editable per vehicle.
  const attachEVAutoFill=()=>{if(!isEV())return;const box=document.getElementById('evSuggestions');if(!box||box.dataset.autofill)return;box.dataset.autofill='1';box.addEventListener('click',e=>{const btn=e.target.closest('[data-add]');if(!btn)return;const i=state.items.find(x=>x.id===btn.dataset.add);if(!i)return;setTimeout(()=>{const map={evBrand:i.brand,evVehicle:i.name,evVariant:i.variant,evColour:i.color};Object.entries(map).forEach(([id,v])=>{const el=document.getElementById(id);if(el&&v)el.value=v});},0)});};
  window.openItemModal=function(){return isEV()?oldOpenEVProductSafe():openUniversalProduct()};
  function oldOpenEVProductSafe(){return typeof window.openEVProduct==='function'?window.openEVProduct():oldOpenItemModal?.()}
  window.openBillModal=function(){if(isEV()){const r=oldOpenEVBill?.();setTimeout(attachEVAutoFill,30);return r}return openUniversalBill()};
  window.launchNewBill=function(){return window.openBillModal()};
  window.addEventListener('load',()=>setTimeout(attachEVAutoFill,300));
})();
