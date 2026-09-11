/* NR BizPro Smart Print — conservative Xerox crop + left shadow cleanup */
(function(){
'use strict';
const originalLoadPhoto=window.loadPhoto;
let bypass=false;
const clamp=v=>Math.max(0,Math.min(255,v));
function readImage(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=r.result};r.onerror=reject;r.readAsDataURL(file)})}
function makeFile(canvas,name){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(new File([b],name,{type:'image/png'})):reject(new Error('canvas export failed')),'image/png',1))}
function cropAndClean(file){return readImage(file).then(im=>{
  const max=1800,scale=Math.min(1,max/im.width,max/im.height),w=Math.max(1,Math.round(im.width*scale)),h=Math.max(1,Math.round(im.height*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,w,h);
  const src=x.getImageData(0,0,w,h),d=src.data;
  const tw=Math.max(48,Math.min(180,Math.round(w/8))),th=Math.max(64,Math.min(240,Math.round(h/8)));
  const sm=document.createElement('canvas');sm.width=tw;sm.height=th;const sx=sm.getContext('2d',{willReadFrequently:true});sx.drawImage(c,0,0,tw,th);const sd=sx.getImageData(0,0,tw,th).data;
  const col=new Float32Array(tw),row=new Float32Array(th);
  for(let yy=0;yy<th;yy++)for(let xx=0;xx<tw;xx++){const i=(yy*tw+xx)*4,v=.2126*sd[i]+.7152*sd[i+1]+.0722*sd[i+2];col[xx]+=v;row[yy]+=v}
  for(let i=0;i<tw;i++)col[i]/=th;for(let i=0;i<th;i++)row[i]/=tw;
  function smooth(a,r){const o=new Float32Array(a.length);for(let i=0;i<a.length;i++){let s=0,n=0;for(let j=Math.max(0,i-r);j<=Math.min(a.length-1,i+r);j++){s+=a[j];n++}o[i]=s/n}return o}
  const cs=smooth(col,Math.max(2,Math.round(tw*.025))),rs=smooth(row,Math.max(2,Math.round(th*.025)));
  // Use the middle of the page as the reference. Only crop a side when it is
  // clearly darker than the page and the change persists for a real margin.
  const refVals=[];for(let i=Math.floor(tw*.30);i<Math.floor(tw*.80);i++)refVals.push(cs[i]);refVals.sort((a,b)=>a-b);const ref=refVals[Math.floor(refVals.length*.55)]||180;
  const threshold=Math.max(48,ref*.48);
  function edgeFromStart(a,limit){let run=0;for(let i=0;i<limit;i++){if(a[i]>=threshold)run++;else run=0;if(run>=Math.max(3,Math.round(a.length*.018)))return i-run+1}return 0}
  function edgeFromEnd(a,limit){let run=0;for(let i=a.length-1;i>=a.length-limit;i--){if(a[i]>=threshold)run++;else run=0;if(run>=Math.max(3,Math.round(a.length*.018)))return i+run-1}return a.length-1}
  let left=edgeFromStart(cs,Math.floor(tw*.30)),right=edgeFromEnd(cs,Math.floor(tw*.30));
  // Top/bottom cropping is deliberately more conservative so page content is never clipped.
  let top=edgeFromStart(rs,Math.floor(th*.14)),bottom=edgeFromEnd(rs,Math.floor(th*.14));
  if(left>tw*.12)left=0;if(right<tw*.82)right=tw-1;if(top>th*.07)top=0;if(bottom<th*.90)bottom=th-1;
  let L=Math.round(left/tw*w),R=Math.round((right+1)/tw*w),T=Math.round(top/th*h),B=Math.round((bottom+1)/th*h);
  L=Math.max(0,Math.min(L,Math.round(w*.18)));R=Math.min(w,Math.max(R,Math.round(w*.82)));T=Math.max(0,Math.min(T,Math.round(h*.10)));B=Math.min(h,Math.max(B,Math.round(h*.90)));
  if(R-L<w*.72){L=0;R=w}if(B-T<h*.82){T=0;B=h}
  const out=document.createElement('canvas');out.width=R-L;out.height=B-T;const ox=out.getContext('2d',{willReadFrequently:true});ox.imageSmoothingEnabled=true;ox.imageSmoothingQuality='high';ox.drawImage(c,L,T,R-L,B-T,0,0,R-L,B-T);
  // Gentle left-edge illumination correction. This is not a global whitening filter:
  // right side stays almost untouched, dark text/stamps are protected.
  const o=ox.getImageData(0,0,out.width,out.height),q=o.data,ow=out.width,oh=out.height;
  const rw=Math.max(32,Math.round(ow/24)),rh=Math.max(40,Math.round(oh/24));
  const thumb=document.createElement('canvas');thumb.width=rw;thumb.height=rh;const tx=thumb.getContext('2d');tx.drawImage(out,0,0,rw,rh);const td=tx.getImageData(0,0,rw,rh).data;
  const col2=new Float32Array(rw);for(let xx=0;xx<rw;xx++){let s=0,n=0;for(let yy=Math.floor(rh*.10);yy<Math.floor(rh*.90);yy++){const i=(yy*rw+xx)*4,v=.2126*td[i]+.7152*td[i+1]+.0722*td[i+2];if(v>35){s+=v;n++}}col2[xx]=n?s/n:180}
  const rv=[];for(let xx=Math.floor(rw*.70);xx<rw;xx++)rv.push(col2[xx]);rv.sort((a,b)=>a-b);const target=rv[Math.floor(rv.length*.55)]||190;
  for(let y=0;y<oh;y++)for(let xx=0;xx<ow;xx++){
    const xn=xx/Math.max(1,ow-1);let zone=1-Math.min(1,Math.max(0,(xn-.02)/.40));zone=zone*zone*(3-2*zone);
    const fx=xn*(rw-1),a=Math.floor(fx),b=Math.min(rw-1,a+1),t=fx-a,local=col2[a]*(1-t)+col2[b]*t;
    let gain=target/Math.max(70,local);gain=Math.max(1,Math.min(1.16,gain));gain=1+(gain-1)*zone;
    const i=(y*ow+xx)*4,r=q[i],g=q[i+1],bl=q[i+2],lum=.2126*r+.7152*g+.0722*bl;
    const protect=lum<45?.10:lum>125?1:.10+.90*(lum-45)/80,eg=1+(gain-1)*protect;
    q[i]=clamp(r*eg);q[i+1]=clamp(g*eg);q[i+2]=clamp(bl*eg);
  }
  ox.putImageData(o,0,0);return makeFile(out,file.name.replace(/\.[^.]+$/i,'')+'-xerox-clean.png');
 })}
function eventFile(file){const dt=new DataTransfer();dt.items.add(file);return {target:{files:dt.files}}}
window.loadPhoto=async function(e){const f=e?.target?.files?.[0];if(!f)return;if(bypass){bypass=false;return originalLoadPhoto(e)}if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)||/passport/i.test(f.name))return originalLoadPhoto(e);try{return originalLoadPhoto(eventFile(await cropAndClean(f)))}catch(err){console.warn('Xerox clean fallback:',err);return originalLoadPhoto(e)}};
window.__xeroxLoadCropped=async function(file){try{bypass=true;return originalLoadPhoto(eventFile(await cropAndClean(file)))}catch(err){bypass=false;return originalLoadPhoto(eventFile(file))}};
})();