/* NR BizPro Smart Print v3 — conservative scanner cleanup.
   Goal: cleaner xerox-like output without generative rewriting, aggressive crop, or content fabrication. */
(function(){
  const $=id=>document.getElementById(id);
  let resultCanvas=null;

  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const img=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});

  function canvasFromImage(i){
    const c=document.createElement('canvas');
    c.width=i.naturalWidth||i.width; c.height=i.naturalHeight||i.height;
    c.getContext('2d').drawImage(i,0,0); return c;
  }
  function resizeForProcessing(c,maxSide=3000){
    if(Math.max(c.width,c.height)<=maxSide)return c;
    const s=maxSide/Math.max(c.width,c.height),o=document.createElement('canvas');
    o.width=Math.round(c.width*s);o.height=Math.round(c.height*s);
    o.getContext('2d').drawImage(c,0,0,o.width,o.height);return o;
  }

  function safeCrop(c){
    try{
      if(!window.smartPrintEdgeEngine||!window.cv)return c;
      const q=window.smartPrintEdgeEngine.detect(c);
      if(!q||q.length!==4)return c;
      const m=window.smartPrintEdgeEngine.warp(c,q);
      if(!m)return c;
      const out=document.createElement('canvas');out.width=m.cols;out.height=m.rows;cv.imshow(out,m);m.delete();
      return out;
    }catch(e){console.warn('Smart Print v3 crop skipped',e);return c}
  }

  function gammaLift(mat,gamma){
    const lut=new cv.Mat(1,256,cv.CV_8U);
    for(let i=0;i<256;i++)lut.data[i]=Math.max(0,Math.min(255,Math.round(255*Math.pow(i/255,gamma))));
    const out=new cv.Mat();cv.LUT(mat,lut,out);lut.delete();return out;
  }

  function cleanWithOpenCV(src){
    if(!window.cv||!cv.Mat)return null;
    let input=null,gray=null,bg=null,norm=null,lift=null,den=null,clahe=null,soft=null,sharp=null,rgba=null;
    try{
      input=cv.imread(src);
      gray=new cv.Mat();cv.cvtColor(input,gray,cv.COLOR_RGBA2GRAY);

      /* Large illumination field: target camera shadows/desk lighting, not document ink. */
      bg=new cv.Mat();
      cv.GaussianBlur(gray,bg,new cv.Size(0,0),70,70,cv.BORDER_REPLICATE);
      norm=new cv.Mat();cv.divide(gray,bg,norm,235,cv.CV_8U);

      /* Shadow lift is deliberately gentle; black text and security patterns stay black. */
      lift=gammaLift(norm,0.78);
      den=new cv.Mat();cv.bilateralFilter(lift,den,5,24,24,cv.BORDER_DEFAULT);

      /* Mild local contrast instead of hard thresholding, so fine print/signatures survive. */
      clahe=new cv.Mat();
      const ce=new cv.CLAHE(1.15,new cv.Size(12,12));ce.apply(den,clahe);ce.delete();
      soft=new cv.Mat();cv.addWeighted(den,0.78,clahe,0.22,0,soft);

      /* Print sharpening: restrained so camera noise does not become fake text. */
      const b=cv.Mat.zeros(soft.rows,soft.cols,soft.type());
      cv.GaussianBlur(soft,b,new cv.Size(0,0),0.85,0.85,cv.BORDER_REPLICATE);
      sharp=new cv.Mat();cv.addWeighted(soft,1.16,b,-0.16,0,sharp);b.delete();

      const out=document.createElement('canvas');out.width=sharp.cols;out.height=sharp.rows;
      rgba=new cv.Mat();cv.cvtColor(sharp,rgba,cv.COLOR_GRAY2RGBA);cv.imshow(out,rgba);
      return out;
    }catch(e){console.warn('Smart Print v3 OpenCV cleanup fallback',e);return null}
    finally{[input,gray,bg,norm,lift,den,clahe,soft,sharp,rgba].forEach(x=>{try{x&&x.delete()}catch{}})}
  }

  function cleanFallback(c){
    const src=resizeForProcessing(c),w=src.width,h=src.height,o=document.createElement('canvas');o.width=w;o.height=h;
    const ctx=o.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,0,0);
    const im=ctx.getImageData(0,0,w,h),d=im.data;
    const small=document.createElement('canvas');small.width=Math.max(48,Math.min(180,Math.round(w/20)));small.height=Math.max(48,Math.min(180,Math.round(h/20)));
    const sc=small.getContext('2d');sc.drawImage(src,0,0,small.width,small.height);const sd=sc.getImageData(0,0,small.width,small.height).data;
    const sw=small.width,sh=small.height,field=new Float32Array(sw*sh),smooth=new Float32Array(sw*sh);
    for(let i=0,j=0;i<sd.length;i+=4,j++)field[j]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];
    const r=Math.max(3,Math.round(Math.min(sw,sh)/18));
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){let sum=0,n=0;for(let yy=Math.max(0,y-r);yy<=Math.min(sh-1,y+r);yy++)for(let xx=Math.max(0,x-r);xx<=Math.min(sw-1,x+r);xx++){sum+=field[yy*sw+xx];n++;}smooth[y*sw+x]=sum/n;}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const fx=x*(sw-1)/Math.max(1,w-1),fy=y*(sh-1)/Math.max(1,h-1),x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1),tx=fx-x0,ty=fy-y0;
      const a=smooth[y0*sw+x0]*(1-tx)+smooth[y0*sw+x1]*tx,b=smooth[y1*sw+x0]*(1-tx)+smooth[y1*sw+x1]*tx,bg=Math.max(65,a*(1-ty)+b*ty),k=(y*w+x)*4,g=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];
      const corrected=Math.max(0,Math.min(255,g*Math.pow(235/bg,.55))),lift=255-(255-corrected)*.78;
      d[k]=d[k+1]=d[k+2]=Math.max(0,Math.min(255,lift));
    }
    ctx.putImageData(im,0,0);return o;
  }

  async function waitForCV(timeout=7000){
    const start=Date.now();
    while(Date.now()-start<timeout){if(window.cv&&cv.Mat)return true;await new Promise(r=>setTimeout(r,100));}
    return false;
  }

  async function run(){
    const f=$('fileInput')?.files?.[0];
    if(!f)return alert('Upload the document photo first.');
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return alert('For Scanner Test, upload JPG or PNG.');
    const body=$('previewBody');$('preview').classList.remove('hidden');
    body.innerHTML='<div class="ai-badge">⏳ Smart Clean v3 — preserving the full page, reducing camera shadows, protecting text/signatures and correcting perspective only when reliable…</div>';
    setTimeout(async()=>{try{
      await waitForCV();
      const original=canvasFromImage(await img(await read(f)));
      const cropped=safeCrop(original);
      resultCanvas=cleanWithOpenCV(cropped)||cleanFallback(cropped);
      const changed=cropped.width!==original.width||cropped.height!==original.height;
      body.innerHTML='<div class="ai-badge">✓ Smart Clean v3 ready — '+(changed?'conservative page crop applied • ':'full page preserved • ')+'shadow/uneven-light reduction • gentle paper whitening • print clarity boost • no text rewriting • original untouched.</div><div class="preview-sheet"><p><b>Clean Print • 1 page</b></p><img src="'+resultCanvas.toDataURL('image/jpeg',.98)+'" alt="Smart Clean v3 preview"></div>';
    }catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ Cleanup failed safely. The original upload is untouched.</div>'; }},20);
  }

  function confirm(){
    if(!resultCanvas)return alert('Run Scanner Preview first.');
    const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');
    const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies').value||1),u=resultCanvas.toDataURL('image/jpeg',.98);
    w.document.write('<html><head><title>NR BizPro Smart Print</title><style>@page{size:'+paper+';margin:10mm}body{margin:0}.p{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>'+Array.from({length:copies},()=>'<div class="p"><img src="'+u+'"></div>').join('')+'<script>onload=()=>setTimeout(()=>print(),250)<\\/script></body></html>');w.document.close();
  }

  window.runScannerPreview=run;
  window.confirmScannerPrint=confirm;
})();
