// NR BizPro — print customer/business address on every invoice
(function(){
  const escP=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const moneyP=n=>typeof money==='function'?money(n):('₹'+(Number(n)||0).toFixed(2));
  function patch(){
    if(typeof window.printBill!=='function'||window.printBill.__nrAddressPrint)return;
    window.printBill.__nrAddressPrint=true;
    window.printBill=function(id){
      const b=state?.bills?.find(x=>x.id===id); if(!b)return;
      const s=state.settings||{};
      const customerAddress=b.customerAddress||b.address||b.customer?.address||'';
      const businessAddress=s.address||currentUser?.address||'';
      const vehicle=b.vehicle||b.evVehicle||null;
      const rows=(b.items||[]).map(x=>`<tr><td>${escP(x.name)}</td><td>${escP(x.type||'Product')}</td><td>${x.qty||1}</td><td class="r">${moneyP(x.price)}</td><td class="r">${moneyP((+x.price||0)*(+x.qty||0))}</td></tr>`).join('');
      const vehicleHtml=vehicle?`<div class="box"><b>Vehicle Details</b><div class="grid"><span>Brand: ${escP(vehicle.brand||'—')}</span><span>Model: ${escP(vehicle.model||'—')}</span><span>Variant: ${escP(vehicle.variant||'—')}</span><span>Colour: ${escP(vehicle.color||vehicle.colour||'—')}</span><span>Range: ${escP(vehicle.range||'—')}</span><span>Top Speed: ${escP(vehicle.speed||vehicle.topSpeed||'—')}</span><span>Battery No.: ${escP(vehicle.batteryNo||'—')}</span><span>Chassis No.: ${escP(vehicle.chassisNo||'—')}</span><span>Motor No.: ${escP(vehicle.motorNo||vehicle.engineNo||'—')}</span><span>Registration No.: ${escP(vehicle.registrationNo||'—')}</span></div></div>`:'';
      const w=window.open('','_blank');
      if(!w)return alert('Allow pop-ups to print the bill.');
      w.document.write(`<html><head><title>${escP(b.invoice)}</title><style>body{font-family:Arial;padding:30px;max-width:760px;margin:auto;font-size:13px;color:#111}.head{display:flex;justify-content:space-between;border-bottom:2px solid #222;padding-bottom:8px}.addr{margin:5px 0 12px;line-height:1.45}.box{border:1px solid #aaa;padding:9px;margin:8px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{padding:7px;border-bottom:1px solid #ddd;text-align:left}.r{text-align:right}.totals{margin-left:auto;width:300px;margin-top:10px}.line{display:flex;justify-content:space-between;padding:3px}.grand{font-size:16px;font-weight:bold;border-top:1px solid #222;margin-top:5px;padding-top:6px}.delivery{border:1px solid #333;padding:12px;margin-top:14px;height:70px}</style></head><body><div class="head"><div><h2>${escP(s.name||currentUser?.business||'NR BizPro')}</h2><div class="addr">${escP(businessAddress)}${s.mobile?`<br>Mobile: ${escP(s.mobile)}`:''}${s.gst?`<br>GSTIN: ${escP(s.gst)}`:''}</div></div><div><b>${vehicle?'VEHICLE DELIVERY BILL':'TAX INVOICE'}</b><br>${escP(b.invoice)}<br>${new Date(b.date).toLocaleDateString('en-IN')}</div></div><div class="box"><b>Customer Details</b><div class="grid"><span>Name: ${escP(b.customer||'Walk-in Customer')}</span><span>Mobile: ${escP(b.mobile||'—')}</span><span style="grid-column:1/-1">Address: ${escP(customerAddress||'—')}</span></div></div>${vehicleHtml}<div class="box"><b>Items</b><table><thead><tr><th>Item / Vehicle</th><th>Type</th><th>Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table></div><div class="totals"><div class="line"><span>Subtotal</span><b>${moneyP(b.subtotal??b.total??0)}</b></div><div class="line"><span>Discount</span><b>${moneyP(b.discount??0)}</b></div><div class="line"><span>GST</span><b>${moneyP(b.gstAmount??0)}</b></div><div class="line grand"><span>Net Amount</span><b>${moneyP(b.total)}</b></div><div class="line"><span>Paid</span><b>${moneyP(b.paid??0)}</b></div><div class="line"><span>Due</span><b>${moneyP(b.due??Math.max(0,(+b.total||0)-(+b.paid||0)))}</b></div></div>${vehicle?'<div class="delivery"><b>DELIVERY CONFIRMATION</b><br>Vehicle delivered to customer in good condition.<br>Customer Signature: ____________________ &nbsp; Delivery Date: ____________________</div>':''}</body></html>`);
      w.document.close();w.focus();setTimeout(()=>w.print(),200);
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch);else patch();
  window.addEventListener('load',()=>{patch();setTimeout(patch,500);setTimeout(patch,1500)});
  setInterval(patch,1000);
})();
