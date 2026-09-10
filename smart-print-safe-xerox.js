/* NR BizPro Smart Print — safe Xerox preview
   Uses the original uploaded image as the processing source, preserves color,
   removes smooth camera-lighting variation, and never rotates automatically. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function process(src,mode){return new Promise(resolve=>{const im=new Image();im.onload=()=>{try{
 const maxW=2480,maxH=3508,s=Math.min(1.35,maxW/im.naturalWidth,maxH/im.naturalHeight);
 const w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 const data=ctx.getImageData(0,0,w,h),d=data.data;
 const bg=document.createElement('canvas');bg.width=Math.max(20,Math.ceil(w/36));bg.height=Math.max(20,Math.ceil(h/36));
 const bx=bg.getContext('2d');bx.drawImage(c,0,0,bg.width,bg.height);bx.filter='blur(2px)';bx.drawImage(bg,0,0);
 const bd=bx.getImageData(0,0,bg.width,bg.height).data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4, gx=(x+.5)*bg.width/w-.5, gy=(y+.5)*bg.height/h-.5;
   const x0=Math.max(0,Math.floor(gx)),x1=Math.min(bg.width-1,x0+1),y0=Math.max(0,Math.floor(gy)),y1=Math.min(bg.height-1,y0+1),fx=gx-x0,fy=gy-y0;
   const p00=(y0*bg.width+x0)*4,p10=(y0*bg.width+x1)*4,p01=(y1*bg.width+x0)*4,p11=(y1*bg.width+x1)*4;
   const br=bd[p00]*(1-fx)*(1-fy)+bd[p10]*fx*(1-fy)+bd[p01]*(1-fx)*fy+bd[p11]*fx*fy;
   const bgc=bd[p00+1]*(1-fx)*(1-fy)+bd[p10+1]*fx*(1-fy)+bd[p01+1]*(1-fx)*fy+bd[p11+1]*fx*fy;
   const bb=bd[p00+2]*(1-fx)*(1-fy)+bd[p10+2]*fx*(1-fy)+bd[p01+2]*(1-fx)*fy+bd[p11+2]*fx*fy;
   const local=.2126*br+.7152*bgc+.0722*bb;
   const factor=Math.min(1.55,Math.max(.92,245/Math.max(115,local)));
   const r=d[i],g=d[i+1],b=d[i+2];
   if(mode==='Black & White'){
     const lum=.2126*r+.7152*g+.0722*b;
     let v=lum*factor;
     v=128+(v-128)*1.12;
     if(v>220)v=255; else if(v<55)v=0;
     d[i]=d[i+1]=d[i+2]=Math.max(0,Math.min(255,v));
   }else{
     /* Color mode: correct illumination but do not grayscale or invent detail. */
     d[i]=Math.max(0,Math.min(255,r*factor));
     d[i+1]=Math.max(0,Math.min(255,g*factor));
     d[i+2]=Math.max(0,Math.min(255,b*factor));
   }
 }
 ctx.putImageData(data,0,0);resolve(c.toDataURL('image/jpeg',.96));
}catch(e){console.warn('Safe Xerox fallback',e);resolve(src)}};im.onerror=()=>resolve(src);im.src=src})}
const corePreview=window.previewPrint;if(typeof corePreview!=='function')return;
let cleaned=[];
window.previewPrint=async function(){
 const safe=$('safeEnhance'),straight=$('autoStraighten');
 const oldSafe=safe?safe.checked:false,oldStraight=straight?straight.checked:false;
 /* Start from the original source: no damaging contrast pass and no auto-rotation. */
 if(safe)safe.checked=false;if(straight)straight.checked=false;
 try{await corePreview.apply(this,arguments)}finally{if(safe)safe.checked=oldSafe;if(straight)straight.checked=oldStraight}
 const imgs=[...document.querySelectorAll('#previewBody .preview-sheet img')];cleaned=[];
 for(const img of imgs){const s=await process(img.src,$('mode')?.value||'Color');cleaned.push(s);img.src=s}
 const badge=document.querySelector('#previewBody .ai-badge');
 if(badge)badge.textContent='✓ Safe Xerox Preview — camera shade reduced, original color/details preserved.';
};
const coreConfirm=window.confirmPrint;if(typeof coreConfirm==='function')window.confirmPrint=function(){
 if(!cleaned.length)return coreConfirm.apply(this,arguments);
 const oldOpen=window.open;
 window.open=function(){const win=oldOpen.apply(window,arguments);if(!win)return win;const write=win.document.write.bind(win.document);win.document.write=function(html){let i=0;html=html.replace(/<img src="([^"]+)"/g,(m)=>i<cleaned.length?'<img src="'+cleaned[i++]+'"':m);return write(html)};return win};
 try{return coreConfirm.apply(this,arguments)}finally{window.open=oldOpen}
};
})();
