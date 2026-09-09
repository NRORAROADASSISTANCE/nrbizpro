/* NR BizPro Smart Print — Passport FINAL v38: reliable 4x6 preview + same-document print. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  let resultCanvas=null;
  let passportSelected=false;
  const read=f=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f)});
  const loadImage=s=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=s});
  function activeType(){return document.querySelector('.types button.active')?.dataset?.type||''}
  function isPassport(){return passportSelected||activeType()==='passport'||/passport/i.test($('typeHint')?.textContent||'')}
  function setPassportUI(){
    if($('paper'))$('paper').value='4x6';
    if($('mode'))$('mode').value='Color';
    if($('copies'))$('copies').value='1';
    if($('typeHint'))$('typeHint').textContent='✓ Passport Photo: DSLR-style enhancement • 8 × 35×45 mm • 4×6 inch photo paper • Color • 300 DPI.';
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('.types button[data-type="passport"]');
    if(b){passportSelected=true;setPassportUI();}
    const non=e.target.closest?.('.types button:not([data-type="passport"])');
    if(non)passportSelected=false;
  },true);
  function bindFileInput(){
    const input=$('fileInput');
    if(!input||input.__passportBound)return;
    input.__passportBound=true;
    input.addEventListener('change',()=>{
      if(!isPassport())return;
      if(typeof window.loadPhoto==='function' && input.files?.length) window.loadPhoto({target:input});
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindFileInput);else bindFileInput();
  new MutationObserver(bindFileInput).observe(document.documentElement,{childList:true,subtree:true});
  async function makeSheet(){
    const input=$('fileInput'),f=input?.files?.[0];
    if(!f)throw new Error('Upload the passport photo first.');
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))throw new Error('Passport Photo mode needs a JPG/PNG photo.');
    if(!window.smartPassportPremium?.sheet)throw new Error('Passport DSLR engine is not ready. Please refresh once.');
    const src=await loadImage(await read(f));
    return window.smartPassportPremium.sheet(src,8);
  }
  async function passportPreview(){
    passportSelected=true;setPassportUI();
    const modal=$('preview'),body=$('previewBody');
    if(!modal||!body)return alert('Passport preview window is unavailable.');
    modal.classList.remove('hidden');
    body.innerHTML='<div class="ai-badge">⏳ Preparing exact 4×6 passport sheet…</div>';
    try{
      resultCanvas=await makeSheet();
      const u=resultCanvas.toDataURL('image/jpeg',.98);
      body.innerHTML='<div class="ai-badge">✓ PASSPORT SHEET READY • 8 photos • exact 35×45 mm each • 4×6 inch • 300 DPI • Color • original photo preserved.</div><div class="preview-sheet passport-sheet-preview" style="width:100%;text-align:center"><p><b>4×6 PHOTO PAPER — 6×4 INCH LANDSCAPE — 8 PASSPORT PHOTOS</b></p><img src="'+u+'" alt="8 passport photos on 4x6 photo paper" style="display:block;width:100%;max-width:720px;height:auto;margin:0 auto;object-fit:contain"><p style="font-size:13px;margin:8px 0 0">Print setting: <b>4×6 / 6×4 landscape • 100% / Actual Size • Color • no Fit/Shrink</b></p></div>';
      const btn=document.querySelector('#preview .actions .primary');if(btn)btn.textContent='Confirm & Print';
    }catch(err){
      console.error('Passport preview:',err);resultCanvas=null;
      body.innerHTML='<div class="ai-badge">⚠️ '+String(err?.message||'Passport preview failed.')+' Original photo is unchanged.</div>';
    }
  }
  function printPassportSameDocument(){
    if(!resultCanvas)return alert('Open Passport Photo Preview first.');
    const old=document.getElementById('__nr_passport_print_root');
    if(old)old.remove();
    const root=document.createElement('div');
    root.id='__nr_passport_print_root';
    const img=document.createElement('img');
    img.src=resultCanvas.toDataURL('image/png');
    img.alt='NR BizPro Passport 4x6 sheet';
    root.appendChild(img);
    const style=document.createElement('style');
    style.id='__nr_passport_print_style';
    style.textContent='@media screen{#__nr_passport_print_root{position:fixed;left:-100000px;top:0;width:6in;height:4in;overflow:hidden}}@media print{@page{size:6in 4in;margin:0!important}html,body{margin:0!important;padding:0!important;width:6in!important;height:4in!important;background:#fff!important;overflow:hidden!important}body>*:not(#__nr_passport_print_root){display:none!important}#__nr_passport_print_root{display:block!important;position:static!important;width:6in!important;height:4in!important;margin:0!important;padding:0!important;overflow:hidden!important}#__nr_passport_print_root img{display:block!important;width:6in!important;height:4in!important;margin:0!important;padding:0!important;border:0!important;object-fit:fill!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}';
    document.head.appendChild(style);
    document.body.appendChild(root);
    const cleanup=()=>{setTimeout(()=>{style.remove();root.remove()},500)};
    window.addEventListener('afterprint',cleanup,{once:true});
    requestAnimationFrame(()=>setTimeout(()=>window.print(),250));
  }
  const oldPreview=window.runScannerPreview;
  const oldConfirm=window.confirmScannerPrint;
  window.runScannerPreview=function(){return isPassport()?passportPreview():(oldPreview?oldPreview():undefined)};
  window.confirmScannerPrint=function(){return isPassport()?printPassportSameDocument():(oldConfirm?oldConfirm():undefined)};
  window.__finalDirectPrint=function(){return isPassport()?printPassportSameDocument():(oldConfirm?oldConfirm():undefined)};
  window.__passportFinalPreview=passportPreview;
  window.__smartPrintPreview=function(){return isPassport()?passportPreview():(oldPreview?oldPreview():undefined)};
})();
