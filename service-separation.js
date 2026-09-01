// Smart Print and Rewards are separate services, not Billing modules.
(function(){
  function remove(){
    document.querySelectorAll('.quick-grid button').forEach(function(b){
      var text=b.innerText||'';
      if(text.indexOf('Smart Print')>=0 || text.indexOf('Rewards')>=0) b.remove();
    });
  }
  function start(){
    remove();
    new MutationObserver(remove).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
