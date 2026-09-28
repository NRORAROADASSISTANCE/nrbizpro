// NR BizPro — actual EV bill DOM selector fix
(function(){
 'use strict';
 function getItems(){return window.NRBizProWorkspace?.visibleItems?window.NRBizProWorkspace.visibleItems():(window.state?.items||[]).filter(i=>!i.businessId||String(i.businessId)===String(window.currentUser?.id));}
 function add(id){
  const i=getItems().find(x=>String(x.id)===String(id));
  if(!i)return;
  window.billCart=Array.isArray(window.billCart)?window.billCart:[];
  const line=window.billCart.find(x=>String(x.id)===String(i.id));
  if(line)line.qty=(Number(line.qty)||1)+1;else window.billCart.push({id:i.id,qty:1});
  const search=document.getElementById('bSearch'),suggestions=document.getElementById('billSuggestions');
  if(search)search.value='';if(suggestions)suggestions.innerHTML='';
  if(typeof window.renderCart==='function')window.renderCart();
  else {const box=document.getElementById('billLines');if(box)box.innerHTML='<div class="bill-line"><b>'+String(i.name)+'</b></div>';}
  search?.focus();
 }
 function wire(){
  const box=document.getElementById('billSuggestions');if(!box||box.__nrActualEV)return;
  box.__nrActualEV=true;
  box.addEventListener('click',function(e){
   const b=e.target.closest('button.suggestion');if(!b)return;
   e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
   const onclick=b.getAttribute('onclick')||'';const m=onclick.match(/addToCart\\(['\"]([^'\"]+)['\"]\\)/);const id=m?m[1]:b.dataset.productId;
   if(id)add(id);
  },true);
 }
 const ob=new MutationObserver(wire);if(document.body)ob.observe(document.body,{childList:true,subtree:true});
 window.addEventListener('load',()=>setTimeout(wire,100));window.addEventListener('authReady',()=>setTimeout(wire,100));setInterval(wire,300);
 window.NRActualEVSelector={wire,add};
})();
