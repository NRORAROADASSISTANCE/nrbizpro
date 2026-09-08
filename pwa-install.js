(function(){
  let deferredPrompt=null;
  function setup(){
    if(!document.querySelector('link[rel="manifest"]')){
      const link=document.createElement('link');link.rel='manifest';link.href='/manifest.webmanifest';document.head.appendChild(link);
    }
    if('serviceWorker' in navigator) navigator.serviceWorker.register('/service-worker.js',{scope:'/'}).catch(()=>{});
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;window.nrBizProInstallReady=true;});
    window.addEventListener('appinstalled',()=>{deferredPrompt=null;window.nrBizProInstallReady=false;});
    document.addEventListener('click',async e=>{
      const btn=e.target.closest?.('#plWebApp');
      if(!btn)return;
      e.preventDefault();e.stopPropagation();
      if(deferredPrompt){
        const prompt=deferredPrompt;deferredPrompt=null;
        await prompt.prompt();
        try{await prompt.userChoice}catch(_){ }
        return;
      }
      if(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true){
        alert('NR BizPro is already installed on this device.');
        return;
      }
      alert('Install option is not ready yet. In Chrome, open the browser menu (⋮) and choose “Install NR BizPro” or “Add to Home screen”.');
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
