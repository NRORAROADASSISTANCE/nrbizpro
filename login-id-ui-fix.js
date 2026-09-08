// Login UI fix: the server already accepts Login ID, Email, or Mobile.
(function(){
  function patch(){
    const input=document.getElementById('loginId');
    if(!input)return;
    const label=input.closest('label');
    if(label){
      const text=[...label.childNodes].find(n=>n.nodeType===3);
      if(text)text.nodeValue='Login ID / Email / Mobile ';
      else label.firstChild.textContent='Login ID / Email / Mobile ';
    }
    input.placeholder='Enter Login ID, email or mobile';
    input.autocomplete='username';
    input.setAttribute('aria-label','Login ID, Email or Mobile');
  }
  const original=window.renderAuth;
  if(typeof original==='function'){
    window.renderAuth=function(){const r=original.apply(this,arguments);setTimeout(patch,0);return r};
  }
  patch();
  new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});
})();
