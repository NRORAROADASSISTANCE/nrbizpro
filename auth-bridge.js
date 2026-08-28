// Server-auth gate: never trust the legacy localStorage session for access.
(function(){
  const originalShowApp=window.showApp;
  function forceLogin(message){
    const app=document.getElementById('app'),screen=document.getElementById('authScreen');
    if(app)app.classList.add('hidden');
    if(screen)screen.classList.remove('hidden');
    if(typeof window.renderAuth==='function')window.renderAuth('login',message||'Please log in to continue.');
  }
  window.login=async function(e){
    e.preventDefault();
    const id=document.getElementById('loginId')?.value.trim()||'';
    const password=document.getElementById('loginPassword')?.value||'';
    try{
      const r=await fetch('/api/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'login',id,password})});
      const d=await r.json();
      if(!r.ok){
        if(d.paymentRequired&&d.user){
          window.currentUser=d.user;
          if(typeof window.renderAuth==='function')window.renderAuth('plans','Membership payment is required before using NR BizPro.');
          return;
        }
        return window.renderAuth('login',d.error||'Invalid login details.');
      }
      window.currentUser=d.user;
      localStorage.removeItem('nr-bizpro-session-v1');
      if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);
      originalShowApp();
    }catch(err){ window.renderAuth('login','Server connection failed. Please try again.'); }
  };
  window.checkSession=async function(){
    try{
      const r=await fetch('/api/auth?action=me',{credentials:'include'});
      const d=await r.json();
      if(r.ok&&d.user){window.currentUser=d.user;window.state=window.loadData(d.user.id);originalShowApp();return;}
    }catch(e){}
    localStorage.removeItem('nr-bizpro-session-v1');
    forceLogin();
  };
  // The old client-side app may have opened the dashboard before this bridge loaded.
  // Immediately replace that behavior with a server-session check.
  forceLogin();
  window.checkSession();
})();
