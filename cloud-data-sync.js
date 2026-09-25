// NR BizPro — single authoritative cloud persistence adapter.
// app.js owns database persistence, versioning and conflict handling. This file
// intentionally does not poll or patch localStorage; legacy duplicate sync was
// causing repeated 409 writes and making the UI slow.
(function(){
  'use strict';
  async function sync(){ return true; }
  async function put(state){ if(typeof window.save==='function'){ await window.save(); return true; } return false; }
  function schedule(){ if(typeof window.save==='function') return window.save(); return Promise.resolve(); }
  window.NRBizProCloudSync={sync,put,schedule};
})();
