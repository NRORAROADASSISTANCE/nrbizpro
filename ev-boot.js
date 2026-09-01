// NR BizPro — boot EV modules after authentication/category load
(function(){
  let booted=false;
  function boot(){
    if(booted) return;
    const u=window.currentUser, s=window.state;
    const category=String(u?.category||s?.settings?.category||'');
    if(!/ev two|electric two|ev 2|ev scooter|ev bike/i.test(category)) return;
    booted=true;
    ['ev-two-wheeler-module.js','ev-two-wheeler-nav.js'].forEach(src=>{
      const el=document.createElement('script'); el.src=src+'?boot='+Date.now(); document.body.appendChild(el);
    });
  }
  boot();
  window.addEventListener('load',boot);
  setInterval(boot,500);
})();
