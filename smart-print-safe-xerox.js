/* NR BizPro Smart Print — localized left-shadow correction
   Only corrects the camera shadow on the left side. No global whitening,
   sharpening, grayscale, rotation or perspective changes. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function process(src,mode){return new Promise(resolve=>{const im=new Image();im.onload=()=>{try{
 const maxW=2480,maxH=3508,s=Math.min(1.35,maxW/im.naturalWidth,maxH/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 const a=ctx.getImageData(0,0,w,h),d=a.data;
 /* Very low-resolution illumination map. This captures only smooth camera shadow, not text/security lines. */
 const bw=Math.max(32,Math.ceil(w/48)),bh=Math.max(32,Math.ceil(h/48));
 const bg=document.createElement('canvas');bg.width=bw;bg.height=bh;const bx=bg.getContext('2d',{willReadFrequently:true});bx.drawImage(c,0,0,bw,bh);const bd=bx.getImageData(0,0,bw,bh).data;
 const rowRef=new Float32Array(bh);
 for(let yy=0;yy<bh;yy++){const vals=[];for(let xx=Math.floor(bw*.72);xx<bw;xx++){const j=(yy*bw+xx)*4;vals.push(.2126*bd[j]+.7152*bd[j+1]+.0722*bd[j+2])}vals.sort((a,b)=>a-b);rowRef[yy]=vals[Math.floor(vals.length*.72)]||205}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const xn=x/w;
   /* Shadow correction exists only on the left 50%; fades to zero before the centre-right. */
   const mask=xn<.10?1:xn<.50?(.50-xn)/.40:0;if(mask<=0)continue;
   const gy=Math.min(bh-1,Math.max(0,Math.round(y*bh/h)));const gx=Math.min(bw-1,Math.max(0,Math.round(x*bw/w)));
   const j=(gy*bw+gx)*4;const local=.2126*bd[j]+.7152*bd[j+1]+.0722*bd[j+2];
   const ref=rowRef[gy];
   /* Correct only when the left illumination is substantially darker than the right reference. */
   const deficit=Math.max(0,ref-local-8);if(deficit<10)continue;
   const strength=Math.min(1,deficit/120);
   const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],lum=.2126*r+.7152*g+.0722*b;
   /* Protect ink: very dark pixels receive almost no lift; paper/midtones receive the correction. */
   const tone=lum<45?0:lum<175?(lum-45)/130:1;
   const lift=1+(Math.min(2.05,ref/Math.max(55,local))-1)*mask*strength*tone;
   if(mode==='Black & White'){
      const v=Math.max(0,Math.min(255,lum*lift));d[i]=d[i+1]=d[i+2]=v;
   }else{
      /* Luminance-only lift: preserve the original RGB ratios/colour. */
      d[i]=Math.min(255,r*lift);d[i+1]=Math.min(255,g*lift);d[i+2]=Math.min(255,b*lift);
   }
 }
 ctx.putImageData(a,0,0);resolve(c.toDataURL('image/jpeg',.98));
}catch(e){console.warn('Left-shadow correction fallback',e);resolve(src)}};im.onerror=()=>resolve(src);im.src=src})}
const corePreview=window.previewPrint;if(typeof corePreview!=='function')return;let cleaned=[];
window.previewPrint=async function(){
 const safe=$('safeEnhance'),straight=$('autoStraighten'),os=safe?safe.checked:false,od=straight?straight.checked:false;
 if(safe)safe.checked=false;if(straight)straight.checked=false;
 try{await corePreview.apply(this,arguments)}finally{if(safe)safe.checked=os;if(straight)straight.checked=od}
 const imgs=[...document.querySelectorAll('#previewBody .preview-sheet img')];cleaned=[];
 for(const img of imgs){const s=await process(img.src,$('mode')?.value||'Color');cleaned.push(s);img.src=s}
 const badge=document.querySelector('#previewBody .ai-badge');if(badge)badge.textContent='✓ Left camera shadow cleaned; document colour and details preserved.';
};
const coreConfirm=window.confirmPrint;if(typeof coreConfirm==='function')window.confirmPrint=function(){
 if(!cleaned.length)return coreConfirm.apply(this,arguments);const oldOpen=window.open;window.open=function(){const win=oldOpen.apply(window,arguments);if(!win)return win;const write=win.document.write.bind(win.document);win.document.write=function(html){let i=0;html=html.replace(/<img src="([^"]+)"/g,(m)=>i<cleaned.length?'<img src="'+cleaned[i++]+'"':m);return write(html)};return win};
 try{return coreConfirm.apply(this,arguments)}finally{window.open=oldOpen}
};
})();
