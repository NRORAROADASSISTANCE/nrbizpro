// NR BizPro Smart Print — target/output preview
(function(){
  'use strict';
  function read(file){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(r.result)};r.onerror=reject;r.readAsDataURL(file)})}
  function processed(){return Array.isArray(window.__NR_SMART_PRINT_PROCESSED_PAGES)?window.__NR_SMART_PRINT_PROCESSED_PAGES:[]}
  window.previewPrint=function(){
    var input=document.getElementById('fileInput'),body=document.getElementById('previewBody'),modal=document.getElementById('preview');
    if(!input||!body||!modal){alert('Preview window is unavailable. Please refresh the page.');return}
    var files=Array.from(input.files||[]);if(!files.length){alert('Upload a WhatsApp image or PDF first.');return}
    if(typeof window.canPrint==='function'&&!window.canPrint())return;
    var copies=Math.max(1,Number(document.getElementById('copies')?.value)||1),active=document.querySelector('.types button.active'),type=active?.dataset.type||'document';
    var ready=processed();
    var imageFiles=files.filter(function(f){return /^image\//i.test(f.type)});
    if(ready.length){
      body.innerHTML='<div class="ai-badge">✓ TARGET PRINT OUTPUT — cleaned and print-ready. Original upload remains unchanged.</div>'+ready.map(function(src,i){return '<div class="preview-sheet target-sheet"><div class="target-label">A4 PRINT TARGET • '+(type==='passport'?'Passport Photo':type==='id'?'ID Card':'Document')+' • Page '+(i+1)+(ready.length>1?' of '+ready.length:'')+' • '+copies+' copy/copies</div><div class="target-content"><img src="'+src+'" alt="A4 target output page '+(i+1)+'"></div></div>'}).join('');
      modal.classList.remove('hidden');return;
    }
    var pdf=files.find(function(f){return f.type==='application/pdf'||/\.pdf$/i.test(f.name)});
    if(pdf){body.innerHTML='<div class="ai-badge">✓ TARGET PRINT OUTPUT — PDF page ready for printing.</div><div class="preview-sheet target-sheet"><div class="target-label">A4 PRINT TARGET • PDF</div><div class="target-content"><iframe title="PDF Target Preview" src="'+URL.createObjectURL(pdf)+'" style="width:100%;height:70vh;border:0"></iframe></div></div>';modal.classList.remove('hidden');return}
    if(!imageFiles.length){alert('This file type cannot be previewed. Please upload an image or PDF.');return}
    body.innerHTML='<div class="ai-badge">✓ TARGET PRINT OUTPUT — preparing uploaded image.</div><div id="directPreviewPages"></div>';modal.classList.remove('hidden');
    var target=document.getElementById('directPreviewPages');Promise.all(imageFiles.map(read)).then(function(pages){target.innerHTML=pages.map(function(src,i){return '<div class="preview-sheet target-sheet"><div class="target-label">A4 PRINT TARGET • '+(type==='passport'?'Passport Photo':type==='id'?'ID Card':'Document')+' • Page '+(i+1)+' • '+copies+' copy/copies</div><div class="target-content"><img src="'+src+'" alt="A4 target output page '+(i+1)+'"></div></div>'}).join('')}).catch(function(e){console.error(e);alert('Preview failed. Please select the file again.')});
  };
  function hook(){var buttons=document.querySelectorAll('.actions button');buttons.forEach(function(btn){if(/Scanner Preview/i.test(btn.textContent||'')&&!btn.dataset.directHook){btn.dataset.directHook='1';btn.onclick=function(ev){ev.preventDefault();ev.stopImmediatePropagation();window.previewPrint();return false;}}})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();[100,500,1200,2500].forEach(function(ms){setTimeout(hook,ms)});
})();
