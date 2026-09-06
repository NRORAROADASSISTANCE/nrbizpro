// NR BizPro — final product save/category stability fix
(function(){
  'use strict';
  function restoreUniversalOpener(){
    if(typeof window.openUniversalProductModal==='function'){
      window.openItemModal=window.openUniversalProductModal;
    }
  }
  function hardenSaveButton(){
    const btn=document.getElementById('universalSaveProduct');
    if(!btn)return;
    btn.disabled=false;
    btn.type='button';
    btn.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.__nrUniversalProductSave==='function')window.__nrUniversalProductSave();
    };
  }
  function stabilizeCategory(){
    const sels=[document.getElementById('demoBusinessCategory'),document.getElementById('businessCategory')].filter(Boolean);
    sels.forEach(sel=>{
      if(sel.dataset.nrStable==='1')return;
      sel.dataset.nrStable='1';
      sel.addEventListener('focus',function(){this.dataset.nrFocused='1'});
      sel.addEventListener('blur',function(){delete this.dataset.nrFocused});
    });
  }
  function repair(){
    restoreUniversalOpener();
    hardenSaveButton();
    stabilizeCategory();
  }
  document.addEventListener('click',function(e){
    const btn=e.target?.closest?.('#universalSaveProduct');
    if(btn && typeof window.__nrUniversalProductSave==='function'){
      e.preventDefault();
      e.stopImmediatePropagation();
      window.__nrUniversalProductSave();
    }
  },true);
  document.addEventListener('change',function(e){
    if(e.target?.id==='demoBusinessCategory'||e.target?.id==='businessCategory'){
      setTimeout(repair,0);
      setTimeout(repair,100);
    }
  },true);
  window.addEventListener('load',()=>{repair();setTimeout(repair,500);setTimeout(repair,1500)});
  window.addEventListener('authReady',()=>setTimeout(repair,0));
  window.addEventListener('loginSuccess',()=>setTimeout(repair,0));
  setInterval(repair,2000);
})();
