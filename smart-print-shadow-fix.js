/* NR BizPro Smart Print — controlled camera-shadow correction
   Only corrects the broad left-edge illumination falloff. It does not crop,
   whiten the page, sharpen text, or alter the document geometry. */
(function(){
  'use strict';
  const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
  const clamp=v=>Math.max(0,Math.min(255,v));
  function fixShadow(src,mode){
    const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(src,0,0);
    const im=x.getImageData(0,0,w,h),d=im.data;
    // Estimate the broad left-to-right illumination difference from a small
    // thumbnail, avoiding fine document text and borders.
    const tw=Math.max(32,Math.min(120,Math.round(w/35))),th=Math.max(32,Math.min(160,Math.round(h/35)));
    const sm=document.createElement('canvas');sm.width=tw;sm.height=th;
    const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(src,0,0,tw,th);
    const sd=sx.getImageData(0,0,tw,th).data;
    const col=new Float32Array(tw);
    for(let xx=0;xx<tw;xx++){
      let sum=0,n=0;
      for(let yy=Math.floor(th*.08);yy<Math.floor(th*.92);yy++){
        const i=(yy*tw+xx)*4, v=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];
        if(v>45){sum+=v;n++}
      }
      col[xx]=n?sum/n:200;
    }
    const ref=col[Math.max(1,Math.floor(tw*.82))];
    for(let y=0;y<h;y++){
      for(let xx=0;xx<w;xx++){
        const xn=xx/Math.max(1,w-1);
        // Correction is limited to the left ~38%, then fades smoothly to zero.
        let zone=1-Math.min(1,Math.max(0,(xn-.02)/.36));
        zone=zone*zone*(3-2*zone);
        const fx=xn*(tw-1),a=Math.floor(fx),b=Math.min(tw-1,a+1),t=fx-a;
        const local=col[a]*(1-t)+col[b]*t;
        let gain=ref/Math.max(55,local);
        gain=Math.max(1,Math.min(1.28,gain));
        gain=1+(gain-1)*zone;
        const i=(y*w+xx)*4,r=d[i],g=d[i+1],b0=d[i+2],lum=.2126*r+.7152*g+.0722*b0;
        // Protect dark ink/stamps from being lifted; paper gets the correction.
        const protect=Math.max(0,Math.min(1,(lum-32)/90));
        const eg=1+(gain-1)*protect;
        let nr=clamp(r*eg),ng=clamp(g*eg),nb=clamp(b0*eg);
        if(mode==='Black & White'){const v=clamp(.2126*nr+.7152*ng+.0722*nb);nr=ng=nb=v}
        d[i]=nr;d[i+1]=ng;d[i+2]=nb;
      }
    }
    x.putImageData(im,0,0);return c;
  }
  const original=window.previewPrint;
  window.previewPrint=async function(){
    const input=document.getElementById('fileInput');
    const f=input&&input.files&&input.files[0];
    if(!f||f.type==='application/pdf'||/\.pdf$/i.test(f.name)) return original?original():alert('Upload a WhatsApp image or PDF first.');
    if(window.canPrint&&!window.canPrint())return;
    try{
      const src=await new Promise((ok,bad)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=bad;r.readAsDataURL(f)});
      const im=await load(src),mode=document.getElementById('mode')?.value||'Color';
      const out=fixShadow(im,mode),page=out.toDataURL('image/png');
      window.__shadowFixedPages=[page];
      const copies=Math.max(1,+document.getElementById('copies').value||1);
      const body=document.getElementById('previewBody');
      body.innerHTML=`<div class="ai-badge">✓ Xerox Clean — left camera shadow gently corrected; original document colours/details preserved.</div><div class="preview-sheet"><p><b>Document • Page 1 • ${copies} copy/copies</b></p><img src="${page}" alt="Print preview page 1"></div>`;
      document.getElementById('preview').classList.remove('hidden');
    }catch(e){console.error(e);alert('Preview could not be prepared. Please try the original WhatsApp photo again.')}
  };
  window.confirmPrint=function(){
    const pages=window.__shadowFixedPages||[];if(!pages.length)return alert('Prepare the preview first.');
    const copies=Math.max(1,+document.getElementById('copies').value||1),paper=document.getElementById('paper').value,w=window.open('','_blank');
    if(!w)return alert('Allow pop-ups to print.');
    const all=[];for(let i=0;i<copies;i++)all.push(...pages);
    w.document.write(`<html><head><title>NR BizPro Smart Print</title><style>@page{size:${paper};margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>${all.map(p=>`<div class="page"><img src="${p}"></div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\\/script></body></html>`);w.document.close();
    setTimeout(()=>{try{const key='nr-bizpro-smart-print-customer-test-v1',allData=JSON.parse(localStorage.getItem(key)||'{}');if(location.search.includes('customerTest=1')){allData.test=allData.test||{licensed:false,expires:null,trialCopies:0};allData.test.trialCopies=(allData.test.trialCopies||0)+copies;localStorage.setItem(key,JSON.stringify(allData))}}catch(e){}document.getElementById('preview').classList.add('hidden');window.__shadowFixedPages=[]},1200);
  };
})();
