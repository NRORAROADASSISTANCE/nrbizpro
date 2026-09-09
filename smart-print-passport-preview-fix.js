/* NR BizPro — Passport Photo FINAL preview/print bridge. Loads after all scanner scripts. */
(function(){
  const $=id=>document.getElementById(id);
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const loadImage=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  let resultCanvas=null, passportSelected=false;

  function isPassport(){
    if(passportSelected)return true;
    const b=document.querySelector('[data-type="passport"]');
    if(b && (b.classList.contains('active') || b.getAttribute('aria-pressed')==='true')) return true;
    // The passport UI forces the 4x6 paper selection; use it as a reliable fallback.
    if($('paper')?.value==='4x6') return true;
    const hint=$('typeHint')?.textContent||'';
    return /passport/i.test(hint);
  }

  function markPassport(){passportSelected=true;}

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-type="passport"]');
    if(b) markPassport();
  },true);

  document.addEventListener('change',e=>{
    if(e.target?.id==='paper' && e.target.value==='4x6') passportSelected=true;
  },true);

  async function passportPreview(){
    passportSelected=true;
    const f=$('fileInput')?.files?.[0];
    if(!f)return alert('Upload the passport photo first.');
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return alert('Passport Photo mode needs a JPG/PNG photo.');
    if(!window.smartPassportPremium?.sheet)return alert('Passport DSLR engine is still loading. Refresh once and try again.');
    const modal=$('preview'),body=$('previewBody');
    if(!modal||!body)return alert('Passport preview window is unavailable.');
    modal.classList.remove('hidden');
    body.innerHTML='<div class="ai-badge">⏳ Creating 4×6 passport sheet…</div>';
    try{
      const src=await loadImage(await read(f));
      resultCanvas=window.smartPassportPremium.sheet(src,8);
      const u=resultCanvas.toDataURL('image/jpeg',.98);
      body.innerHTML='<div class="ai-badge">✓ PASSPORT PHOTO READY • 8 copies • 35×45 mm each • 300 DPI • 4×6 inch • Color</div><div class="preview-sheet passport-sheet-preview" style="width:100%;text-align:center"><p><b>4×6 PHOTO PAPER — 8 PASSPORT PHOTOS</b></p><img style="width:100%;max-width:100%;height:auto;display:block;margin:auto" src="'+u+'" alt="4x6 passport photo sheet"></div>';
      const btn=document.querySelector('#preview .actions .primary');if(btn)btn.textContent='Confirm & Print';
    }catch(e){console.error(e);resultCanvas=null;body.innerHTML='<div class="ai-badge">⚠️ Passport preview failed. Original photo is unchanged.</div>'}
  }

  function confirmPassport(){
    if(!resultCanvas)return alert('Run Passport Photo Preview first.');
    const w=window.open('','_blank');
    if(!w)return alert('Allow pop-ups for printing.');
    const u=resultCanvas.toDataURL('image/png');
    w.document.write('<!doctype html><html><head><title>NR BizPro Passport 4x6</title><style>@page{size:152.4mm 101.6mm;margin:0}html,body{margin:0!important;padding:0!important;width:152.4mm;height:101.6mm;overflow:hidden;background:#fff}img{display:block;width:152.4mm;height:101.6mm;margin:0;padding:0}</style></head><body><img src="'+u+'" onload="setTimeout(function(){window.print()},400)"></body></html>');
    w.document.close();
  }

  const oldPreview=window.runScannerPreview;
  window.runScannerPreview=function(){return isPassport()?passportPreview():oldPreview?.()};
  const oldConfirm=window.confirmScannerPrint;
  window.confirmScannerPrint=function(){return isPassport()?confirmPassport():oldConfirm?.()};
  window.__passportFinalPreview=passportPreview;
})();
