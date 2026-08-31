(function(){
  const originalShowApp=window.showApp;
  let authGeneration=0;
  const DEVICE_KEY='nr-bizpro-device-key-v1';
  const DEVICE_INFO='nr-bizpro-device-info-v1';
  function deviceKey(){let k=localStorage.getItem(DEVICE_KEY);if(!k){k=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`);localStorage.setItem(DEVICE_KEY,k)}return k}
  function deviceInfo(){return {deviceName:navigator.platform||'Web device',deviceType:'web'}}
  function forceLogin(message){const app=document.getElementById('app'),screen=document.getElementById('authScreen');if(app)app.classList.add('hidden');if(screen)screen.classList.remove('hidden');if(typeof window.renderAuth==='function')window.renderAuth('login',message||'Please log in to continue.')}
  async function loginRequest(id,password){return fetch('/api/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json','X-NRBIZPRO-DEVICE':deviceKey()},credentials:'include',body:JSON.stringify({action:'login',id,password,...deviceInfo()})})}
  window.login=async function(e){e.preventDefault();const myGeneration=++authGeneration,id=document.getElementById('loginId')?.value.trim()||'',password=document.getElementById('loginPassword')?.value||'';try{const r=await loginRequest(id,password),d=await r.json();if(myGeneration!==authGeneration)return;if(!r.ok){if(d.deviceLimit)return window.renderAuth('login',d.error||'This device is not authorized.');if(d.paymentRequired&&d.user){window.currentUser=d.user;return window.renderAuth('plans','Membership payment is required before using NR BizPro.')}return window.renderAuth('login',d.error||'Invalid login details.')}window.currentUser=d.user;localStorage.removeItem('nr-bizpro-session-v1');if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);originalShowApp()}catch(err){if(myGeneration===authGeneration)window.renderAuth('login','Server connection failed. Please try again.')}};
  window.checkSession=async function(){const myGeneration=authGeneration;try{const r=await fetch('/api/auth?action=me',{credentials:'include'}),d=await r.json();if(myGeneration!==authGeneration)return;if(r.ok&&d.user){window.currentUser=d.user;if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);originalShowApp();return}}catch(e){}if(myGeneration===authGeneration){localStorage.removeItem('nr-bizpro-session-v1');forceLogin()}};
  window.getNRBizProDeviceKey=deviceKey;
  window.checkSession();
})();