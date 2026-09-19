// NR BizPro — emergency business profile authority
(function(){'use strict';
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const val=(a,b,c='')=>{const x=String(a??'').trim();return x||String(b??'').trim()||String(c??'').trim()};
function profile(){const u=window.currentUser||{},s=window.state?.settings||{};return {name:val(u.business,u.tradeName,s.name)||'Business Name',owner:val(u.owner,s.owner)||'Business Owner',category:val(u.category,s.category,'General Business'),mobile:val(u.mobile,s.mobile),email:val(u.email,s.email),gst:val(u.gst,s.gst),address:val(u.address,s.address)}}
function mergeUser(u){if(!u)return;window.currentUser={...(window.currentUser||{}),...u};window.state=window.state||{};window.state.settings={...(window.state.settings||{}),name:val(u.business,window.state.settings?.name),owner:val(u.owner,window.state.settings?.owner),category:val(u.category,window.state.settings?.category),mobile:val(u.mobile,window.state.settings?.mobile),email:val(u.email,window.state.settings?.email),gst:val(u.gst,window.state.settings?.gst),address:val(u.address,window.state.settings?.address)};try{localStorage.setItem('nr-bizpro-last-auth-user',JSON.stringify(window.currentUser))}catch{}}
function render(){const p=document.getElementById('settings');if(!p)return;const a=profile();
p.innerHTML='<div class="panel-head"><div><p class="eyebrow">MY BUSINESS</p><h2>Business Profile</h2><p class="muted">Registered details for the currently logged-in business account.</p></div></div>'
+'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-top:16px">'
+'<div style="border:1px solid #dfe5ef;border-radius:14px;padding:20px;background:#fff"><h3>Business Details</h3><div class="modal-grid">'
+'<label class="field">Business Name<input value="'+esc(a.name)+'" readonly disabled></label>'
+'<label class="field">Business Category<input value="'+esc(a.category)+'" readonly disabled></label>'
+'<label class="field">Mobile Number<input value="'+esc(a.mobile)+'" readonly disabled></label>'
+'<label class="field">Business Email<input value="'+esc(a.email)+'" readonly disabled></label>'
+'<label class="field">GSTIN<input value="'+esc(a.gst)+'" readonly disabled></label>'
+'<label class="field wide">Business Address<textarea rows="4" readonly disabled>'+esc(a.address)+'</textarea></label>'
+'</div></div>'
+'<div style="border:1px solid #dfe5ef;border-radius:14px;padding:20px;background:#fff"><h3>Owner Profile</h3><div style="display:flex;align-items:center;gap:14px;margin-bottom:18px"><div style="width:72px;height:72px;border-radius:50%;background:#1264f5;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800">'+esc(a.owner.charAt(0).toUpperCase())+'</div><div><b>'+esc(a.owner)+'</b><div class="muted">Owner / Administrator</div></div></div><div class="modal-grid">'
+'<label class="field">Owner Name<input value="'+esc(a.owner)+'" readonly disabled></label>'
+'<label class="field">Login ID<input value="'+esc(window.currentUser?.userId||window.currentUser?.user_id||'')+'" readonly disabled></label>'
+'<label class="field">Owner Mobile<input value="'+esc(a.mobile)+'" readonly disabled></label>'
+'<label class="field">Owner Email<input value="'+esc(a.email)+'" readonly disabled></label>'
+'</div></div></div>'
+'<div style="margin-top:16px;padding:13px 15px;border:1px solid #dfe5ef;border-radius:10px;background:#fafcff"><b>🔒 Profile Locked</b><div class="muted" style="margin-top:4px">Registered business details are view-only. Corrections must be done by Admin.</div></div>'
}
async function enrich(){try{const ac=new AbortController();const t=setTimeout(()=>ac.abort(),5000);const r=await fetch('/api/auth?action=me',{credentials:'include',cache:'no-store',headers:{'Cache-Control':'no-cache'},signal:ac.signal});clearTimeout(t);const d=await r.json().catch(()=>({}));if(r.ok&&d.user){mergeUser(d.user);render();return}}catch{}try{const ac=new AbortController();const t=setTimeout(()=>ac.abort(),5000);const r=await fetch('/api/auth?action=data',{credentials:'include',cache:'no-store',signal:ac.signal});clearTimeout(t);const d=await r.json().catch(()=>({}));const s=d?.settings||{};if(r.ok&&d.exists&&s&&typeof s==='object'){const u=window.currentUser||{};mergeUser({business:val(u.business,s.name),owner:val(u.owner,s.owner),category:val(u.category,s.category),mobile:val(u.mobile,s.mobile),email:val(u.email,s.email),gst:val(u.gst,s.gst),address:val(u.address,s.address)});render()}}catch{}}
function open(){document.querySelectorAll('.tab,.tab-panel').forEach(x=>x.classList.remove('active'));document.querySelector('.tab[data-tab="settings"]')?.classList.add('active');document.getElementById('settings')?.classList.add('active');render();enrich()}
function bind(){document.querySelectorAll('.tab[data-tab="settings"]').forEach(b=>{b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()},{capture:true})});if(document.getElementById('settings')?.classList.contains('active')){render();enrich()}}
window.NRBizProEmergencyProfile={open,render,enrich,mergeUser};
window.addEventListener('load',()=>setTimeout(bind,50));window.addEventListener('authReady',()=>setTimeout(bind,50));window.addEventListener('loginSuccess',()=>setTimeout(bind,50));
})();