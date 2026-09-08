(function(){
  let deferredPrompt = window.__nrBizProDeferredPrompt || null;
  let installReady = !!deferredPrompt;

  function setPrompt(e){
    e.preventDefault();
    deferredPrompt = e;
    window.__nrBizProDeferredPrompt = e;
    installReady = true;
    window.nrBizProInstallReady = true;
  }

  // Register immediately so Chrome's beforeinstallprompt event cannot be missed.
  window.addEventListener('beforeinstallprompt', setPrompt);

  window.addEventListener('appinstalled', function(){
    deferredPrompt = null;
    window.__nrBizProDeferredPrompt = null;
    installReady = false;
    window.nrBizProInstallReady = false;
  });

  function setup(){
    if(!document.querySelector('link[rel="manifest"]')){
      const link=document.createElement('link');
      link.rel='manifest';
      link.href='/manifest.webmanifest';
      document.head.appendChild(link);
    }

    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(()=>{});
    }

    document.addEventListener('click', async function(e){
      const btn=e.target.closest?.('#plWebApp');
      if(!btn)return;
      e.preventDefault();
      e.stopPropagation();

      if(deferredPrompt){
        const prompt=deferredPrompt;
        deferredPrompt=null;
        window.__nrBizProDeferredPrompt=null;
        window.nrBizProInstallReady=false;
        try{
          await prompt.prompt();
          await prompt.userChoice;
        }catch(_){ }
        return;
      }

      if(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true){
        alert('NR BizPro is already installed on this device.');
        return;
      }

      // Chrome may expose its native install control even when the page event is unavailable.
      alert('NR BizPro is ready to install. Please click the Install icon in the Chrome address bar.');
    },true);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',setup);
  }else{
    setup();
  }
})();
