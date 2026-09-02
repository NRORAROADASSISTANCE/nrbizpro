// Server-auth bridge and public landing gate.
(function(){
  const originalShowApp=window.showApp;
  let authGeneration=0;

  function forceLogin(message){
    const app=document.getElementById('app');
    const screen=document.getElementById('authScreen');
    const landing=document.getElementById('publicLanding');
    if(landing)landing.remove();
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
      const r=await fetch('/api/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'login',id,password})});
      const d=await r.json();
      if(myGeneration!==authGeneration)return;
      if(!r.ok){
        if(d.paymentRequired&&d.user){window.currentUser=d.user;if(typeof window.renderAuth==='function')window.renderAuth('plans','Membership payment is required before using NR BizPro.');return;}
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
    if(myGeneration===authGeneration){
      localStorage.removeItem('nr-bizpro-session-v1');
      forceLogin();
    }
  };

  function showPublicLanding(){
    if(document.getElementById('publicLanding'))return;
    const landing=document.createElement('div');
    landing.id='publicLanding';
    landing.innerHTML=`
      <style>
        #publicLanding{position:fixed;inset:0;z-index:9998;overflow:auto;background:linear-gradient(135deg,#f7faff 0%,#fff 48%,#eef5ff 100%);font-family:Inter,Arial,sans-serif;color:#10233f}
        #publicLanding .pl-wrap{max-width:1120px;margin:auto;padding:28px 24px 60px}
        #publicLanding .pl-nav{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:10px 0 55px}
        #publicLanding .pl-brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:22px}
        #publicLanding .pl-mark{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#1264f5;color:#fff;font-weight:900}
        #publicLanding .pl-links{display:flex;gap:22px;align-items:center;flex-wrap:wrap}
        #publicLanding .pl-links a{color:#40516a;text-decoration:none;font-size:14px;font-weight:600}
        #publicLanding .pl-login{border:1px solid #cbd7e8;background:#fff;color:#1559d6;border-radius:10px;padding:11px 18px;font-weight:700;cursor:pointer}
        #publicLanding .pl-hero{display:grid;grid-template-columns:1.25fr .75fr;gap:55px;align-items:center;padding:20px 0 65px}
        #publicLanding .pl-badge{display:inline-block;background:#e7f0ff;color:#1559d6;padding:8px 13px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:.4px}
        #publicLanding h1{font-size:52px;line-height:1.08;margin:18px 0 16px;letter-spacing:-1.8px}
        #publicLanding .pl-sub{font-size:19px;line-height:1.65;color:#607089;max-width:680px;margin:0 0 28px}
        #publicLanding .pl-actions{display:flex;gap:12px;flex-wrap:wrap}
        #publicLanding .pl-primary{background:#1264f5;color:#fff;border:0;border-radius:11px;padding:14px 22px;font-size:15px;font-weight:800;cursor:pointer}
        #publicLanding .pl-secondary{background:#fff;color:#1559d6;border:1px solid #cbd7e8;border-radius:11px;padding:13px 21px;font-size:15px;font-weight:800;text-decoration:none}
        #publicLanding .pl-card{background:#fff;border:1px solid #e1e9f4;border-radius:22px;padding:28px;box-shadow:0 20px 55px rgba(25,64,120,.10)}
        #publicLanding .pl-card h3{margin:0 0 18px;font-size:20px}
        #publicLanding .pl-feature{display:flex;gap:12px;margin:16px 0;color:#53647b;font-size:14px;line-height:1.5}
        #publicLanding .pl-check{width:25px;height:25px;border-radius:50%;background:#eaf2ff;color:#1264f5;display:grid;place-items:center;font-weight:900;flex:none}
        #publicLanding .pl-section{padding:18px 0 40px}
        #publicLanding .pl-section h2{text-align:center;font-size:30px;margin:0 0 24px}
        #publicLanding .pl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        #publicLanding .pl-mini{background:#fff;border:1px solid #e1e9f4;border-radius:14px;padding:19px;font-weight:750;color:#33465f}
        #publicLanding .pl-mini span{display:block;font-size:12px;font-weight:500;color:#718198;margin-top:7px;line-height:1.45}
        #publicLanding .pl-price{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #dce6f2;border-radius:16px;padding:22px 25px;max-width:720px;margin:0 auto}
        #publicLanding .pl-price strong{font-size:26px;color:#1264f5}
        #publicLanding .pl-footer{border-top:1px solid #dfe7f1;margin-top:35px;padding-top:25px;color:#718198;font-size:13px;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}
        @media(max-width:800px){#publicLanding .pl-hero{grid-template-columns:1fr}#publicLanding h1{font-size:40px}#publicLanding .pl-grid{grid-template-columns:1fr 1fr}#publicLanding .pl-nav{padding-bottom:30px}}
        @media(max-width:520px){#publicLanding .pl-grid{grid-template-columns:1fr}#publicLanding .pl-links a:not(:last-child){display:none}}
      </style>
      <div class="pl-wrap">
        <nav class="pl-nav"><div class="pl-brand"><span class="pl-mark">NR</span><span>NR BizPro</span></div><div class="pl-links"><a href="pricing.html">Pricing</a><a href="services.html">Services</a><a href="contact.html">Contact</a><button class="pl-login" onclick="window.openBizLogin()">Login</button></div></nav>
        <section class="pl-hero"><div><span class="pl-badge">UNIVERSAL BILLING & BUSINESS MANAGEMENT</span><h1>One platform.<br>Every business.</h1><p class="pl-sub">Create invoices, manage products and stock, track customers, and run your business from one simple workspace.</p><div class="pl-actions"><button class="pl-primary" onclick="window.openBizSignup()">Create Business Account</button><a class="pl-secondary" href="services.html">Explore Features</a></div></div><div class="pl-card"><h3>Everything you need to bill</h3><div class="pl-feature"><span class="pl-check">✓</span><span>Fast billing with product and barcode support</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Products, pricing, GST and stock management</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Customer records, bill history and printing</span></div><div class="pl-feature"><span class="pl-check">✓</span><span>Business-specific tools for different categories</span></div></div></section>
        <section class="pl-section"><h2>Built for different businesses</h2><div class="pl-grid"><div class="pl-mini">Retail & Grocery<span>Products, stock, GST and quick billing.</span></div><div class="pl-mini">EV Showrooms<span>Vehicle products, customer enquiries and sales.</span></div><div class="pl-mini">Service Centers<span>Service-oriented products, customers and billing.</span></div><div class="pl-mini">Wholesale & Distribution<span>Stock and invoice management for growing businesses.</span></div></div></section>
        <section class="pl-section"><h2>Simple, transparent pricing</h2><div class="pl-price"><span>NR BizPro subscription</span><strong>Plans available</strong><button class="pl-primary" onclick="window.openBizSignup()">Get Started</button></div></section>
        <footer class="pl-footer"><span>© NR BizPro. Universal Billing & Business Management.</span><span><a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a> · <a href="refund.html">Refund Policy</a></span></footer>
      </div>`;
    document.body.appendChild(landing);
    window.openBizLogin=function(){landing.remove();const screen=document.getElementById('authScreen');if(screen)screen.classList.remove('hidden');if(typeof window.renderAuth==='function')window.renderAuth('login');};
    window.openBizSignup=function(){landing.remove();const screen=document.getElementById('authScreen');if(screen)screen.classList.remove('hidden');if(typeof window.renderAuth==='function')window.renderAuth('signup');};
  }

  function setupPublicLayer(){
    const hasSessionCookie=document.cookie.split(';').some(x=>x.trim().startsWith('nr_session='));
    const app=document.getElementById('app');
    if(app&&!app.classList.contains('hidden'))return;
    if(!hasSessionCookie){showPublicLanding();return;}
    window.checkSession();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupPublicLayer);else setupPublicLayer();
})();
