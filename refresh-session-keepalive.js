// NR BizPro — refresh session keepalive (loaded last)
// Restores the active local business session after a browser refresh without overriding an explicit logout.
(function(){
  'use strict';
  const SESSION='nr-bizpro-session-v1',USER='nr-bizpro-last-auth-user',EXPLICIT='nr-bizpro-explicit-logout';
  function read(){
    try{
      if(localStorage.getItem(EXPLICIT)==='1')return null;
      let id=localStorage.getItem(SESSION);
      let u=null;
      const raw=localStorage.getItem(USER);
      if(raw)u=JSON.parse(raw);
      if(!u&&id){
        const users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');
        u=users.find(x=>String(x.id)===String(id))||null;
      }
      if(!u||String(u.status||'').toLowerCase()!=='active')return null;
      return u;
    }catch{return null}
  }
  function restore(){
    const u=read(); if(!u)return false;
    try{localStorage.setItem(SESSION,String(u.id));localStorage.setItem(USER,JSON.stringify(u))}catch{}
    window.currentUser={...(window.currentUser||{}),...u};
    if(typeof window.loadData==='function')window.state=window.loadData(u.id);
    document.getElementById('publicLanding')?.remove();
    document.getElementById('authScreen')?.classList.add('hidden');
    document.getElementById('app')?.classList.remove('hidden');
    if(typeof window.showApp==='function')window.showApp();
    window.NRBizProCloudSync?.sync?.();
    window.renderItems?.();window.renderBills?.();window.renderCustomers?.();window.updateStats?.();
    return true;
  }
  function boot(){
    restore();
    [300,900,1800,3500,6000,9000].forEach(ms=>setTimeout(restore,ms));
  }
  window.addEventListener('pageshow',boot);
  window.addEventListener('load',boot);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)restore()});
  window.NRBizProRefreshKeepalive={restore};
  setTimeout(boot,50);
})();