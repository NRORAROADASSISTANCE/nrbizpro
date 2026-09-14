// NR BizPro Smart Print — final shadow removal target preview
(function(){
  'use strict';
  var busy=false;
  function show(body){var modal=document.getElementById('preview'),box=document.getElementById('previewBody');if(!modal||!box)return;box.innerHTML=body;modal.classList.remove('hidden')}
  function sourceFile(){var input=document.getElementById('fileInput');return input&&input.files&&input.files[0]||null}
  function nextFrame(){return new Promise(function(r){requestAnimationFrame(r)})}
  async function xeroxTarget(file){
    if(file.type==='application/pdf'||/\.pdf$/i.test(file.name))return null;
    var raw=await new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(r.result)};r.onerror=reject;r.readAsDataURL(file)});
    var im=await new Promise(function(resolve,reject){var x=new Image();x.onload=function(){resolve(x)};x.onerror=reject;x.src=raw});
    var maxW=1200,maxH=1650,scale=Math.min(1,maxW/im.naturalWidth,maxH/im.naturalHeight);
    var w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
    var c=document.createElement('canvas');c.width=w;c.height=h;var ctx=c.getContext('2d',{willReadFrequently:true});
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
    var src=ctx.getImageData(0,0,w,h),d=src.data;
    // Low-resolution illumination map. The reference for each row comes from the brightest paper area,
    // so a dark camera/hand shadow on the left is not treated as the desired paper tone.
    var gw=64,gh=80,bg=document.createElement('canvas');bg.width=gw;bg.height=gh;var bx=bg.getContext('2d',{willReadFrequently:true});
    bx.drawImage(c,0,0,gw,gh);var bd=bx.getImageData(0,0,gw,gh).data;
    function lum(j){return .2126*bd[j]+.7152*bd[j+1]+.0722*bd[j+2]}
    var rowRef=new Float32Array(gh);
    for(var gy=0;gy<gh;gy++){
      var vals=[];for(var gx=Math.floor(gw*.62);gx<gw;gx++)vals.push(lum((gy*gw+gx)*4));
      vals.sort(function(a,b){return a-b});rowRef[gy]=vals[Math.floor(vals.length*.70)]||220;
    }
    function refAt(gy){var y0=Math.floor(gy),y1=Math.min(gh-1,y0+1),t=gy-y0;return rowRef[Math.max(0,y0)]*(1-t)+rowRef[y1]*t}
    for(var y=0;y<h;y++){
      var gy=y*(gh-1)/Math.max(1,h-1),y0=Math.floor(gy),y1=Math.min(gh-1,y0+1),ty=gy-y0;
      for(var x=0;x<w;x++){
        var gx=x*(gw-1)/Math.max(1,w-1),x0=Math.floor(gx),x1=Math.min(gw-1,x0+1),tx=gx-x0;
        var a=lum((y0*gw+x0)*4)*(1-tx)+lum((y0*gw+x1)*4)*tx;
        var b0=lum((y1*gw+x0)*4)*(1-tx)+lum((y1*gw+x1)*4)*tx;
        var local=(a*(1-ty)+b0*ty);
        var target=Math.max(205,Math.min(238,refAt(gy)+8));
        var gain=target/Math.max(60,local);gain=Math.max(.92,Math.min(2.05,gain));
        var i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],l=.2126*r+.7152*g+.0722*b;
        // Preserve ink/stamps/signatures while strongly lifting the surrounding paper.
        var protect=l<45?.10:l<95?.10+.35*(l-45)/50:l<145?.45+.45*(l-95)/50:1;
        var eg=1+(gain-1)*protect;
        r=Math.min(255,r*eg);g=Math.min(255,g*eg);b=Math.min(255,b*eg);
        // Remove warm/green camera cast from bright paper without bleaching dark content.
        var nl=.2126*r+.7152*g+.0722*b;
        if(nl>145){var neutral=Math.min(1,(nl-145)/95)*.18;r=r*(1-neutral)+nl*neutral;g=g*(1-neutral)+nl*neutral;b=b*(1-neutral)+nl*neutral}
        // Clean paper contrast; retain strong dark characters.
        var contrast=nl<125?1.08:1.025;
        r=Math.max(0,Math.min(255,128+(r-128)*contrast));g=Math.max(0,Math.min(255,128+(g-128)*contrast));b=Math.max(0,Math.min(255,128+(b-128)*contrast));
        d[i]=r;d[i+1]=g;d[i+2]=b;
      }
      if(y%18===0)await nextFrame();
    }
    ctx.putImageData(src,0,0);
    return c.toDataURL('image/jpeg',.96);
  }
  async function renderPreview(){
    var f=sourceFile();if(!f){alert('Upload a WhatsApp image or PDF first.');return}
    var copies=Math.max(1,+(document.getElementById('copies')||{}).value||1);
    show('<div style="padding:24px;text-align:center"><b>Preparing Smart Xerox Target…</b><br><small>Removing camera shadow, whitening paper and protecting text.</small></div>');
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
      var sp=window.sourcePages;if(Array.isArray(sp)&&sp.length){show('<div class="ai-badge">✓ Smart Xerox target — PDF page ready.</div>'+sp.map(function(p,i){return '<div class="preview-sheet"><p><b>Document • Page '+(i+1)+' of '+sp.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" alt="PDF preview" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));return}
      show('<div class="warn">PDF page rendering is still preparing. Please Preview again.</div>');return;
    }
    try{var url=await xeroxTarget(f);show('<div class="ai-badge">✓ Smart Xerox Target — camera shadow removed, paper whitened, text protected.</div><div class="preview-sheet"><p><b>Document • 1 page • '+copies+' copy/copies</b></p><img src="'+url+'" alt="Smart Xerox target preview" style="max-width:100%;height:auto;display:block;margin:auto"></div>')}catch(e){console.error('Smart Xerox preview',e);show('<div class="warn">Preview processing failed. Please upload the original WhatsApp file again.</div>')}
  }
  window.previewPrint=function(){if(busy)return;busy=true;renderPreview().finally(function(){busy=false})};
})();
