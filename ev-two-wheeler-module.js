// NR BizPro — EV / Two-Wheeler Showroom module
(function(){
  function isEV(){
    const c=String((typeof currentUser!=='undefined'&&currentUser?.category)||state?.settings?.category||'').toLowerCase();
    return /ev two|electric two|ev 2|ev scooter|ev bike/.test(c);
  }
  if(!isEV()) return;

  const escEV=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#39;'}[m]));
  const moneyEV=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);

  function openEVProduct(){
    openModal('Add EV / Two-Wheeler Product',`
      <div class="modal-grid">
        <label class="field">Product Type<select id="evpType"><option>Vehicle</option><option>Helmet</option><option>Battery</option><option>Accessory</option><option>Spare Part</option><option>Service</option><option>Other</option></select></label>
        <label class="field">Brand<input id="evpBrand" placeholder="Ola / Ather / TVS..."></label>
        <label class="field">Product / Model<input id="evpName" placeholder="Vehicle model / Helmet / Battery"></label>
        <label class="field">Variant<input id="evpVariant" placeholder="Variant / Size"></label>
        <label class="field">Colour<input id="evpColor" placeholder="Black / White..."></label>
        <label class="field">Battery Type / Capacity<input id="evpBattery" placeholder="Lithium / 3.2 kWh"></label>
        <label class="field">Battery / Serial No.<input id="evpSerial" placeholder="Optional serial number"></label>
        <label class="field">Barcode / SKU<input id="evpBarcode" placeholder="Scan barcode"></label>
        <label class="field">Cost Price<input id="evpCost" type="number" min="0" step="0.01" value="0"></label>
        <label class="field">Selling Price<input id="evpSell" type="number" min="0" step="0.01" value="0"></label>
        <label class="field">GST %<input id="evpGst" type="number" min="0" step="0.01" value="0"></label>
        <label class="field">Opening Stock<input id="evpStock" type="number" min="0" step="1" value="0"></label>
        <label class="field wide">Warranty / Notes<textarea id="evpNotes" rows="2" placeholder="Warranty period, specifications, etc."></textarea></label>
      </div>
      <div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" id="evpSave">Save Product</button></div>`);
    document.getElementById('evpSave').onclick=function(){
      const name=document.getElementById('evpName').value.trim();
      if(!name)return alert('Enter product / model name');
      const barcode=document.getElementById('evpBarcode').value.trim();
      if(barcode&&state.items.some(i=>i.barcode===barcode))return alert('Barcode already exists');
      state.items.push({id:crypto.randomUUID(),name,barcode,type:document.getElementById('evpType').value,cost:+document.getElementById('evpCost').value||0,margin:0,marginType:'fixed',sell:+document.getElementById('evpSell').value||0,gst:+document.getElementById('evpGst').value||0,stock:+document.getElementById('evpStock').value||0,brand:document.getElementById('evpBrand').value.trim(),variant:document.getElementById('evpVariant').value.trim(),color:document.getElementById('evpColor').value.trim(),batteryCapacity:document.getElementById('evpBattery').value.trim(),serial:document.getElementById('evpSerial').value.trim(),notes:document.getElementById('evpNotes').value.trim(),industry:'EV-TWO-WHEELER'});
      save();closeModal();renderItems();updateStats();
    };
    document.getElementById('evpName').focus();
  }

  function openEVBill(){
    window.billCart=[];
    openModal('Create EV / Two-Wheeler Bill',`
      <div class="panel-head" style="margin-bottom:12px"><div><p class="eyebrow">VEHICLE SALE</p><h3>Customer & Vehicle Details</h3></div></div>
      <div class="modal-grid">
        <label class="field">Customer Name<input id="evCustomer" placeholder="Customer name"></label>
        <label class="field">Mobile<input id="evMobile" type="tel" placeholder="Mobile number"></label>
        <label class="field">Vehicle Model<input id="evVehicle" placeholder="Vehicle model"></label>
        <label class="field">Variant<input id="evVariant" placeholder="Variant"></label>
        <label class="field">Colour<input id="evColour" placeholder="Colour"></label>
        <label class="field">Registration No.<input id="evReg" placeholder="If available"></label>
        <label class="field">Battery Number<input id="evBatteryNo" placeholder="Battery serial / number"></label>
        <label class="field">Chassis Number<input id="evChassis" placeholder="VIN / chassis number"></label>
        <label class="field">Engine / Motor Number<input id="evEngine" placeholder="Engine / motor number"></label>
      </div>
      <div class="panel-head" style="margin:18px 0 12px"><div><h3>Insurance Details</h3></div></div>
      <div class="modal-grid">
        <label class="field">Insurance Status<select id="evInsStatus"><option>Not Required</option><option>Pending</option><option>Active</option></select></label>
        <label class="field">Insurance Company<input id="evInsCompany" placeholder="Insurance company"></label>
        <label class="field">Policy Number<input id="evPolicy" placeholder="Policy number"></label>
        <label class="field">Expiry Date<input id="evInsExpiry" type="date"></label>
      </div>
      <div class="panel-head" style="margin:18px 0 12px"><div><h3>Finance Details</h3></div></div>
      <div class="modal-grid">
        <label class="field">Finance Status<select id="evFinStatus"><option>Self Payment</option><option>Finance Pending</option><option>Financed</option></select></label>
        <label class="field">Finance Company<input id="evFinCompany" placeholder="Bajaj Finance / HDFC..."></label>
        <label class="field">Loan Amount<input id="evLoan" type="number" min="0" step="0.01" value="0"></label>
        <label class="field">Down Payment<input id="evDown" type="number" min="0" step="0.01" value="0"></label>
        <label class="field">EMI Amount<input id="evEmi" type="number" min="0" step="0.01" value="0"></label>
        <label class="field">Tenure<input id="evTenure" placeholder="24 months"></label>
      </div>
      <div class="panel-head" style="margin:18px 0 12px"><div><h3>Products / Accessories</h3><p class="muted">Search vehicles, helmets, batteries and accessories.</p></div></div>
      <div class="field wide"><input id="evSearch" placeholder="Search product / scan barcode"></div>
      <div id="evSuggestions" class="suggestions"></div><div id="evLines" class="bill-lines"></div>
      <div class="bill-summary" id="evSummary"></div>
      <div class="panel-head" style="margin:18px 0 12px"><div><h3>Payment</h3></div></div>
      <div class="modal-grid">
        <label class="field">Payment Mode<select id="evPayMode"><option>Cash</option><option>UPI</option><option>Card</option><option>Bank Transfer</option><option>Finance</option><option>Cash + UPI</option><option>Other</option></select></label>
        <label class="field">Payment Status<select id="evPayStatus"><option>Paid</option><option>Due</option><option>Partially Paid</option></select></label>
        <label class="field">Customer Paid<input id="evPaid" type="number" min="0" step="0.01" value="0"></label>
        <label class="field">Due Amount<input id="evDue" type="number" min="0" step="0.01" value="0" readonly></label>
        <label class="field">Due Date<input id="evDueDate" type="date"></label>
        <label class="field">Payment Reference<input id="evPayRef" placeholder="UPI Txn / receipt no."></label>
      </div>
      <div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" id="evGenerate">Generate Bill</button></div>`);

    const search=document.getElementById('evSearch');
    function totals(){
      let sub=0,gst=0; (window.billCart||[]).forEach(l=>{const i=state.items.find(x=>x.id===l.id);if(i){const a=(+i.sell||0)*(+l.qty||0);sub+=a;gst+=a*(+i.gst||0)/100}});
      const total=sub+gst;const paid=Math.min(total,Math.max(0,+document.getElementById('evPaid').value||0));document.getElementById('evDue').value=Math.max(0,total-paid).toFixed(2);
      const sm=document.getElementById('evSummary');if(sm)sm.innerHTML=`<div><span>Subtotal</span><b>${moneyEV(sub)}</b></div><div><span>GST</span><b>${moneyEV(gst)}</b></div><div class="bill-net"><span>Net Amount</span><strong>${moneyEV(total)}</strong></div><div><span>Paid</span><b>${moneyEV(paid)}</b></div><div><span>Due</span><b>${moneyEV(Math.max(0,total-paid))}</b></div>`;
      const ps=document.getElementById('evPayStatus');if(ps&&paid>=total&&total>0)ps.value='Paid';else if(ps&&paid<=0)ps.value='Due';else if(ps)ps.value='Partially Paid';
    }
    function render(){
      const box=document.getElementById('evLines');if(!window.billCart.length){box.innerHTML='<div class="empty">Add a vehicle, helmet, battery or accessory.</div>';totals();return}
      box.innerHTML=window.billCart.map(l=>{const i=state.items.find(x=>x.id===l.id),amt=(+i.sell||0)*l.qty;return `<div class="bill-line"><span><b>${escEV(i.name)}</b><small>${escEV(i.type)}${i.brand?' • '+escEV(i.brand):''}</small></span><span><button type="button" data-q="${i.id}" data-d="-1">−</button> ${l.qty} <button type="button" data-q="${i.id}" data-d="1">+</button></span><b>${moneyEV(amt)}</b><button type="button" data-r="${i.id}">×</button></div>`}).join('');
      box.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const l=window.billCart.find(x=>x.id===b.dataset.q);if(l){l.qty+=+b.dataset.d;if(l.qty<1)window.billCart=window.billCart.filter(x=>x!==l);render()}});box.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{window.billCart=window.billCart.filter(x=>x.id!==b.dataset.r);render()});totals();
    }
    function find(){const q=search.value.trim().toLowerCase();const box=document.getElementById('evSuggestions');if(!q){box.innerHTML='';return}const found=state.items.filter(i=>String(i.name).toLowerCase().includes(q)||String(i.barcode||'').toLowerCase()===q||String(i.brand||'').toLowerCase().includes(q)).slice(0,10);box.innerHTML=found.map(i=>`<button type="button" class="suggestion" data-add="${i.id}"><b>${escEV(i.name)}</b><span>${escEV(i.type)} • ${moneyEV(i.sell)} • Stock ${i.stock}</span></button>`).join('')||'<div class="empty">No product found</div>';box.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{const l=window.billCart.find(x=>x.id===b.dataset.add);if(l)l.qty++;else window.billCart.push({id:b.dataset.add,qty:1});search.value='';box.innerHTML='';render();search.focus()})}
    search.oninput=find;document.getElementById('evPaid').oninput=totals;document.getElementById('evPayStatus').onchange=totals;render();totals();search.focus();

    document.getElementById('evGenerate').onclick=function(){
      if(!window.billCart.length)return alert('Add at least one product / vehicle');
      let sub=0,gst=0;const lines=window.billCart.map(l=>{const i=state.items.find(x=>x.id===l.id);if(!i)return null;const a=(+i.sell||0)*l.qty;sub+=a;gst+=a*(+i.gst||0)/100;i.stock=Math.max(0,(+i.stock||0)-l.qty);return{name:i.name,barcode:i.barcode||'',qty:l.qty,price:+i.sell||0,gst:+i.gst||0,type:i.type,brand:i.brand||'',variant:i.variant||'',color:i.color||''}}).filter(Boolean);
      const total=sub+gst,paid=Math.min(total,Math.max(0,+document.getElementById('evPaid').value||0)),due=Math.max(0,total-paid);const no=`INV-${String(state.bills.length+1).padStart(4,'0')}`;
      const vehicle={model:document.getElementById('evVehicle').value.trim(),variant:document.getElementById('evVariant').value.trim(),color:document.getElementById('evColour').value.trim(),registrationNo:document.getElementById('evReg').value.trim(),batteryNo:document.getElementById('evBatteryNo').value.trim(),chassisNo:document.getElementById('evChassis').value.trim(),engineNo:document.getElementById('evEngine').value.trim()};
      const insurance={status:document.getElementById('evInsStatus').value,company:document.getElementById('evInsCompany').value.trim(),policyNo:document.getElementById('evPolicy').value.trim(),expiry:document.getElementById('evInsExpiry').value};
      const finance={status:document.getElementById('evFinStatus').value,company:document.getElementById('evFinCompany').value.trim(),loan:+document.getElementById('evLoan').value||0,downPayment:+document.getElementById('evDown').value||0,emi:+document.getElementById('evEmi').value||0,tenure:document.getElementById('evTenure').value.trim()};
      const payment={mode:document.getElementById('evPayMode').value,status:due<=0?'Paid':paid>0?'Partially Paid':'Due',paid,due,dueDate:document.getElementById('evDueDate').value,reference:document.getElementById('evPayRef').value.trim()};
      const customer=document.getElementById('evCustomer').value.trim()||'Walk-in Customer',mobile=document.getElementById('evMobile').value.trim();
      state.bills.unshift({id:crypto.randomUUID(),invoice:no,date:new Date().toISOString(),customer,mobile,items:lines,total,subtotal:sub,gstTotal:gst,paid,due,paymentMode:payment.mode,paymentStatus:payment.status,dueDate:payment.dueDate,vehicle,insurance,finance,payment});
      let c=state.customers.find(x=>x.mobile===mobile&&mobile);if(!c){c={id:crypto.randomUUID(),name:customer,mobile,email:'',bills:0,total:0};state.customers.push(c)}c.bills++;c.total+=total;save();closeModal();renderBills();renderCustomers();renderItems();updateStats();showTab('bills');
    };
  }

  const oldOpenItem=window.openItemModal;
  window.openItemModal=function(){return isEV()?openEVProduct():oldOpenItem()};
  window.openBillModal=openEVBill;
  window.launchNewBill=openEVBill;
  const tabButtons=document.querySelectorAll('.tab');
  tabButtons.forEach(b=>{if(b.dataset.tab==='industryModule')b.textContent='EV / Vehicle Features'});
})();
