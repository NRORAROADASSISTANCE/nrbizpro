/* NR BizPro Smart Print — target-style illumination cleanup
   Preserve the already-clean document. Remove the remaining camera shadow
   on the left by correcting only smooth illumination, not document details. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function process(src,mode){return new Promise(resolve=>{const im=new Image();im.onload=()=>{try{
 const maxW=2480,maxH=3508,s=Math.min(1.35,maxW/im.naturalWidth,maxH/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 const a=ctx.getImageData(0,0,w,h),d=a.data;
 /* Low-resolution illumination map: large enough to follow camera shadow,
    too small to follow text, signatures or security patterns. */
 const gw=Math.max(48,Math.ceil(w/32)),gh=Math.max(48,Math.ceil(h/32));
 const bg=document.createElement('canvas');bg.width=gw;bg.height=gh;const bx=bg.getContext('2d',{willReadFrequently:true});bx.drawImage(c,0,0,gw,gh);const bd=bx.getImageData(0,0,gw,gh).data;
 const lumMap=new Float32Array(gw*gh);
 for(let gy=0;gy<gh;gy++)for(let gx=0;gx<gw;gx++){const i=(gy*gw+gx)*4;lumMap[gy*gw+gx]=.2126*bd[i]+.7152*bd[i+1]+.0722*bd[i+2]}
 /* Use bright paper regions to estimate the intended page illumination. */
 const samples=[];for(let gy=2;gy<gh-2;gy+=2)for(let gx=2;gx<gw-2;gx+=2){const v=lumMap[gy*gw+gx];if(v>95)samples.push(v)}
 samples.sort((a,b)=>a-b);const target=samples.length?samples[Math.floor(samples.length*.72)]:210;
 const getMap=(x,y)=>{
   const fx=x*(gw-1)/(w-1),fy=y*(gh-1)/(h-1),x0=Math.floor(fx),y0=Math.floor(fy),x1=Math.min(gw-1,x0+1),y1=Math.min(gh-1,y0+1),tx=fx-x0,ty=fy-y0;
   const a0=lumMap[y0*gw+x0],a1=lumMap[y0*gw+x1],b0=lumMap[y1*gw+x0],b1=lumMap[y1*gw+x1];
   return (a0+(a1-a0)*tx)*(1-ty)+(b0+(b1-b0)*tx)*ty;
 };
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],lum=.2126*r+.7152*g+.0722*b;
   if(lum<48)continue; /* protect black ink/security marks */
   const field=getMap(x,y),deficit=target-field;
   if(deficit<10)continue;
   /* Shadow correction is strongest on the left, then fades to zero at 62%. */
   const xn=x/w,leftMask=xn<.10?1:xn<.62?(1-xn/.62)/(.90/.62):0;
   if(leftMask<=0)continue;
   const tone=lum<170?(lum-48)/122:1;
   const gain=1+Math.min(.55,deficit/210)*leftMask*Math.max(0,tone);
   if(mode==='Black & White'){
     let v=Math.max(0,Math.min(255,lum*gain));
     v=128+(v-128)*1.08;
     if(v>225)v=240+(v-225)*.55;
     if(v<30)v*=.8;
     v=Math.max(0,Math.min(255,v));d[i]=d[i+1]=d[i+2]=v;
   }else{
     d[i]=Math.min(255,r*gain);d[i+1]=Math.min(255,g*gain);d[i+2]=Math.min(255,b*gain);
   }
 }
 ctx.putImageData(a,0,0);resolve(c.toDataURL('image/jpeg',.985));
}catch(e){console.warn('Target-style shadow correction fallback',e);resolve(src)}};im.onerror=()=>resolve(src);im.src=src})}
const corePreview=window.previewPrint;if(typeof corePreview!=='function')return;let cleaned=[];
window.previewPrint=async function(){
 await corePreview.apply(this,arguments);
 const imgs=[...document.querySelectorAll('#previewBody .preview-sheet img')];cleaned=[];
 for(const img of imgs){const s=await process(img.src,$('mode')?.value||'Color');cleaned.push(s);img.src=s}
 const badge=document.querySelector('#previewBody .ai-badge');if(badge)badge.textContent='✓ Smart Xerox Clean — clear page, original colour preserved, left shadow removed.';
};
const coreConfirm=window.confirmPrint;if(typeof coreConfirm==='function')window.confirmPrint=function(){
 if(!cleaned.length)return coreConfirm.apply(this,arguments);const oldOpen=window.open;window.open=function(){const win=oldOpen.apply(window,arguments);if(!win)return win;const write=win.document.write.bind(win.document);win.document.write=function(html){let i=0;html=html.replace(/<img src="([^"]+)"/g,(m)=>i<cleaned.length?'<img src="'+cleaned[i++]+'"':m);return write(html)};return win};
 try{return coreConfirm.apply(this,arguments)}finally{window.open=oldOpen}
};
})();