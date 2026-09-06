// NR BizPro — final product save/category stability fix
(function(){
  'use strict';

  function syncState(){
    try{
      if((typeof state==='undefined'||!state) && window.state) state=window.state;
    }catch(e){}
    try{
      if((typeof currentUser==='undefined'||!currentUser) && window.currentUser) currentUser=window.currentUser;
    }catch(e){}
    let st=null;
    try{if(typeof state!=='undefined'&&state)st=state}catch(e){}
    if(!st)st=window.state||null;
    if(!st){
      let u=null;try{u=(typeof currentUser!=='undefined'&&currentUser)?currentUser:window.currentUser}catch(e){}
      if(u?.id){try{st=JSON.parse(localStorage.getItem('nr-bizpro-data-v2:'+u.id)||'null')}catch(e){}}
    }
    if(!st)st={};
    st.items=Array.isArray(st.items)?st.items:[];
    st.bills=Array.isArray(st.bills)?st.bills:[];
    st.customers=Array.isArray(st.customers)?st.customers:[];
    st.settings=st.settings&&typeof st.settings==='object'?st.settings:{};
    st.moduleData=st.moduleData&&typeof st.moduleData==='object'?st.moduleData:{};
    if(!Array.isArray(st.moduleData['Product / Vehicle Records']))st.moduleData['Product / Vehicle Records']=[];
    try{state=st}catch(e){}
    window.state=st;
    return st;
  }

  function saveProductDirect(){
    const st=syncState();
    const labels=[...document.querySelectorAll('#modalBody label.field')];
    if(!labels.length)throw Error('Product form is not ready');
    const fields=labels.map((label,i)=>{
      const control=label.querySelector('input,select');
      const name=(label.childNodes[0]?.textContent||'Field '+(i+1)).trim();
      return {name,control,value:String(control?.value||'').trim()};
    });
    if(!fields[0].value)return alert('Enter '+fields[0].name);
    const find=words=>{const f=fields.find(x=>words.some(w=>x.name.toLowerCase().includes(w)));return f?f.value:''};
    const barcode=find(['barcode','sku']);
    if(barcode&&st.items.some(x=>String(x?.barcode||'')===barcode))return alert('Barcode / SKU already exists');
    const name=find(['product name','product / service','item name','medicine name','book / item','material name','service / product name','service name','model','part name'])||fields[0].value;
    const type=find(['product type','item type','type'])||'Product';
    const category=String((st.settings&& (st.settings.category||st.settings.businessCategory)) || window.currentUser?.category || window.currentUser?.businessCategory || 'General Business');
    const item={id:(crypto?.randomUUID?crypto.randomUUID():'item-'+Date.now()),name,barcode,type,cost:Number(find(['cost price','purchase price','wholesale price','ex-showroom price','cost / expense']))||0,sell:Number(find(['selling price','on-road price','selling price','fee / selling price']))||0,gst:Number(find(['gst']))||0,stock:Number(find(['opening stock']))||0,businessCategory:category,details:Object.fromEntries(fields.map(f=>[f.name,f.value]))};
    st.items.push(item);
    st.moduleData['Product / Vehicle Records'].push(item.details);
    let u=null;try{u=(typeof currentUser!=='undefined'&&currentUser)?currentUser:window.currentUser}catch(e){}
    if(u?.id)localStorage.setItem('nr-bizpro-data-v2:'+u.id,JSON.stringify(st));
    window.state=st;try{state=st}catch(e){}
    if(typeof closeModal==='function')closeModal();
    try{if(typeof renderItems==='function')renderItems()}catch(e){console.warn('renderItems after save',e)}
    try{if(typeof updateStats==='function')updateStats()}catch(e){console.warn('updateStats after save',e)}
  }

  function restoreUniversalOpener(){
    if(typeof window.openUniversalProductModal==='function')window.openItemModal=window.openUniversalProductModal;
  }
  function hardenSaveButton(){
    const btn=document.getElementById('universalSaveProduct');
    if(!btn)return;
    btn.disabled=false;
    btn.type='button';
    btn.onclick=function(e){e.preventDefault();e.stopPropagation();try{saveProductDirect()}catch(err){console.error(err);alert('Product save failed: '+(err?.message||'Please try again.'))}};
  }
  function stabilizeCategory(){
    const sels=[document.getElementById('demoBusinessCategory'),document.getElementById('businessCategory')].filter(Boolean);
    sels.forEach(sel=>{
      if(sel.dataset.nrStable==='1')return;
      sel.dataset.nrStable='1';
      sel.addEventListener('focus',function(){this.dataset.nrFocused='1'});
      sel.addEventListener('blur',function(){delete this.dataset.nrFocused});
    });
  }
  function repair(){restoreUniversalOpener();hardenSaveButton();stabilizeCategory();}
  document.addEventListener('click',function(e){
    const btn=e.target?.closest?.('#universalSaveProduct');
    if(btn){e.preventDefault();e.stopImmediatePropagation();try{saveProductDirect()}catch(err){console.error(err);alert('Product save failed: '+(err?.message||'Please try again.'))}}
  },true);
  document.addEventListener('change',function(e){
    if(e.target?.id==='demoBusinessCategory'||e.target?.id==='businessCategory'){setTimeout(repair,0);setTimeout(repair,100);}
  },true);
  window.addEventListener('load',()=>{repair();setTimeout(repair,500);setTimeout(repair,1500)});
  window.addEventListener('authReady',()=>setTimeout(repair,0));
  window.addEventListener('loginSuccess',()=>setTimeout(repair,0));
  setInterval(repair,2000);
})();
