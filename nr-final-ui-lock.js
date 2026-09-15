// NR BizPro — final UI lock: keep the requested billing/settings UI authoritative
(function(){'use strict';
  function api(){return window.NRBizProBusinessV4||{};}
  function force(){
    var a=api();
    if(typeof a.openBill==='function'){
      window.openBillModal=a.openBill;
      window.launchNewBill=a.openBill;
    }
    if(typeof a.render==='function'){
      var p=document.getElementById('settings');
      if(p&&p.classList.contains('active')) a.render();
    }
    if(typeof a.renderBills==='function' && document.getElementById('bills')?.classList.contains('active')) a.renderBills();
    patchPrint();
    patchTabs();
  }
  function patchTabs(){
    document.querySelectorAll('.tab[data-tab="settings"]').forEach(function(b){
      if(b.__nrFinalLock)return;
      b.__nrFinalLock=true;
      b.addEventListener('click',function(){setTimeout(function(){var a=api();if(typeof a.render==='function')a.render();},20)});
    });
  }
  function esc(v){return typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]});}
  function money(v){return typeof window.money==='function'?window.money(v):'₹'+(Number(v)||0).toFixed(2);}
  function patchPrint(){
    window.__nrFinalPrintFn=window.__nrFinalPrintFn||function(id){
      var s=window.state||{},b=(s.bills||[]).find(function(x){return x.id===id});if(!b)return;
      var u=window.currentUser||{},bs=s.settings||{};
      var dt=new Date(b.date||Date.now()),date=b.billDate||dt.toLocaleDateString('en-IN'),time=b.billTime||dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
      var rows=(b.items||[]).map(function(x){var q=Number(x.qty)||1,r=Number(x.price)||0;return '<tr><td>'+esc(x.name)+'</td><td>'+esc(x.type||'Product')+'</td><td>'+q+'</td><td class="r">'+money(r)+'</td><td class="r">'+money(q*r)+'</td></tr>';}).join('');
      var sub=Number(b.subtotal)||0,disc=Number(b.discount)||0,gst=Number(b.gstAmount)||0,total=Number(b.total)||Math.max(0,sub-disc)+gst,paid=Number(b.paid)||0,due=Number.isFinite(Number(b.due))?Number(b.due):Math.max(0,total-paid);
      var w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print the bill.');
      w.document.write('<html><head><title>'+esc(b.invoice||'Invoice')+'</title><style>body{font-family:Arial;padding:28px;max-width:820px;margin:auto;color:#111;font-size:13px}.head{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:10px}.addr{line-height:1.5;margin-top:5px}.box{border:1px solid #aaa;padding:10px;margin:10px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border-bottom:1px solid #ddd;padding:7px;text-align:left}th{background:#f5f5f5}.r{text-align:right}.totals{margin-left:auto;width:330px;margin-top:12px}.line{display:flex;justify-content:space-between;padding:4px}.grand{border-top:2px solid #111;padding-top:7px;font-size:16px;font-weight:700}</style></head><body><div class="head"><div><h2>'+esc(bs.name||u.business||'NR BizPro')+'</h2><div class="addr">'+esc(bs.address||u.address||'')+(bs.mobile||u.mobile?'<br>Mobile: '+esc(bs.mobile||u.mobile):'')+(bs.email||u.email?'<br>Email: '+esc(bs.email||u.email):'')+(bs.gst||u.gst?'<br>GSTIN: '+esc(bs.gst||u.gst):'')+'</div></div><div><b>TAX INVOICE</b><br>'+esc(b.invoice||'')+'<br>Date: '+esc(date)+'<br>Time: '+esc(time)+'</div></div><div class="box"><b>Customer Details</b><div class="grid"><span>Name: '+esc(b.customer||'Walk-in Customer')+'</span><span>Mobile: '+esc(b.mobile||'—')+'</span><span>Address: '+esc(b.customerAddress||b.address||'—')+'</span><span>GSTIN: '+esc(b.customerGstin||'—')+'</span></div></div><div class="box"><b>Items</b><table><thead><tr><th>Item / Vehicle</th><th>Type</th><th>Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="totals"><div class="line"><span>Subtotal</span><b>'+money(sub)+'</b></div><div class="line"><span>Discount'+(b.discountType==='percent'&&b.discountValue?' ('+esc(b.discountValue)+'%)':'')+'</span><b>'+money(disc)+'</b></div><div class="line"><span>GST</span><b>'+money(gst)+'</b></div><div class="line grand"><span>Net Amount</span><b>'+money(total)+'</b></div><div class="line"><span>Paid</span><b>'+money(paid)+'</b></div><div class="line"><span>Due</span><b>'+money(due)+'</b></div></div></body></html>');w.document.close();w.focus();setTimeout(function(){w.print();},250);
    };
    window.printBill=window.__nrFinalPrintFn;
    window.printBill.__nrFinalPrint=true;
    window.NRBillPrint=window.__nrFinalPrintFn;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',force);else force();
  window.addEventListener('load',force);
  setInterval(force,250);
})();
