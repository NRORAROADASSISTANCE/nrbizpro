// NR BizPro — final server-session restore after full browser refresh.
(function(){'use strict';
  let finished=false;
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  async function restore(){
    if(finished||document.visibilityState==='prerender')return;
    // The server cookie is authoritative. Never treat localStorage as proof of login.
    for(let attempt=0;attempt<5&&!finished;attempt++){
      try{
        const r=await fetch('/api/auth?action=me',{method:'GET',credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'}});
        const d=await r.json().catch(()=>({}));
        if(r.ok&&d.user){
          finished=true;
          window.currentUser=d.user;
          if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);
          document.getElementById('publicLanding')?.remove();
          document.getElementById('authScreen')?.classList.add('hidden');
          if(typeof window.showApp==='function')window.showApp();
          return;
        }
      }catch(e){}
      if(attempt<4)await wait(700*(attempt+1));
    }
  }
  window.addEventListener('load',()=>setTimeout(restore,250));
  window.addEventListener('pageshow',e=>{if(e.persisted)restore()});
})();
