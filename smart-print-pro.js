/* NR BizPro Smart Print Pro: non-destructive clarity + safe perspective layer. Never rewrites document text. */
(function(){
  function estimateFineSkew(canvas){
    const max=1200,s=Math.min(1,max/Math.max(canvas.width,canvas.height));
    const w=Math.max(120,Math.round(canvas.width*s)),h=Math.max(120,Math.round(canvas.height*s));
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(canvas,0,0,w,h);const d=x.getImageData(0,0,w,h).data;
    function score(deg){const r=deg*Math.PI/180,cs=Math.cos(r),sn=Math.sin(r),cx=w/2,cy=h/2;let sum=0,n=0;
      for(let y=2;y<h-2;y+=3)for(let xx=2;xx<w-2;xx+=3){const px=xx-cx,py=y-cy,rx=Math.round(px*cs-py*sn+cx),ry=Math.round(px*sn+py*cs+cy);if(rx<2||rx>=w-2||ry<2||ry>=h-2)continue;const i=(ry*w+rx)*4,a=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2],l=.2126*d[i-4]+.7152*d[i-3]+.0722*d[i-2],rr=.2126*d[i+4]+.7152*d[i+5]+.0722*d[i+6],u=.2126*d[i-w*4]+.7152*d[i-w*4+1]+.0722*d[i-w*4+2],dn=.2126*d[i+w*4]+.7152*d[i+w*4+1]+.0722*d[i+w*4+2],gx=Math.abs(rr-l),gy=Math.abs(dn-u);if(gx+gy>35){sum+=Math.max(gx,gy);n++}}return n?sum/n:0;}
    let best=0,bs=-1;for(let deg=-5;deg<=5.0001;deg+=.5){const v=score(deg);if(v>bs){bs=v;best=deg}}return Math.abs(best)<.75?0:-best;
  }
  function rotateSafe(src,deg){if(!deg)return src;const r=deg*Math.PI/180,sw=src.width,sh=src.height,c=document.createElement('canvas'),cs=Math.abs(Math.cos(r)),sn=Math.abs(Math.sin(r));c.width=Math.ceil(sw*cs+sh*sn);c.height=Math.ceil(sw*sn+sh*cs);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.translate(c.width/2,c.height/2);x.rotate(r);x.drawImage(src,-sw/2,-sh/2);return c;}
  function paperCleanup(src,mode){const w=src.width,h=src.height,out=document.createElement('canvas');out.width=w;out.height=h;const ctx=out.getContext('2d',{willReadFrequently:true});ctx.drawImage(src,0,0);const im=ctx.getImageData(0,0,w,h),d=im.data,lum=[],step=Math.max(1,Math.floor((w*h)/8000));for(let y=0;y<h;y+=Math.max(2,Math.floor(step/4)))for(let x=0;x<w;x+=Math.max(2,Math.floor(step/4))){const i=(y*w+x)*4;lum.push(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2]);}lum.sort((a,b)=>a-b);const p=q=>lum[Math.min(lum.length-1,Math.floor((lum.length-1)*q))]||0,lo=p(.02),hi=p(.985),gain=255/Math.max(45,hi-lo);for(let i=0;i<d.length;i+=4){let r=Math.max(0,Math.min(255,(d[i]-lo)*gain)),g=Math.max(0,Math.min(255,(d[i+1]-lo)*gain)),b=Math.max(0,Math.min(255,(d[i+2]-lo)*gain));if(mode==='Black & White'){const y=.2126*r+.7152*g+.0722*b,bw=y<150?y*.90:y>232?255:112+(y-150)*1.53;r=g=b=Math.max(0,Math.min(255,bw));}d[i]=r;d[i+1]=g;d[i+2]=b;}ctx.putImageData(im,0,0);return out;}
  function orderPts(p){const a=p.slice().sort((x,y)=>x.y-y.y),top=a.slice(0,2).sort((x,y)=>x.x-y.x),bot=a.slice(2).sort((x,y)=>x.x-y.x);return [top[0],top[1],bot[1],bot[0]];}
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  function perspectiveCorrect(src){
    if(!window.cv||!cv.Mat)return {canvas:src,changed:false};
    const scale=Math.min(1,1200/Math.max(src.width,src.height)),sw=Math.max(200,Math.round(src.width*scale)),sh=Math.max(200,Math.round(src.height*scale));
    const small=document.createElement('canvas');small.width=sw;small.height=sh;small.getContext('2d').drawImage(src,0,0,sw,sh);
    let mat=null,gray=null,blur=null,edges=null,contours=null,hier=null,approx=null,best=null,bestArea=0;
    try{
      mat=cv.imread(small);gray=new cv.Mat();blur=new cv.Mat();edges=new cv.Mat();cv.cvtColor(mat,gray,cv.COLOR_RGBA2GRAY);cv.GaussianBlur(gray,blur,new cv.Size(5,5),0);cv.Canny(blur,50,150,edges);
      contours=new cv.MatVector();hier=new cv.Mat();cv.findContours(edges,contours,hier,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
      const imageArea=sw*sh;
      for(let i=0;i<contours.size();i++){const c=contours.get(i),peri=cv.arcLength(c,true),a=cv.contourArea(c);if(a<imageArea*.18||a>imageArea*.98||a<=bestArea)continue;const ap=new cv.Mat();cv.approxPolyDP(c,ap,.02*peri,true);if(ap.rows===4&&cv.isContourConvex(ap)){best=ap;bestArea=a;}else ap.delete();c.delete();}
      if(!best)return {canvas:src,changed:false};
      const pts=[];for(let i=0;i<4;i++)pts.push({x:best.intAt(i,0),y:best.intAt(i,1)});const q=orderPts(pts);
      const w1=distance(q[0],q[1]),w2=distance(q[3],q[2]),h1=distance(q[0],q[3]),h2=distance(q[1],q[2]),tw=Math.max(200,Math.round(Math.max(w1,w2)/scale)),th=Math.max(200,Math.round(Math.max(h1,h2)/scale));
      const srcPts=cv.matFromArray(4,1,cv.CV_32FC2,q.flatMap(p=>[p.x,p.y])),dstPts=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,sw-1,0,sw-1,sh-1,0,sh-1]);
      const M=cv.getPerspectiveTransform(srcPts,dstPts),warped=new cv.Mat();cv.warpPerspective(mat,warped,M,new cv.Size(sw,sh),cv.INTER_CUBIC,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));
      const out=document.createElement('canvas');out.width=tw;out.height=th;cv.imshow(out,warped);
      srcPts.delete();dstPts.delete();M.delete();warped.delete();best.delete();return {canvas:out,changed:true};
    }catch(e){console.warn('Perspective correction skipped',e);return {canvas:src,changed:false};}
    finally{[mat,gray,blur,edges,contours,hier,approx].forEach(x=>{try{x&&x.delete()}catch(_){}})}
  }
  async function waitForCv(){if(window.cv&&cv.Mat)return true;return new Promise(resolve=>{let n=0,t=setInterval(()=>{if(window.cv&&cv.Mat){clearInterval(t);resolve(true)}else if(++n>60){clearInterval(t);resolve(false)}},100)});}
  async function proPrepare(){
    if(!window.sourcePages||!sourcePages.length)return;processedPages=[];
    const use=$('safeEnhance')?.checked!==false,deskew=$('autoStraighten')?.checked!==false,mode=$('mode')?.value||'Black & White';let straight=0,perspective=0;
    const cvReady=await waitForCv();
    for(const src of sourcePages){const im=await loadImage(src),c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);let work=c;
      if(deskew&&type==='document'){const a=estimateFineSkew(c);if(Math.abs(a)>=.75){work=rotateSafe(c,a);straight++;}}
      if(type==='document'&&cvReady){const pc=perspectiveCorrect(work);if(pc.changed){work=pc.canvas;perspective++;}}
      if(use)work=paperCleanup(work,mode);processedPages.push(work.toDataURL('image/png'));
    }
    $('typeHint').textContent=`✓ ${processedPages.length} print-ready page${processedPages.length>1?'s':''} prepared${straight||perspective?` • ${straight?straight+' straightened':''}${straight&&perspective?' • ':''}${perspective?perspective+' perspective-corrected':''}`:''}. Original file remains unchanged.`;
  }
  window.estimateFineSkew=estimateFineSkew;window.prepareProcessedPages=proPrepare;
})();
