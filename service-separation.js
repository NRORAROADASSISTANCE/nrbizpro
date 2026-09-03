// Separate Smart Print / Rewards from the billing workspace and provide full Paint Shop / Plumbing workflows.
(function(){
  const categoryOptions=['General Business','Grocery / General Store','Footwear / Chappal Shop','Fertilizer / Agriculture','Garage / Service Center','Spare Parts','EV Two-Wheeler Showroom','Retail / Supermarket','Restaurant / Bakery','Hardware / Building Materials','Medical / Pharmacy','Electronics / Mobile','Clothing / Fashion','Furniture','Jewellery','Stationery / Book Store','Dairy / Milk Products','Salon / Beauty Parlour','Printing / Xerox / Online Services','Wholesale / Distributor','Professional Services','Construction / Building Materials','Paint Shop','Plumbing Business','Other Business'];
  const profiles={
    paint:{match:/paint\s*shop|paints?\s*&?\s*hardware/i,label:'Paint Shop',icon:'🎨',products:'Paint, Primer, Putty, Thinner, Brushes, Rollers, Sandpaper, Exterior & Interior Coatings',features:['Product Management','Brand / Shade Management','Stock & Reorder','Customer Management','Sales Billing','Discount Management','Bill History / Reprint','Customer Sales History','Credit / Due Tracking','Sales Reports']},
    plumbing:{match:/plumb|sanitary/i,label:'Plumbing Business',icon:'🔧',products:'Pipes, Elbows, Tees, Couplers, Valves, Taps, Fittings, Adhesives, Sanitary Items',features:['Product Management','Pipe / Size Management','Brand Management','Unit Management','Stock & Reorder','Customer Management','Sales Billing','Discount Management','Bill History / Reprint','Customer Sales History','Credit / Due Tracking','Sales Reports']}
  };
  function getProfile(){let c='';try{c=window.currentUser?.category||''}catch(e){}try{if(!c)c=window.state?.settings?.category||''}catch(e){}return Object.values(profiles).find(p=>p.match.test(String(c)))||null}
  function addCategories(){document.querySelectorAll('select').forEach(function(s){if(s.id!=='suCategory'&&s.id!=='businessCategory')return;const current=s.value;categoryOptions.forEach(v=>{if(!Array.from(s.options).some(o=>o.value===v)){const o=document.createElement('option');o.value=v;o.textContent=v;s.appendChild(o)}});if(current)s.value=current})}
  function removeExtras(){document.querySelectorAll('.quick-grid button').forEach(function(b){const text=b.innerText||'';if(text.indexOf('Smart Print')>=0||text.indexOf('Rewards')>=0)b.remove()})}
  function action(label,desc,fn){const b=document.createElement('button');b.type='button';b.className='industry-feature';b.innerHTML='<b>'+label+'</b><span>'+desc+'</span>';b.onclick=fn;return b}
  function render(){
    const p=getProfile(),panel=document.getElementById('industryModule');if(!p||!panel)return;
    const core={
      'Product Management':()=>window.showTab?.('items'),
      'Customer Management':()=>window.showTab?.('customers'),
      'Customer Sales History':()=>window.showTab?.('customers'),
      'Sales Billing':()=>window.launchNewBill?.(),
      'Discount Management':()=>window.launchNewBill?.(),
      'Bill History / Reprint':()=>window.showTab?.('bills'),
      'Stock & Reorder':()=>window.showTab?.('items'),
      'Pipe / Size Management':()=>window.showTab?.('items'),
      'Brand / Shade Management':()=>window.showTab?.('items'),
      'Brand Management':()=>window.showTab?.('items'),
      'Unit Management':()=>window.showTab?.('items'),
      'Credit / Due Tracking':()=>window.showTab?.('customers'),
      'Sales Reports':()=>window.showTab?.('bills')
    };
    panel.innerHTML='<div class="panel-head"><div><p class="eyebrow">BUSINESS MODULE</p><h2>'+p.icon+' '+p.label+'</h2><p class="muted">Complete product, customer and sales management for this business.</p></div><button class="secondary" type="button" id="ppFeatureTest">Quick Guide</button></div><div class="quick-grid" id="ppActions"></div><div class="card" style="margin-top:16px;padding:16px"><b>Recommended product setup</b><p class="muted" style="margin:7px 0 0">'+p.products+'</p><p class="muted" style="margin:7px 0 0">Use <b>Products / Services</b> to enter purchase price, selling price, GST, barcode and opening stock. Use <b>New Bill</b> for customer sales and apply either percentage or fixed-amount discount.</p></div>';
    const box=document.getElementById('ppActions');p.features.forEach(f=>box.appendChild(action(f, f==='Discount Management'?'Percentage (%) or Fixed Amount (₹) in New Bill':'Open '+f, core[f]||(()=>{}))));
    document.getElementById('ppFeatureTest').onclick=()=>alert(p.label+' workflow includes '+p.features.length+' modules. Products/Stock, Customers, Sales Billing, Discounts and Bill History are connected to the main NR BizPro data and billing flow.');
  }
  function boot(){addCategories();removeExtras();render()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
  setInterval(function(){addCategories();removeExtras();render()},3000);
})();
