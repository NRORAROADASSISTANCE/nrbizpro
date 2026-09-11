// NR BizPro — keep the customer demo universal after late module syncs
(function(){
  function isDemo(){
    return window.nrBizProDemoMode===true && window.currentUser?.plan==='demo' && window.currentUser?.id==='nr-bizpro-demo';
  }
  function syncSmartPrint(){
    const portal=document.getElementById('smartPrintPortal');
    if(!portal)return;
    // Smart Print belongs on the normal NR BizPro Home/Dashboard only.
    // It must not appear inside the customer Demo experience.
    portal.style.display=isDemo()?'none':'';
  }
  function forceUniversal(){
    syncSmartPrint();
    if(!isDemo())return;
    try{
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
      syncSmartPrint();
    }catch(e){}
  }
  window.addEventListener('demoStarted',()=>setTimeout(forceUniversal,50));
  window.addEventListener('authReady',()=>setTimeout(forceUniversal,50));
  window.addEventListener('loginSuccess',()=>setTimeout(forceUniversal,50));
  window.addEventListener('load',()=>{
    syncSmartPrint();
    [100,500,1000,2000,3500].forEach(ms=>setTimeout(forceUniversal,ms));
    setInterval(forceUniversal,1500);
  });
})();
