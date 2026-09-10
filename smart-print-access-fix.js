/* Smart Print access rules: pre-activation demo vs activated customer. */
(function(){
  'use strict';
  try{
    const q=new URLSearchParams(location.search);
    if(q.get('customerTest')!=='1') return;
    const SESSION_KEY='nr-bizpro-session-v1',USERS_KEY='nr-bizpro-users-v1',KEY='nr-bizpro-smart-print-v1';
    const id=localStorage.getItem(SESSION_KEY);
    const users=JSON.parse(localStorage.getItem(USERS_KEY)||'[]');
    const account=users.find(u=>u.id===id)||null;
    if(!account) return; // No login: this is the pre-activation demo.
    const all=JSON.parse(localStorage.getItem(KEY)||'{}');
    const data=all[account.id]||{};
    const active=!!(data.licensed&&data.expires&&new Date(data.expires)>new Date());
    if(active){
      q.delete('customerTest');
      q.delete('v');
      const clean=location.pathname+(q.toString()?'?'+q.toString():'');
      history.replaceState({},document.title,clean);
    }
  }catch(e){ console.warn('Smart Print access check skipped',e); }
})();
