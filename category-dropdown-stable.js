// NR BizPro — replace native signup category select with a non-jumping custom dropdown.
(function(){
  const styleId='nrStableCategoryStyle';
  function addStyle(){
    if(document.getElementById(styleId))return;
    const s=document.createElement('style');s.id=styleId;
    s.textContent=`.nr-category-wrap{position:relative;margin-top:7px}.nr-category-btn{width:100%;box-sizing:border-box;border:1px solid #cbd7e8;border-radius:9px;padding:11px 12px;background:#fff;color:#10233f;font-size:14px;text-align:left;cursor:pointer;display:flex;justify-content:space-between;align-items:center}.nr-category-btn:focus{outline:2px solid #dbe8ff;border-color:#1559d6}.nr-category-menu{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:10000;background:#fff;border:1px solid #cbd7e8;border-radius:9px;box-shadow:0 12px 28px rgba(25,64,120,.16);max-height:260px;overflow:auto;padding:5px}.nr-category-option{display:block;width:100%;border:0;background:#fff;color:#10233f;text-align:left;padding:9px 10px;border-radius:6px;cursor:pointer;font-size:14px}.nr-category-option:hover,.nr-category-option:focus{background:#eef5ff}.nr-category-option.selected{font-weight:800}`;
    document.head.appendChild(s);
  }
  function replace(){
    const select=document.getElementById('suCategory');
    if(!select||select.tagName!=='SELECT'||select.dataset.stableDropdown==='1')return;
    addStyle();
    select.dataset.stableDropdown='1';
    const wrap=document.createElement('div');wrap.className='nr-category-wrap';
    const hidden=document.createElement('input');hidden.type='hidden';hidden.id='suCategory';hidden.name='businessCategory';hidden.required=true;hidden.value=select.value||'';
    const btn=document.createElement('button');btn.type='button';btn.className='nr-category-btn';btn.setAttribute('aria-haspopup','listbox');btn.setAttribute('aria-expanded','false');
    const label=document.createElement('span');label.textContent=select.options[select.selectedIndex]?.text||'Select Business Category';
    const arrow=document.createElement('span');arrow.textContent='▾';arrow.setAttribute('aria-hidden','true');btn.append(label,arrow);
    const menu=document.createElement('div');menu.className='nr-category-menu';menu.hidden=true;menu.setAttribute('role','listbox');
    Array.from(select.options).forEach((opt,i)=>{
      const item=document.createElement('button');item.type='button';item.className='nr-category-option'+(i===select.selectedIndex?' selected':'');item.textContent=opt.text;item.dataset.value=opt.value;item.setAttribute('role','option');
      item.onclick=()=>{hidden.value=opt.value;label.textContent=opt.text;menu.hidden=true;btn.setAttribute('aria-expanded','false');menu.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));item.classList.add('selected');};
      menu.appendChild(item);
    });
    btn.onclick=()=>{menu.hidden=!menu.hidden;btn.setAttribute('aria-expanded',String(!menu.hidden));};
    document.addEventListener('click',e=>{if(!wrap.contains(e.target)){menu.hidden=true;btn.setAttribute('aria-expanded','false')}});
    wrap.append(btn,menu,hidden);select.replaceWith(wrap);
  }
  function watch(){
    replace();
    const root=document.getElementById('authContent');if(!root||root.__nrStableCategory)return;
    const observer=new MutationObserver(replace);observer.observe(root,{childList:true,subtree:true});root.__nrStableCategory=observer;
  }
  window.addEventListener('load',watch);window.addEventListener('authReady',watch);setTimeout(watch,50);setTimeout(watch,300);setTimeout(watch,1000);
})();
