// NR BizPro — isolate products/services by the logged-in business category
(function(){'use strict';
 const norm=v=>{const c=String(v||'').toLowerCase();if(/ev|electric/.test(c))return'ev';if(/paint/.test(c))return'paint';if(/plumb|pipe/.test(c))return'plumbing';if(/medical|pharmacy|chemist|drug/.test(c))return'medical';if(/garage|service center/.test(c))return'garage';if(/electronic|mobile/.test(c))return'electronics';if(/furniture/.test(c))return'furniture';if(/jewel/.test(c))return'jewellery';if(/clothing|fashion|garment/.test(c))return'clothing';if(/stationery|book/.test(c))return'stationery';if(/footwear|shoe|chappal|slipper/.test(c))return'footwear';if(/fertil|agri/.test(c))return'fertilizer';if(/spare/.test(c))return'spareparts';if(/grocery|general store|retail|supermarket/.test(c))return'retail';if(/restaurant|bakery/.test(c))return'restaurant';if(/hardware|building|construction/.test(c))return'hardware';if(/dairy|milk/.test(c))return'dairy';if(/salon|beauty/.test(c))return'salon';if(/printing|xerox|online/.test(c))return'printing';return'general'};
 function currentCategory(){return norm(window.currentUser?.category||window.state?.settings?.category||'General Business')}
 function matches(i){const cat=currentCategory();if(cat==='general')return true;const raw=String(i?.businessCategory||i?.businessType||i?.industry||'').toLowerCase();if(raw){return norm(raw)===cat||raw.includes(cat)||({ev:/ev|electric/,paint:/paint/,plumbing:/plumb|pipe/,medical:/medical|pharmacy|chemist|drug/,garage:/garage|service center/}[cat]?.test(raw)||false)}
  // Legacy untagged records: hide obvious category-specific sample data from another business.
  const text=String(i?.name||'').toLowerCase();
  if(cat==='ev'&&/paint|birla|asian paints|berger|dulux|putty|primer/.test(text))return false;
  if(cat==='paint'&&/ev|electric|scooter|motorcycle|battery pack|charger/.test(text))return false;
  return true;
 }
 function visible(){return Array.isArray(window.state?.items)?window.state.items.filter(matches):[]}
 window.NRBizProBusinessDataIsolation={normalizeCategory:norm,matches,visible};
 window.visibleItems=visible;
 const oldRenderItems=window.renderItems;
 window.renderItems=function(){const tb=document.getElementById('itemTable');if(!tb)return;const items=visible();if(!items.length){tb.innerHTML='<tr><td colspan="8" class="empty">No products for this business yet.</td></tr>';return}tb.innerHTML=items.map(i=>`<tr><td><b>${window.esc?.(i.name)||i.name}</b></td><td>${window.esc?.(i.barcode||'—')||i.barcode||'—'}</td><td>${i.type||'Product'}</td><td>${window.money?.(i.cost)||'₹0'}</td><td><b>${window.money?.(i.sell)||'₹0'}</b></td><td>${i.gst||0}%</td><td>${i.stock||0}</td><td><button class="secondary" onclick="deleteItem('${i.id}')">Delete</button></td></tr>`).join('')};
 const oldStats=window.updateStats;
 window.updateStats=function(){if(typeof oldStats==='function')oldStats();const el=document.getElementById('itemCount');if(el)el.textContent=String(visible().length)};
 setTimeout(()=>{window.renderItems?.();window.updateStats?.()},0);
 window.addEventListener('authReady',()=>setTimeout(()=>{window.renderItems?.();window.updateStats?.()},0));
 window.addEventListener('loginSuccess',()=>setTimeout(()=>{window.renderItems?.();window.updateStats?.()},0));
})();
