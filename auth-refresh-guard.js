// NR BizPro — refresh auth guard. Restore the last active workspace immediately, then verify server session.
(function(){'use strict';
  const SESSION_KEY='nr-bizpro-session-v1';
  let restoring=false;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function localRestore(){
    try{
      const id=localStorage.getItem(SESSION_KEY);
      if(!id)return false;
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
          try{
            const key='nr-bizpro-users-v1',users=JSON.parse(localStorage.getItem(key)||'[]'),i=users.findIndex(x=>String(x.id)===String(d.user.id));
            if(i>=0){users[i]={...users[i],...d.user};localStorage.setItem(key,JSON.stringify(users));}
          }catch{}
          if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);
          document.getElementById('publicLanding')?.remove();
          document.getElementById('authScreen')?.classList.add('hidden');
          if(typeof window.showApp==='function')window.showApp();
          return true;
        }
      }catch(e){}
      if(attempt<5)await sleep(700+attempt*500);
    }
    // Do not log the user out just because /me had a transient failure.
    return false;
  }
  window.checkSession=async function(){
    if(restoring)return true;
    restoring=true;
    const restored=localRestore();
    if(restored){
      verifyServer().finally(()=>{restoring=false});
      return true;
    }
    const ok=await verifyServer();
    restoring=false;
    return ok;
  };
})();
