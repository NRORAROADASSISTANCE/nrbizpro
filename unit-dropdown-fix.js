// NR BizPro — stable unit + bill product helpers
(function(){
  'use strict';
  const UNITS=['pcs','kg','g','ltr','ml','pack','box','set','pair','dozen','meter','cm','sq.ft','sq.m','ton','bag','bottle','piece','service'];
  const getState=()=>window.state||null;
  const esc=v=>typeof window.esc==='function'?window.esc(v):String(v??'');
  const money=v=>typeof window.money==='function'?window.money(v):'₹'+(Number(v)||0).toFixed(2);
  const getUnit=i=>String(i?.unit||'pcs');

  function ensureUnits(){
    const s=getState(); if(!s||!Array.isArray(s.items))return;
    let changed=false;
    s.items.forEach(i=>{if(!i.unit){i.unit='pcs';changed=true;}});
    if(changed&&typeof window.save==='function')window.save();
  }

  function addBillItem(id){
    const s=getState(),item=(s?.items||[]).find(x=>String(x.id)===String(id));
    if(!item)return;
    window.billCart=Array.isArray(window.billCart)?window.billCart:[];
    const line=window.billCart.find(x=>String(x.id)===String(item.id));
    if(line)line.qty=Number(line.qty||0)+1;else window.billCart.push({id:item.id,qty:1});
    const input=document.getElementById('bSearch')||document.getElementById('nbSearch')||document.getElementById('bSearchFinal');
    const box=document.getElementById('billSuggestions')||document.getElementById('nbSuggestions')||document.getElementById('billSuggestionsFinal');
    if(input)input.value='';if(box)box.innerHTML='';
    if(typeof window.renderCart==='function')window.renderCart();
    input?.focus();
  }
  window.NRBizProAddBillItem=addBillItem;

  function search(){
    const s=getState(),input=document.getElementById('bSearch')||document.getElementById('nbSearch')||document.getElementById('bSearchFinal'),box=document.getElementById('billSuggestions')||document.getElementById('nbSuggestions')||document.getElementById('billSuggestionsFinal');
    if(!input||!box)return;
    const q=input.value.trim().toLowerCase();
    if(!q){box.innerHTML='';return;}
    const found=(s?.items||[]).filter(i=>String(i.name||'').toLowerCase().includes(q)||String(i.barcode||'').toLowerCase()===q).slice(0,10);
    box.innerHTML=found.map(i=>'<button type="button" class="suggestion" data-unit-id="'+esc(i.id)+'"><b>'+esc(i.name)+'</b><span>'+esc(i.barcode||'No barcode')+' • '+money(i.sell)+' • '+esc(getUnit(i))+' • Stock '+esc(i.stock||0)+'</span></button>').join('')||'<div class="empty">No product found</div>';
    box.querySelectorAll('[data-unit-id]').forEach(btn=>btn.onclick=e=>{e.preventDefault();addBillItem(btn.dataset.unitId);});
  }
  window.searchBillProducts=search;

  function bind(){
    const input=document.getElementById('bSearch')||document.getElementById('nbSearch')||document.getElementById('bSearchFinal');
    if(!input||input.dataset.unitSearchBound==='1')return;
    input.dataset.unitSearchBound='1';
    input.addEventListener('input',search);
    input.addEventListener('keydown',e=>{
      if(e.key!=='Enter')return;
      e.preventDefault();
      const q=input.value.trim().toLowerCase(),s=getState(),i=(s?.items||[]).find(x=>String(x.barcode||'').toLowerCase()===q);
      if(i)addBillItem(i.id);
    });
  }
  function install(){
    ensureUnits();bind();
    if(typeof window.renderCart==='function')window.renderCart();
  }
  window.addEventListener('load',()=>setTimeout(install,500));
  window.addEventListener('authReady',()=>setTimeout(install,100));
  window.addEventListener('loginSuccess',()=>setTimeout(install,100));
})();
