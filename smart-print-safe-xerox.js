/* NR BizPro Smart Print — localized Xerox shade correction
   Only lifts the dark left-side camera shadow. The rest of the document stays unchanged. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function process(src,mode){return new Promise(resolve=>{const im=new Image();im.onload=()=>{try{
 const maxW=2480,maxH=3508,s=Math.min(1.35,maxW/im.naturalWidth,maxH/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 const a=ctx.getImageData(0,0,w,h),d=a.data;const bg=document.createElement('canvas');bg.width=Math.max(24,Math.ceil(w/40));bg.height=Math.max(24,Math.ceil(h/40));const bx=bg.getContext('2d');bx.drawImage(c,0,0,bg.width,bg.height);const bd=bx.getImageData(0,0,bg.width,bg.height).data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   /* Correction is strong only on the left; it smoothly becomes zero by 48% width. */
   const xn=x/w;let mask=xn<.18?1:xn<.48?(.48-xn)/.30:0;if(mask<=0)continue;
   const gx=(x+.5)*bg.width/w-.5,gy=(y+.5)*bg.height/h-.5,x0=Math.max(0,Math.floor(gx)),x1=Math.min(bg.width-1,x0+1),y0=Math.max(0,Math.floor(gy)),y1=Math.min(bg.height-1,y0+1),fx=gx-x0,fy=gy-y0;
   const p00=(y0*bg.width+x0)*4,p10=(y0*bg.width+x1)*4,p01=(y1*bg.width+x0)*4,p11=(y1*bg.width+x1)*4;
   const br=bd[p00]*(1-fx)*(1-fy)+bd[p10]*fx*(1-fy)+bd[p01]*(1-fx)*fy+bd[p11]*fx*fy;
   const bgc=bd[p00+1]*(1-fx)*(1-fy)+bd[p10+1]*fx*(1-fy)+bd[p01+1]*(1-fx)*fy+bd[p11+1]*fx*fy;
   const bb=bd[p00+2]*(1-fx)*(1-fy)+bd[p10+2]*fx*(1-fy)+bd[p01+2]*(1-fx)*fy+bd[p11+2]*fx*fy;
   const local=.2126*br+.7152*bgc+.0722*bb, factor=Math.min(1.42,Math.max(1,222/Math.max(120,local)));
   const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],lum=.2126*r+.7152*g+.0722*b;
   /* Do not lift deep ink; only correct mid/light paper tones. */
   const tone=lum<45?0:lum<190?(lum-45)/145:1;
   const f=1+(factor-1)*mask*tone;
   if(mode==='Black & White'){const v=Math.max(0,Math.min(255,lum*f));d[i]=d[i+1]=d[i+2]=v}else{d[i]=Math.min(255,r*f);d[i+1]=Math.min(255,g*f);d[i+2]=Math.min(255,b*f)}
 }
 ctx.putImageData(a,0,0);resolve(c.toDataURL('image/jpeg',.97));
}catch(e){console.warn('Localized Xerox fallback',e);resolve(src)}};im.onerror=()=>resolve(src);im.src=src})}
const corePreview=window.previewPrint;if(typeof corePreview!=='function')return;let cleaned=[];
window.previewPrint=async function(){const safe=$('safeEnhance'),straight=$('autoStraighten'),os=safe?safe.checked:false,od=straight?straight.checked:false;if(safe)safe.checked=false;if(straight)straight.checked=false;try{await corePreview.apply(this,arguments)}finally{if(safe)safe.checked=os;if(straight)straight.checked=od}const imgs=[...document.querySelectorAll('#previewBody .preview-sheet img')];cleaned=[];for(const img of imgs){const s=await process(img.src,$('mode')?.value||'Color');cleaned.push(s);img.src=s}const badge=document.querySelector('#previewBody .ai-badge');if(badge)badge.textContent='✓ Left-side camera shade corrected; remaining document unchanged.'};
const coreConfirm=window.confirmPrint;if(typeof coreConfirm==='function')window.confirmPrint=function(){if(!cleaned.length)return coreConfirm.apply(this,arguments);const oldOpen=window.open;window.open=function(){const win=oldOpen.apply(window,arguments);if(!win)return win;const write=win.document.write.bind(win.document);win.document.write=function(html){let i=0;html=html.replace(/<img src="([^"]+)"/g,(m)=>i<cleaned.length?'<img src="'+cleaned[i++]+'"':m);return write(html)};return win};try{return coreConfirm.apply(this,arguments)}finally{window.open=oldOpen}};
})();
