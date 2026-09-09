/* NR BizPro Smart Print — final scanner pipeline: safe crop + illumination correction + denoise + print clarity. */
(function(){
  const $=id=>document.getElementById(id);let resultCanvas=null;
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const img=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  function canvasFromImage(i){const c=document.createElement('canvas');c.width=i.naturalWidth||i.width;c.height=i.naturalHeight||i.height;c.getContext('2d').drawImage(i,0,0);return c;}
  function resizeForProcessing(c,maxSide=2600){if(Math.max(c.width,c.height)<=maxSide)return c;const s=maxSide/Math.max(c.width,c.height),o=document.createElement('canvas');o.width=Math.round(c.width*s);o.height=Math.round(c.height*s);o.getContext('2d').drawImage(c,0,0,o.width,o.height);return o;}
  function edgeCrop(c){
    try{
      if(window.smartPrintEdgeEngine&&window.cv){
        const q=window.smartPrintEdgeEngine.detect(c);
        if(q&&q.length===4){
          const m=window.smartPrintEdgeEngine.warp(c,q);
          if(m){const out=document.createElement('canvas');out.width=m.cols;out.height=m.rows;cv.imshow(out,m);m.delete();return out;}
        }
      }
    }catch(e){console.warn('Smart Print edge detection fallback',e)}
    return c;
  }
  function cleanWithOpenCV(src){
    if(!window.cv||!cv.Mat)return null;
    let input=null,gray=null,bg=null,norm=null,den=null,clahe=null,blur=null,sharp=null;
    try{
      input=cv.imread(src);
      gray=new cv.Mat();cv.cvtColor(input,gray,cv.COLOR_RGBA2GRAY);
      /* Large-scale illumination field: removes phone/camera shadows without erasing document strokes. */
      bg=new cv.Mat();cv.GaussianBlur(gray,bg,new cv.Size(0,0),28,28,cv.BORDER_REPLICATE);
      norm=new cv.Mat();cv.divide(gray,bg,norm,220,cv.CV_8U);
      /* Gentle denoise first so paper texture/moire does not become artificial ink. */
      den=new cv.Mat();cv.bilateralFilter(norm,den,7,38,38,cv.BORDER_DEFAULT);
      clahe=new cv.Mat();const ce=new cv.CLAHE(2.0,new cv.Size(8,8));ce.apply(den,clahe);ce.delete();
      /* Mild unsharp mask restores edge readability after camera blur. */
      blur=new cv.Mat();cv.GaussianBlur(clahe,blur,new cv.Size(0,0),1.15,1.15,cv.BORDER_REPLICATE);
      sharp=new cv.Mat();cv.addWeighted(clahe,1.32,blur,-0.32,0,sharp);
      const out=document.createElement('canvas');out.width=sharp.cols;out.height=sharp.rows;
      const rgba=new cv.Mat();cv.cvtColor(sharp,rgba,cv.COLOR_GRAY2RGBA);cv.imshow(out,rgba);rgba.delete();return out;
    }catch(e){console.warn('OpenCV cleanup fallback',e);return null}
    finally{[input,gray,bg,norm,den,clahe,blur,sharp].forEach(x=>{try{x&&x.delete()}catch{}})}
  }
  function cleanFallback(c){
    const src=resizeForProcessing(c),w=src.width,h=src.height,o=document.createElement('canvas');o.width=w;o.height=h;
    const ctx=o.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,0,0);const im=ctx.getImageData(0,0,w,h),d=im.data;
    const small=document.createElement('canvas');small.width=Math.max(48,Math.min(180,Math.round(w/20)));small.height=Math.max(48,Math.min(180,Math.round(h/20)));
    const sc=small.getContext('2d');sc.drawImage(src,0,0,small.width,small.height);const sd=sc.getImageData(0,0,small.width,small.height).data;
    const sw=small.width,sh=small.height,field=new Float32Array(sw*sh);
    for(let i=0,j=0;i<sd.length;i+=4,j++)field[j]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];
    const blurField=new Float32Array(field.length),r=Math.max(3,Math.round(Math.min(sw,sh)/20));
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){let sum=0,n=0;for(let yy=Math.max(0,y-r);yy<=Math.min(sh-1,y+r);yy++)for(let xx=Math.max(0,x-r);xx<=Math.min(sw-1,x+r);xx++){sum+=field[yy*sw+xx];n++;}blurField[y*sw+x]=sum/n;}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const fx=x*(sw-1)/Math.max(1,w-1),fy=y*(sh-1)/Math.max(1,h-1),x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1),tx=fx-x0,ty=fy-y0;
      const a=blurField[y0*sw+x0]*(1-tx)+blurField[y0*sw+x1]*tx,b=blurField[y1*sw+x0]*(1-tx)+blurField[y1*sw+x1]*tx,bg=Math.max(60,a*(1-ty)+b*ty),k=(y*w+x)*4,g=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];
      let n=.58*g+.42*Math.max(0,Math.min(255,g*Math.pow(224/bg,.72)));n=132+(n-132)*1.08;n=Math.max(0,Math.min(255,n));d[k]=d[k+1]=d[k+2]=n;
    }
    ctx.putImageData(im,0,0);return o;
  }
  function run(){
    const f=$('fileInput')?.files?.[0];if(!f)return alert('Upload the document photo first.');if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return alert('For Scanner Test, upload JPG or PNG.');
    const body=$('previewBody');$('preview').classList.remove('hidden');body.innerHTML='<div class="ai-badge">⏳ Smart Clean — detecting page edges safely, correcting perspective only when reliable, removing uneven shadows and improving print clarity…</div>';
    setTimeout(async()=>{try{
      const original=canvasFromImage(await img(await read(f))),cropped=edgeCrop(original);resultCanvas=cleanWithOpenCV(cropped)||cleanFallback(cropped);
      const croppedApplied=cropped.width!==original.width||cropped.height!==original.height;
      body.innerHTML='<div class="ai-badge">✓ Clean Print ready — '+(croppedApplied?'safe page crop applied • ':'page edges preserved because crop was not reliable • ')+'perspective corrected only when confident • shadows/uneven lighting reduced • paper whitened • fine details protected • original untouched.</div><div class="preview-sheet"><p><b>Processed document • 1 page</b></p><img src="'+resultCanvas.toDataURL('image/jpeg',.98)+'" alt="Clean print preview"></div>';
    }catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ Smart Clean failed safely. Original upload is untouched.</div>'; }},30);
  }
  function confirm(){if(!resultCanvas)return alert('Run Scanner Preview first.');const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies').value||1),u=resultCanvas.toDataURL('image/jpeg',.98);w.document.write('<html><head><title>NR BizPro Smart Print</title><style>@page{size:'+paper+';margin:10mm}body{margin:0}.p{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>'+Array.from({length:copies},()=>'<div class="p"><img src="'+u+'"></div>').join('')+'<script>onload=()=>setTimeout(()=>print(),250)<\/script></body></html>');w.document.close();}
  window.runScannerPreview=run;window.confirmScannerPrint=confirm;
})();
