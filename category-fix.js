// Ensure the signup Business Category is always a real dropdown.
(function(){
  const categories=[
    'General Business',
    'Grocery / General Store',
    'Footwear / Chappal Shop',
    'Fertilizer / Agriculture',
    'Garage / Service Center',
    'Spare Parts',
    'EV Two-Wheeler Showroom',
    'Retail / Supermarket',
    'Restaurant / Bakery',
    'Hardware / Building Materials',
    'Medical / Pharmacy',
    'Electronics / Mobile',
    'Clothing / Fashion',
    'Furniture',
    'Jewellery',
    'Stationery / Book Store',
    'Dairy / Milk Products',
    'Salon / Beauty Parlour',
    'Printing / Xerox / Online Services',
    'Wholesale / Distributor',
    'Professional Services',
    'Construction / Building Materials',
    'Other Business'
  ];

  function fix(){
    const input=document.getElementById('suCategory');
    if(!input || input.tagName==='SELECT') return;
    const select=document.createElement('select');
    select.id='suCategory';
    select.name='businessCategory';
    select.required=true;
    select.setAttribute('aria-label','Business Category');
    categories.forEach((value,index)=>{
      const option=document.createElement('option');
      option.value=value;
      option.textContent=value;
      if(index===0) option.selected=true;
      select.appendChild(option);
    });
    input.replaceWith(select);
  }

  function start(){
    fix();
    const target=document.getElementById('authContent');
    if(!target) return;
    new MutationObserver(fix).observe(target,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
