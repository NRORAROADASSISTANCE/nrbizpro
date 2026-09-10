/* NR BizPro Smart Print — adaptive Xerox shadow removal */
(function(){
'use strict';
function cleanDataUrl(src){return new Promise(resolve=>{const im=new Image();im.onload=()=>{try{
 const maxW=2480,maxH=3508,scale=Math.min(1.25,maxW/im.naturalWidth,maxH/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 const data=ctx.getImageData(0,0,w,h),d=data.data;
 /* Estimate the slow camera-lighting/shadow field from a tiny blurred copy. */
 const bw=Math.max(24,Math.round(w/35)),bh=Math.max(24,Math.round(h/35)),bg=document.createElement('canvas');bg.width=bw;bg.height=bh;const bx=bg.getContext('2d');bx.drawImage(c,0,0,bw,bh);const bd=bx.getImageData(0,0,bw,bh).data;
 for(let y=0;y<h;y++){
   const gy=(y+.5)*bh/h-.5,y0=Math.max(0,Math.floor(gy)),y1=Math.min(bh-1,y0+1),fy=gy-y0;
   for(let x=0;x<w;x++){
     const gx=(x+.5)*bw/w-.5,x0=Math.max(0,Math.floor(gx)),x1=Math.min(bw-1,x0+1),fx=gx-x0;
     const p00=(y0*bw+x0)*4,p10=(y0*bw+x1)*4,p01=(y1*bw+x0)*4,p11=(y1*bw+x1)*4;
     const br=.2126*(bd[p00]*(1-fx)*(1-fy)+bd[p10]*fx*(1-fy)+bd[p01]*(1-fx)*fy+bd[p11]*fx*fy)+.7152*(bd[p00+1]*(1-fx)*(1-fy)+bd[p10+1]*fx*(1-fy)+bd[p01+1]*(1-fx)*fy+bd[p11+1]*fx*fy)+.0722*(bd[p00+2]*(1-fx)*(1-fy)+bd[p10+2]*fx*(1-fy)+bd[p01+2]*(1-fx)*fy+bd[p11+2]*fx*fy);
     const i=(y*w+x)*4,lum=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
     /* Divide out illumination instead of adding white; this preserves dark ink. */
     let v=lum*(242/Math.max(70,br));
     v=Math.max(0,Math.min(255,v));
     /* Keep ink strong while gently whitening paper. */
     if(v>185)v=185+(v-185)*1.55;
     if(v>238)v=255;
     if(v<38)v=v*.82;
     d[i]=d[i+1]=d[i+2]=Math.max(0,Math.min(255,v));
   }
 }
 ctx.putImageData(data,0,0);resolve(c.toDataURL('image/png'));
}catch(e){console.warn('Xerox cleaner fallback',e);resolve(src)}};im.onerror=()=>resolve(src);im.src=src})}
const originalPreview=window.previewPrint;if(typeof originalPreview!=='function')return;let cleaned=[];
window.previewPrint=async function(){await originalPreview.apply(this,arguments);const imgs=[...document.querySelectorAll('#previewBody .preview-sheet img')];cleaned=[];for(const img of imgs){const s=await cleanDataUrl(img.src);cleaned.push(s);img.src=s}const badge=document.querySelector('#previewBody .ai-badge');if(badge)badge.textContent='✓ Xerox Clean — camera shadow corrected, paper whitened, original document details preserved.'};
const originalConfirm=window.confirmPrint;if(typeof originalConfirm==='function'){window.confirmPrint=function(){if(!cleaned.length)return originalConfirm.apply(this,arguments);const oldOpen=window.open;window.open=function(){const real=oldOpen.apply(window,arguments);if(!real)return real;const oldWrite=real.document.write.bind(real.document);real.document.write=function(html){let i=0;html=html.replace(/<img src="([^"]+)"/g,(m)=>i<cleaned.length?'<img src="'+cleaned[i++]+'"':m);return oldWrite(html)};return real};try{return originalConfirm.apply(this,arguments)}finally{window.open=oldOpen}}}
})();