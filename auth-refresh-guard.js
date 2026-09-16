// NR BizPro — refresh auth guard. Wait for server session before showing login.
(function(){'use strict';
  const SESSION_KEY='nr-bizpro-session-v1';
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  window.checkSession=async function(){
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
      if(attempt<5)await sleep(800+attempt*700);
    }
    // Only after all server retries, use the last known active account locally.
    try{
      const id=localStorage.getItem(SESSION_KEY);
      const users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');
      const u=users.find(x=>String(x.id)===String(id));
      if(u&&String(u.status||'').toLowerCase()==='active'){
        window.currentUser=u;
        if(typeof window.loadData==='function')window.state=window.loadData(u.id);
        document.getElementById('publicLanding')?.remove();
        document.getElementById('authScreen')?.classList.add('hidden');
        if(typeof window.showApp==='function')window.showApp();
        return true;
      }
    }catch(e){}
    return false;
  };
})();
