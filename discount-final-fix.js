// NR BizPro — stable discount UI layer
(function(){
  'use strict';
  const S=()=>window.state||null;
  const esc=v=>typeof window.esc==='function'?window.esc(v):String(v??'');
  const money=v=>typeof window.money==='function'?window.money(v):'₹'+(Number(v)||0).toFixed(2);

  function calc(s){
    const cart=Array.isArray(window.billCart)?window.billCart:[];
    let sub=0,gst=0;
    cart.forEach(l=>{
      const i=(s?.items||[]).find(x=>x.id===l.id);if(!i)return;
      const amount=(Number(i.sell)||0)*(Number(l.qty)||0);sub+=amount;gst+=amount*(Number(i.gst)||0)/100;
    });
    const type=document.getElementById('dfDiscountType')?.value||'percent';
    const value=Number(document.getElementById('dfDiscountValue')?.value)||0;
    const discount=type==='percent'?Math.min(sub,sub*value/100):Math.min(sub,value);
    const taxable=Math.max(0,sub-discount);
    const tax=sub?gst*(taxable/sub):0;
    const total=taxable+tax;
    ['dfSub','dfDisc','dfGst','dfTotal'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent=money(id==='dfSub'?sub:id==='dfDisc'?discount:id==='dfGst'?tax:id==='dfTotal'?total:0);});
    return {sub,discount,tax,total,type,value};
  }

  function openBill(){
    const s=S();if(!s)return;
    window.billCart=[];
    const now=new Date(),date=now.toLocaleDateString('en-IN'),time=now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}),stamp=now.toISOString();
    window.openModal('Create New Bill','<div class="modal-grid"><label class="field">Customer Name<input id="dfCustomer" placeholder="Walk-in Customer"></label><label class="field">Customer Mobile<input id="dfMobile" placeholder="Mobile number"></label><label class="field wide">Customer Address<textarea id="dfAddress" rows="2"></textarea></label><label class="field">Customer GSTIN<input id="dfGstin"></label><label class="field">Bill Date<input id="dfDate" readonly value="'+esc(date)+'"></label><label class="field">Bill Time<input id="dfTime" readonly value="'+esc(time)+'"></label><label class="field wide">Search Product / Barcode<input id="dfSearch" autocomplete="off"></label></div><div id="dfSuggestions" class="suggestions"></div><div id="dfLines" class="bill-lines"></div><div class="modal-grid"><label class="field">Discount Type<select id="dfDiscountType"><option value="percent">Percentage (%)</option><option value="amount">Amount (₹)</option></select></label><label class="field">Customer Discount<input id="dfDiscountValue" type="number" min="0" step="0.01" value="0"></label></div><div class="bill-total">Subtotal: <b id="dfSub">₹0.00</b> &nbsp; Discount: <b id="dfDisc">₹0.00</b> &nbsp; GST: <b id="dfGst">₹0.00</b> &nbsp; Total: <b id="dfTotal">₹0.00</b></div><div class="modal-actions"><button type="button" class="secondary" onclick="closeModal()">Cancel</button><button type="button" class="primary" id="dfGenerate">Generate Bill</button></div>');
    const search=document.getElementById('dfSearch');
    function drawSuggestions(){
      const q=search.value.trim().toLowerCase(),box=document.getElementById('dfSuggestions');
      if(!q){box.innerHTML='';return;}
      const a=(s.items||[]).filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase()===q).slice(0,10);
      box.innerHTML=a.map(i=>'<button type="button" class="suggestion" data-id="'+esc(i.id)+'"><b>'+esc(i.name)+'</b><span>'+money(i.sell)+' • Stock '+esc(i.stock??0)+'</span></button>').join('')||'<div class="empty">No product found</div>';
      box.querySelectorAll('[data-id]').forEach(x=>x.onclick=()=>add(x.dataset.id));
    }
    function add(id){
      const i=(s.items||[]).find(x=>x.id===id);if(!i)return;
      if(i.type!=='Service'&&Number(i.stock)<=0)return alert('Out of stock');
      const line=window.billCart.find(x=>x.id===id);if(line)line.qty++;else window.billCart.push({id,qty:1});
      search.value='';document.getElementById('dfSuggestions').innerHTML='';draw();calc(s);
    }
    function draw(){
      const box=document.getElementById('dfLines');
      box.innerHTML=window.billCart.map((l,n)=>{const i=(s.items||[]).find(x=>x.id===l.id);if(!i)return '';return '<div class="bill-line"><span><b>'+esc(i.name)+'</b><small>'+esc(i.unit||'pcs')+'</small></span><span><button type="button" onclick="window.DFQty('+n+',-1)">−</button> '+l.qty+' <button type="button" onclick="window.DFQty('+n+',1)">+</button></span><b>'+money((Number(i.sell)||0)*l.qty)+'</b><button type="button" onclick="window.DFRemove('+n+')">×</button></div>';}).join('')||'<div class="empty">Add products or scan a barcode.</div>';
      calc(s);
    }
    window.DFQty=(n,d)=>{if(window.billCart[n]){window.billCart[n].qty=Math.max(1,window.billCart[n].qty+d);draw();}};
    window.DFRemove=n=>{window.billCart.splice(n,1);draw();};
    search.oninput=drawSuggestions;
    search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const q=search.value.trim().toLowerCase(),i=(s.items||[]).find(x=>String(x.barcode||'').toLowerCase()===q);if(i)add(i.id);}};
    document.getElementById('dfDiscountType').onchange=()=>calc(s);
    document.getElementById('dfDiscountValue').oninput=()=>calc(s);
    document.getElementById('dfGenerate').onclick=()=>{
      if(!window.billCart.length)return alert('Add at least one product');
      const totals=calc(s),lines=window.billCart.map(l=>{const i=(s.items||[]).find(x=>x.id===l.id);if(!i)throw Error('Product missing');if(i.type!=='Service'&&Number(i.stock)<l.qty)throw Error('Insufficient stock for '+i.name);if(i.type!=='Service')i.stock-=l.qty;return{id:i.id,name:i.name,type:i.type,qty:l.qty,price:Number(i.sell)||0,gst:Number(i.gst)||0,amount:(Number(i.sell)||0)*l.qty};});
      s.bills=Array.isArray(s.bills)?s.bills:[];const invoice='INV-'+String(s.bills.length+1).padStart(4,'0');
      s.bills.push({id:crypto.randomUUID(),invoice,date:stamp,billDate:date,billTime:time,customer:document.getElementById('dfCustomer').value.trim()||'Walk-in Customer',mobile:document.getElementById('dfMobile').value.trim(),customerAddress:document.getElementById('dfAddress').value.trim(),customerGstin:document.getElementById('dfGstin').value.trim(),items:lines,subtotal:totals.sub,discount:totals.discount,discountType:totals.type,discountValue:totals.value,gstAmount:totals.tax,total:totals.total,businessId:window.currentUser?.id||'',businessCategoryKey:window.NRBizProBusinessDataIsolation?.normalizeCategory?.(window.currentUser?.category||s.settings?.category)||String(window.currentUser?.category||s.settings?.category||'general')});
      window.save?.();window.closeModal?.();window.renderBills?.();window.updateStats?.();
    };
    draw();search.focus();
  }
  window.NRBizProDiscountBill={openBill};
  // Do not take ownership from the main billing authority. Expose only as fallback.
  if(typeof window.launchDiscountBill!=='function')window.launchDiscountBill=openBill;
})();
