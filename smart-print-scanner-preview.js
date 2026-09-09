/* NR BizPro Smart Print — real uploaded-image scanner preview. */
(function(){
  let scannerPages=[];
  const $=id=>document.getElementById(id);
  const wait=fn=>{if(window.smartPrintEdgeEngine&&window.cv&&cv.Mat)return fn();setTimeout(()=>wait(fn),250)};
  const readFile=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
  function clean(src){
    const w=src.width,h=src.height,out=document.createElement('canvas');out.width=w;out.height=h;const c=out.getContext('2d',{willReadFrequently:true});c.drawImage(src,0,0);
    const im=c.getImageData(0,0,w,h),d=im.data, smallW=Math.max(32,Math.round(w/18)),smallH=Math.max(32,Math.round(h/18)),sample=document.createElement('canvas');sample.width=smallW;sample.height=smallH;const sc=sample.getContext('2d');sc.drawImage(out,0,0,smallW,smallH);const sd=sc.getImageData(0,0,smallW,smallH).data;
    const gray=new Float32Array(smallW*smallH);for(let i=0,j=0;i<sd.length;i+=4,j++)gray[j]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];
    for(let y=0;y<h;y++){const sy=Math.min(smallH-1,Math.floor(y*h?y*smallH/h:0));for(let x=0;x<w;x++){const sx=Math.min(smallW-1,Math.floor(x*smallW/w)),base=gray[sy*smallW+sx],i=(y*w+x)*4;let r=d[i],g=d[i+1],b=d[i+2],lum=.2126*r+.7152*g+.0722*b;const shadow=Math.max(0,base-190);if(shadow>0){const k=Math.min(.42,shadow/160);r+=k*(255-r);g+=k*(255-g);b+=k*(255-b)}const paper=Math.max(0,lum-185)/70;const lift=Math.min(.18,paper*.18);r+=255*lift;g+=255*lift;b+=255*lift;d[i]=Math.max(0,Math.min(255,r));d[i+1]=Math.max(0,Math.min(255,g));d[i+2]=Math.max(0,Math.min(255,b))}}
    c.putImageData(im,0,0);return out;
  }
  async function process(){
    const f=$('fileInput')?.files?.[0];if(!f)return alert('Upload a WhatsApp image or PDF first.');
    if(/\.pdf$/i.test(f.name)||f.type==='application/pdf')return window.__smartScannerFallback?.();
    await new Promise(r=>wait(r));
    const src=await readFile(f),im=await image(src),base=document.createElement('canvas');base.width=im.naturalWidth||im.width;base.height=im.naturalHeight||im.height;base.getContext('2d').drawImage(im,0,0);
    let final=base,detected=false;
    if(window.smartPrintEdgeEngine&&window.cv&&cv.Mat){const pts=window.smartPrintEdgeEngine.detect(base);if(pts){const mat=cv.imread(base),warped=window.smartPrintEdgeEngine.warp(mat,pts),wc=document.createElement('canvas');wc.width=warped.cols;wc.height=warped.rows;cv.imshow(wc,warped);final=wc;detected=true;mat.delete();warped.delete();}}
    scannerPages=[clean(final)];
    const mode=$('mode')?.value||'Black & White';
    if(mode==='Black & White'){
      const x=scannerPages[0].getContext('2d',{willReadFrequently:true}),ii=x.getImageData(0,0,scannerPages[0].width,scannerPages[0].height),d=ii.data;
      for(let i=0;i<d.length;i+=4){const y=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];const bw=y<128?Math.max(0,y*.45):y>218?255:Math.round((y-128)*1.75+58);d[i]=d[i+1]=d[i+2]=Math.max(0,Math.min(255,bw))}x.putImageData(ii,0,0);
    }
    const dataUrl=scannerPages[0].toDataURL('image/png');
    $('previewBody').innerHTML=`<div class="ai-badge">✓ Scanner Clean — ${detected?'document edges cropped + perspective corrected':'document boundary not confidently detected; original framing retained'} • shadows flattened • paper cleaned • original upload untouched</div><div class="preview-sheet"><p><b>Document • 1 page • ${Math.max(1,+$('copies').value||1)} copy/copies</b></p><img src="${dataUrl}" alt="Clean scanner preview"></div>`;
    $('preview').classList.remove('hidden');
  }
  function confirm(){if(!scannerPages.length)return alert('Prepare the scanner preview first.');const paper=$('paper')?.value||'A4',copies=Math.max(1,+$('copies').value||1),w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');const dataUrl=scannerPages[0].toDataURL('image/png');w.document.write(`<html><head><title>NR BizPro Smart Print</title><style>@page{size:${paper};margin:10mm}body{margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>${Array.from({length:copies},()=>`<div class="page"><img src="${dataUrl}"></div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script></body></html>`);w.document.close();setTimeout(()=>{scannerPages=[];window.closePreview?.();},700)}
  wait(()=>{window.__smartScannerFallback=window.__smartScannerFallback||null;window.previewPrint=process;window.printNow=process;window.confirmPrint=confirm;});
})();