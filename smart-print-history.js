/* NR BizPro Smart Print: local print history. No document content is stored. */
(function(){
 const H='nr-bizpro-smart-print-history-v1';
 function accountId(){try{return localStorage.getItem('nr-bizpro-session-v1')||'guest'}catch{return'guest'}}
 function get(){try{const a=JSON.parse(localStorage.getItem(H)||'{}');return a[accountId()]||[]}catch{return[]}}
 function save(rows){try{const a=JSON.parse(localStorage.getItem(H)||'{}');a[accountId()]=rows.slice(0,50);localStorage.setItem(H,JSON.stringify(a))}catch{}}
 function render(){const el=document.getElementById('printHistory');if(!el)return;const rows=get();if(!rows.length){el.innerHTML='<div class="history-empty">No successful print jobs yet.</div>';return}el.innerHTML='<table class="history-table"><thead><tr><th>Time</th><th>Type</th><th>Paper</th><th>Copies</th><th>Mode</th><th>Status</th></tr></thead><tbody>'+rows.map(r=>`<tr><td>${new Date(r.time).toLocaleString('en-IN')}</td><td>${r.type}</td><td>${r.paper}</td><td>${r.copies}</td><td>${r.mode}</td><td class="status-ok">✓ Printed</td></tr>`).join('')+'</tbody></table>'}
 function install(){
   const old=window.confirmPrint;if(typeof old!=='function'||old.__historyWrapped)return;
   function wrapped(){
     const copies=Math.max(1,+document.getElementById('copies')?.value||1),paper=document.getElementById('paper')?.value||'A4',mode=document.getElementById('mode')?.value||'Black & White';
     const typeName=window.type==='passport'?'Passport Photo':window.type==='id'?'ID Card':'Document';
     old();
     setTimeout(()=>{const rows=get();rows.unshift({time:new Date().toISOString(),type:typeName,paper,copies,mode});save(rows);render()},1500);
   }
   wrapped.__historyWrapped=true;window.confirmPrint=wrapped;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,300));else setTimeout(install,300);
 window.addEventListener('load',()=>{setTimeout(install,500);render()});
 window.addEventListener('pageshow',render);
})();