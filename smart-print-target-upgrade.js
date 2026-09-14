/* NR BizPro Smart Print — single-pass safe Xerox target
   Removes camera illumination/shadow without re-processing the image twice.
   Preserves document content, stamps, signatures and photographs. */
(function(){
  'use strict';
  var busy=false;
  function raf(){return new Promise(function(r){requestAnimationFrame(r)})}
  function show(html){var m=document.getElementById('preview'),b=document.getElementById('previewBody');if(!m||!b)return;b.innerHTML=html;m.classList.remove('hidden')}
  function file(){var i=document.getElementById('fileInput');return i&&i.files&&i.files[0]}
  function read(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=rej;r.readAsDataURL(f)})}
  function image(src){return new Promise(function(res,rej){var i=new Image();i.onload=function(){res(i)};i.onerror=rej;i.src=src})}
  async function clean(src){
    var im=await image(src),mw=1800,mh=2400,s=Math.min(1,mw/im.naturalWidth,mh/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
    var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,w,h);
    var small=document.createElement('canvas'),sw=72,sh=96;small.width=sw;small.height=sh;var q=small.getContext('2d',{willReadFrequently:true});q.drawImage(c,0,0,sw,sh);var bd=q.getImageData(0,0,sw,sh).data;
    function L(i){return .2126*bd[i]+.7152*bd[i+1]+.0722*bd[i+2]}
    /* Estimate illumination from bright paper-like pixels. Never use the dark left edge as the reference. */
    var ref=new Float32Array(sh);
    for(var yy=0;yy<sh;yy++){var a=[];for(var xx=Math.floor(sw*.48);xx<sw;xx++){var ii=(yy*sw+xx)*4,l=L(ii);if(l>145)a.push(l)}a.sort(function(a,b){return a-b});ref[yy]=a.length?a[Math.floor(a.length*.72)]:220}
    function R(y){var z=y*(sh-1),y0=Math.floor(z),y1=Math.min(sh-1,y0+1),t=z-y0;return ref[y0]*(1-t)+ref[y1]*t}
    var d=x.getImageData(0,0,w,h),p=d.data;
    for(var y=0;y<h;y++){
      var rr=R(y/(h-1));
      for(var xx=0;xx<w;xx++){
        var i=(y*w+xx)*4,r=p[i],g=p[i+1],b=p[i+2],l=.2126*r+.7152*g+.0722*b;
        /* local illumination from thumbnail */
        var gx=xx*(sw-1)/(w-1),gy=y*(sh-1)/(h-1),x0=Math.floor(gx),x1=Math.min(sw-1,x0+1),y0=Math.floor(gy),y1=Math.min(sh-1,y0+1),tx=gx-x0,ty=gy-y0;
        function bl(a,b,c,e){return a*(1-e)+b*e}
        var a=bl(L((y0*sw+x0)*4),L((y0*sw+x1)*4),tx),b0=bl(L((y1*sw+x0)*4),L((y1*sw+x1)*4),tx),illum=bl(a,b0,ty);
        /* Only correct illumination; black ink is deliberately protected. */
        var desired=Math.max(190,Math.min(225,rr+5)),gain=desired/Math.max(90,illum);gain=Math.max(.96,Math.min(1.65,gain));
        var protection=l<55?0.02:l<90?0.12:l<125?0.35:l<165?0.65:0.95;
        /* Strong correction for neutral/dull shadow pixels; very little for saturated ink/colours. */
        var mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?((mx-mn)/mx):0;
        var shadow=(l<175&&sat<.24)?1:.55;
        var eg=1+(gain-1)*protection*shadow;
        r=Math.min(255,r*eg);g=Math.min(255,g*eg);b=Math.min(255,b*eg);
        /* Neutralize only bright paper cast, not certificate artwork. */
        var nl=.2126*r+.7152*g+.0722*b;
        if(nl>175&&sat<.18){var k=Math.min(.16,(nl-175)/80*.16);r=r*(1-k)+nl*k;g=g*(1-k)+nl*k;b=b*(1-k)+nl*k}
        p[i]=Math.max(0,Math.min(255,r));p[i+1]=Math.max(0,Math.min(255,g));p[i+2]=Math.max(0,Math.min(255,b));
      }
      if(y%16===0)await raf();
    }
    x.putImageData(d,0,0);return c.toDataURL('image/jpeg',.97)
  }
  async function preview(){
    var f=file();if(!f){alert('Upload a WhatsApp image or PDF first.');return}
    var copies=Math.max(1,+(document.getElementById('copies')||{}).value||1);
    show('<div style="padding:22px;text-align:center"><b>Preparing Smart Xerox Target…</b><br><small>Removing camera shadow while protecting original document details.</small></div>');
    try{
      if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
        var pages=window.sourcePages||[];show('<div class="ai-badge">✓ Smart Xerox Target — PDF page preserved without double enhancement.</div>'+pages.map(function(p,i){return '<div class="preview-sheet"><p><b>Document • Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));return
      }
      var raw=await read(f),url=await clean(raw);
      show('<div class="ai-badge">✓ Smart Xerox Target — left camera shadow reduced, paper balanced, original text/stamps protected.</div><div class="preview-sheet"><p><b>Document • 1 page • '+copies+' copy/copies</b></p><img id="nrTargetPreview" src="'+url+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>');
      window.__nrSmartPrintTargetPages=[url];
    }catch(e){console.error(e);show('<div class="warn">Preview could not be prepared. The original file is unchanged — please try again.</div>')}
  }
  function install(){
    if(window.__nrFinalTargetInstalled)return;
    window.__nrFinalTargetInstalled=true;
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