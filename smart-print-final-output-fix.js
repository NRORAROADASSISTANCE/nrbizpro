/* NR BizPro Smart Print — final output, color, multi-file and print fix. */
(function(){
  const $=id=>document.getElementById(id);
  let multiPages=[],multiFiles=[];
  const read=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(f)});
  async function ensurePdfLocal(){
    if(typeof window.ensurePdf==='function')return window.ensurePdf();
    const pdf=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
    pdf.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';return pdf;
  }
  async function pdfPages(f){
    const pdf=await ensurePdfLocal(),doc=await pdf.getDocument({data:await f.arrayBuffer()}).promise,pages=[];
    for(let n=1;n<=doc.numPages;n++){const p=await doc.getPage(n),vp=p.getViewport({scale:2}),c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);await p.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;pages.push(c.toDataURL('image/png'))}return pages;
  }
  function idMode(){return document.querySelector('.types button.active')?.dataset.type==='id'}
  function passportMode(){return document.querySelector('.types button.active')?.dataset.type==='passport'}
  async function passportSheetFromData(data){
    const im=await new Promise((ok,no)=>{const x=new Image();x.onload=()=>ok(x);x.onerror=no;x.src=data});
    const c=document.createElement('canvas');c.width=im.naturalWidth||im.width;c.height=im.naturalHeight||im.height;c.getContext('2d').drawImage(im,0,0);
    if(window.smartPassportPremium?.sheet)return window.smartPassportPremium.sheet(c,8);
    if(window.smartPrintExactSize?.passportSheet)return window.smartPrintExactSize.passportSheet(c,8,300);
    return c;
  }
  async function passportSheetData(){
    if(!multiPages.length)return null;
    const sheet=await passportSheetFromData(multiPages[0]);
    return sheet.toDataURL('image/png');
  }
  async function finalLoadPhoto(e){
    const files=Array.from(e?.target?.files||[]);if(!files.length)return;
    if(idMode())return window.__idfbOldLoadPhoto?window.__idfbOldLoadPhoto(e):undefined;
    multiFiles=files;multiPages=[];$('quality')?.classList.add('hidden');
    try{
      for(const f of files){if(f.type==='application/pdf'||/\.pdf$/i.test(f.name))multiPages.push(...await pdfPages(f));else if(f.type.startsWith('image/'))multiPages.push(await read(f))}
      if(!multiPages.length)throw new Error('No supported files');
      const q=$('quality');if(q){q.textContent=passportMode()?'✓ Photo loaded • Passport 8-up will be prepared for 4×6 inch photo paper • original photo untouched.':`✓ ${files.length} file${files.length>1?'s':''} loaded • ${multiPages.length} printable page${multiPages.length>1?'s':''}. Original files remain untouched.`;q.classList.remove('hidden')}
      if($('typeHint'))$('typeHint').textContent=passportMode()?'✓ 8 passport photos • 35×45 mm each • 4×6 inch photo paper • Color • 300 DPI.':`✓ ${multiPages.length} page${multiPages.length>1?'s':''} queued from ${files.length} file${files.length>1?'s':''}. Choose Scanner Preview or Print Now.`;
    }catch(err){console.error(err);alert('Could not read one or more files. Please select the original WhatsApp files again.');multiPages=[]}
  }
  function installMulti(){
    const input=$('fileInput');if(!input)return;input.multiple=true;input.removeAttribute('onchange');input.addEventListener('change',finalLoadPhoto);
    const label=input.closest('.upload');if(label){const s=label.querySelector('span');if(s)s.textContent='JPG / PNG / PDF • Select multiple files for multi-document printing • originals are never overwritten';if(!label.querySelector('[data-multi-note]')){const n=document.createElement('small');n.dataset.multiNote='1';n.style.display='block';n.style.marginTop='6px';n.style.fontWeight='600';n.textContent='📚 Multi-document upload enabled';label.appendChild(n)}}
    window.__idfbOldLoadPhoto=window.loadPhoto;
  }
  function idPreview(){return window.__idfbRun?window.__idfbRun():alert('Upload both Front and Back images first.')}
  function idConfirm(){return window.__idfbConfirm?window.__idfbConfirm():alert('Prepare the ID Card preview first.')}
  async function printMulti(){
    if(idMode())return idConfirm();
    if(!multiPages.length)return alert('Upload one or more WhatsApp documents, photos or PDFs first.');
    if(typeof window.canPrint==='function'&&!window.canPrint())return;
    const copies=Math.max(1,+$('copies')?.value||1),paper=passportMode()?'4x6':($('paper')?.value||'A4'),mode=$('mode')?.value||'Color';
    let pagesData=multiPages;
    let pageCss;
    if(passportMode()){
      pagesData=[await passportSheetData()];
      pageCss='@page{size:6in 4in;margin:0}.p{width:6in;height:4in;display:flex;align-items:center;justify-content:center;page-break-after:always;overflow:hidden}.p:last-child{page-break-after:auto}.p img{display:block;width:6in;height:4in;max-width:6in;max-height:4in;object-fit:fill;}';
    }else{
      pageCss=`@page{size:${paper} portrait;margin:0}.p{width:${paper==='A5'?148:210}mm;height:${paper==='A5'?210:297}mm;display:flex;align-items:center;justify-content:center;page-break-after:always;overflow:hidden}.p:last-child{page-break-after:auto}.p img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;}`;
    }
    if(mode==='Black & White')pageCss=pageCss.replace('object-fit:fill;}','object-fit:fill;filter:grayscale(1);}').replace('object-fit:contain;}','object-fit:contain;filter:grayscale(1);}');
    const pages=Array.from({length:copies},()=>pagesData.map(p=>`<div class="p"><img src="${p}"></div>`).join('')).join('');
    const w=window.open('','_blank');if(!w)return alert('Allow pop-ups to print.');
    w.document.write(`<!doctype html><html><head><title>NR BizPro Smart Print</title><style>html,body{margin:0;padding:0;background:#fff}${pageCss}</style></head><body>${pages}<script>window.onload=function(){setTimeout(function(){window.print()},500)};window.onafterprint=function(){window.close()}<\/script></body></html>`);w.document.close();
  }
  async function previewMulti(){
    if(idMode())return idPreview();
    if(!multiPages.length)return alert('Upload one or more WhatsApp documents, photos or PDFs first.');
    const body=$('previewBody');if(!body)return;
    if(passportMode()){
      const p=await passportSheetData();
      body.innerHTML=`<div class="ai-badge">✓ Passport Photo ready • 8 copies • 35×45 mm each • 4×6 inch photo paper • Color • 300 DPI • original photo preserved.</div><div class="preview-sheet"><p><b>4×6 PHOTO PAPER • 6×4 inch landscape • 8 passport photos</b></p><img src="${p}" alt="8-up passport photo 4x6 print preview" style="width:100%;height:auto;object-fit:contain"></div>`;
    }else{
      body.innerHTML=`<div class="ai-badge">✓ Multi-document preview • ${multiFiles.length} file${multiFiles.length>1?'s':''} • ${multiPages.length} page${multiPages.length>1?'s':''} • Mode: ${$('mode')?.value||'Color'} • original files preserved.</div>`+multiPages.map((p,i)=>`<div class="preview-sheet"><p><b>Document Page ${i+1} of ${multiPages.length}</b></p><img src="${p}" alt="Page ${i+1}"></div>`).join('');
    }
    $('preview').classList.remove('hidden');
  }
  function patchButtons(){Array.from(document.querySelectorAll('.actions button')).forEach(b=>{const t=(b.textContent||'').trim();if(/^Print$/i.test(t)){b.textContent='🖨️ Print Now';b.onclick=printMulti}else if(t.includes('Scanner Preview'))b.onclick=previewMulti})}
  function ensurePassportPaperOption(){
    const s=$('paper');if(!s)return;
    if(!s.querySelector('option[value="4x6"]')){const o=document.createElement('option');o.value='4x6';o.textContent='4×6 Photo Paper (6×4 landscape)';s.appendChild(o)}
    if(passportMode()){s.value='4x6';if($('copies'))$('copies').value=1;if($('mode'))$('mode').value='Color';if($('typeHint'))$('typeHint').textContent='📸 1-Click Passport Photo: DSLR-style processing → 8 × 35×45 mm → 4×6 inch photo paper (6×4 landscape) → Color → 300 DPI.'}
  }
  function boot(){
    installMulti();ensurePassportPaperOption();
    window.__idfbRun=window.runScannerPreview;window.__idfbConfirm=window.confirmScannerPrint;window.runScannerPreview=previewMulti;window.confirmScannerPrint=printMulti;window.__finalDirectPrint=printMulti;patchButtons();
    const oldSelect=window.selectType;if(typeof oldSelect==='function'&&!oldSelect.__finalOutputFix){const s=function(t){const r=oldSelect(t);setTimeout(()=>{ensurePassportPaperOption();window.runScannerPreview=idMode()?idPreview:previewMulti;window.confirmScannerPrint=idMode()?idConfirm:printMulti;window.__finalDirectPrint=idMode()?idConfirm:printMulti;patchButtons()},50);return r};s.__finalOutputFix=true;window.selectType=s}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1000));else setTimeout(boot,1000);
})();