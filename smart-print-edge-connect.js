/* NR BizPro Smart Print — activate real document edge crop before cleanup. */
(function(){
  const wait=fn=>{if(window.smartPrintEdgeEngine&&window.cv&&cv.Mat)return fn();setTimeout(()=>wait(fn),250)};
  wait(()=>{
    if(typeof window.prepareProcessedPages!=='function')return;
    const original=window.prepareProcessedPages;
    window.prepareProcessedPages=async function(){
      if(window.__edgePreparing)return original();
      if(window.type!=='document' || !Array.isArray(window.sourcePages) || !window.sourcePages.length)return original();
      const out=[]; let detected=0;
      try{
        for(const src of window.sourcePages){
          const im=await new Promise((resolve,reject)=>{const x=new Image();x.onload=()=>resolve(x);x.onerror=reject;x.src=src;});
          const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);
          const pts=window.smartPrintEdgeEngine.detect(c);
          if(!pts){out.push(src);continue;}
          const mat=cv.imread(c),warped=window.smartPrintEdgeEngine.warp(mat,pts),wc=document.createElement('canvas');wc.width=warped.cols;wc.height=warped.rows;cv.imshow(wc,warped);
          out.push(wc.toDataURL('image/png'));detected++;mat.delete();warped.delete();
        }
        window.sourcePages=out;
        window.__edgePreparing=true;
        await original();
        window.__edgePreparing=false;
        const q=document.getElementById('quality');
        if(q&&detected){q.textContent=`✓ Document edges detected and cropped on ${detected} page${detected>1?'s':''}; perspective corrected before Xerox cleanup.`;q.classList.remove('hidden');}
      }catch(e){window.__edgePreparing=false;console.warn('Smart Print edge connection failed; using safe original pipeline',e);await original();}
    };
  });
})();