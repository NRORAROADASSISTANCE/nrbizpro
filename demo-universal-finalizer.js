// NR BizPro — keep the customer demo universal after late module syncs
(function(){
  function isDemo(){
    return window.nrBizProDemoMode===true && window.currentUser?.plan==='demo' && window.currentUser?.id==='nr-bizpro-demo';
  }
  function forceUniversal(){
    if(!isDemo())return;
    try{
      // Demo must never inherit a real/stale business category.
      if(window.currentUser){
        window.currentUser.plan='demo';
        window.currentUser.category='General Business';
      }
      if(window.state?.settings){
        window.state.settings.category='General Business';
        window.state.settings.businessCategory='General Business';
      }
      window.renderUniversalDemo?.();
      const tab=document.getElementById('industryTab');
      if(tab){tab.textContent='All Business Categories';tab.style.display='';}
      const panel=document.getElementById('industryModule');
      if(panel){panel.style.display='';panel.classList.remove('hidden');}
    }catch(e){}
  }
  window.addEventListener('demoStarted',()=>setTimeout(forceUniversal,50));
  window.addEventListener('authReady',()=>setTimeout(forceUniversal,50));
  window.addEventListener('loginSuccess',()=>setTimeout(forceUniversal,50));
  window.addEventListener('load',()=>{
    [100,500,1000,2000,3500].forEach(ms=>setTimeout(forceUniversal,ms));
    setInterval(forceUniversal,1500);
  });
})();
