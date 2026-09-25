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
    // Do not cloud-sync from stale local profile before server verification.
    // Verification below is authoritative for the business identity/profile.
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
        try{
          if(window.state?.settings&&d.user){
            window.state.settings={...window.state.settings,name:d.user.business||window.state.settings.name||'',owner:d.user.owner||window.state.settings.owner||'',category:d.user.category||window.state.settings.category||'',mobile:d.user.mobile||window.state.settings.mobile||'',gst:d.user.gst||window.state.settings.gst||'',address:d.user.address||window.state.settings.address||'',email:d.user.email||window.state.settings.email||''};
            if(typeof window.save==='function')window.save();
            if(typeof window.loadSettings==='function')window.loadSettings();
          }
        }catch{}
        window.NRBizProCloudSync?.sync?.();
        return true;
      }
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
  // No polling loop: repair is event-driven to keep the UI responsive.
})();