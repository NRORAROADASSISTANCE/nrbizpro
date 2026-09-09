/* NR BizPro Smart Print v3 — conservative document scan cleanup.
   Goals: preserve source pixels/content, crop only when confidence is high,
   flatten illumination without inventing text, and keep a clean print preview. */
(function(){
  const $=id=>document.getElementById(id); let resultCanvas=null;
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const loadImage=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  function canvasFromImage(i){const c=document.createElement('canvas');c.width=i.naturalWidth||i.width;c.height=i.naturalHeight||i.height;c.getContext('2d').drawImage(i,0,0);return c;}
  function resize(c,maxSide=3000){if(Math.max(c.width,c.height)<=maxSide)return c;const s=maxSide/Math.max(c.width,c.height),o=document.createElement('canvas');o.width=Math.round(c.width*s);o.height=Math.round(c.height*s);o.getContext('2d').drawImage(c,0,0,o.width,o.height);return o;}
  function edgeCrop(c){
    try{
      if(!window.smartPrintEdgeEngine||!window.cv)return c;
      const q=window.smartPrintEdgeEngine.detect(c);
      if(!q||q.length!==4)return c;
      const xs=q.map(p=>p.x),ys=q.map(p=>p.y),bw=Math.max(...xs)-Math.min(...xs),bh=Math.max(...ys)-Math.min(...ys),area=bw*bh/(c.width*c.height);
      /* Never accept a suspiciously small or nearly-full-frame crop. */
      if(area<.35||area>.97)return c;
      const m=window.smartPrintEdgeEngine.warp(c,q); if(!m)return c;
      const out=document.createElement('canvas');out.width=m.cols;out.height=m.rows;cv.imshow(out,m);m.delete();return out;
    }catch(e){console.warn('Smart Print crop skipped',e);return c}
  }
  function cleanOpenCV(src){
    if(!window.cv||!cv.Mat)return null;
    let input=null,gray=null,b1=null,b2=null,b3=null,bg=null,flat=null,den=null,detail=null,sharp=null,rgba=null;
    try{
      input=cv.imread(src); gray=new cv.Mat(); cv.cvtColor(input,gray,cv.COLOR_RGBA2GRAY);
      const s=Math.max(input.cols,input.rows);
      const s1=Math.max(12,Math.min(28,s*.012)),s2=Math.max(35,Math.min(75,s*.035)),s3=Math.max(80,Math.min(150,s*.075));
      b1=new cv.Mat();b2=new cv.Mat();b3=new cv.Mat();
      cv.GaussianBlur(gray,b1,new cv.Size(0,0),s1,s1,cv.BORDER_REPLICATE);
      cv.GaussianBlur(gray,b2,new cv.Size(0,0),s2,s2,cv.BORDER_REPLICATE);
      cv.GaussianBlur(gray,b3,new cv.Size(0,0),s3,s3,cv.BORDER_REPLICATE);
      bg=new cv.Mat(); cv.addWeighted(b1,.20,b2,.50,0,bg); cv.addWeighted(bg,.70,b3,.30,0,bg);
      flat=new cv.Mat(); cv.divide(gray,bg,flat,225,cv.CV_8U);
      /* Keep some source luminance so fine print/stamps are not erased. */
      den=new cv.Mat(); cv.bilateralFilter(flat,den,5,24,24,cv.BORDER_DEFAULT);
      detail=new cv.Mat(); cv.GaussianBlur(den,detail,new cv.Size(0,0),1.15,1.15,cv.BORDER_REPLICATE);
      sharp=new cv.Mat(); cv.addWeighted(den,1.12,detail,-.12,4,sharp);
      rgba=new cv.Mat(); cv.cvtColor(sharp,rgba,cv.COLOR_GRAY2RGBA);
      const out=document.createElement('canvas');out.width=sharp.cols;out.height=sharp.rows;cv.imshow(out,rgba);return out;
    }catch(e){console.warn('OpenCV cleanup skipped',e);return null}
    finally{[input,gray,b1,b2,b3,bg,flat,den,detail,sharp,rgba].forEach(x=>{try{x&&x.delete()}catch{}})}
  }
  function cleanFallback(src){
    const c=resize(src),w=c.width,h=c.height,o=document.createElement('canvas');o.width=w;o.height=h;
    const ctx=o.getContext('2d',{willReadFrequently:true});ctx.drawImage(c,0,0);const im=ctx.getImageData(0,0,w,h),d=im.data;
    const small=document.createElement('canvas');small.width=Math.max(48,Math.min(160,Math.round(w/24)));small.height=Math.max(48,Math.min(160,Math.round(h/24)));
    const sc=small.getContext('2d');sc.drawImage(c,0,0,small.width,small.height);const sd=sc.getImageData(0,0,small.width,small.height).data,sw=small.width,sh=small.height;
    const field=new Float32Array(sw*sh);for(let i=0,j=0;i<sd.length;i+=4,j++)field[j]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];
    const r=Math.max(3,Math.round(Math.min(sw,sh)/18)),blur=new Float32Array(field.length);
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){let sum=0,n=0;for(let yy=Math.max(0,y-r);yy<=Math.min(sh-1,y+r);yy++)for(let xx=Math.max(0,x-r);xx<=Math.min(sw-1,x+r);xx++){sum+=field[yy*sw+xx];n++}blur[y*sw+x]=sum/n}
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const fx=x*(sw-1)/Math.max(1,w-1),fy=y*(sh-1)/Math.max(1,h-1),x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1),tx=fx-x0,ty=fy-y0;const a=blur[y0*sw+x0]*(1-tx)+blur[y0*sw+x1]*tx,b=blur[y1*sw+x0]*(1-tx)+blur[y1*sw+x1]*tx,bg=Math.max(70,a*(1-ty)+b*ty),k=(y*w+x)*4,g=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2],n=Math.max(0,Math.min(255,.72*g+.28*g*(220/bg))),v=Math.max(0,Math.min(255,Math.round(6+.96*n)));d[k]=d[k+1]=d[k+2]=v}
    ctx.putImageData(im,0,0);return o;
  }
  async function run(){
    const f=$('fileInput')?.files?.[0]; if(!f)return alert('Upload the document photo first.');
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return alert('Scanner Preview currently uses JPG/PNG. PDF printing remains available separately.');
    const body=$('previewBody');$('preview').classList.remove('hidden');body.innerHTML='<div class="ai-badge">⏳ Smart Clean v3 — checking page boundary, preserving content, flattening uneven light and protecting fine details…</div>';
    setTimeout(async()=>{try{
      const original=resize(canvasFromImage(await loadImage(await read(f)))),processed=edgeCrop(original);resultCanvas=cleanOpenCV(processed)||cleanFallback(processed);
      const cropApplied=processed!==original;
      body.innerHTML='<div class="ai-badge">✓ Clean Print v3 ready — '+(cropApplied?'page boundary accepted • ':'page boundary not confident, so crop skipped • ')+'perspective correction only when reliable • uneven illumination reduced • fine details protected • original untouched.</div><div class="preview-sheet"><p><b>Processed document • 1 page</b></p><img src="'+resultCanvas.toDataURL('image/jpeg',.985)+'" alt="Clean print preview"></div>';
    }catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ Cleanup failed safely. The original upload was not changed.</div>'}},40);
  }
  function confirm(){if(!resultCanvas)return alert('Run Scanner Preview first.');const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies').value||1),u=resultCanvas.toDataURL('image/jpeg',.985);const h=paper==='A5'?210:297;w.document.write('<html><head><title>NR BizPro Smart Print</title><style>@page{size:'+paper+';margin:10mm}body{margin:0}.p{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc('+h+'mm - 20mm)}img{max-width:100%;max-height:calc('+h+'mm - 20mm);object-fit:contain}</style></head><body>'+Array.from({length:copies},()=>'<div class="p"><img src="'+u+'"></div>').join('')+'<script>onload=()=>setTimeout(()=>print(),300)<\\/script></body></html>');w.document.close();}
  window.runScannerPreview=run;window.confirmScannerPrint=confirm;
})();
