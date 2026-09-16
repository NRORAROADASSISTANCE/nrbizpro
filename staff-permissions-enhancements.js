// NR BizPro — Staff & Permissions workspace
(function(){'use strict';
  const S=()=>window.state||{};
  const save=()=>{try{window.save?.();}catch(e){}};
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const modules=[['billing','Billing / New Bill'],['products','Products / Services'],['customers','Customers'],['sales','Sales & Invoices'],['purchases','Purchases'],['inventory','Inventory / Stock'],['payments','Payments & Outstanding'],['expenses','Expenses'],['reports','Reports']];
  const defaults={billing:true,products:true,customers:true,sales:true,purchases:false,inventory:true,payments:false,expenses:false,reports:false};
  function settings(){const s=S();s.settings=s.settings||{};s.settings.staffPermissions=s.settings.staffPermissions||{staff:[],defaults:{...defaults}};return s.settings.staffPermissions;}
  function openStaff(){
    const p=settings();
    const rows=p.staff||[];
    const body=`<div class="nr-staff-top"><div><b>Staff access control</b><p>Owner can create staff profiles and decide which business modules each staff member can use.</p></div><button class="nr-primary" id="nrAddStaff">+ Add Staff</button></div><div class="nr-staff-list">${rows.length?rows.map((x,i)=>`<div class="nr-staff-row"><div><b>${esc(x.name)}</b><span>${esc(x.mobile||'')} · ${esc(x.role||'Staff')}</span></div><button data-edit-staff="${i}">Edit Permissions</button><button class="nr-danger" data-delete-staff="${i}">Delete</button></div>`).join(''):'<div class="nr-empty">No staff accounts added yet.</div>'}</div><div class="nr-note"><b>Owner</b> always has full access. Business Profile remains owner-view-only after approval; registered profile changes are Admin-only.</div>`;
    window.openModal?.('Staff & Permissions',body);
    document.getElementById('nrAddStaff')?.addEventListener('click',()=>{window.closeModal?.();setTimeout(()=>openStaffForm(),80)});
    document.querySelectorAll('[data-edit-staff]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.editStaff);window.closeModal?.();setTimeout(()=>openStaffForm(i),80)}));
    document.querySelectorAll('[data-delete-staff]').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.deleteStaff);if(!confirm('Delete this staff profile?'))return;p.staff.splice(i,1);save();openStaff();}));
  }
  function openStaffForm(index=-1){
    const p=settings(), x=index>=0?(p.staff[index]||{}):{}, perms={...defaults,...(x.permissions||{})};
    const checks=modules.map(([k,l])=>`<label class="nr-check"><input type="checkbox" data-perm="${k}" ${perms[k]?'checked':''}><span>${l}</span></label>`).join('');
    const body=`<div class="nr-form-grid"><label>Staff Name<input id="nrStaffName" value="${esc(x.name||'')}" placeholder="Employee name"></label><label>Mobile<input id="nrStaffMobile" value="${esc(x.mobile||'')}" placeholder="Mobile number"></label><label>Role<select id="nrStaffRole"><option ${x.role==='Cashier'?'selected':''}>Cashier</option><option ${x.role==='Sales Staff'?'selected':''}>Sales Staff</option><option ${(!x.role||x.role==='Staff')?'selected':''}>Staff</option><option ${x.role==='Manager'?'selected':''}>Manager</option></select></label></div><h3>Module Permissions</h3><div class="nr-check-grid">${checks}</div><div class="modal-actions"><button class="secondary" id="nrCancelStaff">Cancel</button><button class="primary" id="nrSaveStaff">Save Staff</button></div>`;
    window.openModal?.(index>=0?'Edit Staff Permissions':'Add Staff',body);
    document.getElementById('nrCancelStaff')?.addEventListener('click',()=>{window.closeModal?.();setTimeout(openStaff,80)});
    document.getElementById('nrSaveStaff')?.addEventListener('click',()=>{
      const name=document.getElementById('nrStaffName')?.value.trim();if(!name)return alert('Enter staff name.');
      const item={id:x.id||('staff-'+Date.now()),name,mobile:document.getElementById('nrStaffMobile')?.value.trim()||'',role:document.getElementById('nrStaffRole')?.value||'Staff',permissions:{}};
      document.querySelectorAll('[data-perm]').forEach(c=>item.permissions[c.dataset.perm]=c.checked);
      if(index>=0)p.staff[index]=item;else p.staff.push(item);save();window.closeModal?.();setTimeout(openStaff,80);alert('Staff permissions saved.');
    });
  }
  function enforce(){
    const host=document.getElementById('customerManagement');if(!host)return;
    const side=host.querySelector('[data-nr="staff"]');if(side&&!side.dataset.staffReady){side.dataset.staffReady='1';side.onclick=()=>{window.NRCustomerDashboard.open('staff');setTimeout(render,30);setTimeout(render,180)};}
    if(host.querySelector('.nr-side.active')?.dataset.nr==='staff'){
      const p=settings();const box=host.querySelector('.nr-perms');
      if(box){box.innerHTML=`<div><b>Owner</b><small>Full business access</small></div><div><b>Staff</b><small>${p.staff.length} staff profile${p.staff.length===1?'':'s'} configured</small></div><button class="nr-primary" id="nrManageStaff">Manage Staff & Permissions</button><div><b>Security</b><small>Approved Business Profile changes remain Admin-only.</small></div>`;box.style.gridTemplateColumns='1fr 1fr';document.getElementById('nrManageStaff')?.addEventListener('click',openStaff);}
    }
  }
  function boot(){const api=window.NRCustomerDashboard;if(!api||api.__staffEnhanced)return;const old=api.open;api.open=function(id){old(id);setTimeout(enforce,30);setTimeout(enforce,180)};api.__staffEnhanced=true;enforce();}
  const css=`.nr-staff-top{display:flex;justify-content:space-between;gap:15px;align-items:center;margin-bottom:18px}.nr-staff-top p{margin:5px 0;color:#697386}.nr-staff-list{display:grid;gap:10px}.nr-staff-row{display:flex;align-items:center;gap:8px;padding:14px;border:1px solid #e5e9f0;border-radius:10px;background:#fff}.nr-staff-row>div{flex:1}.nr-staff-row span,.nr-perms small{display:block;color:#697386;margin-top:4px}.nr-staff-row button{padding:8px 11px;border:0;border-radius:8px;cursor:pointer;background:#1264f5;color:#fff}.nr-staff-row .nr-danger{background:#b42318}.nr-check-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:12px 0 18px}.nr-check{display:flex;gap:8px;align-items:center;padding:11px;border:1px solid #e5e9f0;border-radius:9px;background:#fff}.nr-check input{width:17px;height:17px}.nr-primary{padding:9px 13px;border:0;border-radius:8px;background:#1264f5;color:#fff;cursor:pointer}.nr-note{margin-top:15px;padding:12px;border-radius:9px;background:#f6f8fb;color:#697386}.nr-perms{gap:12px}.nr-perms button{grid-column:1/-1}@media(max-width:700px){.nr-check-grid{grid-template-columns:1fr 1fr}.nr-staff-row{flex-wrap:wrap}}@media(max-width:500px){.nr-check-grid{grid-template-columns:1fr}.nr-staff-top{align-items:flex-start;flex-direction:column}}`;
  function loadCss(){if(document.getElementById('nrStaffCss'))return;const s=document.createElement('style');s.id='nrStaffCss';s.textContent=css;document.head.appendChild(s)}
  window.NRBizProStaff={open:openStaff,openForm:openStaffForm};
  window.addEventListener('load',()=>{loadCss();setTimeout(boot,2300);setTimeout(boot,4200)});window.addEventListener('authReady',boot);window.addEventListener('loginSuccess',boot);
})();
