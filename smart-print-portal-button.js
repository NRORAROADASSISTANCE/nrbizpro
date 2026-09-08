/* Billing dashboard → Smart Print portal shortcut. */
(function(){
 function add(){
  if(document.getElementById('smartPrintPortalBtn')) return;
  const btn=document.createElement('button');btn.id='smartPrintPortalBtn';btn.type='button';btn.className='secondary';btn.textContent='🖨️ Smart Print Portal';
  btn.onclick=function(){window.location.href='smart-print.html';};
  const hero=document.querySelector('.hero .primary');
  if(hero&&hero.parentElement){hero.parentElement.appendChild(btn);return;}
  const nav=document.querySelector('.tabs');if(nav)nav.appendChild(btn);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(add,1200));else setTimeout(add,1200);
})();