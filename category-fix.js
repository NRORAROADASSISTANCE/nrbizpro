// Business Category — stable native select, no MutationObserver and no DOM replacement.
(function(){
 const categories=['General Business','Grocery / General Store','Footwear / Chappal Shop','Fertilizer / Agriculture','Garage / Service Center','Spare Parts','EV Two-Wheeler Showroom','Retail / Supermarket','Restaurant / Bakery','Hardware / Building Materials','Medical / Pharmacy','Electronics / Mobile','Clothing / Fashion','Furniture','Jewellery','Stationery / Book Store','Dairy / Milk Products','Salon / Beauty Parlour','Printing / Xerox / Online Services','Wholesale / Distributor','Professional Services','Construction / Building Materials','Paint Shop','Plumbing Business','Paint Shop + Plumbing Business','Other Business'];
 function makeSelect(){
   const old=document.getElementById('suCategory');
   if(!old || old.tagName==='SELECT') return;
   const s=document.createElement('select'); s.id='suCategory'; s.name='businessCategory'; s.required=true;
   categories.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;s.appendChild(o)});
   if(categories.includes(old.value))s.value=old.value;
   old.replaceWith(s);
 }
 function start(){
   makeSelect();
   // Do not observe authContent: observing/replacing the field was the source of the jump.
   ['product-choice.js','service-separation.js','clothing-module.js','electronics-module.js','furniture-module.js','jewellery-module.js','stationery-module.js','dairy-module.js','salon-module.js','printing-module.js','wholesale-module.js','professional-services-module.js','construction-module.js','business-settings-lock.js?v=20260905-03'].forEach(src=>{const s=document.createElement('script');s.src=src;document.body.appendChild(s)});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();