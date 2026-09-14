/* NR BizPro Smart Print — TARGET SHADOW REMOVAL v2
   Removes a real left-side camera shadow using a smooth illumination map.
   Text, stamps, signatures and photos are protected by luminance/saturation weighting. */
(function(){
  'use strict';
  function show(html){var m=document.getElementById('preview'),b=document.getElementById('previewBody');if(!m||!b)return;b.innerHTML=html;m.classList.remove('hidden')}
  function file(){var i=document.getElementById('fileInput');return i&&i.files&&i.files[0]}
  function read(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=rej;r.readAsDataURL(f)})}
  function image(src){return new Promise(function(res,rej){var i=new Image();i.onload=function(){res(i)};i.onerror=rej;i.src=src})}
  function raf(){return new Promise(function(r){requestAnimationFrame(r)})}
  function lum(r,g,b){return .2126*r+.7152*g+.0722*b}

  async function removeShadow(src){
    var im=await image(src),mw=1800,mh=2400,s=Math.min(1,mw/im.naturalWidth,mh/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
    var c=document.createElement('canvas');c.width=w;c.height=h;
    var x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,w,h);

    /* Build a tiny illumination map. Right side is used as the clean-paper reference,
       while the left side is measured separately so a real camera shadow is detected. */
    var tw=96,th=128,t=document.createElement('canvas');t.width=tw;t.height=th;
    var tx=t.getContext('2d',{willReadFrequently:true});tx.drawImage(c,0,0,tw,th);
    var td=tx.getImageData(0,0,tw,th).data;
    var rowRef=new Float32Array(th), rowLeft=new Float32Array(th);
    for(var y=0;y<th;y++){
      var right=[],left=[];
      for(var xx=0;xx<tw;xx++){
        var ii=(y*tw+xx)*4,r=td[ii],g=td[ii+1],b=td[ii+2],l=lum(r,g,b),mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?((mx-mn)/mx):0;
        if(sat<.30 && l>105){
          if(xx>=Math.floor(tw*.58))right.push(l);
          if(xx<=Math.floor(tw*.38))left.push(l);
        }
      }
      right.sort(function(a,b){return a-b});left.sort(function(a,b){return a-b});
      rowRef[y]=right.length?right[Math.floor(right.length*.62)]:205;
      rowLeft[y]=left.length?left[Math.floor(left.length*.58)]:rowRef[y];
    }
    function interp(arr,z){z=Math.max(0,Math.min(th-1,z));var a=Math.floor(z),b=Math.min(th-1,a+1),q=z-a;return arr[a]*(1-q)+arr[b]*q}

    var d=x.getImageData(0,0,w,h),p=d.data;
    for(var yy=0;yy<h;yy++){
      var py=yy*(th-1)/Math.max(1,h-1),ref=interp(rowRef,py),leftRef=interp(rowLeft,py);
      /* Shadow strength is based on measured left-vs-right paper brightness. */
      var ratio=Math.max(1,Math.min(1.48,ref/Math.max(115,leftRef)));
      for(var xx=0;xx<w;xx++){
        var i=(yy*w+xx)*4,r=p[i],g=p[i+1],b=p[i+2],l=lum(r,g,b),mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?((mx-mn)/mx):0;
        var xf=xx/Math.max(1,w-1);
        /* Strongest at the left edge, fades naturally by ~72% of page width. */
        var zone=Math.max(0,Math.min(1,(.72-xf)/.72));zone=zone*zone*(3-2*zone);
        /* Correct only pixels that look like paper; preserve dark ink and saturated artwork. */
        var paper=l<55?0.015:l<85?0.10:l<120?0.34:l<160?0.68:l<195?0.88:0.96;
        var colourProtect=sat>.42?0.38:(sat>.28?.62:1);
        var gain=1+(ratio-1)*zone*paper*colourProtect;
        /* Never crush highlights or push channels beyond natural range. */
        r=Math.min(255,r*gain);g=Math.min(255,g*gain);b=Math.min(255,b*gain);
        p[i]=Math.max(0,Math.min(255,r));p[i+1]=Math.max(0,Math.min(255,g));p[i+2]=Math.max(0,Math.min(255,b));
      }
      if(yy%12===0)await raf();
    }
    x.putImageData(d,0,0);
    await raf();
    return c.toDataURL('image/jpeg',.97)
  }

  async function preview(){
    var f=file();if(!f){alert('Upload a WhatsApp image or PDF first.');return}
    var copies=Math.max(1,+(document.getElementById('copies')||{}).value||1);
    show('<div style="padding:22px;text-align:center"><b>Preparing Smart Xerox Target…</b><br><small>Detecting and removing the camera shadow from the left side while protecting the original document.</small></div>');
    try{
      if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
        var pages=window.sourcePages||[];if(!pages.length){alert('PDF is still loading. Please try Preview again.');return}
        show('<div class="ai-badge">✓ Smart Xerox Target — PDF page preserved safely.</div>'+pages.map(function(p,i){return '<div class="preview-sheet"><p><b>Document • Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));window.__nrSmartPrintTargetPages=pages;return
      }
      var raw=await read(f),url=await removeShadow(raw);
      show('<div class="ai-badge">✓ Smart Xerox Target — left camera shadow removed with adaptive paper correction; text, stamps, signatures and colours protected.</div><div class="preview-sheet"><p><b>Document • 1 page • '+copies+' copy/copies</b></p><img id="nrTargetPreview" src="'+url+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>');
      window.__nrSmartPrintTargetPages=[url];
    }catch(e){console.error(e);show('<div class="warn">Preview could not be prepared. The original file is unchanged — please try Preview again.</div>')}
  }
  function install(){
    if(window.__nrAdaptiveTargetInstalled)return;window.__nrAdaptiveTargetInstalled=true;
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