// NR BizPro — final invoice print lock
(function(){
  'use strict';
  function lock(){
    const p=window.__NRPremiumPrintBill;
    if(typeof p==='function'){
      window.printBill=p;
      window.NRBillPrint=p;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(lock,50));else lock();
  window.addEventListener('load',()=>{lock();setTimeout(lock,100);setTimeout(lock,500);setTimeout(lock,1500)});
  setInterval(lock,500);
})();