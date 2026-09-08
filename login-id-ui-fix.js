// Business-holder login UI: Login ID + Mobile only.
(function(){
  function patch(){
    const input=document.getElementById('loginId');
    if(!input)return;
    const label=input.closest('label');
    if(label){
      const text=[...label.childNodes].find(n=>n.nodeType===3);
      if(text)text.nodeValue='Login ID / Mobile ';
      else label.firstChild.textContent='Login ID / Mobile ';
    }
    input.placeholder='Enter Login ID or mobile number';
    input.autocomplete='username';
    input.setAttribute('aria-label','Login ID or Mobile');
  }
  const original=window.renderAuth;
  if(typeof original==='function'){
    window.renderAuth=function(){const r=original.apply(this,arguments);setTimeout(patch,0);return r};
  }
  patch();
  new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});
})();
