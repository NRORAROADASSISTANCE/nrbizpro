/* NR BizPro Smart Print FINAL override — pre-activation demo only; activated customers are unlimited for 2 years. */
(function(){
  'use strict';
  const CUSTOMER_KEY='nr-bizpro-smart-print-customer-test-v3';
  const CUSTOMER_LIMIT=3;
  const $=id=>document.getElementById(id);
  const customerMode=()=>new URLSearchParams(location.search).get('customerTest')==='1';
  function getCustomerState(){try{const s=JSON.parse(localStorage.getItem(CUSTOMER_KEY)||'{"used":0}');return s&&typeof s==='object'?s:{used:0}}catch{return {used:0}}}
  function saveCustomerState(s){try{localStorage.setItem(CUSTOMER_KEY,JSON.stringify({used:Math.max(0,Math.min(CUSTOMER_LIMIT,Number(s.used)||0)),createdAt:s.createdAt||Date.now()}))}catch{}}
  function remaining(){return Math.max(0,CUSTOMER_LIMIT-getCustomerState().used)}
  function showCustomerLimit(){if(!customerMode())return;const e=$('trialNote');if(e)e.textContent=`Pre-activation demo: ${remaining()} print${remaining()===1?'':'s'} remaining. After activation: unlimited printing for 2 years.`;const l=$('licenseText'),s=$('licenseSub');if(l)l.textContent='Customer Trial';if(s)s.textContent=`${remaining()} trial prints remaining`}
  function normalizeLicenseTerm(){
    const g=document.querySelector('.gate');
    if(g)g.querySelectorAll('p,.warn,button').forEach(el=>{
      el.textContent=el.textContent
        .replace(/5-Year/gi,'2-Year')
        .replace(/5 Years/gi,'2 Years')
        .replace(/5 successful test copies/gi,'3 successful test copies')
        .replace(/Free trial: 5/gi,'Free trial: 3');
    });
    const l=$('licenseText');
    if(l&&/5-Year/i.test(l.textContent))l.textContent=l.textContent.replace(/5-Year/gi,'2-Year');
    if(customerMode()){
      const b=g?.querySelector('button.primary');
      if(b)b.textContent='Start Free Test (3 Prints)';
    }
  }
  function enforceCustomer(){if(!customerMode())return true;const copies=Math.max(1,Number($('copies')?.value)||1),left=remaining();if(left<=0){alert('Pre-activation demo is finished. Activate Smart Print for unlimited printing for 2 years.');return false}if(copies>left){alert(`Only ${left} demo print${left===1?'':'s'} remain. Please reduce Copies.`);return false}return true}
  function consumeCustomer(){if(!customerMode())return;const s=getCustomerState(),copies=Math.max(1,Number($('copies')?.value)||1);s.used=Math.min(CUSTOMER_LIMIT,(Number(s.used)||0)+copies);saveCustomerState(s);showCustomerLimit()}
  window.enterPrint=function(){if(customerMode()){if(typeof window.showWorkspace==='function')return window.showWorkspace();$('gate')?.classList.add('hidden');$('workspace')?.classList.remove('hidden');showCustomerLimit();return}alert('Please login to your NR BizPro account first.')};
  window.runScannerPreview=async function(){if(!enforceCustomer())return;if(typeof window.previewPrint==='function')return window.previewPrint();alert('Smart Print preview controller is loading. Please try once more.')};
  window.__finalDirectPrint=async function(){if(!enforceCustomer())return;if(typeof window.printNow==='function')return window.printNow();alert('Smart Print print controller is loading. Please try once more.')};
  window.confirmScannerPrint=function(){if(typeof window.confirmPrint!=='function'){alert('Print controller is loading. Please try once more.');return}const old=window.confirmPrint;window.confirmPrint=function(){const r=old.apply(this,arguments);if(customerMode())setTimeout(consumeCustomer,1200);return r};return window.confirmPrint()};
  window.closePreview=window.closePreview||function(){$('preview')?.classList.add('hidden')};
  window.openManualCrop=window.openManualCrop||function(){alert('Manual Crop: upload the document first, then use Scanner Preview.')};
  function start(){showCustomerLimit();normalizeLicenseTerm()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
