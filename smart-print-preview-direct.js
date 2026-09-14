// NR BizPro Smart Print — direct, reliable preview
(function(){
  'use strict';
  window.previewPrint = async function(){
    try{
      if(typeof window.canPrint==='function' && !window.canPrint()) return;
      const body=document.getElementById('previewBody');
      const modal=document.getElementById('preview');
      if(!body || !modal){ alert('Preview window is unavailable. Please refresh the page.'); return; }
      const pages=Array.isArray(window.__NR_SMART_PRINT_SOURCE_PAGES)?window.__NR_SMART_PRINT_SOURCE_PAGES:[];
      if(!pages.length){ alert('Upload a WhatsApp image or PDF first.'); return; }
      const copies=Math.max(1,Number(document.getElementById('copies')?.value)||1);
      const type=(window.__NR_SMART_PRINT_TYPE||'document');
      body.innerHTML='<div class="ai-badge">✓ Print Preview — original uploaded content shown safely.</div>'+pages.map(function(src,i){
        return '<div class="preview-sheet"><p><b>'+(type==='passport'?'Passport Photo':type==='id'?'ID Card':'Document')+' • Page '+(i+1)+(pages.length>1?' of '+pages.length:'')+' • '+copies+' copy/copies</b></p><img src="'+src+'" alt="Print preview page '+(i+1)+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>';
      }).join('');
      modal.classList.remove('hidden');
    }catch(err){ console.error('Direct preview error',err); alert('Preview failed. Please upload the file again.'); }
  };
  function hook(){
    const input=document.getElementById('fileInput');
    if(input && !input.dataset.directPreview){
      input.dataset.directPreview='1';
      input.addEventListener('change',function(){
        setTimeout(function(){
          try{
            const imgs=[];
            if(Array.isArray(window.__NR_SMART_PRINT_SOURCE_PAGES)) window.__NR_SMART_PRINT_SOURCE_PAGES=[];
            const files=Array.from(input.files||[]);
            files.forEach(function(file){
              if(file.type && file.type.indexOf('image/')===0){
                const r=new FileReader(); r.onload=function(){
                  window.__NR_SMART_PRINT_SOURCE_PAGES=window.__NR_SMART_PRINT_SOURCE_PAGES||[];
                  window.__NR_SMART_PRINT_SOURCE_PAGES.push(r.result);
                }; r.readAsDataURL(file);
              }
            });
            window.__NR_SMART_PRINT_TYPE=document.querySelector('.types button.active')?.dataset.type||'document';
          }catch(e){console.error(e)}
        },50);
      });
    }
    const oldLoad=window.loadPhoto;
    if(typeof oldLoad==='function' && !oldLoad.__directPreviewWrapped){
      const wrapped=function(e){
        try{
          const files=Array.from(e?.target?.files||[]);
          window.__NR_SMART_PRINT_SOURCE_PAGES=[];
          window.__NR_SMART_PRINT_TYPE=document.querySelector('.types button.active')?.dataset.type||'document';
          files.forEach(function(file){
            if(file.type && file.type.indexOf('image/')===0){
              const r=new FileReader();r.onload=function(){window.__NR_SMART_PRINT_SOURCE_PAGES.push(r.result)};r.readAsDataURL(file);
            }
          });
        }catch(e2){console.error(e2)}
        return oldLoad.apply(this,arguments);
      };
      wrapped.__directPreviewWrapped=true;
      window.loadPhoto=wrapped;
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',hook); else hook();
  [300,1000,2000].forEach(function(ms){setTimeout(hook,ms)});
})();
