// Robust New Bill launcher + product edit bridge
(function(){
  function launch(){
    if(typeof window.openBillModal==='function') return window.openBillModal();
    if(typeof window.openModal==='function'){
      window.openModal('Create New Bill','<p class="muted">New Bill module is loading. Please try again.</p>');
    } else alert('New Bill module is not loaded. Please refresh the page.');
  }
  function bind(){
    document.querySelectorAll('[onclick*="openBillModal"]').forEach(function(b){
      b.onclick=function(e){e.preventDefault();e.stopPropagation();launch();return false;};
    });
  }
  window.launchNewBill=launch;
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
  window.addEventListener('load',bind);
})();
