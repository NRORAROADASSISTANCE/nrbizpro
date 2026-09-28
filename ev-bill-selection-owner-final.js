// NR BizPro — EV New Bill selection FINAL owner
(function(){
 'use strict';
 const money=v=>typeof window.money==='function'?window.money(v):('₹'+(Number(v)||0).toFixed(2));
 const esc=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
 function list(){return window.NRBizProWorkspace?.visibleItems?window.NRBizProWorkspace.visibleItems():(window.state?.items||[]).filter(i=>!i.businessId||String(i.businessId)===String(window.currentUser?.id));}
 function renderSuggestions(){
   const s=document.getElementById('nbSearch'),box=document.getElementById('nbSuggestions');if(!s||!box)return;
   const q=s.value.trim().toLowerCase();if(!q){box.innerHTML='';return;}
   const a=list().filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase()===q).slice(0,10);
   box.innerHTML=a.length?a.map(i=>'<button type="button" class="suggestion nr-ev-suggestion" data-product-id="'+esc(i.id)+'"><b>'+esc(i.name)+'</b><span>'+esc(i.businessModule||i.businessCategory||'EV')+' • '+money(i.sell)+' • Stock '+(Number(i.stock)||0)+'</span></button>').join(''):'<div class="empty">No product found</div>';
 }
 function renderLines(){
   const box=document.getElementById('nbLines');if(!box)return;
   const cart=Array.isArray(window.billCart)?window.billCart:[];
   if(!cart.length){box.innerHTML='<div class="empty">Add products or scan a barcode.</div>'}
   else box.innerHTML=cart.map(l=>{const i=(window.state?.items||[]).find(x=>String(x.id)===String(l.id));if(!i)return '';const q=Number(l.qty)||1;return '<div class="bill-line"><span><b>'+esc(i.name)+'</b><small>'+esc(i.businessModule||i.businessCategory||'EV')+'</small></span><span><button type="button" class="nr-ev-minus" data-product-id="'+esc(i.id)+'">−</button> '+q+' <button type="button" class="nr-ev-plus" data-product-id="'+esc(i.id)+'">+</button></span><b>'+money((Number(i.sell)||0)*q)+'</b><button type="button" class="nr-ev-remove" data-product-id="'+esc(i.id)+'">×</button></div>'}).join('');
   calc();
 }
 function calc(){
   const cart=Array.isArray(window.billCart)?window.billCart:[];let sub=0,gst=0;
   cart.forEach(l=>{const i=(window.state?.items||[]).find(x=>String(x.id)===String(l.id));if(!i)return;const a=(Number(i.sell)||0)*(Number(l.qty)||0);sub+=a;gst+=a*(Number(i.gst)||0)/100});
   const markup=Number(document.getElementById('nbMarkup')?.value)||0,disc=Number(document.getElementById('nbDiscount')?.value)||0,total=Math.max(0,sub+markup-disc+gst);
   [['nbSubtotal',sub],['nbGst',gst],['nbTotal',total],['bTotal',total]].forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.textContent=money(v)});
 }
 function add(id){const i=list().find(x=>String(x.id)===String(id));if(!i)return alert('Product not found');if(Number(i.stock)<=0&&i.type!=='Service')return alert('Out of stock');window.billCart=Array.isArray(window.billCart)?window.billCart:[];const l=window.billCart.find(x=>String(x.id)===String(i.id));if(l)l.qty=(Number(l.qty)||1)+1;else window.billCart.push({id:i.id,qty:1});renderLines();const s=document.getElementById('nbSearch');if(s){s.value='';renderSuggestions();s.focus()}}
 function wire(){
   const s=document.getElementById('nbSearch'),box=document.getElementById('nbSuggestions');if(!s||!box)return;
   if(!s.__nrEvOwner){s.__nrEvOwner=true;s.addEventListener('input',renderSuggestions,true);s.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=box.querySelector('.nr-ev-suggestion');if(first){e.preventDefault();e.stopImmediatePropagation();add(first.dataset.productId)}}},true)}
   if(!box.__nrEvOwner){box.__nrEvOwner=true;box.addEventListener('click',e=>{const b=e.target.closest('.nr-ev-suggestion');if(b){e.preventDefault();e.stopImmediatePropagation();add(b.dataset.productId);return}const x=e.target.closest('.nr-ev-minus,.nr-ev-plus,.nr-ev-remove');if(x){const id=x.dataset.productId,l=window.billCart?.find(z=>String(z.id)===String(id));if(!l)return;if(x.classList.contains('nr-ev-minus'))l.qty=Math.max(1,(Number(l.qty)||1)-1);else if(x.classList.contains('nr-ev-plus'))l.qty++;else window.billCart=window.billCart.filter(z=>String(z.id)!==String(id));renderLines()}},true)}
   ['nbMarkup','nbDiscount'].forEach(id=>{const e=document.getElementById(id);if(e&&!e.__nrEvCalc){e.__nrEvCalc=true;e.addEventListener('input',calc,true)}});
   renderSuggestions();renderLines();
 }
 const observer=new MutationObserver(()=>{if(document.getElementById('nbSearch')){clearTimeout(window.__nrEvWireTimer);window.__nrEvWireTimer=setTimeout(wire,20)}});if(document.body)observer.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('load',()=>setTimeout(wire,100));window.addEventListener('authReady',()=>setTimeout(wire,100));setInterval(wire,500);
 window.NRFinalEVBillOwner={wire,add,renderSuggestions,renderLines,calc};
})();
