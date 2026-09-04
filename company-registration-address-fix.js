// NR BizPro — Company Registration Address Fix
(function(){
  const ADDRESS_ID='suAddress';
  function addAddressField(){
    const grid=document.querySelector('#authContent .portal-grid, #authContent .auth-grid');
    if(!grid || document.getElementById(ADDRESS_ID)) return;
    const label=document.createElement('label');
    label.className='wide';
    label.innerHTML='Business Address *<textarea id="suAddress" rows="3" required placeholder="Door No, Street, Village/Town, District, State, PIN Code" style="width:100%;box-sizing:border-box;margin-top:7px;border:1px solid #cbd7e8;border-radius:9px;padding:11px 12px;background:#fff;color:#10233f;font-size:14px;resize:vertical"></textarea></label>';
    grid.appendChild(label);
  }
  function patchRenderAuth(){
    if(typeof window.renderAuth!=='function' || window.renderAuth.__nrCompanyAddressPatch) return;
    const old=window.renderAuth;
    function wrapped(mode,message){
      const result=old.apply(this,arguments);
      if(mode==='signup') setTimeout(addAddressField,0);
      return result;
    }
    wrapped.__nrCompanyAddressPatch=true;
    window.renderAuth=wrapped;
  }
  function patchFetch(){
    if(window.fetch.__nrCompanyAddressPatch) return;
    const original=window.fetch;
    const wrapped=function(input,init){
      try{
        const url=typeof input==='string'?input:(input&&input.url)||'';
        if(url.includes('/api/auth') && init && String(init.method||'GET').toUpperCase()==='POST' && typeof init.body==='string'){
          const body=JSON.parse(init.body);
          if(body && body.action==='signup'){
            body.address=(document.getElementById(ADDRESS_ID)?.value||'').trim();
            init={...init,body:JSON.stringify(body)};
          }
        }
      }catch(err){console.error('NR company registration address fetch patch',err)}
      return original.apply(this,arguments);
    };
    wrapped.__nrCompanyAddressPatch=true;
    window.fetch=wrapped;
  }
  function run(){patchRenderAuth();patchFetch();if(document.getElementById('authContent')) addAddressField();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  window.addEventListener('load',()=>{run();setTimeout(run,100);setTimeout(run,500);});
  setInterval(run,1000);
})();