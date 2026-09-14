/* NR BizPro Smart Print — target-output quality upgrade
   Improves the actual Preview image and the image sent to the browser print dialog.
   No original file is overwritten. */
(function(){
  'use strict';
  const MAX_W=1800, MAX_H=2400;
  const raf=()=>new Promise(r=>requestAnimationFrame(r));

  function imgCanvas(img){
    const c=document.createElement('canvas');
    const s=Math.min(1,MAX_W/img.naturalWidth,MAX_H/img.naturalHeight);
    c.width=Math.max(1,Math.round(img.naturalWidth*s));
    c.height=Math.max(1,Math.round(img.naturalHeight*s));
    const x=c.getContext('2d'); x.imageSmoothingEnabled=true; x.imageSmoothingQuality='high';
    x.drawImage(img,0,0,c.width,c.height); return c;
  }

  function edgeAngle(c){
    const w=c.width,h=c.height,sw=Math.min(520,w),sh=Math.min(760,h);
    const s=document.createElement('canvas'); s.width=sw; s.height=sh;
    const q=s.getContext('2d',{willReadFrequently:true}); q.drawImage(c,0,0,sw,sh);
    const d=q.getImageData(0,0,sw,sh).data;
    const g=(x,y)=>{const i=(y*sw+x)*4;return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2]};
    function fit(top){
      const xs=[],ys=[]; const y0=top?2:Math.floor(sh*.82), y1=top?Math.floor(sh*.18):sh-3;
      for(let x=Math.floor(sw*.12);x<Math.floor(sw*.88);x+=4){
        let bestY=y0,best=-1;
        const a=Math.min(y0,y1),b=Math.max(y0,y1);
        for(let y=a;y<=b;y++){
          const v=Math.abs(g(x,y)-g(x,Math.max(0,y-2)));
          if(v>best){best=v;bestY=y;}
        }
        if(best>18){xs.push(x);ys.push(bestY)}
      }
      if(xs.length<8)return 0;
      const mx=xs.reduce((a,b)=>a+b,0)/xs.length,my=ys.reduce((a,b)=>a+b,0)/ys.length;
      let num=0,den=0; for(let i=0;i<xs.length;i++){num+=(xs[i]-mx)*(ys[i]-my);den+=(xs[i]-mx)**2;}
      return den?Math.atan(num/den):0;
    }
    let a=(fit(true)+fit(false))/2;
    if(!isFinite(a))a=0;
    return Math.max(-5,Math.min(5,a*180/Math.PI));
  }

  function rotate(c,deg){
    if(Math.abs(deg)<.35)return c;
    const r=deg*Math.PI/180,w=c.width,h=c.height,cs=Math.abs(Math.cos(r)),sn=Math.abs(Math.sin(r));
    const o=document.createElement('canvas'); o.width=Math.ceil(w*cs+h*sn);o.height=Math.ceil(w*sn+h*cs);
    const x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.translate(o.width/2,o.height/2);x.rotate(r);x.drawImage(c,-w/2,-h/2);return o;
  }

  function cropBorder(c){
    const m=Math.max(2,Math.round(Math.min(c.width,c.height)*.018));
    const o=document.createElement('canvas');o.width=Math.max(1,c.width-2*m);o.height=Math.max(1,c.height-2*m);
    const x=o.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(c,m,m,o.width,o.height,0,0,o.width,o.height);return o;
  }

  async function enhance(c){
    const ctx=c.getContext('2d',{willReadFrequently:true}), im=ctx.getImageData(0,0,c.width,c.height),d=im.data,w=c.width,h=c.height;
    // Neutralize the common yellow/green cast using bright paper pixels.
    let sr=0,sg=0,sb=0,n=0;
    for(let y=0;y<h;y+=6)for(let x=0;x<w;x+=6){const i=(y*w+x)*4,r=d[i],g=d[i+1],b=d[i+2],l=.2126*r+.7152*g+.0722*b;if(l>185){sr+=r;sg+=g;sb+=b;n++;}}
    if(!n){sr=sg=sb=200;n=1;}
    const ar=sr/n,ag=sg/n,ab=sb/n,avg=(ar+ag+ab)/3;
    const gr=Math.max(.88,Math.min(1.12,avg/Math.max(1,ar))),gg=Math.max(.88,Math.min(1.12,avg/Math.max(1,ag))),gb=Math.max(.88,Math.min(1.12,avg/Math.max(1,ab)));
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const i=(y*w+x)*4;let r=d[i]*gr,g=d[i+1]*gg,b=d[i+2]*gb;
        let l=.2126*r+.7152*g+.0722*b;
        // Stronger paper lift, but protect ink/stamps/photographs.
        const ink=Math.max(0,Math.min(1,(l-55)/115));
        if(l>115){const lift=Math.min(.28,(l-115)/140*.28);r=r+(255-r)*lift;g=g+(255-g)*lift;b=b+(255-b)*lift;}
        l=.2126*r+.7152*g+.0722*b;
        const contrast=l<65?1:l>205?1.035:1.10;
        r=128+(r-128)*contrast;g=128+(g-128)*contrast;b=128+(b-128)*contrast;
        // Mild saturation protection: keep certificate colors, reduce dirty cast.
        const ll=.2126*r+.7152*g+.0722*b;
        r=ll+(r-ll)*.94;g=ll+(g-ll)*.94;b=ll+(b-ll)*.94;
        d[i]=Math.max(0,Math.min(255,r));d[i+1]=Math.max(0,Math.min(255,g));d[i+2]=Math.max(0,Math.min(255,b));
      }
      if(y%20===0)await raf();
    }
    ctx.putImageData(im,0,0);
    return c;
  }

  async function upgradeDataUrl(src){
    const im=new Image(); im.decoding='async'; im.src=src; await im.decode();
    let c=imgCanvas(im);
    c=rotate(c,-edgeAngle(c));
    c=cropBorder(c);
    c=await enhance(c);
    return c.toDataURL('image/jpeg',.96);
  }

  function replacePrintHtml(html,pages){
    if(!pages.length)return html;
    let i=0;
    return html.replace(/<img\s+src="([^"]+)"/gi,(m)=>{
      const p=pages[i++]; return p?`<img src="${p}"`:m;
    });
  }

  function install(){
    if(typeof window.previewPrint!=='function'||window.__nrTargetUpgradeInstalled)return;
    window.__nrTargetUpgradeInstalled=true;
    const oldPreview=window.previewPrint,oldConfirm=window.confirmPrint;
    let upgraded=[];
    window.previewPrint=async function(){
      upgraded=[];
      await oldPreview.apply(this,arguments);
      const imgs=[...document.querySelectorAll('#previewBody img')];
      for(const img of imgs){
        try{const src=await upgradeDataUrl(img.currentSrc||img.src);img.src=src;upgraded.push(src);}catch(e){upgraded.push(img.src);console.warn('Smart Print target upgrade',e);}
      }
      const badge=document.querySelector('#previewBody .ai-badge');
      if(badge)badge.textContent='✓ Smart Xerox Target — perspective/edge cleanup, paper whitening, colour balance and text protection applied.';
    };
    window.confirmPrint=function(){
      if(!upgraded.length)return oldConfirm.apply(this,arguments);
      const originalOpen=window.open;
      window.open=function(){
        const child=originalOpen.apply(window,arguments);
        if(!child)return child;
        const doc=child.document, write=doc.write.bind(doc);
        doc.write=function(html){write(replacePrintHtml(html,upgraded));};
        return child;
      };
      try{return oldConfirm.apply(this,arguments)}finally{window.open=originalOpen;}
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
  [100,400,1000,2000].forEach(ms=>setTimeout(install,ms));
})();
