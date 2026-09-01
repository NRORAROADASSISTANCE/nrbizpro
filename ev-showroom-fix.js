// NR BizPro — final EV showroom UI fixes
(function(){
  const isEV=()=>/ev two|electric two|ev 2|ev scooter|ev bike/i.test(String((typeof currentUser!=='undefined'&&currentUser?.category)||(typeof state!=='undefined'&&state?.settings?.category)||''));
  const moneySafe=n=>typeof money==='function'?money(n):new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0);
  const escSafe=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function renderItemsFixed(){
    const tb=document.getElementById('itemTable');
    if(!tb || typeof state==='undefined' || !state) return;
    const items=Array.isArray(state.items)?state.items:[];
    if(!items.length){tb.innerHTML='<tr><td colspan="8" class="empty">No products yet.</td></tr>';return;}
    tb.innerHTML=items.map(i=>`<tr><td><b>${escSafe(i.name||'—')}</b></td><td>${escSafe(i.barcode||'—')}</td><td>${escSafe(i.type||'Product')}</td><td>${moneySafe(i.cost)}</td><td><b>${moneySafe(i.sell)}</b></td><td>${Number(i.gst)||0}%</td><td><b>${Number(i.stock)||0}</b></td><td><button class="secondary" type="button" data-fix-delete="${i.id}">Delete</button></td></tr>`).join('');
    tb.querySelectorAll('[data-fix-delete]').forEach(b=>b.onclick=()=>{if(typeof deleteItem==='function')deleteItem(b.dataset.fixDelete);});
  }

  function addRtoNotApplicable(){
    const s=document.getElementById('evRto');
    if(!s)return;
    if(!Array.from(s.options).some(o=>o.value==='Not Applicable')){
      const o=document.createElement('option');o.value='Not Applicable';o.textContent='Not Applicable';s.insertBefore(o,s.firstChild);
    }
  }

  function addSpeedToBill(){
    if(document.getElementById('evSpeed'))return;
    const model=document.getElementById('evVehicle');
    if(!model)return;
    const label=document.createElement('label');label.className='field';label.innerHTML='Speed<input id="evSpeed" placeholder="45 km/h">';
    model.closest('.field')?.parentElement?.appendChild(label);
  }

  function patchEvBill(){
    if(!isEV() || typeof window.openEVBill!=='function')return;
    const original=window.openEVBill;
    if(original.__nrFinalFix)return;
    function wrapped(){
      original();
      setTimeout(()=>{
        addRtoNotApplicable();
        addSpeedToBill();
        const btn=document.getElementById('evGenerate');
        if(btn && !btn.__nrSpeedFix){
          const old=btn.onclick;
          btn.onclick=function(){
            const speed=document.getElementById('evSpeed')?.value?.trim()||'';
            if(typeof old==='function')old();
            if(typeof state!=='undefined'&&state?.bills?.[0] && speed){state.bills[0].vehicle=state.bills[0].vehicle||{};state.bills[0].vehicle.speed=speed;save();}
          };
          btn.__nrSpeedFix=true;
        }
      },0);
    }
    wrapped.__nrFinalFix=true;
    window.openEVBill=wrapped;
    window.openBillModal=wrapped;
    window.launchEVNewBill=wrapped;
    window.launchNewBill=wrapped;
  }

  function install(){
    window.renderItems=renderItemsFixed;
    if(isEV() && typeof window.openBusinessProductModal==='function') window.openItemModal=window.openBusinessProductModal;
    patchEvBill();
    renderItemsFixed();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  window.addEventListener('load',()=>setTimeout(install,100));
  window.addEventListener('authReady',install);
  window.addEventListener('loginSuccess',install);
})();
