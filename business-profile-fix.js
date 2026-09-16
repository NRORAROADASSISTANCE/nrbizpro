// NR BizPro — reliable Business Profile panel for live accounts
(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>typeof window.money==='function'?window.money(v):'₹'+(Number(v)||0).toFixed(2);
  function localState(){
    if(!window.state) window.state={items:[],bills:[],customers:[],settings:{}};
    window.state.settings=window.state.settings||{};
    return window.state;
  }
  async function refreshUser(){
    try{
      const r=await fetch('/api/auth?action=me',{credentials:'include',cache:'no-store'});
      if(!r.ok)return window.currentUser||{};
      const d=await r.json();
      if(d.user) window.currentUser=d.user;
      return window.currentUser||{};
    }catch{return window.currentUser||{}}
  }
  async function render(){
    const p=document.getElementById('settings');
    if(!p)return;
    const u=await refreshUser();
    const s=localState();
    s.settings={...(s.settings||{}),name:u.business||s.settings.name||'',owner:u.owner||s.settings.owner||'',mobile:u.mobile||s.settings.mobile||'',email:u.email||s.settings.email||'',category:u.category||s.settings.category||'',gst:u.gst||s.settings.gst||'',address:u.address||s.settings.address||''};
    p.innerHTML=`<div class="panel-head"><div><p class="eyebrow">MY BUSINESS</p><h2>Business Profile</h2><p class="muted">Your registered business details, owner profile and subscription information.</p></div></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:16px">
        <div style="border:1px solid #dfe5ef;border-radius:14px;padding:20px;background:#fff"><h3 style="margin-top:0">Business Details</h3><div class="modal-grid">
          <label class="field">Business Name<input id="bpName" value="${esc(s.settings.name)}"></label>
          <label class="field">Business Category<input id="bpCategory" value="${esc(s.settings.category)}"></label>
          <label class="field">Mobile Number<input id="bpMobile" value="${esc(s.settings.mobile)}"></label>
          <label class="field">Business Email<input id="bpEmail" type="email" value="${esc(s.settings.email)}"></label>
          <label class="field">GSTIN<input id="bpGst" value="${esc(s.settings.gst)}"></label>
          <label class="field wide">Business Address<textarea id="bpAddress" rows="4">${esc(s.settings.address)}</textarea></label>
        </div></div>
        <div style="border:1px solid #dfe5ef;border-radius:14px;padding:20px;background:#fff"><h3 style="margin-top:0">Owner Profile</h3>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><div style="width:58px;height:58px;border-radius:50%;background:#1264f5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800">${esc((u.owner||'O').trim().charAt(0).toUpperCase())}</div><div><b style="font-size:18px">${esc(u.owner||'Business Owner')}</b><div class="muted">Owner / Administrator</div></div></div>
          <div class="modal-grid"><label class="field">Owner Name<input id="bpOwner" value="${esc(u.owner||s.settings.owner||'')}"></label><label class="field">Login ID<input value="${esc(u.userId||u.user_id||'')}" disabled></label><label class="field">Owner Mobile<input value="${esc(u.mobile||'')}" disabled></label><label class="field">Owner Email<input value="${esc(u.email||'')}" disabled></label></div>
          <div style="margin-top:18px;padding:14px;border-radius:10px;background:#f5f8ff"><b>Membership</b><div style="margin-top:7px">Plan: <b>${esc(u.plan||'Not activated')}</b><br>Expiry: ${u.subscriptionEnds?esc(new Date(u.subscriptionEnds).toLocaleDateString('en-IN')):'—'}<br>Status: <b>${esc(u.status||'—')}</b></div></div>
        </div>
      </div><div style="margin-top:16px"><button class="primary" id="bpSave">Save Business Profile</button><span id="bpStatus" class="muted" style="margin-left:12px"></span></div>`;
    document.getElementById('bpSave').onclick=save;
  }
  async function save(){
    const s=localState(),u=window.currentUser||{};
    const q=id=>document.getElementById(id);
    const payload={name:q('bpName').value.trim(),owner:q('bpOwner').value.trim(),mobile:q('bpMobile').value.trim(),email:q('bpEmail').value.trim().toLowerCase(),category:q('bpCategory').value.trim()||'General Business',gst:q('bpGst').value.trim(),address:q('bpAddress').value.trim()};
    if(!payload.name||!payload.owner)return alert('Business Name and Owner Name are required.');
    const btn=q('bpSave'),status=q('bpStatus');btn.disabled=true;btn.textContent='Saving...';
    try{
      const r=await fetch('/api/auth?action=business-settings',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'business-settings',settings:payload})});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Could not save Business Profile.');
      Object.assign(u,{business:payload.name,owner:payload.owner,mobile:payload.mobile,email:payload.email,category:payload.category,gst:payload.gst,address:payload.address});
      Object.assign(s.settings,payload);
      try{const users=JSON.parse(localStorage.getItem('nr-bizpro-users-v1')||'[]');localStorage.setItem('nr-bizpro-users-v1',JSON.stringify(users.map(x=>x.id===u.id?{...x,...u}:x)));}catch{}
      if(typeof window.save==='function')window.save();
      status.textContent='Business Profile saved successfully.';
      render();
    }catch(e){status.textContent=e.message;}
    finally{btn.disabled=false;btn.textContent='Save Business Profile';}
  }
  function bind(){
    document.querySelectorAll('.tab[data-tab="settings"]').forEach(b=>{
      b.textContent='Business Profile';
      b.onclick=function(e){e.preventDefault();document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');const p=document.getElementById('settings');p.classList.add('active');render();};
    });
    const p=document.getElementById('settings');if(p&&p.classList.contains('active'))render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,100));else setTimeout(bind,100);
  window.addEventListener('load',()=>setTimeout(bind,300));
  setInterval(()=>{if(document.getElementById('settings')?.classList.contains('active')){const p=document.getElementById('bpName');if(!p)render();}},1500);
})();