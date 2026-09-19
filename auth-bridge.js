// Server-auth bridge and public landing gate.
(function(){
  const originalShowApp=window.showApp;
  const SESSION_KEY='nr-bizpro-session-v1';
  let authGeneration=0;
  function clearDemoState(){
    window.nrBizProDemoMode=false;
    if(window.currentUser?.plan==='demo')window.currentUser=null;
    document.getElementById('industryTab')?.remove();
    document.getElementById('industryModule')?.remove();
  }
  function safeShowApp(){try{const a=document.getElementById('app'),s=document.getElementById('authScreen');if(a&&!a.classList.contains('hidden')&&s?.classList.contains('hidden'))return;}catch{} originalShowApp();}
  function forceLogin(message){
    clearDemoState();
    const app=document.getElementById('app'),screen=document.getElementById('authScreen'),landing=document.getElementById('publicLanding');
    if(landing) landing.remove();
    if(app) app.classList.add('hidden');
    if(screen) screen.classList.remove('hidden');
    if(typeof window.renderAuth==='function') window.renderAuth('login',message||'Please log in to continue.');
  }
  function saveServerUser(d){
    window.currentUser=d.user;
    if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);
    // Server business fields are authoritative. Repair older local records that
    // contain blank/stale profile fields without deleting the business workspace.
    try{
      if(window.state?.settings&&d.user){
        window.state.settings={...window.state.settings,name:d.user.business||window.state.settings.name||'',owner:d.user.owner||window.state.settings.owner||'',category:d.user.category||window.state.settings.category||'',mobile:d.user.mobile||window.state.settings.mobile||'',gst:d.user.gst||window.state.settings.gst||'',address:d.user.address||window.state.settings.address||'',email:d.user.email||window.state.settings.email||''};
        if(typeof window.save==='function')window.save();
      }
    }catch{}
    const key='nr-bizpro-users-v1';
    try{const users=JSON.parse(localStorage.getItem(key)||'[]');const i=users.findIndex(u=>u.id===d.user.id);const local={...d.user};if(i>=0)users[i]={...users[i],...local};else users.push(local);localStorage.setItem(key,JSON.stringify(users));}catch{}
  }
  async function serverSignup(e){
    e.preventDefault();
    const business=document.getElementById('suBusiness')?.value.trim()||'';
    const owner=document.getElementById('suOwner')?.value.trim()||'';
    const mobile=document.getElementById('suMobile')?.value.trim()||'';
    const email=document.getElementById('suEmail')?.value.trim().toLowerCase()||'';
    const category=document.getElementById('suCategory')?.value.trim()||'';
    const gst=document.getElementById('suGst')?.value.trim()||'';
    const password=document.getElementById('suPassword')?.value||'';
    const userId=(email.split('@')[0]||business.toLowerCase().replace(/[^a-z0-9._-]/g,'')).slice(0,40);
    try{
      const r=await fetch('/api/auth?action=signup',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'signup',business,owner,mobile,email,category,gst,password,userId,address:'Not provided'})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw Error(d.error||'Registration failed.');
      saveServerUser(d);
      window.renderAuth?.('plans');
    }catch(err){window.renderAuth?.('signup',err.message)}
  }
  async function serverLogin(e){
    e.preventDefault(); const myGeneration=++authGeneration;
    const id=document.getElementById('loginId')?.value.trim()||''; const password=document.getElementById('loginPassword')?.value||'';
    try{
      const r=await fetch('/api/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'login',id,password})});
      const d=await r.json(); if(myGeneration!==authGeneration)return;
      if(!r.ok){
        if(d.paymentRequired&&d.user){saveServerUser(d);return window.renderAuth?.('plans','Membership payment is required before using NR BizPro.')}
        try{
          const users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');
          const legacy=users.find(u=>((u.user_id||u.loginId||u.mobile||'').toString().toLowerCase()===id.toLowerCase()||String(u.mobile||'')===id)&&u.password===password);
          if(legacy){
            const userId=(legacy.user_id||legacy.loginId||String(legacy.email||'').split('@')[0]||legacy.business||'legacy').toLowerCase().replace(/[^a-z0-9._-]/g,'').slice(0,40);
            const sr=await fetch('/api/auth?action=signup',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'signup',business:legacy.business||'Legacy Business',owner:legacy.owner||'Owner',userId,mobile:legacy.mobile||'',email:legacy.email||'',category:legacy.category||'General Business',gst:legacy.gst||'',address:legacy.address||'Not provided',password})});
            const sd=await sr.json().catch(()=>({}));
            if(sr.ok&&sd.user){saveServerUser(sd);return window.renderAuth?.('plans','Your older browser-only account has been connected to the secure business database. Please choose a membership plan to activate it.')}
          }
        }catch{}
        return window.renderAuth?.('login',d.error||'Invalid login details.')
      }
      clearDemoState();
      saveServerUser(d);
      try{localStorage.setItem(SESSION_KEY,d.user.id);localStorage.setItem('nr-bizpro-last-auth-user',JSON.stringify(d.user));localStorage.removeItem('nr-bizpro-explicit-logout')}catch{}
      safeShowApp();
    }catch(err){if(myGeneration===authGeneration)window.renderAuth?.('login','Server connection failed. Please try again.')}
  }
  window.login=serverLogin;
  window.signup=serverSignup;
  window.checkSession=async function(){
    // Refresh-safe session restore: local active session keeps the workspace visible immediately.
    const myGeneration=authGeneration;
    let sid='';
    try{sid=localStorage.getItem(SESSION_KEY)||''}catch{}
    if(sid){
      try{
        const users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');
        const u=users.find(x=>String(x.id)===String(sid));
        if(u&&String(u.status||'').toLowerCase()==='active'){
          clearDemoState();
          window.currentUser=u;
          if(typeof window.loadData==='function')window.state=window.loadData(u.id);
          safeShowApp();
          // Verify in background. Never force logout on a transient server/auth failure.
          fetch('/api/auth?action=me',{method:'GET',credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'}})
            .then(r=>r.json().catch(()=>({})))
            .then(d=>{
              if(myGeneration!==authGeneration)return;
              if(d?.user){
                saveServerUser(d);
                try{localStorage.setItem(SESSION_KEY,d.user.id)}catch{}
                safeShowApp();
              }
            }).catch(()=>{});
          return true;
        }
      }catch{}
    }
    try{
      const r=await fetch('/api/auth?action=me',{method:'GET',credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      const d=await r.json().catch(()=>({}));
      if(myGeneration===authGeneration&&r.ok&&d.user){
        clearDemoState();
        saveServerUser(d);
        try{localStorage.setItem(SESSION_KEY,d.user.id)}catch{}
        safeShowApp();
        return true;
      }
    }catch{}
    if(myGeneration===authGeneration)forceLogin('Please log in to continue.');
    return false;
  };
  function buildPublicLanding(){
    const old=document.getElementById('publicLanding'); if(old)old.remove();
    const landing=document.createElement('div'); landing.id='publicLanding';
    landing.innerHTML=`<style>#publicLanding{position:fixed;inset:0;z-index:9998;overflow:auto;background:linear-gradient(135deg,#f7faff,#fff 48%,#eef5ff);font-family:Inter,Arial,sans-serif;color:#10233f}#publicLanding .pl-wrap{max-width:1120px;margin:auto;padding:28px 24px 60px}.pl-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 0 55px}.pl-brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px}.pl-mark{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#1264f5;color:#fff;font-weight:900}.pl-links{display:flex;gap:12px;align-items:center}.pl-links a{color:#40516a;text-decoration:none;font-size:14px;font-weight:600}.pl-login,.pl-web,.pl-primary{border:0;border-radius:11px;padding:13px 21px;font-weight:800;cursor:pointer}.pl-login,.pl-web{border:1px solid #cbd7e8;background:#fff;color:#1559d6}.pl-web{background:#eef5ff}.pl-primary{background:#1264f5;color:#fff}.pl-hero{display:grid;grid-template-columns:1.25fr .75fr;gap:55px;align-items:center;padding:20px 0 65px}.pl-badge{display:inline-block;background:#e7f0ff;color:#1559d6;padding:8px 13px;border-radius:999px;font-size:12px;font-weight:800}.pl-hero h1{font-size:52px;line-height:1.08;margin:18px 0}.pl-sub{font-size:19px;line-height:1.65;color:#607089;max-width:680px}.pl-actions{display:flex;gap:12px}.pl-secondary{background:#fff;color:#1559d6;border:1px solid #cbd7e8;border-radius:11px;padding:12px 21px;font-weight:800;text-decoration:none}.pl-card{background:#fff;border:1px solid #e1e9f4;border-radius:22px;padding:28px;box-shadow:0 20px 55px rgba(25,64,120,.1)}.pl-feature{display:flex;gap:12px;margin:16px 0;color:#53647b;font-size:14px}.pl-check{width:25px;height:25px;border-radius:50%;background:#eaf2ff;color:#1264f5;display:grid;place-items:center;flex:none}.pl-section{text-align:center;padding:18px 0 40px}.pl-section h2{font-size:30px}.pl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.pl-mini{background:#fff;border:1px solid #e1e9f4;border-radius:14px;padding:19px;font-weight:750}.pl-mini span{display:block;font-size:12px;font-weight:500;color:#718198;margin-top:7px}@media(max-width:800px){.pl-links a{display:none}.pl-hero{grid-template-columns:1fr}.pl-grid{grid-template-columns:1fr 1fr}.pl-hero h1{font-size:40px}.pl-grid{grid-template-columns:1fr 1fr}}@media(max-width:520px){.pl-grid{grid-template-columns:1fr}.pl-web,.pl-login{padding:11px 13px;font-size:13px}}</style><div class="pl-wrap"><nav class="pl-nav"><div class="pl-brand"><span class="pl-mark">NR</span><span>NR BizPro</span></div><div class="pl-links"><a href="pricing.html">Pricing</a><a href="services.html">Services</a><a href="contact.html">Contact</a><button class="pl-web" id="plWebApp">Web App</button><button class="pl-login" id="plLogin">Login</button></div></nav><section class="pl-hero"><div><span class="pl-badge">UNIVERSAL BILLING & BUSINESS MANAGEMENT</span><h1>One platform.<br>Every business.</h1><p class="pl-sub">Create invoices, manage products and stock, track customers, and run your business from one simple workspace.</p><div class="pl-actions"><button class="pl-primary" id="plSignup">Create Business Account</button></div></div><div class="pl-card"><h3>Everything you need to bill</h3><div class="pl-feature"><span class="pl-check">✓</span><span>Fast billing with product and barcode support</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Products, pricing, GST and stock management</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Customer records, bill history and printing</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Business-specific tools for different categories</span></div></div></section></div>`;
    document.body.appendChild(landing);
    const openAuth=mode=>{landing.remove();document.getElementById('authScreen')?.classList.remove('hidden');window.renderAuth?.(mode)};
    document.getElementById('plLogin').onclick=()=>openAuth('login');
    document.getElementById('plWebApp').onclick=()=>openAuth('login');
    document.getElementById('plSignup').onclick=()=>openAuth('signup');
  }
  function setupPublicLayer(){
    clearDemoState();
    const app=document.getElementById('app');
    if(app&&!app.classList.contains('hidden'))return;
    const requested=new URLSearchParams(location.hash.replace(/^#/,'')).get('auth');
    if(requested==='login'||requested==='signup'){
      document.getElementById('publicLanding')?.remove();
      document.getElementById('authScreen')?.classList.remove('hidden');
      window.renderAuth?.(requested);
      return;
    }
    buildPublicLanding();
  }
  setupPublicLayer();
  // Give the dedicated refresh guard time to install before the first session check.
  setTimeout(()=>window.checkSession?.(),5000);
})();
