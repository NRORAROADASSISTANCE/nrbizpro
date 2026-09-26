// NR BizPro — final interaction authority
(function(){
 'use strict';
 function hideModal(){
   const m=document.getElementById('modal');
   if(m)m.classList.add('hidden');
 }
 window.closeModal=hideModal;

 function showTabSafe(id){
   hideModal();
   document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active',p.id===id));
   document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
   if(id==='items'&&typeof window.renderItems==='function')window.renderItems();
   if(id==='bills'&&typeof window.renderBills==='function')window.renderBills();
   if(id==='customers'&&typeof window.renderCustomers==='function')window.renderCustomers();
   if(id==='settings'&&typeof window.NRBizProBusinessV4?.render==='function')window.NRBizProBusinessV4.render();
 }
 window.__NRShowTab=showTabSafe;

 function bind(){
   window.closeModal=hideModal;
   document.querySelectorAll('#modal .nr-modal-close').forEach(b=>{
     b.onclick=function(e){e.preventDefault();e.stopPropagation();hideModal()};
   });
   document.querySelectorAll('#modal .modal-actions .secondary').forEach(b=>{
     if(/cancel/i.test(b.textContent||'')){
       b.onclick=function(e){e.preventDefault();e.stopPropagation();hideModal()};
     }
   });
   document.querySelectorAll('.tab[data-tab]').forEach(b=>{
     if(b.__nrFinalInteraction)return;
     b.__nrFinalInteraction=true;
     b.onclick=function(e){e.preventDefault();e.stopPropagation();showTabSafe(b.dataset.tab)};
   });
   document.querySelectorAll('button').forEach(b=>{
     const t=(b.textContent||'').trim().toLowerCase();
     if(t.includes('add product')){
       b.type='button';
       b.onclick=function(e){e.preventDefault();e.stopImmediatePropagation();hideModal();if(typeof window.openItemModal==='function')window.openItemModal();else alert('Add Product is not ready. Please refresh once.')};
     }
   });
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hideModal()},true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
 window.addEventListener('load',bind);
 window.addEventListener('authReady',bind);
 [100,500,1200,2500,5000].forEach(ms=>setTimeout(bind,ms));
})();
