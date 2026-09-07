/* NR BizPro Smart Print Pro: safe print-quality engine. Original source is never modified. */
(function(){
  function enhancePrintQuality(src,mode){
    const maxW=3000,maxH=4243;let scale=Math.min(1.35,maxW/src.width,maxH/src.height);if(src.width<1600&&src.height<2400)scale=Math.min(1.55,Math.max(1,scale));
    const w=Math.max(1,Math.round(src.width*scale)),h=Math.max(1,Math.round(src.height*scale));
    const out=document.createElement('canvas');out.width=w;out.height=h;const c=out.getContext('2d',{willReadFrequently:true});c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(src,0,0,w,h);
    const im=c.getImageData(0,0,w,h),d=im.data,gray=new Float32Array(w*h);
    for(let i=0,p=0;i<d.length;i+=4,p++)gray[p]=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
    const result=new Uint8ClampedArray(d.length);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x,i=p*4;let sum=0,n=0;for(let yy=Math.max(0,y-2);yy<=Math.min(h-1,y+2);yy+=2)for(let xx=Math.max(0,x-2);xx<=Math.min(w-1,x+2);xx+=2){sum+=gray[yy*w+xx];n++;}const local=sum/n,boost=Math.max(-10,Math.min(14,(gray[p]-local)*.16));let r=d[i]+boost,g=d[i+1]+boost,b=d[i+2]+boost;if(mode==='Black & White'){const yv=.2126*r+.7152*g+.0722*b;const bw=yv<145?Math.max(0,yv*.86):yv>235?255:108+(yv-145)*1.60;r=g=b=bw;}result[i]=Math.max(0,Math.min(255,r));result[i+1]=Math.max(0,Math.min(255,g));result[i+2]=Math.max(0,Math.min(255,b));result[i+3]=255;}
    c.putImageData(new ImageData(result,w,h),0,0);return out;
  }
  function install(){
    const original=window.prepareProcessedPages;if(typeof original!=='function'||original.__qualityInstalled)return;
    async function wrapped(){await original();if(!window.processedPages?.length)return;const mode=document.getElementById('mode')?.value||'Black & White',next=[];for(const src of window.processedPages){const im=await loadImage(src),c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);next.push(enhancePrintQuality(c,mode).toDataURL('image/png'));}window.processedPages=next;const hint=document.getElementById('typeHint');if(hint)hint.textContent+=' • Print Quality optimized';}
    wrapped.__qualityInstalled=true;window.prepareProcessedPages=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,100));else setTimeout(install,100);
  window.enhancePrintQuality=enhancePrintQuality;
})();