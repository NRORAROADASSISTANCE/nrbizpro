/* Visible customer test entry. Keeps the production/login flow untouched. */
(function(){
  function addTestEntry(){
    const gate=document.getElementById('gate');
    if(!gate || document.getElementById('customerTestEntry')) return;
    const box=document.createElement('div');
    box.id='customerTestEntry';
    box.style.cssText='margin:16px 0 0;padding:16px;border:2px dashed #1264f5;border-radius:14px;background:#f7fbff;text-align:center';
    box.innerHTML='<div style="font-size:18px;font-weight:800;margin-bottom:6px">🧪 Customer Test</div><div style="font-size:14px;margin-bottom:12px">Test 5 document/ID pages without login. Passport photos are Premium only.</div><button type="button" id="startCustomerTest" class="secondary" style="width:100%;cursor:pointer">Start 5-Page Customer Test</button>';
    gate.appendChild(box);
    document.getElementById('startCustomerTest').addEventListener('click',function(){
      const u=new URL(location.href);u.searchParams.set('customerTest','1');location.href=u.toString();
    });
  }
  function run(){addTestEntry();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(run,300)); else setTimeout(run,300);
  const observer=new MutationObserver(run);
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();