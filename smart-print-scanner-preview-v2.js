/* NR BizPro Smart Print scanner preview — conservative crop, non-destructive cleanup. */
(function(){
  const $=id=>document.getElementById(id);let resultCanvas=null;
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const img=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  function canvasFromImage(i){const c=document.createElement('canvas');c.width=i.naturalWidth||i.width;c.height=i.naturalHeight||i.height;c.getContext('2d').drawImage(i,0,0);return c;}
  function fallbackCrop(c){
    // Conservative fallback: never guess a tight crop from text/background pixels.
    // If OpenCV cannot confidently find four paper corners, preserve the complete upload.
    return c;
  }
  function edgeCrop(c){try{if(window.smartPrintEdgeEngine&&window.cv){const q=window.smartPrintEdgeEngine.detect(c);if(q&&q.length===4){const m=window.smartPrintEdgeEngine.warp(c,q);if(m){const out=document.createElement('canvas');out.width=m.cols;out.height=m.rows;cv.imshow(out,m);m.delete();return out;}}}}catch(e){console.warn('Smart Print edge detection fallback',e)}return fallbackCrop(c);}
  function resizeForProcessing(c,maxSide=2800){if(Math.max(c.width,c.height)<=maxSide)return c;const s=maxSide/Math.max(c.width,c.height),o=document.createElement('canvas');o.width=Math.round(c.width*s);o.height=Math.round(c.height*s);o.getContext('2d').drawImage(c,0,0,o.width,o.height);return o;}
  function clean(c){
    // Gentle, detail-preserving cleanup only. Do not hard-threshold or aggressively whiten.
    const src=resizeForProcessing(c),w=src.width,h=src.height,o=document.createElement('canvas');o.width=w;o.height=h;const ctx=o.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,0,0);
    const im=ctx.getImageData(0,0,w,h),d=im.data;for(let i=0;i<d.length;i+=4){let y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];if(y>248)y=255;else if(y<35)y=30;d[i]=d[i+1]=d[i+2]=y;}ctx.putImageData(im,0,0);return o;
  }
  function run(){const f=$('fileInput')?.files?.[0];if(!f)return alert('Upload the document photo first.');if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return alert('For Scanner Test, upload JPG or PNG.');const body=$('previewBody');$('preview').classList.remove('hidden');body.innerHTML='<div class="ai-badge">⏳ Scanner processing the actual uploaded photo…</div>';setTimeout(async()=>{try{const original=canvasFromImage(await img(await read(f))),cropped=edgeCrop(original);resultCanvas=clean(cropped);body.innerHTML='<div class="ai-badge">✓ Conservative scanner output — page edges preserved, perspective corrected only when confident, original untouched.</div><div class="preview-sheet"><p><b>Processed document • 1 page</b></p><img src="'+resultCanvas.toDataURL('image/jpeg',.97)+'" alt="Processed uploaded document"></div>';}catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ Scanner processing failed. Original upload is untouched.</div>'; }},0);}
  function confirm(){if(!resultCanvas)return alert('Run Scanner Preview first.');const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies').value||1),u=resultCanvas.toDataURL('image/jpeg',.97);w.document.write('<html><head><title>NR BizPro Smart Print</title><style>@page{size:'+paper+';margin:10mm}body{margin:0}.p{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>'+Array.from({length:copies},()=>'<div class="p"><img src="'+u+'"></div>').join('')+'<script>onload=()=>setTimeout(()=>print(),250)<\/script></body></html>');w.document.close();}
  window.runScannerPreview=run;window.confirmScannerPrint=confirm;
})();