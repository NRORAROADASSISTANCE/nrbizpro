// Server-auth bridge and public landing gate.
(function(){
  const originalShowApp=window.showApp;
  const SESSION_KEY='nr-bizpro-session-v1';
  let authGeneration=0;
  // Shared generation prevents a refresh/pageshow session check for the previous
  // account from overwriting a newly authenticated business account.
  window.__NRAuthGeneration=Number(window.__NRAuthGeneration||0);
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
    // Server identity is authoritative. Never preload a local workspace during login.
    window.currentUser=d.user;
    window.state=null;
    // Do not merge server identity into a possibly stale local workspace here.\n    // loadServerData() must run first and is the only source of workspace state.\n    const key='nr-bizpro-users-v1';
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
    e.preventDefault(); const myGeneration=++authGeneration; const loginGeneration=++window.__NRAuthGeneration;
    const id=document.getElementById('loginId')?.value.trim()||''; const password=document.getElementById('loginPassword')?.value||'';
    try{
      const r=await fetch('/api/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'login',id,password})});
      const d=await r.json(); if(myGeneration!==authGeneration)return;
      if(!r.ok){
        if(d.paymentRequired&&d.user){saveServerUser(d);return window.renderAuth?.('plans','Membership payment is required before using NR BizPro.')}
        return window.renderAuth?.('login',d.error||'Invalid login details.')
      }
      clearDemoState();
      if(loginGeneration!==window.__NRAuthGeneration)return;
      saveServerUser(d);
      // The server login response is authoritative. Load the business workspace
      // from PostgreSQL before rendering the app; the old local loadData path
      // is not the source of truth anymore.
      if(loginGeneration!==window.__NRAuthGeneration)return;
      if(typeof window.loadServerData==='function') await window.loadServerData();
      if(loginGeneration!==window.__NRAuthGeneration)return;
      try{localStorage.setItem(SESSION_KEY,d.user.id);localStorage.setItem('nr-bizpro-last-auth-user',JSON.stringify(d.user));localStorage.removeItem('nr-bizpro-explicit-logout')}catch{}
      // Login/API success must never be converted into a misleading
      // "Server connection failed" message by a legacy UI renderer.
      try{safeShowApp()}catch(uiError){
        console.error('NR BizPro UI render after login failed:',uiError);
        document.getElementById('publicLanding')?.remove();
        document.getElementById('authScreen')?.classList.add('hidden');
        document.getElementById('app')?.classList.remove('hidden');
      }
    }catch(err){if(myGeneration===authGeneration)window.renderAuth?.('login','Server connection failed. Please try again.')}
  }
  window.login=serverLogin;
  window.signup=serverSignup;
  window.checkSession=async function(){
    // SECURITY: the server session is the only authority for the active business.
    // Never restore an old local user/workspace before /api/auth?action=me.
    const myGeneration=authGeneration;
    let explicitLogout=false;
    try{explicitLogout=localStorage.getItem('nr-bizpro-explicit-logout')==='1'}catch{}
    if(explicitLogout){forceLogin('You have been logged out.');return false}
    try{
      const r=await fetch('/api/auth?action=me',{method:'GET',credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'}});
      const d=await r.json().catch(()=>({}));
      if(myGeneration!==authGeneration)return false;
      if(!r.ok||!d.user){forceLogin('Please log in to continue.');return false}
      clearDemoState();
      // Set the authenticated identity from the server, then load only that
      // businessId's PostgreSQL workspace before showing any business screen.
      window.currentUser=d.user;
      try{localStorage.setItem(SESSION_KEY,d.user.id);localStorage.setItem('nr-bizpro-last-auth-user',JSON.stringify(d.user));localStorage.removeItem('nr-bizpro-explicit-logout')}catch{}
      if(typeof window.loadServerData==='function') await window.loadServerData();
      safeShowApp();
      return true;
    }catch(e){
      if(myGeneration===authGeneration)forceLogin('Session verification failed. Please log in again.');
      return false;
    }
  };
  function buildPublicLanding(){
    const old=document.getElementById('publicLanding'); if(old)old.remove();
    const landing=document.createElement('div'); landing.id='publicLanding';
    landing.innerHTML=`<style>#publicLanding{position:fixed;inset:0;z-index:9998;overflow:auto;background:linear-gradient(135deg,#f7faff,#fff 48%,#eef5ff);font-family:Inter,Arial,sans-serif;color:#10233f}#publicLanding .pl-wrap{max-width:1120px;margin:auto;padding:28px 24px 60px}.pl-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 0 55px}.pl-brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px}.pl-mark{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#1264f5;color:#fff;font-weight:900}.pl-links{display:flex;gap:12px;align-items:center}.pl-links a{color:#1559d6;text-decoration:none;font-size:14px;font-weight:800;border:1px solid #cbd7e8;background:#fff;border-radius:11px;padding:12px 15px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}.pl-login,.pl-web,.pl-primary{border:0;border-radius:11px;padding:13px 21px;font-weight:800;cursor:pointer}.pl-login,.pl-web{border:1px solid #cbd7e8;background:#fff;color:#1559d6}.pl-web{background:#eef5ff}.pl-primary{background:#1264f5;color:#fff}.pl-hero{display:grid;grid-template-columns:1.25fr .75fr;gap:55px;align-items:center;padding:20px 0 65px}.pl-badge{display:inline-block;background:#e7f0ff;color:#1559d6;padding:8px 13px;border-radius:999px;font-size:12px;font-weight:800}.pl-hero h1{font-size:52px;line-height:1.08;margin:18px 0}.pl-sub{font-size:19px;line-height:1.65;color:#607089;max-width:680px}.pl-actions{display:flex;gap:12px}.pl-secondary{background:#fff;color:#1559d6;border:1px solid #cbd7e8;border-radius:11px;padding:12px 21px;font-weight:800;text-decoration:none}.pl-card{background:#fff;border:1px solid #e1e9f4;border-radius:22px;padding:28px;box-shadow:0 20px 55px rgba(25,64,120,.1)}.pl-feature{display:flex;gap:12px;margin:16px 0;color:#53647b;font-size:14px}.pl-check{width:25px;height:25px;border-radius:50%;background:#eaf2ff;color:#1264f5;display:grid;place-items:center;flex:none}.pl-section{text-align:center;padding:18px 0 40px}.pl-section h2{font-size:30px}.pl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.pl-mini{background:#fff;border:1px solid #e1e9f4;border-radius:14px;padding:19px;font-weight:750}.pl-mini span{display:block;font-size:12px;font-weight:500;color:#718198;margin-top:7px}@media(max-width:800px){.pl-nav{align-items:center;flex-wrap:wrap;gap:12px;padding-bottom:30px}.pl-links{flex:1 1 100%;justify-content:flex-end;flex-wrap:wrap;gap:8px}.pl-links a{display:inline-block}.pl-hero{grid-template-columns:1fr;gap:28px}.pl-grid{grid-template-columns:1fr 1fr}.pl-hero h1{font-size:40px}.pl-sub{font-size:18px}.pl-card{padding:24px}}@media(max-width:520px){.pl-wrap{padding:20px 16px 45px}.pl-nav{padding-top:72px}.pl-brand{font-size:20px}.pl-mark{width:40px;height:40px}.pl-links{justify-content:flex-start}.pl-links a,.pl-web,.pl-login{font-size:13px}.pl-links a{padding:10px 12px}.pl-web,.pl-login{padding:10px 12px}.pl-grid{grid-template-columns:1fr}.pl-hero h1{font-size:36px}.pl-sub{font-size:17px}.pl-actions{flex-wrap:wrap}.pl-primary,.pl-secondary{width:100%;text-align:center}}</style><div class="pl-wrap"><nav class="pl-nav"><div class="pl-brand"><span class="pl-mark">NR</span><span>NR BizPro</span></div><div class="pl-links"><a href="pricing.html">Pricing</a><a href="services.html">Services</a><a href="contact.html">Contact</a><button class="pl-web" id="plHms">HMS</button><button class="pl-web" id="plWebApp">Web App</button><button class="pl-login" id="plLogin">Login</button></div></nav><section class="pl-hero"><div><span class="pl-badge">UNIVERSAL BILLING & BUSINESS MANAGEMENT</span><h1>One platform.<br>Every business.</h1><p class="pl-sub">Create invoices, manage products and stock, track customers, and run your business from one simple workspace.</p><div class="pl-actions"><button class="pl-primary" id="plSignup">Create Business Account</button></div></div><div class="pl-card"><h3>Everything you need to bill</h3><div class="pl-feature"><span class="pl-check">✓</span><span>Fast billing with product and barcode support</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Products, pricing, GST and stock management</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Customer records, bill history and printing</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Business-specific tools for different categories</span></div></div></section>
<section class="pl-section">
  <span class="pl-badge">BUILT FOR DIFFERENT BUSINESSES</span>
  <h2>One platform. Many business workflows.</h2>
  <p class="pl-sub" style="margin:0 auto 26px">Choose the workflow that matches your business and keep billing, stock, customers and daily operations in one workspace.</p>
  <div class="pl-grid">
    <div class="pl-mini">Retail & Supermarket<span>Barcode billing, stock, purchases and customer history.</span></div>
    <div class="pl-mini">Hardware & Plumbing<span>Units, products, suppliers, stock and sales.</span></div>
    <div class="pl-mini">Paint Shop<span>Brands, shades, pack sizes, GST and billing.</span></div>
    <div class="pl-mini">Garage & Service<span>Customers, services, spares, job workflow and billing.</span></div>
    <div class="pl-mini">EV Showroom<span>Vehicle details, leads, bookings, finance and delivery workflow.</span></div>
    <div class="pl-mini">Medical & Pharmacy<span>Medicine records, stock, batch/expiry and billing workflow.</span></div>
    <div class="pl-mini">Restaurant & Bakery<span>Products, orders, customers and daily billing workflow.</span></div>
    <div class="pl-mini">Professional Services<span>Clients, services, invoices, expenses and records.</span></div>
  </div>
</section>
<section class="pl-section">
  <span class="pl-badge">YOUR BUSINESS WORKSPACE</span>
  <h2>Everything connected in one place</h2>
  <div class="pl-grid">
    <div class="pl-mini">Fast Billing<span>Create invoices and keep bill history organised.</span></div>
    <div class="pl-mini">Products & Stock<span>Manage products, prices, GST and stock.</span></div>
    <div class="pl-mini">Customers<span>Keep customer details and purchase history together.</span></div>
    <div class="pl-mini">Business Tools<span>Use business-specific workflows when your category needs them.</span></div>
  </div>
</section>
<section class="pl-section" style="padding-bottom:70px">
  <div class="pl-card">
    <span class="pl-badge">READY TO START?</span>
    <h2 style="margin-bottom:10px">Run your business from one simple workspace.</h2>
    <p class="pl-sub" style="margin:0 auto 22px">Create your business account or open the web app to continue.</p>
    <div class="pl-actions" style="justify-content:center">
      <button class="pl-primary" id="plSignupBottom">Create Business Account</button>
      <button class="pl-secondary" id="plLoginBottom">Login</button>
    </div>
  </div>
</section>
<footer style="text-align:center;padding:0 0 20px;color:#718198;font-size:12px">© NR BizPro • Universal Billing & Business Management</footer></div>`;
    document.body.appendChild(landing);
    const openAuth=mode=>{landing.remove();document.getElementById('authScreen')?.classList.remove('hidden');window.renderAuth?.(mode)};
    document.getElementById('plLogin').onclick=()=>openAuth('login');
    document.getElementById('plWebApp').onclick=()=>openAuth('login');
    document.getElementById('plHms').onclick=()=>{location.href='/hms.html'};
    document.getElementById('plSignup').onclick=()=>openAuth('signup');
    document.getElementById('plSignupBottom').onclick=()=>openAuth('signup');
    document.getElementById('plLoginBottom').onclick=()=>openAuth('login');
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
  // Session authority is verified by the dedicated bootstrap in index.html.
  // Do not launch a second fallback check that can race during slow script loading.
})();
