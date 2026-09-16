/* NR BizPro — Admin Business Accounts renderer fallback */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const date=v=>v?new Date(v).toLocaleDateString('en-IN'):'—';
async function load(){
  const tb=document.getElementById('users');
  if(!tb)return;
  try{
    const r=await fetch('/api/admin?action=businesses&refresh='+Date.now(),{credentials:'same-origin',cache:'no-store',headers:{'Cache-Control':'no-cache'}});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||('Business list request failed ('+r.status+')'));
    const users=Array.isArray(j.businesses)?j.businesses:[];
    const q=(document.getElementById('search')?.value||'').trim().toLowerCase();
    const rows=users.filter(u=>`${u.business||''} ${u.user_id||''} ${u.owner||''} ${u.email||''} ${u.mobile||''} ${u.category||''} ${u.address||''}`.toLowerCase().includes(q));
    document.getElementById('total').textContent=users.length;
    document.getElementById('active').textContent=users.filter(u=>String(u.status).toLowerCase()==='active').length;
    document.getElementById('expired').textContent=users.filter(u=>['expired','suspended'].includes(String(u.status).toLowerCase())).length;
    tb.innerHTML=rows.length?rows.map(u=>{
      const id=encodeURIComponent(u.id),active=String(u.status).toLowerCase()==='active';
      return `<tr><td><b>${esc(u.business)}</b></td><td>${esc(u.owner)}</td><td>${esc(u.email)}<br>${esc(u.mobile)}</td><td>${esc(u.category)}</td><td><span class="pill ${esc(u.status)}">${esc(u.status)}</span></td><td>${esc(u.plan||'—')}</td><td>${date(u.subscription_ends)}</td><td><div class="actions"><button class="view" onclick="viewBusiness('${id}')">View Details</button>${active?`<button class="warn" onclick="changeStatus('${id}','suspended')">Suspend</button>`:`<button class="success" onclick="activateBusiness('${id}')">Activate</button>`}<button class="danger" onclick="deleteBusiness('${id}')">Delete</button></div></td></tr>`;
    }).join(''):'<tr><td colspan="8">No business accounts found.</td></tr>';
    if(typeof populateBackupBusinesses==='function')populateBackupBusinesses(users);
  }catch(err){
    tb.innerHTML=`<tr><td colspan="8" style="color:#ff8b8b;font-weight:700">Business list error: ${esc(err.message)} — click Refresh and try again.</td></tr>`;
  }
}
window.addEventListener('load',()=>{setTimeout(load,1200);setTimeout(load,3000);setTimeout(load,6000)});
window.addEventListener('pageshow',()=>setTimeout(load,500));
})();
