/* NR BizPro Smart Print — TARGET SHADOW REMOVAL v4
   Strong document illumination correction for real camera shadows.
   Detects the paper-light field from the image itself, then lifts only
   shadowed paper while protecting dark ink, signatures and saturated marks. */
(function(){
  'use strict';
  function show(html){var m=document.getElementById('preview'),b=document.getElementById('previewBody');if(!m||!b)return;b.innerHTML=html;m.classList.remove('hidden')}
  function file(){var i=document.getElementById('fileInput');return i&&i.files&&i.files[0]}
  function read(f){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=rej;r.readAsDataURL(f)})}
  function image(src){return new Promise(function(res,rej){var i=new Image();i.onload=function(){res(i)};i.onerror=rej;i.src=src})}
  function raf(){return new Promise(function(r){requestAnimationFrame(r)})}
  function lum(r,g,b){return .2126*r+.7152*g+.0722*b}
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function smoothstep(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)}

  async function removeShadow(src){
    var im=await image(src),mw=1800,mh=2400,s=Math.min(1,mw/im.naturalWidth,mh/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
    var c=document.createElement('canvas');c.width=w;c.height=h;
    var x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,w,h);
    var d=x.getImageData(0,0,w,h),p=d.data;

    /* Low-resolution luminance field. A broad blur captures illumination/shadow,
       while text and stamps disappear because they occupy very few thumbnail pixels. */
    var tw=120,th=Math.max(80,Math.round(120*h/w)),t=document.createElement('canvas');t.width=tw;t.height=th;
    var tx=t.getContext('2d',{willReadFrequently:true});tx.drawImage(c,0,0,tw,th);
    var td=tx.getImageData(0,0,tw,th).data, field=new Float32Array(tw*th);
    for(var yy=0;yy<th;yy++)for(var xx=0;xx<tw;xx++){var q=(yy*tw+xx)*4;field[yy*tw+xx]=lum(td[q],td[q+1],td[q+2])}
    /* Box blur twice: approximately a large Gaussian illumination map. */
    function blur(src,dst,r){
      for(var y=0;y<th;y++)for(var xx=0;xx<tw;xx++){
        var sum=0,n=0,y0=Math.max(0,y-r),y1=Math.min(th-1,y+r),x0=Math.max(0,xx-r),x1=Math.min(tw-1,xx+r);
        for(var a=y0;a<=y1;a++)for(var b=x0;b<=x1;b++){sum+=src[a*tw+b];n++}
        dst[y*tw+xx]=sum/n;
      }
    }
    var b1=new Float32Array(field.length),b2=new Float32Array(field.length);blur(field,b1,5);blur(b1,b2,5);

    /* Estimate clean paper brightness per row from the right half. Use high-ish
       percentile so dark printed content does not become the reference. */
    var rowRef=new Float32Array(th);
    for(var y=0;y<th;y++){
      var vals=[];
      for(var xx=Math.floor(tw*.62);xx<tw;xx++){var v=b2[y*tw+xx];if(v>95)vals.push(v)}
      vals.sort(function(a,b){return a-b});
      rowRef[y]=vals.length?vals[Math.floor(vals.length*.72)]:Math.max(165,field[y*tw+Math.floor(tw*.8)]);
    }
    function interpRow(z){z=clamp(z,0,th-1);var a=Math.floor(z),b=Math.min(th-1,a+1),q=z-a;return rowRef[a]*(1-q)+rowRef[b]*q}
    function interpField(fx,fy){fx=clamp(fx,0,tw-1);fy=clamp(fy,0,th-1);var x0=Math.floor(fx),x1=Math.min(tw-1,x0+1),y0=Math.floor(fy),y1=Math.min(th-1,y0+1),qx=fx-x0,qy=fy-y0;return (f[y0*tw+x0]*(1-qx)+f[y0*tw+x1]*qx)*(1-qy)+(f[y1*tw+x0]*(1-qx)+f[y1*tw+x1]*qx)*qy}

    /* First determine how much darker the left illumination field is than the
       clean right side. This is the actual camera-shadow strength. */
    var ratios=new Float32Array(th);
    for(var ry=0;ry<th;ry++){
      var left=0,n=0;
      for(var rx=Math.floor(tw*.04);rx<Math.floor(tw*.38);rx++){var lv=b2[ry*tw+rx];if(lv>70){left+=lv;n++}}
      left=n?left/n:rowRef[ry];
      ratios[ry]=clamp(rowRef[ry]/Math.max(70,left),1,2.15);
    }
    function interpRatio(z){z=clamp(z,0,th-1);var a=Math.floor(z),b=Math.min(th-1,a+1),q=z-a;return ratios[a]*(1-q)+ratios[b]*q}

    for(var y2=0;y2<h;y2++){
      var fy=y2*(th-1)/Math.max(1,h-1), rowRatio=interpRatio(fy), clean=interpRow(fy);
      for(var xx2=0;xx2<w;xx2++){
        var i=(y2*w+xx2)*4,r=p[i],g=p[i+1],bb=p[i+2],l=lum(r,g,bb),mx=Math.max(r,g,bb),mn=Math.min(r,g,bb),sat=mx?((mx-mn)/mx):0,fx=xx2*(tw-1)/Math.max(1,w-1);
        var local=interpField(fx,fy), desired=clean;
        /* Blend row reference and local field so gradients are corrected smoothly. */
        var localRatio=clamp(desired/Math.max(55,local),1,2.0);
        var strength=Math.max(rowRatio,localRatio);
        /* Shadow correction is strongest on the left and fades after the shadow area. */
        var zone=1-smoothstep(.28,.82,xx2/Math.max(1,w-1));
        /* Avoid correcting dark printed pixels. Mid-tone paper receives the most help. */
        var paper=smoothstep(70,145,l)*(1-smoothstep(205,245,l));
        var darkInk=1-smoothstep(35,105,l);
        var colourProtect=sat>.50?.30:(sat>.34?.58:1);
        var gain=1+(strength-1)*zone*(.35+.65*paper)*colourProtect*(1-.78*darkInk);
        gain=clamp(gain,1,2.05);
        p[i]=clamp(r*gain,0,255);p[i+1]=clamp(g*gain,0,255);p[i+2]=clamp(bb*gain,0,255);
      }
      if(y2%8===0)await raf();
    }
    x.putImageData(d,0,0);await raf();
    return c.toDataURL('image/jpeg',.98)
  }

  async function preview(){
    var f=file();if(!f){alert('Upload a WhatsApp image or PDF first.');return}
    var copies=Math.max(1,+(document.getElementById('copies')||{}).value||1);
    show('<div style="padding:22px;text-align:center"><b>Preparing Smart Xerox Target…</b><br><small>Removing the camera shadow using strong adaptive illumination correction.</small></div>');
    try{
      if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
        var pages=window.sourcePages||[];if(!pages.length){alert('PDF is still loading. Please try Preview again.');return}
        show('<div class="ai-badge">✓ Smart Xerox Target — PDF page preserved safely.</div>'+pages.map(function(p,i){return '<div class="preview-sheet"><p><b>Document • Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));window.__nrSmartPrintTargetPages=pages;return
      }
      var raw=await read(f),url=await removeShadow(raw);
      show('<div class="ai-badge">✓ Smart Xerox Target — strong left camera-shadow removal with adaptive illumination correction.</div><div class="preview-sheet"><p><b>Document • 1 page • '+copies+' copy/copies</b></p><img id="nrTargetPreview" src="'+url+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>');
      window.__nrSmartPrintTargetPages=[url];
    }catch(e){console.error(e);show('<div class="warn">Preview could not be prepared. The original file is unchanged — please try Preview again.</div>')}
  }
  function install(){
    if(window.__nrAdaptiveTargetInstalled)return;window.__nrAdaptiveTargetInstalled=true;
    window.previewPrint=preview;
    var oldConfirm=window.confirmPrint;
    window.confirmPrint=function(){
      var pages=window.__nrSmartPrintTargetPages||[];if(!pages.length)return oldConfirm.apply(this,arguments);
      var oldOpen=window.open;window.open=function(){var w=oldOpen.apply(window,arguments);if(!w)return w;var dw=w.document,wr=dw.write.bind(dw);dw.write=function(html){var i=0;html=html.replace(/<img\s+src="([^"]+)"/gi,function(m){return pages[i++]?'<img src="'+pages[i-1]+'"':m});wr(html)};return w};try{return oldConfirm.apply(this,arguments)}finally{window.open=oldOpen}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
