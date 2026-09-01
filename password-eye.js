// NR BizPro password visibility toggle
(function(){
  function addEye(input){
    if(!input || input.dataset.eyeReady==='1') return;
    input.dataset.eyeReady='1';
    const wrap=document.createElement('span');
    wrap.className='password-eye-wrap';
    input.parentNode.insertBefore(wrap,input);
    wrap.appendChild(input);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='password-eye-btn';
    btn.setAttribute('aria-label','Show password');
    btn.innerHTML='👁️';
    btn.onclick=function(){
      const visible=input.type==='text';
      input.type=visible?'password':'text';
      btn.innerHTML=visible?'👁️':'🙈';
      btn.setAttribute('aria-label',visible?'Show password':'Hide password');
    };
    wrap.appendChild(btn);
  }
  function scan(){
    document.querySelectorAll('input[type="password"]').forEach(addEye);
  }
  const obs=new MutationObserver(scan);
  obs.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',scan);
  setTimeout(scan,100);
  setTimeout(scan,500);
})();
