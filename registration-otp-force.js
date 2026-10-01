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
        window.renderAuth('signup');
      }
    }catch(e){ console.error('NR OTP signup render:',e); }
  }
  window.addEventListener('authReady',()=>{ ensureOtpSignup(); setTimeout(ensureOtpSignup,300); setTimeout(ensureOtpSignup,1000); });
  document.addEventListener('click',()=>setTimeout(ensureOtpSignup,100));
})();
