/* NR BizPro Smart Print scanner preview — conservative crop, shadow-safe cleanup. */
(function(){
  const $=id=>document.getElementById(id);let resultCanvas=null;
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const img=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  function canvasFromImage(i){const c=document.createElement('canvas');c.width=i.naturalWidth||i.width;c.height=i.naturalHeight||i.height;c.getContext('2d').drawImage(i,0,0);return c;}
  function fallbackCrop(c){return c;}
  function edgeCrop(c){try{if(window.smartPrintEdgeEngine&&window.cv){const q=window.smartPrintEdgeEngine.detect(c);if(q&&q.length===4){const m=window.smartPrintEdgeEngine.warp(c,q);if(m){const out=document.createElement('canvas');out.width=m.cols;out.height=m.rows;cv.imshow(out,m);m.delete();return out;}}}}catch(e){console.warn('Smart Print edge detection fallback',e)}return fallbackCrop(c);}
  function resizeForProcessing(c,maxSide=2800){if(Math.max(c.width,c.height)<=maxSide)return c;const s=maxSide/Math.max(c.width,c.height),o=document.createElement('canvas');o.width=Math.round(c.width*s);o.height=Math.round(c.height*s);o.getContext('2d').drawImage(c,0,0,o.width,o.height);return o;}
  function clean(c){
    // Scanner-style shadow removal: estimate only the large-scale illumination field,
    // then gently flatten it. Fine text/photos are kept intact; no hard thresholding.
    const src=resizeForProcessing(c),w=src.width,h=src.height,o=document.createElement('canvas');o.width=w;o.height=h;
    const ctx=o.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,0,0);
    const im=ctx.getImageData(0,0,w,h),d=im.data;
    const sw=Math.max(32,Math.min(90,Math.round(w/45))),sh=Math.max(32,Math.min(90,Math.round(h/45)));
    const small=document.createElement('canvas');small.width=sw;small.height=sh;const sc=small.getContext('2d',{willReadFrequently:true});sc.drawImage(src,0,0,sw,sh);
    const sd=sc.getImageData(0,0,sw,sh).data,field=new Float32Array(sw*sh);
    for(let i=0,j=0;i<sd.length;i+=4,j++)field[j]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];
    // Blur the illumination map so characters/lines cannot become the shadow model.
    const blur=new Float32Array(field.length),radius=2;
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){let sum=0,n=0;for(let yy=Math.max(0,y-radius);yy<=Math.min(sh-1,y+radius);yy++)for(let xx=Math.max(0,x-radius);xx<=Math.min(sw-1,x+radius);xx++){sum+=field[yy*sw+xx];n++;}blur[y*sw+x]=sum/n;}
    let vals=Array.from(blur).filter(v=>v>30&&v<250).sort((a,b)=>a-b);const target=vals.length?vals[Math.floor(vals.length*.65)]:220;
    for(let y=0;y<h;y++){
      const fy=(y/(h-1))*Math.max(1,sh-1),y0=Math.floor(fy),y1=Math.min(sh-1,y0+1),ty=fy-y0;
      for(let x=0;x<w;x++){
        const fx=(x/(w-1))*Math.max(1,sw-1),x0=Math.floor(fx),x1=Math.min(sw-1,x0+1),tx=fx-x0;
        const a=blur[y0*sw+x0]*(1-tx)+blur[y0*sw+x1]*tx,b=blur[y1*sw+x0]*(1-tx)+blur[y1*sw+x1]*tx,base=Math.max(70,a*(1-ty)+b*ty);
        const k=(y*w+x)*4,g=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];
        // Partial correction avoids the over-white/washed look from full division.
        let factor=Math.pow(target/base,.62);factor=Math.max(.90,Math.min(1.32,factor));
        let n=g*factor;
        n=128+(n-128)*1.04;n=Math.max(0,Math.min(255,n));
        d[k]=d[k+1]=d[k+2]=n;
      }
    }
    ctx.putImageData(im,0,0);return o;
  }
  function run(){const f=$('fileInput')?.files?.[0];if(!f)return alert('Upload the document photo first.');if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return alert('For Scanner Test, upload JPG or PNG.');const body=$('previewBody');$('preview').classList.remove('hidden');body.innerHTML='<div class="ai-badge">⏳ Scanner processing — removing uneven shadows without damaging document details…</div>';setTimeout(async()=>{try{const original=canvasFromImage(await img(await read(f))),cropped=edgeCrop(original);resultCanvas=clean(cropped);body.innerHTML='<div class="ai-badge">✓ Scanner output — document edges preserved, perspective corrected when confident, uneven shadow flattened, original untouched.</div><div class="preview-sheet"><p><b>Processed document • 1 page</b></p><img src="'+resultCanvas.toDataURL('image/jpeg',.97)+'" alt="Processed uploaded document"></div>';}catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ Scanner processing failed. Original upload is untouched.</div>'; }},0);}
  function confirm(){if(!resultCanvas)return alert('Run Scanner Preview first.');const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies').value||1),u=resultCanvas.toDataURL('image/jpeg',.97);w.document.write('<html><head><title>NR BizPro Smart Print</title><style>@page{size:'+paper+';margin:10mm}body{margin:0}.p{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>'+Array.from({length:copies},()=>'<div class="p"><img src="'+u+'"></div>').join('')+'<script>onload=()=>setTimeout(()=>print(),250)<\/script></body></html>');w.document.close();}
  window.runScannerPreview=run;window.confirmScannerPrint=confirm;
})();