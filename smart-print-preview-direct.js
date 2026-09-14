// NR BizPro Smart Print — direct preview that reads the selected file at click time
(function(){
  'use strict';
  function read(file){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(r.result)};r.onerror=reject;r.readAsDataURL(file)})}
  window.previewPrint=function(){
    var input=document.getElementById('fileInput'),body=document.getElementById('previewBody'),modal=document.getElementById('preview');
    if(!input||!body||!modal){alert('Preview window is unavailable. Please refresh the page.');return}
    var files=Array.from(input.files||[]);
    if(!files.length){alert('Upload a WhatsApp image or PDF first.');return}
    var copies=Math.max(1,Number(document.getElementById('copies')?.value)||1);
    var active=document.querySelector('.types button.active');
    var type=active?.dataset.type||'document';
    var imageFiles=files.filter(function(f){return /^image\//i.test(f.type)});
    if(!imageFiles.length){
      var pdf=files.find(function(f){return f.type==='application/pdf'||/\.pdf$/i.test(f.name)});
      if(pdf){body.innerHTML='<div class="ai-badge">✓ PDF Preview</div><div class="preview-sheet" style="width:100%;min-height:0;padding:12px"><iframe title="PDF Preview" src="'+URL.createObjectURL(pdf)+'" style="width:100%;height:70vh;border:1px solid #ddd;border-radius:8px"></iframe></div>';modal.classList.remove('hidden');return}
      alert('This file type cannot be previewed. Please upload an image or PDF.');return
    }
    body.innerHTML='<div class="ai-badge">✓ Print Preview — uploaded content shown safely.</div><div id="directPreviewPages"></div>';
    modal.classList.remove('hidden');
    var target=document.getElementById('directPreviewPages');
    Promise.all(imageFiles.map(read)).then(function(pages){
      target.innerHTML=pages.map(function(src,i){return '<div class="preview-sheet"><p><b>'+(type==='passport'?'Passport Photo':type==='id'?'ID Card':'Document')+' • Page '+(i+1)+(pages.length>1?' of '+pages.length:'')+' • '+copies+' copy/copies</b></p><img src="'+src+'" alt="Print preview page '+(i+1)+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join('');
    }).catch(function(e){console.error('Direct preview read error',e);alert('Preview failed. Please select the file again.');});
  };
  // Also replace the inline button handler so it cannot be shadowed by an older script.
  function hook(){
    var buttons=document.querySelectorAll('.actions button');
    buttons.forEach(function(btn){if(/Scanner Preview/i.test(btn.textContent||'')&&!btn.dataset.directHook){btn.dataset.directHook='1';btn.onclick=function(ev){ev.preventDefault();ev.stopImmediatePropagation();window.previewPrint();return false;};}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hook);else hook();
  [100,500,1200,2500].forEach(function(ms){setTimeout(hook,ms)});
})();
