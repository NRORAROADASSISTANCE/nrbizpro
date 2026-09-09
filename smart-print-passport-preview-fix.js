/* NR BizPro — Passport preview/print bridge. Must load after scanner-preview scripts. */
(function(){
  const $=id=>document.getElementById(id);
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  const loadImage=s=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=s});
  let resultCanvas=null;
  function activePassport(){return window.type==='passport'||document.querySelector('[data-type="passport"].active')?.classList.contains('active');}
  async function passportPreview(){
    const f=$('fileInput')?.files?.[0];
    if(!f)return alert('Upload the passport photo first.');
    if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))return alert('Passport Photo mode needs a JPG/PNG photo.');
    if(!window.smartPassportPremium?.sheet)return alert('Passport DSLR engine is still loading. Please try again.');
    const body=$('previewBody');$('preview').classList.remove('hidden');
    body.innerHTML='<div class="ai-badge">⏳ Passport DSLR — improving portrait, cleaning background and preparing exact 35×45 mm photos…</div>';
    setTimeout(async()=>{try{
      const src=await loadImage(await read(f));
      resultCanvas=window.smartPassportPremium.sheet(src,8);
      const u=resultCanvas.toDataURL('image/jpeg',.98);
      body.innerHTML='<div class="ai-badge">✓ Passport DSLR ready • 8 photos • each 35×45 mm • 300 DPI • 4×6 inch photo paper • Color • original unchanged.</div><div class="preview-sheet passport-sheet-preview"><p><b>4×6 PHOTO PAPER • 8 PASSPORT PHOTOS</b></p><img src="'+u+'" alt="Passport 4x6 preview"></div>';
      const note=document.querySelector('#preview .actions .primary');if(note)note.textContent='Confirm & Print';
    }catch(e){console.error(e);body.innerHTML='<div class="ai-badge">⚠️ Passport preview failed safely. Original photo was not changed.</div>'}},30);
  }
  function confirmPassport(){
    if(!resultCanvas)return alert('Run Passport Photo Preview first.');
    const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');
    const u=resultCanvas.toDataURL('image/png');
    w.document.write('<!doctype html><html><head><title>NR BizPro — Passport 4x6</title><style>@page{size:152.4mm 101.6mm;margin:0}html,body{margin:0;padding:0;width:152.4mm;height:101.6mm;overflow:hidden}img{display:block;width:152.4mm;height:101.6mm;object-fit:fill}</style></head><body><img src="'+u+'"><script>onload=()=>setTimeout(()=>print(),500)<\\/script></body></html>');
    w.document.close();
  }
  const oldPreview=window.runScannerPreview;
  window.runScannerPreview=function(){return activePassport()?passportPreview():oldPreview?.()};
  const oldConfirm=window.confirmScannerPrint;
  window.confirmScannerPrint=function(){return activePassport()?confirmPassport():oldConfirm?.()};
})();
