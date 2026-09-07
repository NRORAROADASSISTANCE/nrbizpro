/* NR BizPro Smart Print: A4/A5 document layout. Source remains untouched. */
(function(){
 const MM=96/25.4;
 const SIZE={A4:{w:210,h:297},A5:{w:148,h:210}};
 function layoutPage(src,paper='A4',margin=8){
   const s=SIZE[paper]||SIZE.A4, W=Math.round(s.w*MM),H=Math.round(s.h*MM),m=Math.round(margin*MM);
   const out=document.createElement('canvas');out.width=W;out.height=H;const c=out.getContext('2d');
   c.fillStyle='#fff';c.fillRect(0,0,W,H);
   const maxW=W-2*m,maxH=H-2*m,scale=Math.min(maxW/src.width,maxH/src.height);
   const w=Math.max(1,Math.round(src.width*scale)),h=Math.max(1,Math.round(src.height*scale));
   c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(src,Math.round((W-w)/2),Math.round((H-h)/2),w,h);
   return out;
 }
 window.smartPrintDocumentLayout={layoutPage};
 function install(){
   const old=window.prepareProcessedPages;if(typeof old!=='function'||old.__docLayoutInstalled)return;
   async function wrapped(){await old();if(!window.processedPages?.length||window.type!=='document')return;const paper=document.getElementById('paper')?.value||'A4',next=[];
     for(const src of window.processedPages){const im=await loadImage(src),c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);next.push(layoutPage(c,paper).toDataURL('image/png'));}
     window.processedPages=next;const hint=document.getElementById('typeHint');if(hint)hint.textContent+=' • '+paper+' page-fit layout ready';
   }
   wrapped.__docLayoutInstalled=true;window.prepareProcessedPages=wrapped;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,200));else setTimeout(install,200);
})();