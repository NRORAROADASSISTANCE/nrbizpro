/* NR BizPro — Business Registration OTP (MSG91)
 * Uses the configured MSG91 OTP Widget for mobile + email verification.
 * The widget token is fetched from the server config endpoint; the MSG91
 * account Authkey is never exposed to the browser.
 */
(function () {
  'use strict';

  async function sendOtpApi(kind, identifier) {\n    return api('/api/auth?action=otp-send', { method:'POST', body:JSON.stringify({kind, identifier}) });\n  }\n\n  async function verifyOtpApi(kind, reqId, otp) {\n    return api('/api/auth?action=otp-verify', { method:'POST', body:JSON.stringify({kind, reqId, otp}) });\n  }\n\n  function normalizeMobile(v) {
    const digits = String(v || '').replace(/\D/g, '');
    if (digits.length === 10) return '91' + digits;
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    return '';
  }

  function normalizeEmail(v) {
    return String(v || '').trim().toLowerCase();
  }

  function setOtpUi(kind, text, ok) {
    const status = document.getElementById(kind + 'OtpStatus');
    if (status) {
      status.textContent = text || '';
      status.style.color = ok ? '#16834b' : '#c2410c';
    }
    const badge = document.getElementById(kind + 'VerifiedBadge');
    if (badge) {
      badge.textContent = otpState[kind].verified ? '✓ Verified' : '';
      badge.style.display = otpState[kind].verified ? 'inline-flex' : 'none';
    }
    const btn = document.getElementById('continuePlansBtn');
    if (btn) btn.disabled = !(otpState.mobile.verified && otpState.email.verified);
  }

  function buildSignup(message = '') {
    const el = document.getElementById('authContent');
    if (!el) return;
    el.innerHTML = `
      <div class="auth-title"><h1>Create your business account</h1><p>Verify the owner mobile and email before continuing.</p></div>
      ${message ? `<div class="notice">${esc(message)}</div>` : ''}
      <form id="nrOtpSignupForm" onsubmit="signup(event)">
        <div class="auth-grid">
          <label>Business Name<input id="suBusiness" required></label>
          <label>Owner Name<input id="suOwner" required></label>
          <label>Mobile
            <div class="nr-otp-row"><input id="suMobile" required inputmode="tel" maxlength="10" placeholder="10-digit mobile"><button type="button" class="secondary nr-otp-send" id="sendMobileOtp">Send OTP</button></div>
            <span id="mobileVerifiedBadge" class="nr-otp-badge">✓ Verified</span>
            <div id="mobileOtpBox" class="nr-otp-box">
              <input id="mobileOtp" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit OTP">
              <button type="button" class="primary nr-otp-verify" id="verifyMobileOtp">Verify</button>
            </div>
            <small id="mobileOtpStatus" class="nr-otp-status"></small>
          </label>
          <label>Email
            <div class="nr-otp-row"><input id="suEmail" required type="email" placeholder="owner@example.com"><button type="button" class="secondary nr-otp-send" id="sendEmailOtp">Send OTP</button></div>
            <span id="emailVerifiedBadge" class="nr-otp-badge">✓ Verified</span>
            <div id="emailOtpBox" class="nr-otp-box">
              <input id="emailOtp" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit OTP">
              <button type="button" class="primary nr-otp-verify" id="verifyEmailOtp">Verify</button>
            </div>
            <small id="emailOtpStatus" class="nr-otp-status"></small>
          </label>
          <label>Business Category<input id="suCategory" required placeholder="Garage / Retail / Service..."></label>
          <label>Login ID<input id="suUserId" required minlength="4" maxlength="40" pattern="[A-Za-z0-9._-]+" placeholder="Unique Login ID"></label>
          <label>GSTIN <span>(optional)</span><input id="suGst"></label>
          <label>Business Address<input id="suAddress" required></label>
        </div>
        <label>Password<div style="position:relative"><input id="suPassword" required minlength="8" type="password" style="padding-right:46px"><button type="button" id="toggleSuPassword" aria-label="Show password" title="Show password" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;cursor:pointer;font-size:18px;padding:4px">👁️</button></div></label>
        <button id="continuePlansBtn" class="primary auth-btn" disabled>Continue to Plans</button>
      </form>
      <p class="auth-switch">Already registered? <button onclick="renderAuth('login')">Login</button></p>
    `;

    const mobile = document.getElementById('suMobile');
    const email = document.getElementById('suEmail');
    ['mobile','email'].forEach(k => {
      otpState[k] = { sent:false, verified:false, accessToken:'', reqId:'', identifier:'' };
      setOtpUi(k, '', false);
    });

    document.getElementById('sendMobileOtp').onclick = () => sendOtpFor('mobile', normalizeMobile(mobile.value));
    document.getElementById('verifyMobileOtp').onclick = () => verifyOtpFor('mobile', document.getElementById('mobileOtp').value.trim());
    document.getElementById('sendEmailOtp').onclick = () => sendOtpFor('email', normalizeEmail(email.value));
    document.getElementById('toggleSuPassword').onclick = () => { const p=document.getElementById('suPassword'); const b=document.getElementById('toggleSuPassword'); if(p.type==='password'){p.type='text';b.textContent='🙈';b.setAttribute('aria-label','Hide password');b.title='Hide password';}else{p.type='password';b.textContent='👁️';b.setAttribute('aria-label','Show password');b.title='Show password';} };
    document.getElementById('verifyEmailOtp').onclick = () => verifyOtpFor('email', document.getElementById('emailOtp').value.trim());

    mobile.addEventListener('input', () => { if (otpState.mobile.verified) { otpState.mobile.verified=false; otpState.mobile.accessToken=''; setOtpUi('mobile','Mobile changed — verify again.',false); } });
    email.addEventListener('input', () => { if (otpState.email.verified) { otpState.email.verified=false; otpState.email.accessToken=''; setOtpUi('email','Email changed — verify again.',false); } });
  }

  async function sendOtpFor(kind, identifier) {
    const btn = document.getElementById(kind === 'mobile' ? 'sendMobileOtp' : 'sendEmailOtp');
    if (!identifier || (kind === 'mobile' && identifier.length !== 12) || (kind === 'email' && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(identifier))) {
      setOtpUi(kind, kind === 'mobile' ? 'Enter a valid 10-digit mobile number.' : 'Enter a valid email address.', false); return;
    }
    btn.disabled=true; btn.textContent='Sending...';
    try {
      const d=await sendOtpApi(kind,identifier);
      if(!d.reqId) throw new Error('MSG91 did not return a request ID.');
      otpState[kind].sent=true; otpState[kind].verified=false; otpState[kind].accessToken=''; otpState[kind].identifier=identifier; otpState[kind].reqId=d.reqId;
      document.getElementById(kind+'OtpBox').style.display='flex'; setOtpUi(kind,'OTP sent. Enter the 6-digit OTP.',false);
    } catch(e){ setOtpUi(kind,e.message||'OTP could not be sent.',false); }
    finally{btn.disabled=false;btn.textContent=otpState[kind].verified?'Verified':'Resend OTP';}
  }

  async function verifyOtpFor(kind, otp) {
    const s=otpState[kind];
    if(!s.sent||!s.reqId){setOtpUi(kind,'Send OTP first.',false);return;}
    if(!/^\\d{4,8}$/.test(otp)){setOtpUi(kind,'Enter the OTP received.',false);return;}
    const btn=document.getElementById(kind==='mobile'?'verifyMobileOtp':'verifyEmailOtp'); btn.disabled=true; btn.textContent='Verifying...';
    try{const d=await verifyOtpApi(kind,s.reqId,otp); if(!d.accessToken)throw new Error('MSG91 did not return an access token.'); s.accessToken=d.accessToken;s.verified=true;setOtpUi(kind,'OTP verified successfully.',true);}
    catch(e){s.verified=false;s.accessToken='';setOtpUi(kind,e.message||'OTP verification failed.',false);}
    finally{btn.disabled=false;btn.textContent='Verify';}
  }

  window.__NRBuildOtpSignup = buildSignup;

  window.renderAuth = function(mode = 'login', message = '') {
    if (mode !== 'signup') return originalRenderAuth(mode, message);
    buildSignup(message);
  };

  window.signup = async function(e) {
    e.preventDefault();
    const statusMessage = (msg) => {
      const n = document.querySelector('.notice');
      if (n) n.textContent = msg;
      else {
        const x = document.createElement('div');
        x.className = 'notice'; x.textContent = msg;
        document.getElementById('authContent')?.prepend(x);
      }
    };
    if (!otpState.mobile.verified || !otpState.email.verified) {
      statusMessage('Please verify both mobile number and email before continuing.');
      return;
    }
    const business = document.getElementById('suBusiness').value.trim();
    const owner = document.getElementById('suOwner').value.trim();
    const mobile = document.getElementById('suMobile').value.trim();
    const email = document.getElementById('suEmail').value.trim().toLowerCase();
    const category = document.getElementById('suCategory').value.trim();
    const gst = document.getElementById('suGst').value.trim();
    const userId = document.getElementById('suUserId').value.trim().toLowerCase();
    const address = document.getElementById('suAddress').value.trim();
    const password = document.getElementById('suPassword').value;
    const btn = document.getElementById('continuePlansBtn');
    btn.disabled = true; btn.textContent = 'Creating account...';
    try {
      const d = await api('/api/auth?action=signup', {
        method: 'POST',
        body: JSON.stringify({
          business, owner, mobile, email, category, gst, userId, address, password,
          mobileAccessToken: otpState.mobile.accessToken,
          emailAccessToken: otpState.email.accessToken
        })
      });
      window.currentUser = d.user;
      currentUser = d.user;
      localStorage.setItem('nr-bizpro-session-v2', currentUser.id);
      originalRenderAuth('plans');
    } catch (err) {
      statusMessage(err.message || 'Registration failed.');
    } finally {
      btn.disabled = !(otpState.mobile.verified && otpState.email.verified);
      btn.textContent = 'Continue to Plans';
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    .nr-otp-row{display:flex;gap:8px;align-items:stretch}.nr-otp-row input{min-width:0;flex:1}.nr-otp-send{white-space:nowrap;padding:10px 12px}.nr-otp-box{display:none;gap:8px;margin-top:8px}.nr-otp-box input{flex:1;min-width:0}.nr-otp-verify{padding:10px 14px;white-space:nowrap}.nr-otp-badge{display:none;margin-top:6px;padding:3px 8px;border-radius:999px;background:#e8f8ef;color:#16834b;font-size:12px;font-weight:700}.nr-otp-status{display:block;min-height:16px;margin-top:5px}.nr-otp-captcha{margin-top:6px;min-height:0}.auth-btn:disabled{opacity:.55;cursor:not-allowed}
  `;
  document.head.appendChild(style);

  window.addEventListener('authReady', () => {
    const wantsSignup = location.hash === '#signup' ||
      new URLSearchParams(location.search).get('auth') === 'signup' ||
      !!document.getElementById('suBusiness');
    if (wantsSignup) window.renderAuth('signup');
  });
})();
