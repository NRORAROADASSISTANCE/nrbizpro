// Server-auth bridge and public landing gate.
(function(){
  const originalShowApp=window.showApp;
  let authGeneration=0;
  function forceLogin(message){
    const app=document.getElementById('app'),screen=document.getElementById('authScreen'),landing=document.getElementById('publicLanding');
    if(landing) landing.remove();
    if(app) app.classList.add('hidden');
    if(screen) screen.classList.remove('hidden');
    if(typeof window.renderAuth==='function') window.renderAuth('login',message||'Please log in to continue.');
  }
  async function serverLogin(e){
    e.preventDefault(); const myGeneration=++authGeneration;
    const id=document.getElementById('loginId')?.value.trim()||''; const password=document.getElementById('loginPassword')?.value||'';
    try{
      const r=await fetch('/api/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'login',id,password})});
      const d=await r.json(); if(myGeneration!==authGeneration)return;
      if(!r.ok){if(d.paymentRequired&&d.user){window.currentUser=d.user;return window.renderAuth?.('plans','Membership payment is required before using NR BizPro.')}return window.renderAuth?.('login',d.error||'Invalid login details.')}
      window.currentUser=d.user; localStorage.removeItem('nr-bizpro-session-v1');
      if(typeof window.loadData==='function') window.state=window.loadData(d.user.id); originalShowApp();
    }catch(err){if(myGeneration===authGeneration)window.renderAuth?.('login','Server connection failed. Please try again.')}
  }
  window.login=serverLogin;
  window.checkSession=async function(){
    const myGeneration=authGeneration,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2500);
    try{const r=await fetch('/api/auth?action=me',{credentials:'include',signal:controller.signal});clearTimeout(timer);const d=await r.json();if(myGeneration!==authGeneration)return;if(r.ok&&d.user){window.currentUser=d.user;if(typeof window.loadData==='function')window.state=window.loadData(d.user.id);originalShowApp();return}}catch(e){clearTimeout(timer)}
    if(myGeneration===authGeneration){localStorage.removeItem('nr-bizpro-session-v1');forceLogin()}
  };
  function buildPublicLanding(){
    const old=document.getElementById('publicLanding'); if(old)old.remove();
    const landing=document.createElement('div'); landing.id='publicLanding';
    landing.innerHTML=`<style>#publicLanding{position:fixed;inset:0;z-index:9998;overflow:auto;background:linear-gradient(135deg,#f7faff,#fff 48%,#eef5ff);font-family:Inter,Arial,sans-serif;color:#10233f}#publicLanding .pl-wrap{max-width:1120px;margin:auto;padding:28px 24px 60px}.pl-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 0 55px}.pl-brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px}.pl-mark{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#1264f5;color:#fff;font-weight:900}.pl-links{display:flex;gap:22px;align-items:center}.pl-links a{color:#40516a;text-decoration:none;font-size:14px;font-weight:600}.pl-login,.pl-primary{border:0;border-radius:11px;padding:13px 21px;font-weight:800;cursor:pointer}.pl-login{border:1px solid #cbd7e8;background:#fff;color:#1559d6}.pl-primary{background:#1264f5;color:#fff}.pl-hero{display:grid;grid-template-columns:1.25fr .75fr;gap:55px;align-items:center;padding:20px 0 65px}.pl-badge{display:inline-block;background:#e7f0ff;color:#1559d6;padding:8px 13px;border-radius:999px;font-size:12px;font-weight:800}.pl-hero h1{font-size:52px;line-height:1.08;margin:18px 0}.pl-sub{font-size:19px;line-height:1.65;color:#607089;max-width:680px}.pl-actions{display:flex;gap:12px}.pl-secondary{background:#fff;color:#1559d6;border:1px solid #cbd7e8;border-radius:11px;padding:12px 21px;font-weight:800;text-decoration:none}.pl-card{background:#fff;border:1px solid #e1e9f4;border-radius:22px;padding:28px;box-shadow:0 20px 55px rgba(25,64,120,.1)}.pl-feature{display:flex;gap:12px;margin:16px 0;color:#53647b;font-size:14px}.pl-check{width:25px;height:25px;border-radius:50%;background:#eaf2ff;color:#1264f5;display:grid;place-items:center;flex:none}.pl-section{text-align:center;padding:18px 0 40px}.pl-section h2{font-size:30px}.pl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.pl-mini{background:#fff;border:1px solid #e1e9f4;border-radius:14px;padding:19px;font-weight:750}.pl-mini span{display:block;font-size:12px;font-weight:500;color:#718198;margin-top:7px}@media(max-width:800px){.pl-hero{grid-template-columns:1fr}.pl-grid{grid-template-columns:1fr 1fr}.pl-hero h1{font-size:40px}}@media(max-width:520px){.pl-grid{grid-template-columns:1fr}}</style><div class="pl-wrap"><nav class="pl-nav"><div class="pl-brand"><span class="pl-mark">NR</span><span>NR BizPro</span></div><div class="pl-links"><a href="pricing.html">Pricing</a><a href="services.html">Services</a><a href="contact.html">Contact</a><button class="pl-login" id="plLogin">Login</button></div></nav><section class="pl-hero"><div><span class="pl-badge">UNIVERSAL BILLING & BUSINESS MANAGEMENT</span><h1>One platform.<br>Every business.</h1><p class="pl-sub">Create invoices, manage products and stock, track customers, and run your business from one simple workspace.</p><div class="pl-actions"><button class="pl-primary" id="plSignup">Create Business Account</button><a class="pl-secondary" href="services.html">Explore Features</a></div></div><div class="pl-card"><h3>Everything you need to bill</h3><div class="pl-feature"><span class="pl-check">✓</span><span>Fast billing with product and barcode support</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Products, pricing, GST and stock management</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Customer records, bill history and printing</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Business-specific tools for different categories</span></div></div></section><section class="pl-section"><h2>Built for different businesses</h2><div class="pl-grid"><div class="pl-mini">Retail & Grocery<span>Products, stock, GST and quick billing.</span></div><div class="pl-mini">EV Showrooms<span>Vehicle products, customer enquiries and sales.</span></div><div class="pl-mini">Service Centers<span>Service-oriented products, customers and billing.</span></div><div class="pl-mini">Wholesale & Distribution<span>Stock and invoice management.</span></div></div></section></div>`;
    document.body.appendChild(landing);
    const openAuth=mode=>{landing.remove();document.getElementById('authScreen')?.classList.remove('hidden');window.renderAuth?.(mode)};
    document.getElementById('plLogin').onclick=()=>openAuth('login'); document.getElementById('plSignup').onclick=()=>openAuth('signup');
  }
  function setupPublicLayer(){const app=document.getElementById('app');if(app&&!app.classList.contains('hidden'))return;buildPublicLanding()}
  setupPublicLayer();
})();