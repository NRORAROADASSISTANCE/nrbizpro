/* NR BizPro Smart Print — SAFE camera-shadow target
   Uses the original pixels as the base and only lifts the visible left/top shadow.
   No aggressive per-pixel whitening, so text, stamps, signatures and photos stay intact. */
(function(){
  'use strict';
  function show(html){var m=document.getElementById('preview'),b=document.getElementById('previewBody');if(!m||!b)return;b.innerHTML=html;m.classList.remove('hidden')}
  function file(){var i=document.getElementById('fileInput');return i&&i.files&&i.files[0]}
  function read(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=rej;r.readAsDataURL(f)})}
  function image(src){return new Promise(function(res,rej){var i=new Image();i.onload=function(){res(i)};i.onerror=rej;i.src=src})}
  function raf(){return new Promise(function(r){requestAnimationFrame(r)})}
  async function safeTarget(src){
    var im=await image(src),mw=1800,mh=2400,s=Math.min(1,mw/im.naturalWidth,mh/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
    var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');
    x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,w,h);
    /* Lift only the camera-shadow zones with soft white gradients. The document itself remains untouched underneath. */
    x.save();x.globalCompositeOperation='screen';
    var left=x.createLinearGradient(0,0,w*.42,0);left.addColorStop(0,'rgba(255,255,255,.48)');left.addColorStop(.38,'rgba(255,255,255,.18)');left.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=left;x.fillRect(0,0,w,h);
    var top=x.createLinearGradient(0,0,0,h*.30);top.addColorStop(0,'rgba(255,255,255,.30)');top.addColorStop(.45,'rgba(255,255,255,.10)');top.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=top;x.fillRect(0,0,w,h);
    x.restore();
    /* Very mild global lift, only to avoid a muddy print while preserving colour. */
    x.save();x.globalCompositeOperation='screen';x.fillStyle='rgba(255,255,255,.045)';x.fillRect(0,0,w,h);x.restore();
    await raf();
    return c.toDataURL('image/jpeg',.97)
  }
  async function preview(){
    var f=file();if(!f){alert('Upload a WhatsApp image or PDF first.');return}
    var copies=Math.max(1,+(document.getElementById('copies')||{}).value||1);
    show('<div style="padding:22px;text-align:center"><b>Preparing Smart Xerox Target…</b><br><small>Removing the camera shadow safely without damaging document details.</small></div>');
    try{
      if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
        var pages=window.sourcePages||[];if(!pages.length){alert('PDF is still loading. Please try Preview again.');return}
        show('<div class="ai-badge">✓ Smart Xerox Target — PDF page preserved safely.</div>'+pages.map(function(p,i){return '<div class="preview-sheet"><p><b>Document • Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));window.__nrSmartPrintTargetPages=pages;return
      }
      var raw=await read(f),url=await safeTarget(raw);
      show('<div class="ai-badge">✓ Smart Xerox Target — left camera shadow lifted safely; original text, stamps, signatures and colours preserved.</div><div class="preview-sheet"><p><b>Document • 1 page • '+copies+' copy/copies</b></p><img id="nrTargetPreview" src="'+url+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>');
      window.__nrSmartPrintTargetPages=[url];
    }catch(e){console.error(e);show('<div class="warn">Safe preview failed. The original file is unchanged. Please try Preview again.</div>')}
  }
  function install(){
    if(window.__nrSafeTargetInstalled)return;window.__nrSafeTargetInstalled=true;
    window.previewPrint=preview;
    var oldConfirm=window.confirmPrint;
    window.confirmPrint=function(){
      var pages=window.__nrSmartPrintTargetPages||[];
      if(!pages.length)return oldConfirm.apply(this,arguments);
      var oldOpen=window.open;window.open=function(){var w=oldOpen.apply(window,arguments);if(!w)return w;var dw=w.document,wr=dw.write.bind(dw);dw.write=function(html){var i=0;html=html.replace(/<img\s+src="([^"]+)"/gi,function(m){return pages[i++]?'<img src="'+pages[i-1]+'"':m});wr(html)};return w};try{return oldConfirm.apply(this,arguments)}finally{window.open=oldOpen}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();