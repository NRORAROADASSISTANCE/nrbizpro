(function(){
  const $=id=>document.getElementById(id);
  const state={pages:[]};
  function readFile(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
  function load(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=src})}
  function clamp(v){return Math.max(0,Math.min(255,v))}
  function cleanCanvas(src,mode){
    const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
    const out=document.createElement('canvas');out.width=w;out.height=h;
    const ctx=out.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,0,0);
    const im=ctx.getImageData(0,0,w,h),d=im.data;
    // Low-resolution illumination map. It is used only to correct camera lighting,
    // not to sharpen, whiten, recolor, or rewrite document pixels.
    const sw=Math.max(48,Math.min(180,Math.round(w/28))),sh=Math.max(48,Math.min(220,Math.round(h/28)));
    const sm=document.createElement('canvas');sm.width=sw;sm.height=sh;const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(src,0,0,sw,sh);
    const sd=sx.getImageData(0,0,sw,sh).data;
    const lum=new Float32Array(sw*sh);
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){const i=(y*sw+x)*4;lum[y*sw+x]=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2]}
    // Reference is the bright, relatively even part of each row (normally the right side).
    const ref=new Float32Array(sh);
    for(let y=0;y<sh;y++){
      const a=[];for(let x=Math.floor(sw*.62);x<sw;x++)a.push(lum[y*sw+x]);
      a.sort((p,q)=>p-q);ref[y]=a[Math.floor(a.length*.58)]||210;
    }
    for(let y=0;y<h;y++){
      const fy=y*(sh-1)/Math.max(1,h-1),y0=Math.floor(fy),y1=Math.min(sh-1,y0+1),ty=fy-y0;
      const ry=ref[y0]*(1-ty)+ref[y1]*ty;
      for(let x=0;x<w;x++){
        const fx=x*(sw-1)/Math.max(1,w-1),x0=Math.floor(fx),x1=Math.min(sw-1,x0+1),tx=fx-x0;
        const l0=lum[y0*sw+x0]*(1-tx)+lum[y0*sw+x1]*tx;
        const l1=lum[y1*sw+x0]*(1-tx)+lum[y1*sw+x1]*tx;
        const local=Math.max(35,l0*(1-ty)+l1*ty);
        // Only the left/upper camera-shadow zone is eligible. Correction fades to zero.
        const xn=x/Math.max(1,w-1);
        let zone=1-Math.min(1,Math.max(0,(xn-.02)/.58));
        zone=zone*zone*(3-2*zone);
        const desired=Math.min(ry,225);
        let gain=desired/local;
        gain=Math.max(1,Math.min(1.48,gain));
        gain=1+(gain-1)*zone;
        const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],l=.2126*r+.7152*g+.0722*b;
        // Protect ink and very dark printed details from being lifted like paper.
        const protect=Math.max(0,Math.min(1,(l-38)/105));
        const eg=1+(gain-1)*protect;
        let nr=clamp(r*eg),ng=clamp(g*eg),nb=clamp(b*eg);
        if(mode==='Black & White'){
          let v=.2126*nr+.7152*ng+.0722*nb;
          v=clamp(v);
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
    if(window.canPrint&&!window.canPrint())return;
    const input=$('fileInput');if(!input?.files?.length)return alert('Upload a WhatsApp image or PDF first.');
    try{
      const pages=await makePages();
      if(!pages)return alert('For PDF files, use the normal PDF preview.');
      state.pages=pages;
      const copies=Math.max(1,+$('copies').value||1);
      $('previewBody').innerHTML=`<div class="ai-badge">✓ Smart Xerox Clean — left camera shadow reduced, original colour preserved.</div>${pages.map((p,i)=>`<div class="preview-sheet"><p><b>${window.type==='passport'?'Passport Photo':window.type==='id'?'ID Card':'Document'} • Page ${i+1} • ${copies} copy/copies</b></p><img src="${p}" alt="Print preview page ${i+1}"></div>`).join('')}`;
      $('preview').classList.remove('hidden');
    }catch(e){console.error(e);alert('Preview could not be prepared. Please upload the original WhatsApp photo again.')}
  };
  window.confirmPrint=function(){
    if(!state.pages.length)return alert('Prepare the preview first.');
    const copies=Math.max(1,+$('copies').value||1),paper=$('paper').value,mode=$('mode').value;
    const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');
    const pages=[];for(let i=0;i<copies;i++)pages.push(...state.pages);
    w.document.write(`<html><head><title>NR BizPro Smart Print</title><style>@page{size:${paper};margin:10mm}body{font-family:Arial;margin:0}.page{page-break-after:always;display:flex;justify-content:center;align-items:center;min-height:calc(297mm - 20mm)}img{max-width:100%;max-height:277mm;object-fit:contain}</style></head><body>${pages.map(p=>`<div class="page"><img src="${p}"></div>`).join('')}<script>window.onload=()=>setTimeout(()=>window.print(),250);window.onafterprint=()=>window.close();<\/script></body></html>`);w.document.close();
    setTimeout(()=>{if(window.CUSTOMER_TEST||location.search.includes('customerTest=1')){try{const key='nr-bizpro-smart-print-customer-test-v1',all=JSON.parse(localStorage.getItem(key)||'{}');all.test=all.test||{licensed:false,expires:null,trialCopies:0};all.test.trialCopies=(all.test.trialCopies||0)+copies;localStorage.setItem(key,JSON.stringify(all))}catch(e){}}$('preview').classList.add('hidden')},1200);
  };
})();