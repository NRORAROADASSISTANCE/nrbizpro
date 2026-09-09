/* NR BizPro Smart Print scanner preview — real uploaded-image pipeline. */
(function(){
  const $=id=>document.getElementById(id); let resultCanvas=null;
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const img=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function canvasFromImage(i){const c=document.createElement('canvas');c.width=i.naturalWidth||i.width;c.height=i.naturalHeight||i.height;c.getContext('2d').drawImage(i,0,0);return c;}
  function fallbackCrop(c){
    const w=c.width,h=c.height,S=Math.min(1400/Math.max(w,h),1),sw=Math.max(40,Math.round(w*S)),sh=Math.max(40,Math.round(h*S)),t=document.createElement('canvas');t.width=sw;t.height=sh;const x=t.getContext('2d',{willReadFrequently:true});x.drawImage(c,0,0,sw,sh);const d=x.getImageData(0,0,sw,sh).data;
    let minX=sw,minY=sh,maxX=-1,maxY=-1;const lum=(q)=>.2126*d[q]+.7152*d[q+1]+.0722*d[q+2];
    // Find the largest coherent light paper region, rather than simply cropping the whole photo.
    const th=185; for(let y=2;y<sh-2;y++)for(let xx=2;xx<sw-2;xx++){const k=(y*sw+xx)*4;if(lum(k)<th)continue;let n=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const j=((y+dy)*sw+xx+dx)*4;if(lum(j)>th)n++;}if(n>=16){minX=Math.min(minX,xx);minY=Math.min(minY,y);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,y)}}
    if(maxX<sw*.45||maxY<sh*.45)return c;const pad=Math.max(4,Math.round(Math.min(sw,sh)*.006));const o=document.createElement('canvas');o.width=Math.round((maxX-minX+2*pad)/S);o.height=Math.round((maxY-minY+2*pad)/S);o.getContext('2d').drawImage(c,(minX-pad)/S,(minY-pad)/S,o.width,o.height,0,0,o.width,o.height);return o;
  }
  function edgeCrop(c){
    try{
      if(window.smartPrintEdgeEngine&&window.cv){
        const q=window.smartPrintEdgeEngine.detect(c); if(q&&q.length===4){
          const m=window.smartPrintEdgeEngine.warp(c,q); if(m){const out=document.createElement('canvas');out.width=m.cols;out.height=m.rows;cv.imshow(out,m);m.delete();return out;}
        }
      }
    }catch(e){console.warn('OpenCV crop fallback',e)}
    return fallbackCrop(c);
  }
  function resizeForProcessing(c,maxSide=2200){if(Math.max(c.width,c.height)<=maxSide)return c;const s=maxSide/Math.max(c.width,c.height),o=document.createElement('canvas');o.width=Math.round(c.width*s);o.height=Math.round(c.height*s);o.getContext('2d').drawImage(c,0,0,o.width,o.height);return o;}
  function xeroxClean(src){
    // Scanner-like illumination correction: estimate the page lighting at low resolution,
    // divide it out, then apply a gentle adaptive contrast. This avoids the crushed-black
    // result of the previous global lift while keeping printed marks intact.
    const c=resizeForProcessing(src,2200),w=c.width,h=c.height,o=document.createElement('canvas');o.width=w;o.height=h;const ctx=o.getContext('2d',{willReadFrequently:true});ctx.drawImage(c,0,0);
    const im=ctx.getImageData(0,0,w,h),d=im.data,sw=Math.max(24,Math.round(w/45)),sh=Math.max(24,Math.round(h/45)),small=document.createElement('canvas');small.width=sw;small.height=sh;const sc=small.getContext('2d');sc.drawImage(c,0,0,sw,sh);const sd=sc.getImageData(0,0,sw,sh).data,illum=new Float32Array(sw*sh);
    for(let i=0,j=0;i<sd.length;i+=4,j++)illum[j]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];
    for(let y=0;y<h;y++){
      const sy=Math.min(sh-1,Math.floor(y*sh/h));
      for(let x=0;x<w;x++){
        const sx=Math.min(sw-1,Math.floor(x*sw/w)),k=(y*w+x)*4,base=Math.max(70,illum[sy*sw+sx]),gray=.2126*d[k]+.7152*d[k+1]+.0722*d[k+2];
        // Normalize illumination around a paper target. Limit gain to protect dark text/seals.
        let n=gray*235/base;n=clamp(128+(n-128)*1.18,0,255);
        d[k]=d[k+1]=d[k+2]=n;
      }
    }
    ctx.putImageData(im,0,0);
    return o;
  }
  function adaptiveBW(c){
    const w=c.width,h=c.height,ctx=c.getContext('2d',{willReadFrequently:true}),im=ctx.getImageData(0,0,w,h),d=im.data;
    // Mild document threshold; retain mid-tones so stamps/photos don't turn into solid black blobs.
    const gray=new Uint8Array(w*h);for(let i=0,j=0;i<d.length;i+=4,j++)gray[j]=Math.round(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2]);
    const radius=Math.max(10,Math.round(Math.min(w,h)*.008)),step=Math.max(4,Math.round(radius/2));
    for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){let sum=0,n=0;for(let yy=Math.max(0,y-radius);yy<=Math.min(h-1,y+radius);yy+=Math.max(1,Math.floor(radius/3)))for(let xx=Math.max(0,x-radius);xx<=Math.min(w-1,x+radius);xx+=Math.max(1,Math.floor(radius/3))){sum+=gray[yy*w+xx];n++;}const local=sum/n-12;for(let yy=y;yy<Math.min(h,y+step);yy++)for(let xx=x;xx<Math.min(w,x+step);xx++){const j=yy*w+xx,g=gray[j];let v=g<local?0:Math.round(clamp((g-local)*2.15+local,0,255));const k=j*4;d[k]=d[k+1]=d[k+2]=v;}}
    ctx.putImageData(im,0,0);return c;
  }
  async function run(){
    const f=$('fileInput')?.files?.[0];if(!f)return alert('Upload the document photo first.');if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return alert('For Scanner Test, upload JPG or PNG.');
    const body=$('previewBody');$('preview').classList.remove('hidden');body.innerHTML='<div class="ai-badge">⏳ Scanner processing the actual uploaded photo…</div>';
    try{
      const original=canvasFromImage(await img(await read(f)));const cropped=edgeCrop(original);let cleaned=xeroxClean(cropped);
      if(($('mode')?.value||'Black & White')==='Black & White')cleaned=adaptiveBW(cleaned);
      resultCanvas=cleaned;
      body.innerHTML='<div class="ai-badge">✓ Scanner output — actual upload cropped/straightened and cleaned for print. Original untouched.</div><div class="preview-sheet"><p><b>Processed document • 1 page</b></p><img src="'+cleaned.toDataURL('image/jpeg',.96)+'" alt="Processed uploaded document"></div>';
    }catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ Scanner processing failed. Original upload is untouched.</div>'}
  }
  function confirm(){if(!resultCanvas)return alert('Run Scanner Preview first.');const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies').value||1),u=resultCanvas.toDataURL('image/jpeg',.96);w.document.write('<html><head><title>NR BizPro Smart Print</title><style>@page{size:'+paper+';margin:10mm}body{margin:0}.p{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>'+Array.from({length:copies},()=>'<div class="p"><img src="'+u+'"></div>').join('')+'<script>onload=()=>setTimeout(()=>print(),250)<\/script></body></html>');w.document.close()}
  window.runScannerPreview=run;window.confirmScannerPrint=confirm;
})();