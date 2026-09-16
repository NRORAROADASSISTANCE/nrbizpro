// NR BizPro — refresh auth guard. Keep the active workspace visible during refresh.
(function(){'use strict';
  const SESSION_KEY='nr-bizpro-session-v1';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function showLocal(){
    try{
      const id=localStorage.getItem(SESSION_KEY);
      const users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');
      const u=users.find(x=>String(x.id)===String(id));
      if(!u||String(u.status||'').toLowerCase()!=='active')return false;
      window.currentUser=u;
      if(typeof window.loadData==='function')window.state=window.loadData(u.id);
      document.getElementById('publicLanding')?.remove();
      document.getElementById('authScreen')?.classList.add('hidden');
      if(typeof window.showApp==='function')window.showApp();
      return true;
    }catch(e){return false}
  }
  async function verifyServer(){
    for(let attempt=0;attempt<6;attempt++){
      try{
        const r=await fetch('/api/auth?action=me',{method:'GET',credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'}});
        const d=await r.json().catch(()=>({}));
        if(r.ok&&d.user){
          window.currentUser=d.user;
          try{localStorage.setItem(SESSION_KEY,d.user.id)}catch{}
          if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);
          document.getElementById('publicLanding')?.remove();
          document.getElementById('authScreen')?.classList.add('hidden');
          if(typeof window.showApp==='function')window.showApp();
          return true;
        }
      }catch(e){}
      if(attempt<5)await sleep(700+attempt*600);
    }
    return false;
  }
  window.checkSession=async function(){
    // Do not flash the user back to Login during a browser refresh.
    // Restore the last active workspace immediately, then validate the server session.
    const hadLocal=showLocal();
    const ok=await verifyServer();
    if(ok)return true;
    // Keep the locally restored workspace visible if the server is temporarily unavailable.
    return hadLocal;
  };
})();
