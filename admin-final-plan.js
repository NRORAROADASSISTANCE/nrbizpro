/* Admin display labels for final membership plans. */
(function(){
'use strict';
const map={year3:'6 Years — ₹6,000',lifetime:'Lifetime — ₹15,000'};
function patch(root){if(!root)return;root.querySelectorAll('td').forEach(td=>{const v=td.textContent.trim();if(map[v])td.textContent=map[v]})}
function install(){['payments','users'].forEach(id=>{const el=document.getElementById(id);if(!el||el.dataset.finalPlan==='1')return;el.dataset.finalPlan='1';const run=()=>patch(el);new MutationObserver(run).observe(el,{childList:true,subtree:true});run()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();setTimeout(install,500);setTimeout(install,1500);setTimeout(install,3000);
})();
