(function(){
  'use strict';
  function renderSignupWithGST(){
    const el=document.getElementById('authContent');
    if(!el||typeof window.signup!=='function')return;
    el.innerHTML=`<div class="auth-title"><h1>Create your business account</h1><p>Setup your business and start billing.</p></div><form onsubmit="signup(event)"><div class="auth-grid"><label>Business Name<input id="suBusiness" required></label><label>Owner Name<input id="suOwner" required></label><label>Login ID<input id="suUserId" required minlength="4" maxlength="40" pattern="[A-Za-z0-9._-]+" autocomplete="username" placeholder="Create Login ID"></label><label>Mobile<input id="suMobile" required inputmode="tel"></label><label>Email<input id="suEmail" required type="email"></label><label>Business Category<input id="suCategory" required placeholder="Garage / Retail / Service..."></label><label>GST Registration<select id="suGstRegistered" onchange="window.nrGSTToggle()"><option value="NO">NO</option><option value="YES">YES</option></select></label><label id="nrGstinWrap" style="display:none">GSTIN<input id="suGst" maxlength="15" placeholder="Enter GSTIN"></label><label id="nrNoGstWrap" class="wide" style="display:block"><span style="font-size:12px;color:#68758a">GST billing will remain disabled for this business.</span></label></div><label>Password<input id="suPassword" required minlength="8" type="password" autocomplete="new-password"></label><label>Confirm Password<input id="suPasswordConfirm" required minlength="8" type="password" autocomplete="new-password"></label><button class="primary auth-btn">Continue to Plans</button></form><p class="auth-switch">Already registered? <button type="button" onclick="renderAuth('login')">Login</button></p>`;
  }
  window.nrGSTToggle=function(){
    const yes=document.getElementById('suGstRegistered')?.value==='YES';
    const wrap=document.getElementById('nrGstinWrap');
    const input=document.getElementById('suGst');
    const no=document.getElementById('nrNoGstWrap');
    if(wrap)wrap.style.display=yes?'block':'none';
    if(no)no.style.display=yes?'none':'block';
    if(input){input.required=yes;input.disabled=!yes;if(!yes)input.value='';}
  };
  function install(){
    const original=window.renderAuth;
    if(typeof original!=='function')return;
    window.renderAuth=function(mode,message){
      original(mode,message);
      if(mode==='signup'){
        renderSignupWithGST();
        window.nrGSTToggle();
        const form=document.querySelector('#authContent form');
        if(form&&!form.dataset.nrGstWrapped){
          form.dataset.nrGstWrapped='1';
          form.addEventListener('submit',function(e){
            const id=(document.getElementById('suUserId')?.value||'').trim();
            const p=document.getElementById('suPassword')?.value||'';
            const cp=document.getElementById('suPasswordConfirm')?.value||'';
            const yes=document.getElementById('suGstRegistered')?.value==='YES';
            const gst=document.getElementById('suGst');
            if(!/^[A-Za-z0-9._-]{4,40}$/.test(id)){e.preventDefault();alert('Login ID must be 4-40 characters and use only letters, numbers, dot, underscore or hyphen.');return;}
            if(p.length<8){e.preventDefault();alert('Password must be at least 8 characters.');return;}
            if(p!==cp){e.preventDefault();alert('Password and Confirm Password do not match.');return;}
            if(yes&&!(gst?.value||'').trim()){e.preventDefault();alert('GSTIN is required when GST Registration is YES.');return;}
          },true);
        }
      }
    };
    if(document.getElementById('authContent')&&location.hash.includes('auth=signup'))window.renderAuth('signup');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();