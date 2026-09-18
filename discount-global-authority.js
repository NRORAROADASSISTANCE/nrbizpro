// NR BizPro — GLOBAL discount authority for every business
// Ensures New Bill always shows discount controls, regardless of business module or which
// legacy billing UI script opened the modal. Persists the chosen discount on the saved bill.
(function(){'use strict';
  const money=v=>typeof window.money==='function'?window.money(v):('₹'+(Number(v)||0).toFixed(2));
  let observer=null,bound=false;
  function billModal(){
    const m=document.getElementById('modal'),b=document.getElementById('modalBody');
    if(!m||m.classList.contains('hidden')||!b)return false;
    const title=(document.getElementById('modalTitle')?.textContent||'').toLowerCase();
    return /new bill|create new bill/.test(title)||!!b.querySelector('#nbSearch,#fbSearch,#dfSearch,#bSearch');
  }
  function cart(){
    const c=window.__nrBillCart||window.billCart||[];
    return Array.isArray(c)?c:[];
  }
  function calc(){
    const s=window.state||{};let sub=0,gst=0;
    cart().forEach(l=>{const i=(s.items||[]).find(x=>x.id===l.id);if(!i)return;const a=(Number(i.sell)||0)*(Number(l.qty)||0);sub+=a;gst+=a*(Number(i.gst)||0)/100});
    const type=document.getElementById('nrGlobalDiscountType')?.value||'percent';
    const val=Math.max(0,Number(document.getElementById('nrGlobalDiscountValue')?.value)||0);
    const disc=type==='percent'?Math.min(sub,sub*val/100):Math.min(sub,val);
    const taxable=Math.max(0,sub-disc),tax=sub?gst*(taxable/sub):0;
    return {sub,disc,gst:tax,total:taxable+tax,type,val};
  }
  function renderBlock(){
    const body=document.getElementById('modalBody');if(!billModal()||body.querySelector('#nrGlobalDiscountBlock'))return;
    const host=body.querySelector('#nbLines,#fbLines,#dfLines,#billLines');if(!host)return;
    const block=document.createElement('div');block.id='nrGlobalDiscountBlock';
    block.style.cssText='margin-top:14px;padding:12px;border:1px solid #dfe5ef;border-radius:10px;background:#fff';
    block.innerHTML='<div class="modal-grid"><label class="field"><b>Discount Type</b><select id="nrGlobalDiscountType"><option value="percent">Percentage (%)</option><option value="amount">Amount (₹)</option></select></label><label class="field"><b>Discount</b><input id="nrGlobalDiscountValue" type="number" min="0" step="0.01" value="0" placeholder="Enter discount"></label></div><div id="nrGlobalDiscountSummary" class="bill-summary" style="margin-top:10px"></div>';
    host.insertAdjacentElement('afterend',block);
    const update=()=>{
      const t=calc();
      block.querySelector('#nrGlobalDiscountSummary').innerHTML='<div><span>Subtotal</span><b>'+money(t.sub)+'</b></div><div><span>Discount</span><b>− '+money(t.disc)+'</b></div><div><span>GST</span><b>'+money(t.gst)+'</b></div><div class="bill-net"><span>Grand Total</span><strong>'+money(t.total)+'</strong></div>';
      ['nbSubtotal','fbSub','dfSub'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=money(t.sub)});
      ['nbGst','fbGst','dfGst'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=money(t.gst)});
      ['nbTotal','fbTotal','dfTotal','bTotal'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=money(t.total)});
      ['fbDisc','dfDisc'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=money(t.disc)});
    };
    document.getElementById('nrGlobalDiscountType').addEventListener('change',update);
    document.getElementById('nrGlobalDiscountValue').addEventListener('input',update);
    update();
  }
  function bindSaveCapture(){
    if(bound)return;bound=true;
    document.addEventListener('click',e=>{
      const btn=e.target?.closest?.('#modal .modal-actions button');if(!btn||!billModal())return;
      const tx=(btn.textContent||'').toLowerCase();if(!/generate bill|generate & print/.test(tx))return;
      const typeEl=document.getElementById('nrGlobalDiscountType'),valEl=document.getElementById('nrGlobalDiscountValue');if(!typeEl||!valEl)return;
      const before=new Set((window.state?.bills||[]).map(x=>x.id));
      const snap={type:typeEl.value,val:Number(valEl.value)||0};
      setTimeout(()=>{
        const arr=Array.isArray(window.state?.bills)?window.state.bills:[],b=arr.find(x=>!before.has(x.id));if(!b)return;
        const lines=Array.isArray(b.items)?b.items:[];let sub=Number(b.subtotal)||0,gstBase=0;
        if(!sub)sub=lines.reduce((s,l)=>s+(Number(l.price)||0)*(Number(l.qty)||0),0);
        gstBase=lines.reduce((s,l)=>s+(Number(l.price)||0)*(Number(l.qty)||0)*(Number(l.gst)||0)/100,0);
        const disc=snap.type==='percent'?Math.min(sub,sub*snap.val/100):Math.min(sub,snap.val),taxable=Math.max(0,sub-disc),gst=sub?gstBase*(taxable/sub):0;
        Object.assign(b,{subtotal:sub,discount:disc,discountType:snap.type,discountValue:snap.val,gstAmount:gst,total:taxable+gst});
        window.save?.();window.renderBills?.();window.updateStats?.();
      },150);
    },true);
  }
  function install(){if(!observer){observer=new MutationObserver(()=>billModal()&&setTimeout(renderBlock,0));observer.observe(document.body,{childList:true,subtree:true})}bindSaveCapture();renderBlock()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,50));else install();
  window.addEventListener('load',()=>setTimeout(install,50));setInterval(install,700);
})();