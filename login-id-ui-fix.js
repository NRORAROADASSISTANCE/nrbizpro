// Business-holder login UI + Smart Print trial option.
(function(){
  const USERS_KEY='nr-bizpro-users-v1',SESSION_KEY='nr-bizpro-session-v1';
  function patch(){
    const input=document.getElementById('loginId');
    if(input){
      const label=input.closest('label');
      if(label){
        const text=[...label.childNodes].find(n=>n.nodeType===3);
        if(text)text.nodeValue='Login ID / Mobile ';
        else if(label.firstChild)label.firstChild.textContent='Login ID / Mobile ';
      }
      input.placeholder='Enter Login ID or mobile number';
      input.autocomplete='username';
      input.setAttribute('aria-label','Login ID or Mobile');
    }
  }
  async function startTrial(){
    const btn=document.getElementById('smartPrintTrialBtn');
    if(btn){btn.disabled=true;btn.textContent='Starting Trial...';}
    try{
      const r=await fetch('/api/trial',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},cache:'no-store'});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'Could not start Smart Print trial.');
      try{
        const users=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');
        const u=users[0];
        if(u){u.status='active';u.plan='trial';u.subscriptionEnds=null;localStorage.setItem(USERS_KEY,JSON.stringify([u]));localStorage.setItem(SESSION_KEY,u.id);}
      }catch{}
      location.reload();
    }catch(e){
      if(btn){btn.disabled=false;btn.textContent='🖨️ Start Free Trial — 3 Prints';}
      alert(e.message);
    }
  }
  function addTrial(){
    const form=document.querySelector('.nr-portal .portal-form');
    if(!form||document.getElementById('smartPrintTrialBtn'))return;
    const h=[...form.querySelectorAll('h1')].find(x=>/Activate Membership/i.test(x.textContent||''));
    if(!h)return;
    const plans=form.querySelector('.plans');
    if(!plans)return;
    const wrap=document.createElement('div');
    wrap.style.cssText='margin-top:14px;padding:14px;border:1px dashed #9db9e8;border-radius:12px;background:#f8fbff';
    wrap.innerHTML='<b style="display:block;color:#10233f">Need only a few prints?</b><span style="display:block;color:#607089;font-size:12px;margin:4px 0 10px">Try Smart Print free for 3 successful document / ID prints. Passport photos are Premium only.</span><button id="smartPrintTrialBtn" type="button" class="portal-secondary" style="margin:0">🖨️ Start Free Trial — 3 Prints</button>';
    plans.parentNode.insertBefore(wrap,plans.nextSibling);
    document.getElementById('smartPrintTrialBtn').onclick=startTrial;
  }
  const original=window.renderAuth;
  if(typeof original==='function'){
    window.renderAuth=function(){
      const r=original.apply(this,arguments);
      setTimeout(patch,0);setTimeout(addTrial,0);setTimeout(addTrial,150);
      return r;
    };
  }
  patch();addTrial();
  new MutationObserver(()=>{patch();addTrial()}).observe(document.body,{childList:true,subtree:true});
})();
