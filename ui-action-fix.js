// NR BizPro — UI action wiring fix
(function(){
  'use strict';

  function wire(){
    const newBillButtons=document.querySelectorAll('button');
    newBillButtons.forEach(btn=>{
      const text=(btn.textContent||'').trim().toLowerCase();
      if(text.includes('new bill')){
        btn.type='button';
        btn.onclick=function(e){
          e.preventDefault();
          if(typeof window.openBillModal==='function') return window.openBillModal();
          alert('New Bill is loading. Please try again.');
        };
      }
      if(text.includes('add product')){
        btn.type='button';
        btn.onclick=function(e){
          e.preventDefault();
          if(typeof window.openItemModal==='function') return window.openItemModal();
          alert('Add Product is loading. Please try again.');
        };
      }
    });

    if(typeof window.openBillModal==='function') window.launchNewBill=window.openBillModal;
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(wire,100),{once:true});
  }else{
    setTimeout(wire,100);
  }
  window.addEventListener('load',()=>setTimeout(wire,100));
  window.addEventListener('demoStarted',()=>setTimeout(wire,200));
  [500,1200,2500,4000].forEach(ms=>setTimeout(wire,ms));
})();
