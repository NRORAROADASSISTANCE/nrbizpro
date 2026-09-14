/* NR BizPro Smart Print — TARGET SHADOW REMOVAL v3
   Adaptive illumination correction for camera-shadowed documents.
   Uses the clean/right side as a reference and corrects illumination, not ink. */
(function(){
'use strict';
function show(h){var m=document.getElementById('preview'),b=document.getElementById('previewBody');if(m&&b){b.innerHTML=h;m.classList.remove('hidden')}}
function file(){var i=document.getElementById('fileInput');return i&&i.files&&i.files[0]}
function read(f){return new Promise(function(a,b){var r=new FileReader();r.onload=function(){a(r.result)};r.onerror=b;r.readAsDataURL(f)})}
function img(s){return new Promise(function(a,b){var i=new Image();i.onload=function(){a(i)};i.onerror=b;i.src=s})}
function raf(){return new Promise(function(r){requestAnimationFrame(r)})}
function lum(r,g,b){return .2126*r+.7152*g+.0722*b}
async function target(src){
 var im=await img(src),mw=1800,mh=2400,sc=Math.min(1,mw/im.naturalWidth,mh/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*sc)),h=Math.max(1,Math.round(im.naturalHeight*sc));
 var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d',{willReadFrequently:true});x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(im,0,0,w,h);
 /* Estimate illumination from a tiny image. Median/upper-middle luminance is used so text does not dominate. */
 var tw=72,th=96,t=document.createElement('canvas');t.width=tw;t.height=th;var q=t.getContext('2d',{willReadFrequently:true});q.drawImage(c,0,0,tw,th);var z=q.getImageData(0,0,tw,th).data;
 var col=new Float32Array(tw);
 for(var xx=0;xx<tw;xx++){
   var vals=[];
   for(var yy=0;yy<th;yy++){var i=(yy*tw+xx)*4,r=z[i],g=z[i+1],b=z[i+2],l=lum(r,g,b),mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?((mx-mn)/mx):0;if(l>90&&sat<.45)vals.push(l)}
   vals.sort(function(a,b){return a-b});col[xx]=vals.length?vals[Math.floor(vals.length*.70)]:190;
 }
 /* Smooth the illumination profile so document text cannot create stripes. */
 for(var pass=0;pass<3;pass++){var cp=col.slice();for(var k=1;k<tw-1;k++)col[k]=(cp[k-1]+2*cp[k]+cp[k+1])/4}
 var right=[];for(var rx=Math.floor(tw*.62);rx<tw;rx++)right.push(col[rx]);right.sort(function(a,b){return a-b});var base=right.length?right[Math.floor(right.length*.60)]:190;
 var gainCol=new Float32Array(tw);for(var j=0;j<tw;j++){var need=base/Math.max(100,col[j]);gainCol[j]=Math.max(1,Math.min(1.42,need))}
 var d=x.getImageData(0,0,w,h),p=d.data;
 for(var y=0;y<h;y++){
   for(var X=0;X<w;X++){
     var i=(y*w+X)*4,r=p[i],g=p[i+1],b=p[i+2],l=lum(r,g,b),mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?((mx-mn)/mx):0,xf=X/Math.max(1,w-1),pos=xf*(tw-1),a=Math.floor(pos),bb=Math.min(tw-1,a+1),u=pos-a,gc=gainCol[a]*(1-u)+gainCol[bb]*u;
     /* Only correct the shadowed left ~65%. Right side stays effectively original. */
     var zone=Math.max(0,Math.min(1,(.68-xf)/.68));zone=zone*zone*(3-2*zone);
     var ink=l<70?0.18:l<105?0.45:l<145?0.78:.96;
     var colour=sat>.55?.45:(sat>.35?.70:1);
     var gain=1+(gc-1)*zone*ink*colour;
     p[i]=Math.min(255,r*gain);p[i+1]=Math.min(255,g*gain);p[i+2]=Math.min(255,b*gain);
   }
   if(y%10===0)await raf();
 }
 x.putImageData(d,0,0);await raf();return c.toDataURL('image/jpeg',.97)
}
async function preview(){
 var f=file();if(!f){alert('Upload a WhatsApp image or PDF first.');return}var copies=Math.max(1,+(document.getElementById('copies')||{}).value||1);show('<div style="padding:22px;text-align:center"><b>Preparing Smart Xerox Target…</b><br><small>Adaptive shadow correction is running.</small></div>');
 try{
   if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){var pages=window.sourcePages||[];if(!pages.length){alert('PDF is still loading. Please try Preview again.');return}show('<div class="ai-badge">✓ Smart Xerox Target — PDF preserved.</div>'+pages.map(function(p,i){return '<div class="preview-sheet"><p><b>Document • Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));window.__nrSmartPrintTargetPages=pages;return}
   var raw=await read(f),url=await target(raw);show('<div class="ai-badge">✓ Smart Xerox Target — adaptive camera-shadow correction applied; document details preserved.</div><div class="preview-sheet"><p><b>Document • 1 page • '+copies+' copy/copies</b></p><img src="'+url+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>');window.__nrSmartPrintTargetPages=[url]
 }catch(e){console.error(e);show('<div class="warn">Preview failed safely. Original file is unchanged.</div>')}
}
function install(){if(window.__nrAdaptiveTargetV3)return;window.__nrAdaptiveTargetV3=true;window.previewPrint=preview}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();