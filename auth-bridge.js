// Server-auth gate: use the server session and prevent an old /me check from
// sending the user back to login after a successful login.
(function(){
  const originalShowApp=window.showApp;
  let authGeneration=0;

  function forceLogin(message){
    const app=document.getElementById('app');
    const screen=document.getElementById('authScreen');
    if(app)app.classList.add('hidden');
    if(screen)screen.classList.remove('hidden');
    if(typeof window.renderAuth==='function')window.renderAuth('login',message||'Please log in to continue.');
  }

  window.login=async function(e){
    e.preventDefault();
    const myGeneration=++authGeneration;
    const id=document.getElementById('loginId')?.value.trim()||'';
    const password=document.getElementById('loginPassword')?.value||'';

    try{
      const r=await fetch('/api/auth?action=login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify({action:'login',id,password})
      });
      const d=await r.json();

      // Ignore a stale login response if another auth action already happened.
      if(myGeneration!==authGeneration)return;

      if(!r.ok){
        if(d.paymentRequired&&d.user){
          window.currentUser=d.user;
          if(typeof window.renderAuth==='function'){
            window.renderAuth('plans','Membership payment is required before using NR BizPro.');
          }
          return;
        }
        return window.renderAuth('login',d.error||'Invalid login details.');
      }

      window.currentUser=d.user;
      localStorage.removeItem('nr-bizpro-session-v1');
      if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);
      originalShowApp();
    }catch(err){
      if(myGeneration!==authGeneration)return;
      window.renderAuth('login','Server connection failed. Please try again.');
    }
  };

  window.checkSession=async function(){
    const myGeneration=authGeneration;
    try{
      const r=await fetch('/api/auth?action=me',{credentials:'include'});
      const d=await r.json();

      // A login/logout happened while /me was in flight. Never let this stale
      // response change the current screen.
      if(myGeneration!==authGeneration)return;

      if(r.ok&&d.user){
        window.currentUser=d.user;
        if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);
        originalShowApp();
        return;
      }
    }catch(e){
      if(myGeneration!==authGeneration)return;
    }

    // Only this generation may force the login screen.
    if(myGeneration===authGeneration){
      localStorage.removeItem('nr-bizpro-session-v1');
      forceLogin();
    }
  };

  // Do not call forceLogin() before the server-session check. The auth screen is
  // already the initial page, and checkSession() decides whether to show the app.
  window.checkSession();
})();
