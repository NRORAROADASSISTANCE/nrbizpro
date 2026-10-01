/* NR BizPro — force MSG91 signup renderer after all auth scripts are ready */
(function(){
  'use strict';
  function ensureOtpSignup(){
    try{
      const form=document.querySelector('#authContent form');
      const mobile=document.getElementById('suMobile');
      const email=document.getElementById('suEmail');
      const hasOtp=document.getElementById('sendMobileOtp') && document.getElementById('sendEmailOtp');
      if(form && mobile && email && !hasOtp && typeof window.renderAuth==='function'){
        window.__NRBuildOtpSignup?.();
      }
    }catch(e){ console.error('NR OTP signup render:',e); }
  }
  function hookRenderAuth(){
    if(window.__NROtpRenderHooked||typeof window.renderAuth!=='function')return;
    const original=window.renderAuth;
    window.renderAuth=function(mode,message){
      const result=original.apply(this,arguments);
      if(mode==='signup'){
        setTimeout(ensureOtpSignup,0);setTimeout(ensureOtpSignup,150);setTimeout(ensureOtpSignup,500);
      }
      return result;
    };
    window.__NROtpRenderHooked=true;
  }
  window.addEventListener('authReady',()=>{ hookRenderAuth(); ensureOtpSignup(); setTimeout(ensureOtpSignup,300); setTimeout(ensureOtpSignup,1000); });
  document.addEventListener('click',()=>setTimeout(ensureOtpSignup,100));
})();
