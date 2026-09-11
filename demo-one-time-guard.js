// NR BizPro — Demo rules: one demo, 3 total BILLING prints, fixed demo settings
(function(){
  const isDemo=()=>window.nrBizProDemoMode===true&&window.currentUser?.id==='nr-bizpro-demo';
  let busy=false;
  async function consumePrint(){
    if(busy)return false;busy=true;
    try{const r=await fetch('/api/auth?action=demo-print',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({action:'demo-print'})});const d=await r.json();if(!r.ok){alert(d.error||'Demo billing print trial is finished.');return false}window.__demoPrintsRemaining=d.remaining;return true}catch(e){alert('Unable to verify the demo print trial. Please try again.');return false}finally{busy=false}
  }
  function lockSettings(){if(!isDemo())return;document.getElementById('demoCategorySwitcher')?.remove();const selectors=[document.getElementById('businessCategory'),document.getElementById('businessCategorySettings')];selectors.forEach(s=>{if(s){s.disabled=true;s.title='Business category is fixed in the one-time demo.'}});document.querySelectorAll('select,input').forEach(el=>{if(el.id==='businessCategory'||el.id==='businessCategorySettings')el.disabled=true});}
  document.addEventListener('click',async e=>{if(!isDemo())return;const el=e.target?.closest?.('button,a,[role="button"]');if(!el)return;const text=(el.textContent||'').trim().toLowerCase();if(!/\b(print|ప్రింట్)\b/.test(text))return;if(el.dataset.demoPrintApproved==='1')return;el.dataset.demoPrintPending='1';const ok=await consumePrint();if(!ok){e.preventDefault();e.stopImmediatePropagation();el.dataset.demoPrintPending='';return}el.dataset.demoPrintApproved='1';setTimeout(()=>{if(el.dataset)el.dataset.demoPrintApproved='';},1500);},{capture:true});
  const boot=()=>{if(isDemo())lockSettings()};window.addEventListener('load',()=>setTimeout(boot,250));window.addEventListener('demoStarted',()=>setTimeout(boot,100));setInterval(boot,1000);
})();
