// Product / vehicle edit controls for the business-specific product module.
(function(){
  function edit(id){
    const item=window.state?.items?.find(x=>x.id===id); if(!item)return;
    const d=item.details||{};
    const keys=Object.keys(d);
    const fields=keys.length?keys:["Product / Service","Barcode","Selling Price","GST %","Opening Stock"];
    const html=`<div class="modal-grid">${fields.map((k,i)=>`<label class="field">${k}<input id="editField${i}" value="${esc(d[k]??(k==='Barcode'?item.barcode:k==='Selling Price'?item.sell:k==='GST %'?item.gst:k==='Opening Stock'?item.stock:item.name))}"></label>`).join('')}</div><div class="modal-actions"><button class="secondary" type="button" onclick="closeModal()">Cancel</button><button class="primary" type="button" id="saveEditedItem">Save Changes</button></div>`;
    openModal('Edit Product / Vehicle',html);
    document.getElementById('saveEditedItem').onclick=function(){
      fields.forEach((k,i)=>{const v=document.getElementById('editField'+i).value.trim();d[k]=v;
        if(/barcode|vin|chassis/i.test(k))item.barcode=v;
        if(/selling price|on-road price/i.test(k))item.sell=Number(v)||0;
        if(/^gst/i.test(k))item.gst=Number(v)||0;
        if(/opening stock/i.test(k))item.stock=Number(v)||0;
        if(/product name|product \/ service|item \/ service|model/i.test(k)&&v)item.name=v;
      });
      item.details=d; save(); closeModal(); renderItems(); updateStats();
    };
  }
  function render(){
    const tb=document.getElementById('itemTable'); if(!tb||!window.state)return;
    if(!state.items.length){tb.innerHTML='<tr><td colspan="8" class="empty">No products yet.</td></tr>';return;}
    tb.innerHTML=state.items.map(i=>`<tr><td><b>${esc(i.name)}</b></td><td>${esc(i.barcode||'—')}</td><td>${esc(i.type||'Product')}</td><td>${money(i.cost)}</td><td><b>${money(i.sell)}</b></td><td>${i.gst||0}%</td><td>${i.stock||0}</td><td><button class="secondary" type="button" data-edit-item="${i.id}">Edit</button> <button class="secondary" type="button" onclick="deleteItem('${i.id}')">Delete</button></td></tr>`).join('');
    tb.querySelectorAll('[data-edit-item]').forEach(b=>b.addEventListener('click',()=>edit(b.dataset.editItem)));
  }
  window.renderItems=render; window.editBusinessItem=edit;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render); else render();
  window.addEventListener('load',render);
})();
