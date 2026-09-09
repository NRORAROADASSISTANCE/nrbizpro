/* NR BizPro Smart Print — scanner preview. Takes over Preview immediately; OpenCV is awaited inside processing. */
(function(){
  let scannerPages=[];
  const $=id=>document.getElementById(id);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function waitForCV(timeout=15000){
    const start=Date.now();
    while(Date.now()-start<timeout){
      if(window.smartPrintEdgeEngine&&window.cv&&window.cv.Mat)return true;
      await sleep(150);
    }
    return false;
  }
  const readFile=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
  function fallbackCrop(canvas){
    const w=canvas.width,h=canvas.height,max=900,s=Math.min(1,max/Math.max(w,h)),sw=Math.max(20,Math.round(w*s)),sh=Math.max(20,Math.round(h*s));
    const c=document.createElement('canvas');c.width=sw;c.height=sh;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(canvas,0,0,sw,sh);const a=x.getImageData(0,0,sw,sh).data;
    let sum=0,n=0;for(let i=0;i<a.length;i+=4){sum+=.2126*a[i]+.7152*a[i+1]+.0722*a[i+2];n++;}const mean=sum/n,thr=Math.max(125,Math.min(220,mean+18));
    let minX=sw,minY=sh,maxX=0,maxY=0,count=0;for(let y=1;y<sh-1;y++)for(let xx=1;xx<sw-1;xx++){const i=(y*sw+xx)*4,g=.2126*a[i]+.7152*a[i+1]+.0722*a[i+2];if(g>thr){let near=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=((y+dy)*sw+xx+dx)*4;const q=.2126*a[j]+.7152*a[j+1]+.0722*a[j+2];if(q>thr)near++;}if(near>=5){minX=Math.min(minX,xx);minY=Math.min(minY,y);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,y);count++;}}}
    if(count<sw*sh*.12||maxX-minX<sw*.35||maxY-minY<sh*.35)return {canvas,detected:false};
    const pad=Math.max(3,Math.round(Math.min(sw,sh)*.012));minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);maxX=Math.min(sw-1,maxX+pad);maxY=Math.min(sh-1,maxY+pad);
    const out=document.createElement('canvas');out.width=Math.round((maxX-minX)/s);out.height=Math.round((maxY-minY)/s);out.getContext('2d').drawImage(canvas,minX/s,minY/s,out.width,out.height,0,0,out.width,out.height);return {canvas:out,detected:true};
  }
  function clean(src){
    const w=src.width,h=src.height,out=document.createElement('canvas');out.width=w;out.height=h;const c=out.getContext('2d',{willReadFrequently:true});c.drawImage(src,0,0);
    const im=c.getImageData(0,0,w,h),d=im.data,smallW=Math.max(32,Math.round(w/24)),smallH=Math.max(32,Math.round(h/24)),sample=document.createElement('canvas');sample.width=smallW;sample.height=smallH;const sc=sample.getContext('2d');sc.drawImage(out,0,0,smallW,smallH);const sd=sc.getImageData(0,0,smallW,smallH).data,gray=new Float32Array(smallW*smallH);
    for(let i=0,j=0;i<sd.length;i+=4,j++)gray[j]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];
    for(let y=0;y<h;y++){const sy=Math.min(smallH-1,Math.floor(y*smallH/h));for(let xx=0;xx<w;xx++){const sx=Math.min(smallW-1,Math.floor(xx*smallW/w)),base=gray[sy*smallW+sx],i=(y*w+xx)*4;let r=d[i],g=d[i+1],b=d[i+2],lum=.2126*r+.7152*g+.0722*b;const shadow=Math.max(0,190-base);if(shadow>0){const k=Math.min(.30,shadow/300);r+=k*(255-r);g+=k*(255-g);b+=k*(255-b)}if(lum>188){const k=Math.min(.10,(lum-188)/670);r+=255*k;g+=255*k;b+=255*k}d[i]=Math.min(255,r);d[i+1]=Math.min(255,g);d[i+2]=Math.min(255,b)}}
    c.putImageData(im,0,0);return out;
  }
  async function process(){
    const f=$('fileInput')?.files?.[0];if(!f)return alert('Upload a WhatsApp image or PDF first.');
    if(/\.pdf$/i.test(f.name)||f.type==='application/pdf')return alert('PDF scanner processing will be handled separately. For this test, upload the WhatsApp JPG/PNG photo.');
    const src=await readFile(f),im=await image(src),base=document.createElement('canvas');base.width=im.naturalWidth||im.width;base.height=im.naturalHeight||im.height;base.getContext('2d').drawImage(im,0,0);
    const cvReady=await waitForCV();let final=base,detected=false;
    if(cvReady){try{const pts=window.smartPrintEdgeEngine.detect(base);if(pts){const mat=cv.imread(base),warped=window.smartPrintEdgeEngine.warp(mat,pts),wc=document.createElement('canvas');wc.width=warped.cols;wc.height=warped.rows;cv.imshow(wc,warped);final=wc;detected=true;mat.delete();warped.delete();}}catch(e){console.warn('Perspective processing failed',e)}}
    if(!detected){const fb=fallbackCrop(base);final=fb.canvas;detected=fb.detected;}
    scannerPages=[clean(final)];
    const mode=$('mode')?.value||'Black & White';
    if(mode==='Black & White'){
      const x=scannerPages[0].getContext('2d',{willReadFrequently:true}),ii=x.getImageData(0,0,scannerPages[0].width,scannerPages[0].height),d=ii.data;
      for(let i=0;i<d.length;i+=4){const y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];const bw=y<118?Math.max(0,y*.55):y>224?255:Math.round((y-118)*1.86+65);d[i]=d[i+1]=d[i+2]=Math.max(0,Math.min(255,bw))}x.putImageData(ii,0,0);
    }
    const dataUrl=scannerPages[0].toDataURL('image/jpeg',.94);
    $('previewBody').innerHTML=`<div class="ai-badge">✓ Scanner Clean — ${detected?'document boundary cropped':'automatic boundary not confident; framing retained'} • perspective correction when available • shadows flattened • original upload untouched</div><div class="preview-sheet"><p><b>Document • 1 page • ${Math.max(1,+$('copies').value||1)} copy/copies</b></p><img src="${dataUrl}" alt="Actual uploaded document cleaned for print"></div>`;
    $('preview').classList.remove('hidden');
  }
  function confirm(){if(!scannerPages.length)return alert('Prepare the scanner preview first.');const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies').value||1),w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');const dataUrl=scannerPages[0].toDataURL('image/jpeg',.94);w.document.write(`<html><head><title>NR BizPro Smart Print</title><style>@page{size:${paper};margin:10mm}body{margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>${Array.from({length:copies},()=>`<div class="page"><img src="${dataUrl}"></div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script></body></html>`);w.document.close();}
  // Take over immediately; do not wait for OpenCV before replacing the old preview handler.
  window.previewPrint=process;window.printNow=process;window.confirmPrint=confirm;
})();