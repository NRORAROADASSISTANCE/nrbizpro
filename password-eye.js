// NR BizPro password visibility toggle
(function(){
  function addStyles(){
    if(document.getElementById('nrPasswordEyeStyles')) return;
    const s=document.createElement('style');
    s.id='nrPasswordEyeStyles';
    s.textContent='.password-eye-wrap{position:relative;display:block;width:100%}.password-eye-wrap input{padding-right:48px!important;width:100%}.password-eye-btn{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;cursor:pointer;font-size:18px;line-height:1;padding:6px;border-radius:6px}.password-eye-btn:hover{background:rgba(0,0,0,.06)}';
    document.head.appendChild(s);
  }
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
  function scan(){addStyles();document.querySelectorAll('input[type="password"]').forEach(addEye)}
  const obs=new MutationObserver(scan);
  obs.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',scan);
  setTimeout(scan,100);
  setTimeout(scan,500);
})();
