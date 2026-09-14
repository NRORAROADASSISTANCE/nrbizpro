// NR BizPro Smart Print — non-blocking preview guard
(function(){
  'use strict';
  var busy=false;
  function esc(s){return String(s||'').replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]})}
  function show(body){var modal=document.getElementById('preview'),box=document.getElementById('previewBody');if(!modal||!box)return;box.innerHTML=body;modal.classList.remove('hidden')}
  function file(){var input=document.getElementById('fileInput');return input&&input.files&&input.files[0]||null}
  function fastImage(f){return new Promise(function(resolve,reject){var r=new FileReader();r.onerror=reject;r.onload=function(){var im=new Image();im.onerror=reject;im.onload=function(){var s=Math.min(1,1400/im.naturalWidth,1900/im.naturalHeight),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*s));c.height=Math.max(1,Math.round(im.naturalHeight*s));var x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.filter='brightness(1.12) contrast(1.08) saturate(.96)';x.drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.94))};im.src=r.result};r.readAsDataURL(f)})}
  function render(){
    var f=file();if(!f){alert('Upload a WhatsApp image or PDF first.');return}
    var copies=Math.max(1,+(document.getElementById('copies')||{}).value||1);
    var pages=window.processedPages;
    if(Array.isArray(pages)&&pages.length){show('<div class="ai-badge">✓ Smart Xerox target ready — cleaned preview.</div>'+pages.map(function(p,i){return '<div class="preview-sheet"><p><b>Document • Page '+(i+1)+(pages.length>1?' of '+pages.length:'')+' • '+copies+' copy/copies</b></p><img src="'+p+'" alt="Smart Print target preview" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));return}
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
      var sp=window.sourcePages;if(Array.isArray(sp)&&sp.length){show('<div class="ai-badge">✓ PDF print-ready page preview.</div>'+sp.map(function(p,i){return '<div class="preview-sheet"><p><b>Document • Page '+(i+1)+' • '+copies+' copy/copies</b></p><img src="'+p+'" alt="PDF preview" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));return}
      show('<div class="warn">PDF is still preparing. Please wait for the page count message, then click Preview again.</div>');return
    }
    show('<div class="ai-badge">✓ Preparing fast Smart Xerox target…</div>');
    fastImage(f).then(function(url){show('<div class="ai-badge">✓ Smart Xerox Preview — fast target view.</div><div class="preview-sheet"><p><b>Document • 1 page • '+copies+' copy/copies</b></p><img src="'+url+'" alt="Smart Print target preview" style="max-width:100%;height:auto;display:block;margin:auto"></div>')}).catch(function(){show('<div class="warn">Preview could not read the selected file. Please upload it again.</div>')});
  }
  window.previewPrint=function(){if(busy)return;busy=true;try{render()}catch(e){console.error('Smart Print preview guard',e)}finally{busy=false}};
})();
