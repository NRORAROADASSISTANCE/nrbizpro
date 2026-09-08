async function render(){
 try{
  const r=await api('/api/admin-businesses'),users=r.businesses||[],q=(document.getElementById('search')?.value||'').trim().toLowerCase();
  populateBackupBusinesses(users);
  document.getElementById('total').textContent=users.length;
  document.getElementById('active').textContent=users.filter(u=>u.status==='active').length;
  const pending=users.filter(u=>u.status==='pending'&&u.has_pending_payment);
  document.getElementById('pending').textContent=pending.length;
  document.getElementById('expired').textContent=users.filter(u=>['expired','suspended'].includes(u.status)).length;
  const pendingTb=document.getElementById('pendingUsers');
  pendingTb.innerHTML=pending.map(u=>`<tr><td><b>${esc(u.business)}</b></td><td>${esc(u.owner)}</td><td>${esc(u.email)}<br>${esc(u.mobile)}</td><td>${esc(u.category)}</td><td><span class="pill pending">Payment Submitted</span></td><td>${u.created_at?new Date(u.created_at).toLocaleString('en-IN'):'—'}</td><td>${pendingActions(u.id?encodeURIComponent(u.id):'')}</td></tr>`).join('')||'<tr><td colspan="7">No businesses are awaiting approval. Registration alone does not create an approval request; a payment request must be submitted first.</td></tr>';
  const rows=users.filter(u=>`${u.business} ${u.owner} ${u.email} ${u.mobile} ${u.category} ${u.address||''}`.toLowerCase().includes(q));
  document.getElementById('users').innerHTML=rows.length?rows.map(u=>`<tr data-business-id="${esc(u.id)}"><td><b>${esc(u.business)}</b></td><td>${esc(u.owner)}</td><td>${esc(u.email)}<br>${esc(u.mobile)}</td><td>${esc(u.category)}</td><td><span class="pill ${esc(u.status)}">${esc(u.status)}</span></td><td>${esc(u.plan||'—')}</td><td>${fmtDate(u.subscription_ends)}</td><td>${actionButtons(u)}</td></tr>`).join(''):'<tr><td colspan="8">No business accounts found.</td></tr>';
 }catch(err){if(err.message==='Admin login required')location.replace('/admin.html');else document.getElementById('error').textContent=err.message}
}
async function deleteBusiness(id){
 const businessId=decodeURIComponent(id); if(!businessId)return;
 if(!confirm('DELETE this business permanently? All business data, sessions, OTP records, backups and payment records will also be deleted. This cannot be undone.'))return;
 try{
  const r=await api('/api/admin-delete',{method:'POST',body:JSON.stringify({businessId})});
  if(!r.ok)throw new Error('Delete failed.');
  const row=document.querySelector(`#users tr[data-business-id="${CSS.escape(businessId)}"]`); if(row)row.remove();
  await render(); await loadPayments();
  alert(`Business "${r.deletedBusiness?.business||'Business'}" deleted permanently.`);
 }catch(err){alert(err.message||'Delete failed.')}
}