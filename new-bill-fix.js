// Robust New Bill launcher + product edit bridge
(function(){
  function launch(){
    if(typeof window.openBillModal==='function') return window.openBillModal();
    if(typeof window.openModal==='function') {
      window.openModal('Create New Bill','<p class="muted">New Bill module is loading. Please try again.</p>');
    } else {
      alert('New Bill module is not loaded. Please refresh the page.');
    }
  }

  function bind(){
    // Current index.html uses dedicated IDs for the New Bill buttons.
    ['newBillButton','createBillButton'].forEach(function(id){
      var b=document.getElementById(id);
      if(b){
        b.onclick=function(e){
          e.preventDefault();
          e.stopPropagation();
          launch();
          return false;
        };
      }
    });

    // Keep compatibility with any older buttons that still use inline onclick.
    document.querySelectorAll('[onclick*="openBillModal"]').forEach(function(b){
      b.onclick=function(e){
        e.preventDefault();
        e.stopPropagation();
        launch();
        return false;
      };
    });
  }

  window.launchNewBill=launch;
  if(document.readyState==='loading') {
    document.addEventListener('DOMContentLoaded',bind);
  } else {
    bind();
  }
  window.addEventListener('load',bind);
})();
