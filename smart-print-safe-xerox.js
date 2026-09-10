/* NR BizPro Smart Print — localized Xerox shade correction
   Only lifts the dark left-side camera shadow. The rest of the document stays unchanged. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function process(src,mode){return new Promise(resolve=>{const im=new Image();im.onload=()=>{try{
 const maxW=2480,maxH=3508,s=Math.min(1.35,maxW/im.naturalWidth,maxH/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 const a=ctx.getImageData(0,0,w,h),d=a.data;const bg=document.createElement('canvas');bg.width=Math.max(24,Math.ceil(w/36));bg.height=Math.max(24,Math.ceil(h/36));const bx=bg.getContext('2d');bx.drawImage(c,0,0,bg.width,bg.height);const bd=bx.getImageData(0,0,bg.width,bg.height).data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const xn=x/w;
   /* Full correction on far left, gradual fade, absolutely zero after 58%. */
   const mask=xn<.12?1:xn<.58?(.58-xn)/.46:0;if(mask<=0)continue;
   const gx=Math.min(bg.width-1,Math.max(0,Math.floor(x*bg.width/w))),gy=Math.min(bg.height-1,Math.max(0,Math.floor(y*bg.height/h))),j=(gy*bg.width+gx)*4;
   const local=.2126*bd[j]+.7152*bd[j+1]+.0722*bd[j+2];
   /* Estimate a clean paper illumination level from the right side. */
   const refY=[];for(let rx=Math.floor(bg.width*.72);rx<bg.width;rx++){const k=(gy*bg.width+rx)*4;refY.push(.2126*bd[k]+.7152*bd[k+1]+.0722*bd[k+2])}refY.sort((a,b)=>a-b);const ref=refY[Math.floor(refY.length*.65)]||210;
   const deficit=Math.max(0,ref-local);
   const shadow=Math.min(1,deficit/95);
   const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],lum=.2126*r+.7152*g+.0722*b;
   /* Ink and very dark marks are protected; mid-tone paper gets most correction. */
   const tone=lum<40?0:lum<205?(lum-40)/165:1;
   const desired=Math.min(1.85,Math.max(1,ref/Math.max(70,local)));
   const f=1+(desired-1)*mask*shadow*tone*.92;
   if(mode==='Black & White'){const v=Math.max(0,Math.min(255,lum*f));d[i]=d[i+1]=d[i+2]=v}else{d[i]=Math.min(255,r*f);d[i+1]=Math.min(255,g*f);d[i+2]=Math.min(255,b*f)}
 }
 ctx.putImageData(a,0,0);resolve(c.toDataURL('image/jpeg',.97));
}catch(e){console.warn('Localized Xerox fallback',e);resolve(src)}};im.onerror=()=>resolve(src);im.src=src})}
const corePreview=window.previewPrint;if(typeof corePreview!=='function')return;let cleaned=[];
window.previewPrint=async function(){const safe=$('safeEnhance'),straight=$('autoStraighten'),os=safe?safe.checked:false,od=straight?straight.checked:false;if(safe)safe.checked=false;if(straight)straight.checked=false;try{await corePreview.apply(this,arguments)}finally{if(safe)safe.checked=os;if(straight)straight.checked=od}const imgs=[...document.querySelectorAll('#previewBody .preview-sheet img')];cleaned=[];for(const img of imgs){const s=await process(img.src,$('mode')?.value||'Color');cleaned.push(s);img.src=s}const badge=document.querySelector('#previewBody .ai-badge');if(badge)badge.textContent='✓ Xerox Preview — left camera shadow reduced; remaining document preserved.'};
const coreConfirm=window.confirmPrint;if(typeof coreConfirm==='function')window.confirmPrint=function(){if(!cleaned.length)return coreConfirm.apply(this,arguments);const oldOpen=window.open;window.open=function(){const win=oldOpen.apply(window,arguments);if(!win)return win;const write=win.document.write.bind(win.document);win.document.write=function(html){let i=0;html=html.replace(/<img src="([^"]+)"/g,(m)=>i<cleaned.length?'<img src="'+cleaned[i++]+'"':m);return write(html)};return win};try{return coreConfirm.apply(this,arguments)}finally{window.open=oldOpen}};
})();