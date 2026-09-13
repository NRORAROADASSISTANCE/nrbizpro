// NR BizPro — customer details + GST on invoice print
(function(){
  'use strict';
  function escP(v){return typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]));}
  function moneyP(v){return typeof window.money==='function'?window.money(v):('₹'+(Number(v)||0).toFixed(2));}

  function patchBillForm(){
    if(typeof window.openBillModal!=='function'||window.openBillModal.__nrCustomerDetails)return;
    const old=window.openBillModal;
    function wrapped(){
      old.apply(this,arguments);
      setTimeout(()=>{
        const search=document.getElementById('bSearch');
        if(!search||document.getElementById('bAddress'))return;
        const wrap=document.createElement('div');
        wrap.className='modal-grid';
        wrap.innerHTML='<label class="field wide">Customer Address<textarea id="bAddress" rows="2" placeholder="Door No, Street, Village/Town, District, State, PIN"></textarea></label><label class="field">Customer GSTIN<input id="bCustomerGstin" placeholder="Optional GSTIN"></label>';
        search.closest('.field')?.before(wrap);
      },0);
    }
    wrapped.__nrCustomerDetails=true;
    window.openBillModal=wrapped;
    if(typeof window.launchNewBill==='function')window.launchNewBill=wrapped;
  }

  function patchSaveBill(){
    if(typeof window.saveBill!=='function'||window.saveBill.__nrCustomerDetailsSave)return;
    const old=window.saveBill;
    function wrapped(){
      const address=(document.getElementById('bAddress')?.value||'').trim();
      const gstin=(document.getElementById('bCustomerGstin')?.value||'').trim();
      const before=new Set((window.state?.bills||[]).map(b=>b.id));
      old.apply(this,arguments);
      const bills=window.state?.bills||[];
      const created=bills.find(b=>!before.has(b.id))||bills[0];
      if(created){
        created.customerAddress=address;
        created.customerGstin=gstin;
        if(typeof window.save==='function')window.save();
      }
    }
    wrapped.__nrCustomerDetailsSave=true;
    window.saveBill=wrapped;
  }

  function patchPrint(){
    if(typeof window.printBill!=='function'||window.printBill.__nrCustomerGSTPrint)return;
    window.printBill.__nrCustomerGSTPrint=true;
    window.printBill=function(id){
      const b=window.state?.bills?.find(x=>x.id===id);if(!b)return;
      const s=window.state?.settings||{};
      const business=currentUser?.business||s.name||'NR BizPro';
      const businessAddress=s.address||currentUser?.address||'';
      const customer=b.customer||'Walk-in Customer';
      const customerMobile=b.mobile||'';
      const customerAddress=b.customerAddress||b.address||'';
      const customerGstin=b.customerGstin||'';
      const lines=(b.items||[]).map(x=>{
        const qty=Number(x.qty)||1,rate=Number(x.price)||0,amount=qty*rate,gst=Number(x.gst)||0,gstAmt=amount*gst/100;
        return '<tr><td>'+escP(x.name)+'</td><td>'+escP(x.type||'Product')+'</td><td>'+qty+'</td><td>'+moneyP(rate)+'</td><td>'+gst.toFixed(2)+'%</td><td>'+moneyP(gstAmt)+'</td><td>'+moneyP(amount+gstAmt)+'</td></tr>';
      }).join('');
      const subtotal=Number(b.subtotal)||((b.items||[]).reduce((t,x)=>t+(Number(x.price)||0)*(Number(x.qty)||1),0));
      const discount=Number(b.discount)||0;
      const gstAmount=Number(b.gstAmount)||(b.items||[]).reduce((t,x)=>t+(Number(x.price)||0)*(Number(x.qty)||1)*(Number(x.gst)||0)/100,0);
      const taxable=Math.max(0,subtotal-discount);
      const total=Number(b.total)||(taxable+gstAmount);
      const cgst=gstAmount/2,sgst=gstAmount/2;
      const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print the bill.');
      w.document.write('<html><head><title>'+escP(b.invoice||'Invoice')+'</title><style>body{font-family:Arial,sans-serif;padding:24px;max-width:900px;margin:auto;color:#111;font-size:13px}.head{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:12px}.title{font-size:22px;font-weight:700}.muted{color:#555;line-height:1.5}.box{border:1px solid #bbb;border-radius:6px;padding:10px;margin:12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 18px}table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border-bottom:1px solid #ddd;padding:7px;text-align:left}th{background:#f5f5f5}.r{text-align:right}.totals{margin-left:auto;width:340px;margin-top:12px}.line{display:flex;justify-content:space-between;padding:4px}.grand{font-size:16px;font-weight:bold;border-top:2px solid #111;margin-top:6px;padding-top:8px}@media print{body{padding:0}.box{break-inside:avoid}}</style></head><body><div class="head"><div><div class="title">'+escP(business)+'</div><div class="muted">'+escP(businessAddress)+(s.mobile?'<br>Mobile: '+escP(s.mobile):'')+(s.gst?'<br>GSTIN: '+escP(s.gst):'')+'</div></div><div class="r"><b>TAX INVOICE</b><br>Invoice: '+escP(b.invoice||'')+'<br>Date: '+escP(new Date(b.date||Date.now()).toLocaleString('en-IN'))+'</div></div><div class="box"><b>Customer Details</b><div class="grid"><span>Name: '+escP(customer)+'</span><span>Mobile: '+escP(customerMobile||'—')+'</span><span>Address: '+escP(customerAddress||'—')+'</span><span>GSTIN: '+escP(customerGstin||'—')+'</span></div></div><div class="box"><b>Items</b><table><thead><tr><th>Item / Service</th><th>Type</th><th>Qty</th><th>Rate</th><th>GST %</th><th>GST Amount</th><th>Total</th></tr></thead><tbody>'+lines+'</tbody></table></div><div class="totals"><div class="line"><span>Subtotal</span><b>'+moneyP(subtotal)+'</b></div><div class="line"><span>Discount</span><b>− '+moneyP(discount)+'</b></div><div class="line"><span>Taxable Value</span><b>'+moneyP(taxable)+'</b></div><div class="line"><span>CGST</span><b>'+moneyP(cgst)+'</b></div><div class="line"><span>SGST</span><b>'+moneyP(sgst)+'</b></div><div class="line"><span>GST Total</span><b>'+moneyP(gstAmount)+'</b></div><div class="line grand"><span>Grand Total</span><b>'+moneyP(total)+'</b></div></div></body></html>');
      w.document.close();w.focus();setTimeout(()=>w.print(),250);
    };
  }
  function run(){patchBillForm();patchSaveBill();patchPrint();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  window.addEventListener('load',()=>{run();setTimeout(run,300);setTimeout(run,1000);setTimeout(run,2000)});
  setInterval(run,1000);
})();
