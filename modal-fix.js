// Fix modal element lookup for billing and all dashboard dialogs.
(function(){
  window.openModal=function(title,html){
    const m=document.getElementById('modal');
    const t=document.getElementById('modalTitle');
    const b=document.getElementById('modalBody');
    if(!m||!t||!b){console.error('NR BizPro: modal container missing');return false;}
    t.textContent=title||'';
    b.innerHTML=html||'';
    m.classList.remove('hidden');
    return true;
  };
  window.closeModal=function(){const m=document.getElementById('modal');if(m)m.classList.add('hidden');};
})();
