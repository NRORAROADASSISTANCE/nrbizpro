// NR BizPro — single session authority
// One refresh-safe session controller loaded after all legacy auth scripts.
// Explicit Logout remains respected; browser refresh/reload never logs an active session out.
(function(){
  'use strict';
  const SESSION='nr-bizpro-session-v1';
  const USER='nr-bizpro-last-auth-user';
  const EXPLICIT='nr-bizpro-explicit-logout';
  let booting=false;

  function readUser(){
    try{
      if(localStorage.getItem(EXPLICIT)==='1')return null;
      const id=localStorage.getItem(SESSION)||'';
      const raw=localStorage.getItem(USER);
      let u=raw?JSON.parse(raw):null;
      if(!u&&id){
        const users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');
        u=users.find(x=>String(x.id)===String(id))||null;
      }
      if(!u||String(u.status||'').toLowerCase()!=='active')return null;
      return u;
    }catch{return null}
  }

  function restoreLocal(){
    const u=readUser();
    if(!u)return false;
    try{
      localStorage.setItem(SESSION,String(u.id));
      localStorage.setItem(USER,JSON.stringify(u));
    }catch{}
    window.currentUser={...(window.currentUser||{}),...u};
    if(typeof window.loadData==='function')window.state=window.loadData(u.id);
    document.getElementById('publicLanding')?.remove();
    document.getElementById('authScreen')?.classList.add('hidden');
    document.getElementById('app')?.classList.remove('hidden');
    if(typeof window.showApp==='function')window.showApp();
    window.NRBizProCloudSync?.sync?.();
    return true;
  }

  async function verify(){
    try{
      const r=await fetch('/api/auth?action=me',{method:'GET',credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      const d=await r.json().catch(()=>({}));
      if(r.ok&&d.user){
        try{
          localStorage.removeItem(EXPLICIT);
          localStorage.setItem(SESSION,String(d.user.id));
          localStorage.setItem(USER,JSON.stringify(d.user));
          const users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');
          const i=users.findIndex(x=>String(x.id)===String(d.user.id));
          if(i>=0){users[i]={...users[i],...d.user};localStorage.setItem('nr-bizpro-users-v1',JSON.stringify(users));}
        }catch{}
        window.currentUser=d.user;
        if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);
        document.getElementById('publicLanding')?.remove();
        document.getElementById('authScreen')?.classList.add('hidden');
        document.getElementById('app')?.classList.remove('hidden');
        if(typeof window.showApp==='function')window.showApp();
        return true;
      }
    }catch{}
    return false;
  }

  window.__NRSessionAuthority={restore:restoreLocal,verify};

  async function boot(){
    if(booting)return;
    booting=true;
    const restored=restoreLocal();
    if(restored){
      await verify(); // background validation only; never hides the workspace on failure
    }
    booting=false;
  }

  const repair=()=>{
    if(localStorage.getItem(EXPLICIT)==='1')return;
    const u=readUser();
    if(!u)return;
    const app=document.getElementById('app');
    const auth=document.getElementById('authScreen');
    // Repair only an unintended login screen while a valid local session exists.
    if(app?.classList.contains('hidden')||!auth?.classList.contains('hidden')){
      restoreLocal();
    }
  };

  window.addEventListener('load',()=>{boot();setTimeout(repair,800);setTimeout(repair,2500);setTimeout(repair,5000)});
  window.addEventListener('pageshow',boot);
  window.addEventListener('focus',repair);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)repair()});
  setInterval(repair,1500);
})();