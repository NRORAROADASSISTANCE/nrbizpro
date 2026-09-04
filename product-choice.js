// NR BizPro product-choice UI + cache-safe demo business filter loader.
(function(){
  const NR_CATEGORIES=['General Business','Grocery / General Store','Footwear / Chappal Shop','Fertilizer / Agriculture','Garage / Service Center','Spare Parts','EV Two-Wheeler Showroom','Retail / Supermarket','Restaurant / Bakery','Hardware / Building Materials','Medical / Pharmacy','Electronics / Mobile','Clothing / Fashion','Furniture','Jewellery','Stationery / Book Store','Dairy / Milk Products','Salon / Beauty Parlour','Printing / Xerox / Online Services','Wholesale / Distributor','Professional Services','Construction / Building Materials','Paint Shop','Plumbing Business','Paint Shop + Plumbing Business','Other Business'];
  function load(src){const s=document.createElement('script');s.src=src;document.head.appendChild(s)}
  function removeLinks(){document.querySelectorAll('.quick-grid button').forEach(b=>{const t=b.innerText||'';if(t.includes('Smart Print')||t.includes('Rewards'))b.remove()})}
  function ensureCategoryOptions(){
    ['businessCategory','businessCategorySettings','suCategory'].forEach(id=>{
      const el=document.getElementById(id); if(!el)return;
      if(el.tagName==='SELECT'){
        const current=el.value;
        const existing=new Set(Array.from(el.options).map(o=>o.value));
        NR_CATEGORIES.forEach(c=>{if(!existing.has(c)){const o=document.createElement('option');o.value=c;o.textContent=c;el.appendChild(o)}});
        if(current)el.value=current;
      }else if(id==='suCategory'){
        const select=document.createElement('select');select.id='suCategory';select.name='businessCategory';select.required=el.required;select.setAttribute('aria-label','Business Category');
        NR_CATEGORIES.forEach((c,i)=>{const o=document.createElement('option');o.value=c;o.textContent=c;if(i===0)o.selected=true;select.appendChild(o)});
        el.replaceWith(select);
      }
    });
  }
  function install(){
    removeLinks();
    ensureCategoryOptions();
    if(!window.__nrIsolationLoader){window.__nrIsolationLoader=true;load('business-product-isolation.js?v=20260904-04')}
    if(!window.__nrHardFilterLoader){window.__nrHardFilterLoader=true;load('demo-business-filter-fix.js?v=20260904-03')}
    if(typeof window.renderAuth!=='function'||window.__productChoiceInstalled)return;
    window.__productChoiceInstalled=true;
    const old=window.renderAuth;
    window.renderAuth=function(mode='login',message=''){
      old(mode,message);if(mode!=='signup')return;
      ensureCategoryOptions();
      const el=document.getElementById('authContent');if(!el||el.querySelector('.nr-product-choice'))return;
      const box=document.createElement('div');box.className='nr-product-choice';box.style.cssText='margin:0 0 18px;padding:16px;border:1px solid #e5e9f0;border-radius:14px;background:#fbfcfe';
      box.innerHTML='<h3>Choose Product</h3><p>Billing Software and Smart Print are separate services.</p><button type="button" onclick="document.getElementById(\'suBusiness\')?.focus()">🧾 Billing Software</button> <button type="button" onclick="location.href=\'smart-print.html\'">🖨️ Smart Print</button>';
      const form=el.querySelector('form');if(form)el.insertBefore(box,form);else el.prepend(box)
      ensureCategoryOptions();
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();window.addEventListener('load',install);setInterval(ensureCategoryOptions,500);setInterval(removeLinks,1000)
})();
