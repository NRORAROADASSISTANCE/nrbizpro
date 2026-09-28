// NR BizPro — EV billing product selection + totals authority
(function(){
 'use strict';
 const money=v=>typeof window.money==='function'?window.money(v):new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(v)||0);
 function items(){return window.NRBizProWorkspace?.visibleItems?window.NRBizProWorkspace.visibleItems():(window.state?.items||[]).filter(i=>!i.businessId||i.businessId===window.currentUser?.id)}
 function recalc(){
   const cart=Array.isArray(window.billCart)?window.billCart:[]; let sub=0,gst=0;
   cart.forEach(l=>{const i=(window.state?.items||[]).find(x=>x.id===l.id);if(!i)return;const a=(Number(i.sell)||0)*(Number(l.qty)||0);sub+=a;gst+=a*(Number(i.gst)||0)/100});
   const markup=Number(document.getElementById('nbMarkup')?.value)||0,disc=Number(document.getElementById('nbDiscount')?.value)||0,total=Math.max(0,sub+markup-disc+gst);
   const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=money(v)};
   set('nbSubtotal',sub);set('nbGst',gst);set('nbTotal',total);set('bTotal',total);
 }
 function add(id){
   const i=items().find(x=>String(x.id)===String(id)); if(!i)return;
   if(Number(i.stock)<=0&&i.type!=='Service')return alert('Out of stock');
   window.billCart=Array.isArray(window.billCart)?window.billCart:[];
   const l=window.billCart.find(x=>x.id===i.id); if(l)l.qty++; else window.billCart.push({id:i.id,qty:1});
   if(typeof window.renderBill==='function')window.renderBill();
   recalc(); document.getElementById('nbSearch')?.focus();
 }
 function bind(){
   const box=document.getElementById('nbSuggestions'); if(box&&!box.__nrCapture){
     box.__nrCapture=true;
     box.addEventListener('click',e=>{const b=e.target.closest('button.suggestion');if(!b)return;const m=b.getAttribute('onclick')?.match(/['"]([^'"]+)['"]/);if(m){e.preventDefault();e.stopImmediatePropagation();add(m[1]);}},true);
   }
   const s=document.getElementById('nbSearch'); if(s&&!s.__nrTotals){s.__nrTotals=true;s.addEventListener('input',()=>setTimeout(recalc,0));}
   ['nbMarkup','nbDiscount'].forEach(id=>{const e=document.getElementById(id);if(e&&!e.__nrTotals){e.__nrTotals=true;e.addEventListener('input',recalc)}});
   recalc();
 }
 window.NRFinalEVBilling={recalc,add,bind};
 window.addEventListener('load',()=>setTimeout(bind,100));window.addEventListener('authReady',()=>setTimeout(bind,100));
 setInterval(bind,500);
})();
