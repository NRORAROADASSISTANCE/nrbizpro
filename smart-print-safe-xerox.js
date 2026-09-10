/* NR BizPro Smart Print — dark-corner-only correction
   The existing clean preview remains untouched. This pass only softens the
   small dark camera-shadow corner at the upper-left and fades completely away. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
function process(src,mode){return new Promise(resolve=>{const im=new Image();im.onload=()=>{try{
 const maxW=2480,maxH=3508,s=Math.min(1.35,maxW/im.naturalWidth,maxH/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*s)),h=Math.max(1,Math.round(im.naturalHeight*s));
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 const a=ctx.getImageData(0,0,w,h),d=a.data;
 const bw=Math.max(32,Math.ceil(w/48)),bh=Math.max(32,Math.ceil(h/48));
 const bg=document.createElement('canvas');bg.width=bw;bg.height=bh;const bx=bg.getContext('2d',{willReadFrequently:true});bx.drawImage(c,0,0,bw,bh);const bd=bx.getImageData(0,0,bw,bh).data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   /* ONLY the upper-left corner: 0 at/after 34% width or 38% height. */
   const xn=x/w,yn=y/h;
   const dx=xn/.34,dy=yn/.38,dist=Math.sqrt(dx*dx+dy*dy);
   const mask=dist<.38?1:dist<1? (1-dist)/.62 : 0;
   if(mask<=0)continue;
   const gx=Math.min(bw-1,Math.max(0,Math.round(x*bw/w))),gy=Math.min(bh-1,Math.max(0,Math.round(y*bh/h))),j=(gy*bw+gx)*4;
   const local=.2126*bd[j]+.7152*bd[j+1]+.0722*bd[j+2];
   /* Compare only against nearby clean paper toward the right, not the whole page. */
   const refX=Math.min(bw-1,Math.max(0,Math.floor(bw*.62)));let ref=0,n=0;
   for(let xx=refX;xx<Math.min(bw,refX+Math.max(2,Math.floor(bw*.18)));xx++){const k=(gy*bw+xx)*4;ref+=.2126*bd[k]+.7152*bd[k+1]+.0722*bd[k+2];n++}
   ref=n?ref/n:205;
   const deficit=Math.max(0,ref-local-12);if(deficit<8)continue;
   const strength=Math.min(.72,deficit/135);
   const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],lum=.2126*r+.7152*g+.0722*b;
   /* Protect dark ink and security details. */
   const tone=lum<55?0:lum<185?(lum-55)/130:1;
   const lift=1+(Math.min(1.55,ref/Math.max(80,local))-1)*mask*strength*tone;
   if(mode==='Black & White'){const v=Math.max(0,Math.min(255,lum*lift));d[i]=d[i+1]=d[i+2]=v}
   else{d[i]=Math.min(255,r*lift);d[i+1]=Math.min(255,g*lift);d[i+2]=Math.min(255,b*lift)}
 }
 ctx.putImageData(a,0,0);resolve(c.toDataURL('image/jpeg',.98));
}catch(e){console.warn('Dark-corner correction fallback',e);resolve(src)}};im.onerror=()=>resolve(src);im.src=src})}
const corePreview=window.previewPrint;if(typeof corePreview!=='function')return;let cleaned=[];
window.previewPrint=async function(){
 const safe=$('safeEnhance'),straight=$('autoStraighten'),os=safe?safe.checked:false,od=straight?straight.checked:false;
 if(safe)safe.checked=false;if(straight)straight.checked=false;
 try{await corePreview.apply(this,arguments)}finally{if(safe)safe.checked=os;if(straight)straight.checked=od}
 const imgs=[...document.querySelectorAll('#previewBody .preview-sheet img')];cleaned=[];
 for(const img of imgs){const s=await process(img.src,$('mode')?.value||'Color');cleaned.push(s);img.src=s}
 const badge=document.querySelector('#previewBody .ai-badge');if(badge)badge.textContent='✓ Dark corner cleaned; rest of the document preserved.';
};
const coreConfirm=window.confirmPrint;if(typeof coreConfirm==='function')window.confirmPrint=function(){
 if(!cleaned.length)return coreConfirm.apply(this,arguments);const oldOpen=window.open;window.open=function(){const win=oldOpen.apply(window,arguments);if(!win)return win;const write=win.document.write.bind(win.document);win.document.write=function(html){let i=0;html=html.replace(/<img src="([^"]+)"/g,(m)=>i<cleaned.length?'<img src="'+cleaned[i++]+'"':m);return write(html)};return win};
 try{return coreConfirm.apply(this,arguments)}finally{window.open=oldOpen}
};
})();
