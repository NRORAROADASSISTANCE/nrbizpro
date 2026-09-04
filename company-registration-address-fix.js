// NR BizPro — Company Registration Address Fix
(function(){
  function patchRenderAuth(){
    if(typeof window.renderAuth!=='function' || window.renderAuth.__nrCompanyAddressPatch) return;
    const old=window.renderAuth;
    function wrapped(mode,message){
      const result=old.apply(this,arguments);
      if(mode==='signup'){
        const grid=document.querySelector('#authContent .auth-grid');
        if(grid && !document.getElementById('suAddress')){
          const label=document.createElement('label');
          label.className='wide';
          label.innerHTML='Business Address<textarea id="suAddress" rows="3" required placeholder="Door No, Street, Village/Town, District, State, PIN"></textarea></label>';
          grid.appendChild(label);
        }
      }
      return result;
    }
    wrapped.__nrCompanyAddressPatch=true;
    window.renderAuth=wrapped;
  }
  function patchSignup(){
    if(typeof window.signup!=='function' || window.signup.__nrCompanyAddressPatch) return;
    const old=window.signup;
    function wrapped(e){
      old.apply(this,arguments);
      try{
        const address=(document.getElementById('suAddress')?.value||'').trim();
        if(window.currentUser){
          currentUser.address=address;
          if(typeof persistUser==='function') persistUser();
        }
      }catch(err){console.error('NR company registration address',err)}
    }
    wrapped.__nrCompanyAddressPatch=true;
    window.signup=wrapped;
  }
  function patchActivation(){
    if(typeof window.activateAfterVerifiedPayment!=='function' || window.activateAfterVerifiedPayment.__nrCompanyAddressPatch) return;
    const old=window.activateAfterVerifiedPayment;
    function wrapped(paymentId){
      const address=(window.currentUser?.address||'').trim();
      old.apply(this,arguments);
      try{
        if(window.state){
          state.settings=state.settings||{};
          state.settings.address=address;
          if(typeof save==='function') save();
          if(typeof loadSettings==='function') loadSettings();
        }
      }catch(err){console.error('NR activation address',err)}
    }
    wrapped.__nrCompanyAddressPatch=true;
    window.activateAfterVerifiedPayment=wrapped;
  }
  function run(){patchRenderAuth();patchSignup();patchActivation();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  window.addEventListener('load',()=>{run();setTimeout(run,100);setTimeout(run,500);});
  setInterval(run,1000);
})();
