// NR BizPro — Company Registration Address Fix (reliable)
(function(){
  const ADDRESS_ID='suAddress';
  const ADDRESS_LABEL_ID='nrCompanyAddressLabel';
  const ADDRESS_HTML=`<label id="${ADDRESS_LABEL_ID}" class="wide">Business Address *<textarea id="${ADDRESS_ID}" rows="3" required placeholder="Door No, Street, Area, Village/Town, District, State, PIN Code" style="width:100%;box-sizing:border-box;margin-top:7px;border:1px solid #cbd7e8;border-radius:9px;padding:11px 12px;background:#fff;color:#10233f;font-size:14px;resize:vertical"></textarea></label>`;

  function addAddressField(){
    const content=document.getElementById('authContent');
    if(!content) return false;
    const form=content.querySelector('.portal-form form');
    if(!form) return false;
    if(document.getElementById(ADDRESS_ID)) return true;
    const grid=form.querySelector('.portal-grid');
    if(grid){
      grid.insertAdjacentHTML('beforeend',ADDRESS_HTML);
      return true;
    }
    // Fallback: place it immediately before the password field.
    const password=form.querySelector('#suPassword')?.closest('label');
    if(password){password.insertAdjacentHTML('beforebegin',ADDRESS_HTML);return true;}
    form.insertAdjacentHTML('beforeend',ADDRESS_HTML);
    return true;
  }

  function patchRenderAuth(){
    if(typeof window.renderAuth!=='function' || window.renderAuth.__nrCompanyAddressPatch) return;
    const old=window.renderAuth;
    function wrapped(mode,message){
      const result=old.apply(this,arguments);
      if(mode==='signup') addAddressField();
      return result;
    }
    wrapped.__nrCompanyAddressPatch=true;
    window.renderAuth=wrapped;
  }

  function patchSignup(){
    if(typeof window.signup!=='function' || window.signup.__nrCompanyAddressPatch) return;
    const old=window.signup;
    async function wrapped(e){
      addAddressField();
      const address=document.getElementById(ADDRESS_ID)?.value?.trim()||'';
      if(!address){
        e.preventDefault();
        alert('Please enter Business Address.');
        document.getElementById(ADDRESS_ID)?.focus();
        return;
      }
      return old.apply(this,arguments);
    }
    wrapped.__nrCompanyAddressPatch=true;
    window.signup=wrapped;
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
      }catch(err){console.error('NR company registration address patch',err)}
      return original.apply(this,arguments);
    };
    wrapped.__nrCompanyAddressPatch=true;
    window.fetch=wrapped;
  }

  function run(){
    patchRenderAuth();
    patchSignup();
    patchFetch();
    const auth=document.getElementById('authContent');
    if(auth && auth.querySelector('.portal-form form')) addAddressField();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run);
  else run();
  window.addEventListener('load',run);
  setTimeout(run,0);setTimeout(run,100);setTimeout(run,500);setTimeout(run,1500);
})();
