(() => {
  const USERS_KEY='nr-bizpro-users-v1';
  const SESSION_KEY='nr-bizpro-session-v1';
  const REG_FEE=3500;
  const PLANS={year1:{label:'1 Year',years:1,fee:3000},year2:{label:'2 Years',years:2,fee:4000},year3:{label:'3 Years',years:3,fee:5200}};
  const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
  const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  async function apiJson(url,options={}){const r=await fetch(url,{credentials:'same-origin',...options});const text=await r.text();let d={};try{d=JSON.parse(text)}catch{throw Error(r.ok?'Unexpected server response.':'Server is not configured yet. Please try again after backend setup.')}if(!r.ok)throw Error(d.error||'Request failed.');return d}
  let pendingUser=null;
  window.renderAuth=function(mode='login',message=''){
    const el=document.getElementById('authContent'); if(!el)return;
    if(mode==='login')el.innerHTML=`<div class="auth-title"><h1>Welcome to NR BizPro</h1><p>Universal billing & business management.</p></div>${message?`<div class="notice">${esc(message)}</div>`:''}<form onsubmit="login(event)"><label>Email or Mobile<input id="loginId" required autocomplete="username"></label><label>Password<input id="loginPassword" required type="password" autocomplete="current-password"></label><button class="primary auth-btn">Login</button></form><div class="auth-switch"><button class="secondary auth-btn" onclick="renderAuth('signup')">Create Business Account</button></div>`;
    if(mode==='signup')el.innerHTML=`<div class="auth-title"><h1>Create your business account</h1><p>Complete registration details before selecting a membership.</p></div><form onsubmit="signup(event)"><div class="auth-grid"><label>Business Name<input id="suBusiness" required></label><label>Owner Name<input id="suOwner" required></label><label>Mobile<input id="suMobile" required inputmode="tel"></label><label>Email<input id="suEmail" required type="email"></label><label>Business Category<input id="suCategory" required placeholder="Garage / Retail / Service..."></label><label>GSTIN <span>(optional)</span><input id="suGst"></label></div><label>Password<input id="suPassword" required minlength="6" type="password"></label><button class="primary auth-btn">Continue to Membership</button></form><div class="auth-switch"><button class="secondary auth-btn" onclick="renderAuth('login')">Back to Login</button></div>`;
    if(mode==='plans')el.innerHTML=`<div class="auth-title"><h1>Activate Membership</h1><p>Registration fee is mandatory. Select one membership plan.</p></div><div class="registration-fee"><span>One-time Registration Fee</span><strong>${money(REG_FEE)}</strong></div><div class="plans">${Object.entries(PLANS).map(([key,p])=>`<button class="plan ${key==='year2'?'featured':''}" onclick="startSubscription('${key}')"><b>${p.label}</b><strong>${money(p.fee)}</strong><span>Membership fee • ${p.years} year${p.years>1?'s':''}</span><em>Total payable: ${money(REG_FEE+p.fee)}</em></button>`).join('')}</div>${message?`<div class="notice">${esc(message)}</div>`:''}`;
    if(mode==='payment')renderDirectPayment();
  };
  window.signup=async function(e){e.preventDefault();const body={action:'signup',business:document.getElementById('suBusiness').value.trim(),owner:document.getElementById('suOwner').value.trim(),mobile:document.getElementById('suMobile').value.trim(),email:document.getElementById('suEmail').value.trim().toLowerCase(),category:document.getElementById('suCategory').value.trim(),gst:document.getElementById('suGst').value.trim(),password:document.getElementById('suPassword').value};if(!body.business||!body.owner||!body.mobile||!body.email||!body.category||body.password.length<6)return alert('Please complete all required registration details.');try{const d=await apiJson('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});pendingUser=d.user;localStorage.setItem(USERS_KEY,JSON.stringify([d.user]));renderAuth('plans')}catch(err){alert(err.message)}};
  window.startSubscription=async function(plan){if(!pendingUser||!PLANS[plan])return alert('Complete registration first.');try{const d=await apiJson('/api/auth?action=pending',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'pending',plan})});pendingUser=d.user;pendingUser.pendingPlan=plan;pendingUser.pendingAmount=REG_FEE+PLANS[plan].fee;localStorage.setItem(USERS_KEY,JSON.stringify([pendingUser]));renderAuth('payment')}catch(err){alert(err.message)}};
  async function renderDirectPayment(){
    const el=document.getElementById('authContent');
    const p=PLANS[pendingUser?.pendingPlan];
    if(!p)return renderAuth('plans');
    el.innerHTML=`<div class="auth-title"><h1>Direct UPI Payment</h1><p>${p.label} Membership</p></div><div class="summary"><div><span>Registration Fee</span><b>${money(REG_FEE)}</b></div><div><span>${p.label} Plan</span><b>${money(p.fee)}</b></div><div class="total"><span>Total Payable</span><b>${money(REG_FEE+p.fee)}</b></div></div><div id="upiBox" class="notice">Loading UPI payment details...</div><label style="display:block;margin-top:12px">UTR / Transaction ID<input id="directUtr" required maxlength="40" placeholder="Enter UTR after payment"></label><button id="upiSubmit" class="primary auth-btn" disabled>Submit Payment for Verification</button><button class="secondary auth-btn" onclick="renderAuth('plans')">Back to Plans</button><div id="directStatus" style="margin-top:12px"></div>`;
    try{
      const d=await apiJson('/api/direct-payment?action=config');
      const box=document.getElementById('upiBox');
      if(!d.configured){box.innerHTML='<b>UPI payment is not configured yet.</b><br>Please contact NR BizPro support.';return;}
      const upi=d.upiId;
      const intent=`upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(d.upiName||'NR BizPro')}&am=${encodeURIComponent(REG_FEE+p.fee)}&cu=INR&tn=${encodeURIComponent(`NR BizPro ${p.label} Membership`)}`;
      box.innerHTML=`<b>Pay ₹${REG_FEE+p.fee} via UPI</b><br><span>UPI ID: <strong id="upiIdText">${esc(upi)}</strong></span><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button type="button" class="secondary" onclick="navigator.clipboard?.writeText(${JSON.stringify(upi)}).then(()=>alert('UPI ID copied'))">Copy UPI ID</button><a class="secondary" href="${intent}" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:10px">Open UPI App</a></div><small style="display:block;margin-top:8px">After payment, enter the UTR / transaction ID below.</small>`;
      document.getElementById('upiSubmit').disabled=false;
    }catch(err){document.getElementById('upiBox').innerHTML=`<b>Unable to load UPI details.</b><br>${esc(err.message)}`;return;}
    document.getElementById('upiSubmit').onclick=submitDirectPayment;
  }
  async function submitDirectPayment(){
    const btn=document.getElementById('upiSubmit'),utr=document.getElementById('directUtr')?.value.trim();
    if(!/^[A-Za-z0-9-]{8,40}$/.test(utr||''))return alert('Enter a valid UTR / transaction reference (8-40 characters).');
    btn.disabled=true;btn.textContent='Submitting...';
    try{
      const d=await apiJson('/api/direct-payment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit',plan:pendingUser.pendingPlan,utr})});
      document.getElementById('directStatus').innerHTML='<div class="notice">Payment details submitted successfully. Your account will be activated after admin verification.</div>';
      btn.textContent='Submitted ✓';
    }catch(err){btn.disabled=false;btn.textContent='Submit Payment for Verification';alert(err.message)}
  }
  window.login=async function(e){e.preventDefault();const id=document.getElementById('loginId').value.trim().toLowerCase(),password=document.getElementById('loginPassword').value;try{const d=await apiJson('/api/auth?action=login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',id,password})});if(d.paymentRequired&&d.user){pendingUser=d.user;localStorage.setItem(USERS_KEY,JSON.stringify([d.user]));return renderAuth('plans','Membership payment is required before using NR BizPro.')}localStorage.setItem(USERS_KEY,JSON.stringify([d.user]));localStorage.setItem(SESSION_KEY,d.user.id);location.reload()}catch(err){alert(err.message)}};
  renderAuth('login');
})();
