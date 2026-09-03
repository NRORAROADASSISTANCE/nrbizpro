// NR BizPro — business account details are read-only for business users.
(function(){
 function lock(){
  const panel=document.getElementById('settings'); if(!panel)return;
  panel.querySelectorAll('input,select,textarea').forEach(el=>{
   el.readOnly=true;
   el.disabled=true;
   el.setAttribute('aria-readonly','true');
  });
  panel.querySelectorAll('button[onclick="saveSettings()"],#editBusinessAccount').forEach(b=>b.remove());
  const note=document.getElementById('businessSettingsReadonlyNote');
  if(!note){
   const n=document.createElement('p');
   n.id='businessSettingsReadonlyNote';
   n.className='muted';
   n.textContent='Business account details are managed by Admin. Bill details can be edited from Bill History.';
   panel.querySelector('.panel-head')?.appendChild(n);
  }
 }
 function watch(){
  lock();
  const panel=document.getElementById('settings');
  if(!panel||panel.__nrReadonlyObserver)return;
  const observer=new MutationObserver(()=>lock());
  observer.observe(panel,{childList:true,subtree:true});
  panel.__nrReadonlyObserver=observer;
 }
 window.addEventListener('load',watch);
 window.addEventListener('authReady',watch);
 window.addEventListener('loginSuccess',()=>setTimeout(watch,50));
 setTimeout(watch,300);
 setTimeout(watch,1000);
 setTimeout(watch,2000);
})();
