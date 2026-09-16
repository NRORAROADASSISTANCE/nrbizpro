// NR BizPro — session security hardening (no new API function)
(function(){'use strict';
  const IDLE_MS=30*60*1000, WARN_MS=5*60*1000;
  let lastActivity=Date.now(), warnTimer=0, lockTimer=0, locked=false;
  const active=()=>!!(window.currentUser&&document.getElementById('app')&&!document.getElementById('app').classList.contains('hidden'));
  function touch(){if(locked)return;lastActivity=Date.now();schedule()}
  function schedule(){clearTimeout(warnTimer);clearTimeout(lockTimer);if(!active())return;warnTimer=setTimeout(()=>{if(Date.now()-lastActivity>=IDLE_MS-WARN_MS&&!locked)showWarning()},IDLE_MS-WARN_MS);lockTimer=setTimeout(()=>{if(Date.now()-lastActivity>=IDLE_MS&&!locked)lock()},IDLE_MS)}
  function showWarning(){if(document.getElementById('nr-session-warning'))return;const d=document.createElement('div');d.id='nr-session-warning';d.style='position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:20px;font-family:Arial,sans-serif';d.innerHTML='<div style="background:#fff;width:min(420px,100%);padding:24px;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.25)"><h3 style="margin:0 0 10px">Session expiring</h3><p style="color:#607089;line-height:1.5">You have been inactive for 25 minutes. Continue working to keep your session active.</p><button id="nrStay" style="border:0;border-radius:10px;padding:12px 18px;background:#1264f5;color:#fff;font-weight:700;cursor:pointer">Continue Session</button></div>';document.body.appendChild(d);document.getElementById('nrStay').onclick=()=>{d.remove();touch()}}
  function lock(){locked=true;document.getElementById('nr-session-warning')?.remove();const app=document.getElementById('app');if(app)app.classList.add('hidden');const s=document.getElementById('authScreen');if(s)s.classList.remove('hidden');if(typeof window.renderAuth==='function')window.renderAuth('login','Your session was locked after 30 minutes of inactivity. Please sign in again.')}
  function secureLogout(){locked=true;clearTimeout(warnTimer);clearTimeout(lockTimer);try{sessionStorage.clear()}catch{};try{localStorage.removeItem('nr-bizpro-session-v1')}catch{};if(typeof window.logout==='function'&&!window.__nrSecureLogout){window.__nrSecureLogout=true;window.logout()}}
  window.NRBizProSession={touch,lock,secureLogout,isLocked:()=>locked};
  ['click','keydown','pointerdown','touchstart','mousemove'].forEach(e=>window.addEventListener(e,touch,{passive:true}));
  window.addEventListener('load',()=>{setTimeout(schedule,4500);document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(Date.now()-lastActivity>=IDLE_MS)lock();else schedule()})});
})();
