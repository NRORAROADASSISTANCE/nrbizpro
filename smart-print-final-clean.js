(function(){
  const $=id=>document.getElementById(id);
  const state={pages:[]};
  const basePreview=window.previewPrint;
  function readFile(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
  function load(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src})}
  function clamp(v){return Math.max(0,Math.min(255,v))}
  function blurMap(map,w,h){
    const a=new Float32Array(map),b=new Float32Array(map.length);
    // Small repeated box blur gives a smooth illumination field while staying fast in-browser.
    for(let pass=0;pass<5;pass++){
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        let sum=0,n=0;
        for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
          const yy=y+dy,xx=x+dx;if(yy>=0&&yy<h&&xx>=0&&xx<w){sum+=a[yy*w+xx];n++}
        }
        b[y*w+x]=sum/n;
      }
      a.set(b);
    }
    return a;
  }
  function cleanCanvas(src,mode){
    const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
    const out=document.createElement('canvas');out.width=w;out.height=h;
    const ctx=out.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,0,0);
    const im=ctx.getImageData(0,0,w,h),d=im.data;
    // Estimate broad camera illumination at low resolution. This targets uneven lighting/shadows,
    // not document ink, so the original RGB ratios are retained.
    const sw=Math.max(64,Math.min(96,Math.round(w/16))),sh=Math.max(80,Math.min(128,Math.round(h/16)));
    const sm=document.createElement('canvas');sm.width=sw;sm.height=sh;
    const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(src,0,0,sw,sh);
    const sd=sx.getImageData(0,0,sw,sh).data,raw=new Float32Array(sw*sh);
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const i=(y*sw+x)*4;raw[y*sw+x]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2]}
    const illum=blurMap(raw,sw,sh);
    for(let y=0;y<h;y++){
      const fy=y*(sh-1)/Math.max(1,h-1),y0=Math.floor(fy),y1=Math.min(sh-1,y0+1),ty=fy-y0;
      for(let x=0;x<w;x++){
        const fx=x*(sw-1)/Math.max(1,w-1),x0=Math.floor(fx),x1=Math.min(sw-1,x0+1),tx=fx-x0;
        const q0=illum[y0*sw+x0]*(1-tx)+illum[y0*sw+x1]*tx;
        const q1=illum[y1*sw+x0]*(1-tx)+illum[y1*sw+x1]*tx;
        const local=Math.max(38,q0*(1-ty)+q1*ty);
        const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2];
        const l=.2126*r+.7152*g+.0722*b;
        // A pixel whose local neighbourhood is also dark is likely shadowed paper.
        // A very dark pixel inside bright neighbourhood is likely ink and is protected.
        const ratio=l/local;
        const paper=Math.max(0,Math.min(1,(ratio-.48)/.24));
        let gain=215/local;
        gain=Math.max(1,Math.min(2.75,gain));
        // Fade correction gradually toward the centre/right so genuine colour gradients remain.
        const xn=x/Math.max(1,w-1);
        let zone=1-Math.min(1,Math.max(0,(xn-.02)/.78));
        zone=zone*zone*(3-2*zone);
        const eg=1+(gain-1)*paper*zone;
        let nr=clamp(r*eg),ng=clamp(g*eg),nb=clamp(b*eg);
        if(mode==='Black & White'){
          let v=.2126*nr+.7152*ng+.0722*nb;
          // Clean Xerox-style grayscale while retaining handwriting, stamps and fine lines.
          v=clamp((v-8)*1.08+8);
          nr=ng=nb=v;
        }
        d[i]=nr;d[i+1]=ng;d[i+2]=nb;
      }
    }
    ctx.putImageData(im,0,0);return out;
  }
  async function makePages(){
    const input=$('fileInput'),file=input&&input.files&&input.files[0];
    if(!file)return null;
    if(file.type==='application/pdf'||/\.pdf$/i.test(file.name))return null;
    const src=await readFile(file),im=await load(src),mode=$('mode')?.value||'Color';
    const c=cleanCanvas(im,mode);return [c.toDataURL('image/png')];
  }
  window.previewPrint=async function(){
    const input=$('fileInput');
    if(!input?.files?.length)return alert('Upload a WhatsApp image or PDF first.');
    // Keep the proven core PDF flow untouched.
    if(input.files[0].type==='application/pdf'||/\.pdf$/i.test(input.files[0].name))return basePreview&&basePreview();
    if(window.canPrint&&!window.canPrint())return;
    try{
      const pages=await makePages();
      if(!pages)return basePreview&&basePreview();
      state.pages=pages;
      const copies=Math.max(1,+$('copies').value||1);
      $('previewBody').innerHTML=`<div class="ai-badge">✓ Smart Xerox Clean — left camera shadow reduced, original colour preserved.</div>${pages.map((p,i)=>`<div class="preview-sheet"><p><b>${window.type==='passport'?'Passport Photo':window.type==='id'?'ID Card':'Document'} • Page ${i+1} • ${copies} copy/copies</b></p><img src="${p}" alt="Print preview page ${i+1}"></div>`).join('')}`;
      $('preview').classList.remove('hidden');
    }catch(e){console.error(e);alert('Preview could not be prepared. Please upload the original WhatsApp photo again.')}
  };
  window.confirmPrint=function(){
    if(!state.pages.length)return alert('Prepare the preview first.');
    const copies=Math.max(1,+$('copies').value||1),paper=$('paper').value;
    const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');
    const pages=[];for(let i=0;i<copies;i++)pages.push(...state.pages);
    w.document.write(`<html><head><title>NR BizPro Smart Print</title><style>@page{size:${paper};margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>${pages.map(p=>`<div class="page"><img src="${p}"></div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script></body></html>`);w.document.close();
    setTimeout(()=>{if(location.search.includes('customerTest=1')){try{const key='nr-bizpro-smart-print-customer-test-v1',all=JSON.parse(localStorage.getItem(key)||'{}');all.test=all.test||{licensed:false,expires:null,trialCopies:0};all.test.trialCopies=(all.test.trialCopies||0)+copies;localStorage.setItem(key,JSON.stringify(all))}catch(e){}}$('preview').classList.add('hidden')},1200);
  };
})();