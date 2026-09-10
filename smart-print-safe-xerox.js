/* NR BizPro Smart Print — precise corner shadow correction
   Color mode starts from the original image and changes only the smooth
   upper-left camera shadow. No global whitening, saturation, sharpening or B/W. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function process(src,mode){return new Promise(resolve=>{const im=new Image();im.onload=()=>{try{
 const maxW=2480,maxH=3508,s=Math.min(1.35,maxW/im.naturalWidth,maxH/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 const a=ctx.getImageData(0,0,w,h),d=a.data;
 const gw=Math.max(48,Math.ceil(w/40)),gh=Math.max(48,Math.ceil(h/40));
 const bg=document.createElement('canvas');bg.width=gw;bg.height=gh;const bx=bg.getContext('2d',{willReadFrequently:true});bx.drawImage(c,0,0,gw,gh);const bd=bx.getImageData(0,0,gw,gh).data;
 const lum=new Float32Array(gw*gh);for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=(y*gw+x)*4;lum[y*gw+x]=.2126*bd[i]+.7152*bd[i+1]+.0722*bd[i+2]}
 const ref=[];for(let y=2;y<gh-2;y+=2)for(let x=Math.floor(gw*.68);x<Math.floor(gw*.94);x+=2){const v=lum[y*gw+x];if(v>115)ref.push(v)}
 ref.sort((a,b)=>a-b);const target=ref.length?ref[Math.floor(ref.length*.65)]:205;
 function mapAt(px,py){const fx=px*(gw-1)/(w-1),fy=py*(gh-1)/(h-1),x0=Math.max(0,Math.floor(fx)),y0=Math.max(0,Math.floor(fy)),x1=Math.min(gw-1,x0+1),y1=Math.min(gh-1,y0+1),tx=fx-x0,ty=fy-y0;const a0=lum[y0*gw+x0],a1=lum[y0*gw+x1],b0=lum[y1*gw+x0],b1=lum[y1*gw+x1];return (a0+(a1-a0)*tx)*(1-ty)+(b0+(b1-b0)*tx)*ty}
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const xn=x/w,yn=y/h;
   /* Only the camera-shadow region: upper-left, fading smoothly by 58% width. */
   const mx=xn<.08?1:xn<.58?(1-xn/.58)/(.92/.58):0;
   const my=yn<.62?1:yn<.82?(1-yn)/.20:0;
   const mask=mx*my;if(mask<=0)continue;
   const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],L=.2126*r+.7152*g+.0722*b;
   if(L<52)continue; /* preserve black ink and borders */
   const field=mapAt(x,y),def=Math.max(0,target-field-6);if(def<8)continue;
   const strength=Math.min(.72,def/155)*mask;
   if(mode==='Black & White'){
     let v=L;
     /* luminance-only correction for B/W */
     v=255-(255-v)*(1/(1+strength*.85));
     v=Math.max(0,Math.min(255,v));
     if(v<45)v*=.9;
     d[i]=d[i+1]=d[i+2]=v;
   }else{
     /* Color: neutral illumination lift; channel ratios/hue are retained. */
     const gain=1+strength;
     d[i]=Math.min(255,255-(255-r)*gain**-1);
     d[i+1]=Math.min(255,255-(255-g)*gain**-1);
     d[i+2]=Math.min(255,255-(255-b)*gain**-1);
   }
 }
 ctx.putImageData(a,0,0);resolve(c.toDataURL('image/jpeg',.99));
}catch(e){console.warn('Precise shadow correction fallback',e);resolve(src)}};im.onerror=()=>resolve(src);im.src=src})}
const corePreview=window.previewPrint;if(typeof corePreview!=='function')return;let cleaned=[];
window.previewPrint=async function(){
 await corePreview.apply(this,arguments);
 const imgs=[...document.querySelectorAll('#previewBody .preview-sheet img')];cleaned=[];
 for(const img of imgs){const s=await process(img.src,$('mode')?.value||'Color');cleaned.push(s);img.src=s}
 const badge=document.querySelector('#previewBody .ai-badge');if(badge)badge.textContent='✓ Smart Xerox Clean — original colour preserved, upper-left camera shadow corrected.';
};
const coreConfirm=window.confirmPrint;if(typeof coreConfirm==='function')window.confirmPrint=function(){
 if(!cleaned.length)return coreConfirm.apply(this,arguments);const oldOpen=window.open;window.open=function(){const win=oldOpen.apply(window,arguments);if(!win)return win;const write=win.document.write.bind(win.document);win.document.write=function(html){let i=0;html=html.replace(/<img src="([^"]+)"/g,(m)=>i<cleaned.length?'<img src="'+cleaned[i++]+'"':m);return write(html)};return win};
 try{return coreConfirm.apply(this,arguments)}finally{window.open=oldOpen}
};
})();