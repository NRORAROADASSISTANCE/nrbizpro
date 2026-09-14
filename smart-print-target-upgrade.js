/* NR BizPro Smart Print — TARGET ENGINE v5
   Robust browser-safe document shadow correction. */
(function(){
'use strict';
function show(html){var m=document.getElementById('preview'),b=document.getElementById('previewBody');if(!m||!b)return;b.innerHTML=html;m.classList.remove('hidden')}
function file(){var i=document.getElementById('fileInput');return i&&i.files&&i.files[0]}
function read(f){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){ok(r.result)};r.onerror=no;r.readAsDataURL(f)})}
function load(src){return new Promise(function(ok,no){var i=new Image();i.onload=function(){ok(i)};i.onerror=no;i.src=src})}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function lum(r,g,b){return .2126*r+.7152*g+.0722*b}
function smooth(a,b,x){x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)}
function frame(){return new Promise(function(r){requestAnimationFrame(r)})}
async function process(src){
 var im=await load(src),mw=1600,mh=2200,scale=Math.min(1,mw/im.naturalWidth,mh/im.naturalHeight),w=Math.max(1,Math.round(im.naturalWidth*scale)),h=Math.max(1,Math.round(im.naturalHeight*scale));
 var c=document.createElement('canvas');c.width=w;c.height=h;var ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,w,h);
 var d=ctx.getImageData(0,0,w,h),p=d.data;
 /* Build a tiny illumination map. This avoids expensive full-resolution blur and cannot block Preview. */
 var tw=72,th=96,t=document.createElement('canvas');t.width=tw;t.height=th;var tc=t.getContext('2d');tc.drawImage(c,0,0,tw,th);var td=tc.getImageData(0,0,tw,th).data;
 var field=new Float32Array(tw*th);
 for(var y=0;y<th;y++)for(var x=0;x<tw;x++){var q=(y*tw+x)*4;field[y*tw+x]=lum(td[q],td[q+1],td[q+2])}
 /* Reference is the cleanest paper area on the right, calculated per row. */
 var ref=new Float32Array(th),left=new Float32Array(th);
 for(var yy=0;yy<th;yy++){
   var rv=[],lv=[];
   for(var xx=0;xx<tw;xx++){var v=field[yy*tw+xx];if(xx>tw*.62&&v>105)rv.push(v);if(xx<tw*.38&&v>55)lv.push(v)}
   rv.sort(function(a,b){return b-a});lv.sort(function(a,b){return a-b});
   ref[yy]=rv.length?rv[Math.floor(rv.length*.25)]:170;
   left[yy]=lv.length?lv[Math.floor(lv.length*.65)]:ref[yy];
 }
 function interp(a,z){z=clamp(z,0,a.length-1);var i=Math.floor(z),j=Math.min(a.length-1,i+1),q=z-i;return a[i]*(1-q)+a[j]*q}
 function fld(fx,fy){fx=clamp(fx,0,tw-1);fy=clamp(fy,0,th-1);var x0=Math.floor(fx),x1=Math.min(tw-1,x0+1),y0=Math.floor(fy),y1=Math.min(th-1,y0+1),qx=fx-x0,qy=fy-y0;return (field[y0*tw+x0]*(1-qx)+field[y0*tw+x1]*qx)*(1-qy)+(field[y1*tw+x0]*(1-qx)+field[y1*tw+x1]*qx)*qy}
 for(var y2=0;y2<h;y2++){
   var fy=y2*(th-1)/Math.max(1,h-1),rr=interp(ref,fy),lr=interp(left,fy);
   for(var x2=0;x2<w;x2++){
     var i=(y2*w+x2)*4,r=p[i],g=p[i+1],b=p[i+2],L=lum(r,g,b),mx=Math.max(r,g,b),mn=Math.min(r,g,b),sat=mx?(mx-mn)/mx:0,fx=x2*(tw-1)/Math.max(1,w-1),local=fld(fx,fy);
     var shadow=Math.max(0,rr-Math.max(45,lr));
     var localShadow=Math.max(0,rr-Math.max(45,local));
     var amount=Math.max(shadow,localShadow)/(Math.max(80,rr));
     var edge=1-smooth(.30,.82,x2/Math.max(1,w-1));
     var paper=smooth(55,145,L)*(1-smooth(205,245,L));
     var inkProtect=1-smooth(25,95,L);
     var colorProtect=sat>.55?.25:(sat>.35?.55:1);
     var gain=1+clamp(amount,0,.82)*edge*(.25+.75*paper)*colorProtect*(1-.75*inkProtect);
     gain=clamp(gain,1,1.72);
     p[i]=clamp(r*gain,0,255);p[i+1]=clamp(g*gain,0,255);p[i+2]=clamp(b*gain,0,255);
   }
   if(y2%24===0)await frame();
 }
 ctx.putImageData(d,0,0);return c.toDataURL('image/jpeg',.97)
}
async function preview(){
 var f=file();if(!f){alert('Upload a WhatsApp image or PDF first.');return}
 var copies=Math.max(1,+(document.getElementById('copies')||{}).value||1);
 show('<div style="padding:22px;text-align:center"><b>Preparing Smart Xerox Target…</b><br><small>Detecting and removing camera shadow.</small></div>');
 try{
   if(f.type==='application/pdf'||/\.pdf$/i.test(f.name)){
     var pages=window.sourcePages||[];if(!pages.length){show('<div class="warn">PDF is still loading. Please click Preview again.</div>');return}
     window.__nrSmartPrintTargetPages=pages;show('<div class="ai-badge">✓ Smart Xerox Target — PDF ready.</div>'+pages.map(function(p,i){return '<div class="preview-sheet"><p><b>Page '+(i+1)+' of '+pages.length+' • '+copies+' copy/copies</b></p><img src="'+p+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>'}).join(''));return
   }
   var raw=await read(f),url=await process(raw);window.__nrSmartPrintTargetPages=[url];
   show('<div class="ai-badge">✓ Smart Xerox Target — camera shadow corrected.</div><div class="preview-sheet"><p><b>Document • 1 page • '+copies+' copy/copies</b></p><img src="'+url+'" style="max-width:100%;height:auto;display:block;margin:auto"></div>');
 }catch(e){console.error('Smart Print target error:',e);show('<div class="warn">Preview processing failed safely. Please select the image again and Preview.</div>')}
}
function install(){if(window.__nrTargetV5Installed)return;window.__nrTargetV5Installed=true;window.previewPrint=preview}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
