/* NR BizPro Smart Print — stable browser-only Xerox document crop */
(function(){
'use strict';
const originalLoadPhoto=window.loadPhoto;
let skipAuto=false;
function imageFromFile(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=r.result};r.onerror=reject;r.readAsDataURL(file)})}
function cropFile(file){return imageFromFile(file).then(im=>{
  const max=900,sc=Math.min(1,max/im.width,max/im.height),w=Math.max(1,Math.round(im.width*sc)),h=Math.max(1,Math.round(im.height*sc));
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data, lum=new Float32Array(w*h);
  let corner=0,n=0,center=0,cn=0;
  for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){const i=(y*w+xx)*4,v=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];lum[y*w+xx]=v;if((xx<w*.08||xx>w*.92)&&(y<h*.08||y>h*.92)){corner+=v;n++}if(xx>w*.25&&xx<w*.75&&y>h*.2&&y<h*.8){center+=v;cn++}}
  corner/=Math.max(1,n);center/=Math.max(1,cn);
  // A bright-page mask works well for photographed documents on desks/tables; if contrast is weak, leave it unchanged.
  const contrast=center-corner;if(contrast<18)return file;
  const threshold=Math.max(corner+14,corner+contrast*.16);
  const col=new Float32Array(w),row=new Float32Array(h);
  for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++)if(lum[y*w+xx]>threshold){col[xx]++;row[y]++}
  // Smooth occupancy so text holes and printed lines do not break the page boundary.
  function smooth(a,r){const out=new Float32Array(a.length);for(let i=0;i<a.length;i++){let s=0,k=0;for(let j=Math.max(0,i-r);j<=Math.min(a.length-1,i+r);j++){s+=a[j];k++}out[i]=s/k}return out}
  const cs=smooth(col,Math.max(3,Math.round(w*.012))),rs=smooth(row,Math.max(3,Math.round(h*.012)));
  function bounds(a,total){const min=Math.max(8,Math.round(total*.015)),need=total*.48;let lo=-1,hi=-1;for(let i=min;i<total-min;i++){if(a[i]>need){if(lo<0)lo=i;hi=i}else if(lo>=0&&i-hi>Math.max(10,total*.035))break}return lo>=0&&hi>lo?[lo,hi]:null}
  let bx=bounds(cs,h),by=bounds(rs,w);
  // Above function uses occupancy against the opposite dimension; reject implausible detections.
  let left=0,right=w-1,top=0,bottom=h-1;
  if(bx){left=bx[0];right=bx[1]}
  if(by){top=by[0];bottom=by[1]}
  if(right-left<w*.55||bottom-top<h*.55)return file;
  const pad=Math.max(1,Math.round(Math.min(w,h)*.004));left=Math.min(w-1,left+pad);right=Math.max(left+1,right-pad);top=Math.min(h-1,top+pad);bottom=Math.max(top+1,bottom-pad);
  const out=document.createElement('canvas');out.width=Math.round((right-left+1)/sc);out.height=Math.round((bottom-top+1)/sc);const ox=out.getContext('2d');ox.imageSmoothingEnabled=true;ox.imageSmoothingQuality='high';ox.drawImage(im,left/sc,top/sc,(right-left+1)/sc,(bottom-top+1)/sc,0,0,out.width,out.height);
  return new Promise((resolve,reject)=>out.toBlob(b=>b?resolve(new File([b],file.name.replace(/\.[^.]+$/i,'')+'-xerox.png',{type:'image/png'})):reject(new Error('crop failed')),'image/png',1));
 })}
function eventWithFile(file){const dt=new DataTransfer();dt.items.add(file);return {target:{files:dt.files}}}
window.loadPhoto=async function(e){const f=e?.target?.files?.[0];if(!f)return;if(skipAuto){skipAuto=false;return originalLoadPhoto(e)}if(window.selectType&&/\.(jpg|jpeg|png|webp|bmp|heic)$/i.test(f.name)&&!/passport/i.test(f.name)){try{const cropped=await cropFile(f);return originalLoadPhoto(eventWithFile(cropped))}catch(err){console.warn('Xerox auto-crop fallback:',err);return originalLoadPhoto(e)}}return originalLoadPhoto(e)};
window.__xeroxLoadCropped=async function(file){try{skipAuto=true;const cropped=await cropFile(file);return originalLoadPhoto(eventWithFile(cropped))}catch(err){skipAuto=false;return originalLoadPhoto(eventWithFile(file))}};
})();
