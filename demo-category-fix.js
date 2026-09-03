// NR BizPro Demo — keep EV-specific actions isolated to EV category only.
(function(){
  const isEV=()=>/ev two|electric two|ev 2|ev scooter|ev bike/i.test(String(window.currentUser?.category||window.state?.settings?.category||''));
  function apply(){
    const normalBill=window._oldLaunchNewBill||window._normalLaunchNewBill;
    const normalItem=window._oldOpenItemModal||window._normalOpenItemModal;
    if(typeof window.openEVBill==='function'&&typeof normalBill==='function')window.launchNewBill=function(){return isEV()?window.openEVBill():normalBill()};
    if(typeof window.openEVProduct==='function'&&typeof normalItem==='function')window.openItemModal=function(){return isEV()?window.openEVProduct():normalItem()};
  }
  window.addEventListener('load',()=>setTimeout(apply,50));
  window.addEventListener('loginSuccess',()=>setTimeout(apply,0));
  window.addEventListener('categoryChanged',()=>setTimeout(apply,0));
  setTimeout(apply,500);setTimeout(apply,1500);
})();