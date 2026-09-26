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

  async function restoreLocal(){
    // Do not restore a local user before server verification. A browser can
    // contain credentials/profile data for a different business account.
    return false;
  }

  async function verify(){
    try{
      const r=await fetch('/api/auth?action=me',{method:'GET',credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      const d=await r.json().catch(()=>({}));
      if(!r.ok||!d.user)return false;
      try{
        localStorage.removeItem(EXPLICIT);
        localStorage.setItem(SESSION,String(d.user.id));
        localStorage.setItem(USER,JSON.stringify(d.user));
        const users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');
        const i=users.findIndex(x=>String(x.id)===String(d.user.id));
        if(i>=0){users[i]={...users[i],...d.user};localStorage.setItem('nr-bizpro-users-v1',JSON.stringify(users));}
      }catch{}
      window.currentUser=d.user;
      // PostgreSQL is the workspace source of truth. Never hydrate from local
      // business data during session restore.
      if(typeof window.loadServerData==='function') await window.loadServerData();
      document.getElementById('publicLanding')?.remove();
      document.getElementById('authScreen')?.classList.add('hidden');
      document.getElementById('app')?.classList.remove('hidden');
      if(typeof window.showApp==='function')window.showApp();
      return true;
    }catch{}
    return false;
  }
  async function forceLogout(){
    try{await fetch('/api/auth?action=logout',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},cache:'no-store',body:'{}'});}catch{}
    try{
      Object.keys(localStorage).forEach(k=>{
        if(/^nr-bizpro-(session|last-auth-user|explicit-logout)/.test(k)||k==='nr-bizpro-users-v1')localStorage.removeItem(k);
      });
      localStorage.setItem(EXPLICIT,'1');
      sessionStorage.clear();
    }catch{}
    try{window.currentUser=null;window.state=null;}catch{}
    document.getElementById('app')?.classList.add('hidden');
    document.getElementById('authScreen')?.classList.remove('hidden');
    document.getElementById('publicLanding')?.remove();
    window.renderAuth?.('login','You have been logged out successfully.');
  }
  window.__NRForceLogout=forceLogout;
  window.logout=forceLogout;
  // Capture the header Logout button before any legacy inline handler can run.
  document.addEventListener('click',function(e){
    const btn=e.target?.closest?.('button.logout');
    if(!btn)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    forceLogout();
  },true);
  window.__NRSessionAuthority={restore:restoreLocal,verify,logout:forceLogout};

  async function boot(){
    if(booting)return;
    booting=true;
    await verify();
    booting=false;
  }

  const repair=()=>{ /* Server verification is authoritative; no local-user UI repair. */ };

  window.addEventListener('load',()=>{boot();setTimeout(repair,800);setTimeout(repair,2500);setTimeout(repair,5000)});
  window.addEventListener('pageshow',boot);
  window.addEventListener('focus',repair);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)repair()});
  // No polling loop: repair is event-driven to keep the UI responsive.
})();