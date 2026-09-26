// NR BizPro — FINAL interaction authority
(function(){
 'use strict';

 function hideModal(){
   const m=document.getElementById('modal');
   if(m)m.classList.add('hidden');
 }
 window.closeModal=hideModal;

 function openNewBillAuthoritative(){
   const fn=window.NRVehicleOpenBill||window.openBillModal;
   if(typeof fn==='function'){fn();return;}
   alert('New Bill is still loading. Please refresh once.');
 }
 function openAddProductAuthoritative(){
   const fn=window.__NRDirectAddProduct || window.__NRFinalAddProduct;
   if(typeof fn==='function'){ fn(); return; }
   const fn2=window.openItemModal;
   if(typeof fn2==='function'){ fn2(); return; }
   alert('Add Product is still loading. Please refresh once.');
 }

 function showTabSafe(id){
   hideModal();
   document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===id));
   document.querySelectorAll('.tab[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
   if(id==='items'&&typeof window.renderItems==='function')window.renderItems();
   if(id==='bills'&&typeof window.renderBills==='function')window.renderBills();
   if(id==='customers'&&typeof window.renderCustomers==='function')window.renderCustomers();
   if(id==='settings'&&typeof window.NRBizProBusinessV4?.render==='function')window.NRBizProBusinessV4.render();
 }
 window.__NRShowTab=showTabSafe;
 window.__NRFinalHideModal=hideModal;
 window.__NRFinalOpenAddProduct=openAddProductAuthoritative;
 window.__NRFinalOpenNewBill=openNewBillAuthoritative;

 function bind(){
   window.closeModal=hideModal;

   // Make the final Add Product implementation authoritative.
   if(typeof window.__NRFinalAddProduct==='function'){
     window.openItemModal=window.__NRFinalAddProduct;
   }

   document.querySelectorAll('#modal .nr-modal-close').forEach(b=>{
     b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();hideModal();};
   });

   document.querySelectorAll('#modal .modal-actions .secondary').forEach(b=>{
     if(/cancel/i.test(b.textContent||'')){
       b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();hideModal();};
     }
   });

   document.querySelectorAll('.tab[data-tab]').forEach(b=>{
     b.type='button';
     b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();showTabSafe(b.dataset.tab);};
   });

   document.querySelectorAll('button').forEach(b=>{
     const t=(b.textContent||'').trim().toLowerCase();
     if(t.includes('new bill')){b.type='button';b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();openNewBillAuthoritative();};}
     if(t.includes('add product')){
       b.type='button';
       b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();openAddProductAuthoritative();};
     }
   });
 }

 // Capture phase: legacy scripts cannot cancel/replace these interactions.
 if(!window.__NRFinalCaptureBound){
   window.__NRFinalCaptureBound=true;
   document.addEventListener('click',function(e){
     const el=e.target?.closest?.('button');
     if(!el)return;
     const text=(el.textContent||'').trim().toLowerCase();

     if(text.includes('new bill')){
       e.preventDefault();
       e.stopImmediatePropagation();
       openNewBillAuthoritative();
       return;
     }

     if(text.includes('add product')){
       e.preventDefault();
       e.stopImmediatePropagation();
       openAddProductAuthoritative();
       return;
     }

     const tab=el.closest?.('.tab[data-tab]');
     if(tab){
       e.preventDefault();
       e.stopImmediatePropagation();
       showTabSafe(tab.dataset.tab);
       return;
     }

     if(el.closest?.('#modal') && (/^×$|^x$/i.test(text)||/cancel/i.test(text))){
       e.preventDefault();
       e.stopImmediatePropagation();
       hideModal();
       return;
     }
   },true);
 }

 document.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();hideModal();}
 },true);

 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
 window.addEventListener('load',()=>setTimeout(bind,50));
 window.addEventListener('authReady',()=>setTimeout(bind,50));
 window.addEventListener('loginSuccess',()=>setTimeout(bind,50));
 [50,150,300,600,1200,2500,5000].forEach(ms=>setTimeout(bind,ms));

 // Dashboard/tabs are rendered dynamically after login in some flows.
 if(!window.__NRFinalObserver){
   window.__NRFinalObserver=new MutationObserver(function(){
     clearTimeout(window.__NRFinalObserverTimer);
     window.__NRFinalObserverTimer=setTimeout(bind,30);
   });
   window.__NRFinalObserver.observe(document.body,{childList:true,subtree:true});
 }
})();