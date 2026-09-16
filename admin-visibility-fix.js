/* NR BizPro Admin visibility hardening */
(function(){
  'use strict';
  function forceFreshAdminData(){
    const s=document.getElementById('search');
    if(s && s.value && s.dataset.autoCleared!=='1'){
      s.dataset.autoCleared='1';
      s.value='';
    }
  }
  window.addEventListener('load',function(){
    forceFreshAdminData();
    setTimeout(forceFreshAdminData,300);
    setTimeout(forceFreshAdminData,1000);
  });
})();
