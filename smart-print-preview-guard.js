// NR BizPro Smart Print — guaranteed preview guard
(function(){
  'use strict';
  var originalPreview=window.previewPrint;
  var busy=false;
  function esc(s){return String(s||'').replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]})}
  function show(body){var modal=document.getElementById('preview'),box=document.getElementById('previewBody');if(!modal||!box)return;box.innerHTML=body;modal.classList.remove('hidden')}
  function directSource(){
    var input=document.getElementById('fileInput'),f=input&&input.files&&input.files[0];
    if(!f)return null;
    return new Promise(function(resolve,reject){
      if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){resolve('<div class="ai-badge">✓ PDF uploaded. Preview is being prepared.</div><div style="padding:28px;text-align:center"><b>'+esc(f.name)+'</b><br><small>Use Confirm & Print after the print-ready preview appears.</small></div>');return;}
      var r=new FileReader();r.onload=function(){resolve('<div class="ai-badge">✓ Preview ready — uploaded content shown safely.</div><div class="preview-sheet"><p><b>Document • 1 page • 1 copy</b></p><img src="'+r.result+'" alt="Preview" style="max-width:100%;height:auto;display:block;margin:auto"></div>')};r.onerror=reject;r.readAsDataURL(f)
    })
  }
  window.previewPrint=function(){
    if(busy)return;
    busy=true;
    var finished=false;
    show('<div style="padding:30px;text-align:center"><b>Preparing Print Preview…</b><br><small>Please wait.</small></div>');
    var p;
    try{p=typeof originalPreview==='function'?originalPreview():Promise.reject(new Error('preview function unavailable'))}catch(e){p=Promise.reject(e)}
    Promise.resolve(p).then(function(){finished=true}).catch(function(e){console.error('Smart Print preview',e)}).finally(function(){busy=false});
    setTimeout(function(){
      if(finished)return;
      directSource().then(function(html){
        var box=document.getElementById('previewBody');
        if(box&&document.getElementById('preview')&&!document.getElementById('preview').classList.contains('hidden')){
          box.innerHTML=html+'<div class="warn" style="margin-top:10px">Target processing is taking longer than expected. The uploaded page is shown so Preview never remains blank.</div>';
        }
        busy=false;
      }).catch(function(){busy=false});
    },2200);
  };
})();
