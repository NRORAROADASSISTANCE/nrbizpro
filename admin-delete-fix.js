async function deleteBusiness(id){
 const businessId=decodeURIComponent(id);
 if(!businessId)return;
 if(!confirm('DELETE this business permanently? All business data, sessions, OTP records, backups and payment records will also be deleted. This cannot be undone.'))return;
 try{
  const r=await api('/api/admin-delete',{method:'POST',body:JSON.stringify({businessId})});
  if(!r.ok)throw new Error('Delete failed.');
  const row=[...document.querySelectorAll('#users tr')].find(tr=>tr.innerHTML.includes(businessId));
  if(row)row.remove();
  await render();
  await loadPayments();
  alert(`Business "${r.deletedBusiness?.business||'Business'}" deleted permanently.`);
 }catch(err){alert(err.message||'Delete failed.')}
}