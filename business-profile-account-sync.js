// NR BizPro — keep Business Profile aligned with the logged-in account identity
(function(){'use strict';
 function sync(){
  const u=window.currentUser,s=window.state;if(!u||!s)return;
  s.settings=s.settings||{};
  if(u.business)s.settings.name=u.business;
  if(u.category)s.settings.category=u.category;
  if(u.mobile)s.settings.mobile=u.mobile;
  if(u.email)s.settings.email=u.email;
  if(u.gst)s.settings.gst=u.gst;
  if(u.owner)s.settings.owner=u.owner;
  const p=document.getElementById('settings');
  if(p&&p.classList.contains('active')&&window.NRBizProBusinessV4?.render)window.NRBizProBusinessV4.render();
 }
 window.NRBizProBusinessAccountSync={sync};
 window.addEventListener('load',()=>setTimeout(sync,200));
 window.addEventListener('authReady',()=>setTimeout(sync,100));
 window.addEventListener('loginSuccess',()=>setTimeout(sync,100));
})();
