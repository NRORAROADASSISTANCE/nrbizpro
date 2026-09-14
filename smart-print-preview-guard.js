// NR BizPro Smart Print — fast real Xerox target preview
(function(){
  'use strict';
  var busy=false;
  function esc(s){return String(s||'').replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m]})}
  function show(body){var modal=document.getElementById('preview'),box=document.getElementById('previewBody');if(!modal||!box)return;box.innerHTML=body;modal.classList.remove('hidden')}
  function sourceFile(){var input=document.getElementById('fileInput');return input&&input.files&&input.files[0]||null}
  function nextFrame(){return new Promise(function(r){requestAnimationFrame(r)})}
  async function xeroxTarget(file){
    if(file.type==='application/pdf'||/\.pdf$/i.test(file.name))return null;
    var raw=await new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(r.result)};r.onerror=reject;r.readAsDataURL(file)});
    var im=await new Promise(function(resolve,reject){var x=new Image();x.onload=function(){resolve(x)};x.onerror=reject;x.src=raw});
    var maxW=1050,maxH=1450,scale=Math.min(1,maxW/im.naturalWidth,maxH/im.naturalHeight);
    var w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
    var c=document.createElement('canvas');c.width=w;c.height=h;var ctx=c.getContext('2d',{willReadFrequently:true});
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
    var src=ctx.getImageData(0,0,w,h),d=src.data;
    // Estimate page illumination on a small grid, then flatten camera/room shadows.
    var gw=48,gh=64,bg=document.createElement('canvas');bg.width=gw;bg.height=gh;var bx=bg.getContext('2d',{willReadFrequently:true});
    bx.filter='blur(2px)';bx.drawImage(c,0,0,gw,gh);var bd=bx.getImageData(0,0,gw,gh).data;
    function lumAt(gx,gy){gx=Math.max(0,Math.min(gw-1,gx));gy=Math.max(0,Math.min(gh-1,gy));var j=(gy*gw+gx)*4;return .2126*bd[j]+.7152*bd[j+1]+.0722*bd[j+2]}
    for(var y=0;y<h;y++){
      var gy=y*(gh-1)/Math.max(1,h-1),y0=Math.floor(gy),y1=Math.min(gh-1,y0+1),ty=gy-y0;
      for(var x=0;x<w;x++){
        var gx=x*(gw-1)/Math.max(1,w-1),x0=Math.floor(gx),x1=Math.min(gw-1,x0+1),tx=gx-x0;
        var bgLum=(lumAt(x0,y0)*(1-tx)+lumAt(x1,y0)*tx)*(1-ty)+(lumAt(x0,y1)*(1-tx)+lumAt(x1,y1)*tx)*ty;
        var i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],l=.2126*r+.7152*g+.0722*b;
        // Stronger lift for paper/shadow areas, but protect dark text/stamps.
        var target=232,gain=target/Math.max(75,bgLum);gain=Math.max(.92,Math.min(1.65,gain));
        var protect=l<70?.20:l<125?.20+.80*(l-70)/55:1;
        var eg=1+(gain-1)*protect;
        r=Math.min(255,r*eg);g=Math.min(255,g*eg);b=Math.min(255,b*eg);
        // Gentle contrast: paper becomes cleaner while dark characters stay dark.
        var nl=.2126*r+.7152*g+.0722*b;var contrast=nl<150?1.10:1.04;
        r=Math.max(0,Math.min(255,128+(r-128)*contrast));g=Math.max(0,Math.min(255,128+(g-128)*contrast));b=Math.max(0,Math.min(255,128+(b-128)*contrast));
        d[i]=r;d[i+1]=g;d[i+2]=b;
      }
      if(y%20===0)await nextFrame();
    }
    ctx.putImageData(src,0,0);
    return c.toDataURL('image/jpeg',.95);
  }
  async function renderPreview(){
    var f=sourceFile();if(!f){alert('Upload a WhatsApp image or PDF first.');return}
    var copies=Math.max(1,+(document.getElementById('copies')||{}).value||1),type=window.type||'document';
    show('<div style="padding:24px;text-align:center"><b>Preparing Smart Xerox Preview…</b><br><small>Removing camera shade and improving document readability.</small></div>');
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
      var sp=window.sourcePages;if(Array.isArray(sp)&&sp.length){show('<div class="ai-badge">✓ Smart Xerox target — PDF page ready.</div>'+sp.map(function(p,i){return '<div class="preview-sheet"><p><b>Document • Page '+(i+1)+' of '+sp.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" alt="PDF preview" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));return}
      show('<div class="warn">PDF page rendering is still preparing. Please Preview again.</div>');return;
    }
    try{var url=await xeroxTarget(f);show('<div class="ai-badge">✓ Smart Xerox Target — shadow reduced, paper lifted, text protected.</div><div class="preview-sheet"><p><b>'+(type==='id'?'ID Card':'Document')+' • 1 page • '+copies+' copy/copies</b></p><img src="'+url+'" alt="Smart Xerox target preview" style="max-width:100%;height:auto;display:block;margin:auto"></div>')}catch(e){console.error('Smart Xerox preview',e);show('<div class="warn">Preview processing failed. Please upload the original WhatsApp file again.</div>')}
  }
  window.previewPrint=function(){if(busy)return;busy=true;renderPreview().finally(function(){busy=false})};
})();
