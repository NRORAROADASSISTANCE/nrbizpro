// Business-holder login UI: Login ID + Mobile only.
(function(){
  const originalRenderAuth=window.renderAuth;
  if(typeof originalRenderAuth!=='function') return;
  window.renderAuth=function(mode='login',message=''){
    if(mode!=='login') return originalRenderAuth(mode,message);
    const el=document.getElementById('authContent');
    if(!el) return originalRenderAuth(mode,message);
    const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
    el.innerHTML=`<div class="auth-title"><h1>Welcome back</h1><p>Login to your NR BizPro business account.</p></div>${message?`<div class="notice">${esc(message)}</div>`:''}<form onsubmit="login(event)"><label>Login ID / Mobile<input id="loginId" required autocomplete="username" placeholder="Enter Login ID or mobile number"></label><label>Password<input id="loginPassword" required type="password" autocomplete="current-password"></label><button class="primary auth-btn">Login</button></form><p class="auth-switch">Use your registered <b>Login ID</b> or <b>Mobile number</b> with your password.</p><p class="auth-switch">New business? <button onclick="renderAuth('signup')">Create account</button></p>`;
  };
})();
