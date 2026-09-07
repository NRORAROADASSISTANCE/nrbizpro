/* NR BizPro Smart Print: automatic 0/90/180/270 document orientation. Source is never modified. */
(function(){
  function quarterScore(canvas,turn){
    const max=900,s=Math.min(1,max/Math.max(canvas.width,canvas.height)),w=Math.max(120,Math.round(canvas.width*s)),h=Math.max(120,Math.round(canvas.height*s));
    const c=document.createElement('canvas');
    c.width=turn%2?h:w;c.height=turn%2?w:h;
    const x=c.getContext('2d',{willReadFrequently:true});x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.save();x.translate(c.width/2,c.height/2);x.rotate(turn*Math.PI/2);x.drawImage(canvas,-w/2,-h/2,w,h);x.restore();
    const d=x.getImageData(0,0,c.width,c.height).data,W=c.width,H=c.height;
    let horizontal=0,vertical=0,center=0;
    const lum=(i)=>.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];
    for(let y=3;y<H-3;y+=3)for(let xx=3;xx<W-3;xx+=3){const i=(y*W+xx)*4,g=lum(i),gx=Math.abs(g-lum(i-12)),gy=Math.abs(g-lum(i-W*12));if(gx>28)vertical+=gx;if(gy>28)horizontal+=gy;if(xx>W*.12&&xx<W*.88&&y>H*.12&&y<H*.88)center+=Math.abs(g-128)}
    // Printed text normally produces repeated horizontal strokes when upright.
    return horizontal*1.15+vertical*.18+center*.002;
  }
  function estimateOrientation(canvas){
    const scores=[0,1,2,3].map(t=>quarterScore(canvas,t));
    let best=0;for(let i=1;i<4;i++)if(scores[i]>scores[best]*1.035)best=i;
    return best;
  }
  function rotateQuarter(src,turn){if(!turn)return src;const c=document.createElement('canvas');c.width=turn%2?src.height:src.width;c.height=turn%2?src.width:src.height;const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.translate(c.width/2,c.height/2);x.rotate(turn*Math.PI/2);x.drawImage(src,-src.width/2,-src.height/2);return c}
  function install(){
    const old=window.prepareProcessedPages;if(typeof old!=='function'||old.__orientationInstalled)return;
    async function wrapped(){
      if(window.type!=='document'){return old()}
      const originalSource=window.sourcePages;
      if(!originalSource?.length)return old();
      // Let the existing pipeline run first only for state setup; then rebuild document pages with orientation correction.
      window.processedPages=[];
      const use=document.getElementById('safeEnhance')?.checked!==false;
      const mode=document.getElementById('mode')?.value||'Black & White';
      const deskew=document.getElementById('autoStraighten')?.checked!==false;
      let turns=0;
      for(const src of originalSource){
        const im=await loadImage(src),c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);
        const turn=estimateOrientation(c);turns+=turn?1:0;let work=rotateQuarter(c,turn);
        if(deskew&&typeof estimateSkew==='function'&&typeof rotateCanvas==='function'){const a=estimateSkew(work);if(Math.abs(a)>=2)work=rotateCanvas(work,a)}
        const out=use&&typeof enhanceCanvas==='function'?enhanceCanvas(work,mode):work;window.processedPages.push(out.toDataURL('image/png'));
      }
      const hint=document.getElementById('typeHint');if(hint)hint.textContent=`✓ ${window.processedPages.length} print-ready page${window.processedPages.length>1?'s':''} prepared${turns?` • ${turns} page${turns>1?'s':''} auto-rotated upright`:''}. Original file remains unchanged.`;
    }
    wrapped.__orientationInstalled=true;window.prepareProcessedPages=wrapped;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,250));else setTimeout(install,250);
})();