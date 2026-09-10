/* NR BizPro Smart Print FINAL override — customer trial + Continue fix. */
(function(){
  'use strict';
  const CUSTOMER_KEY='nr-bizpro-smart-print-customer-test-v3';
  const CUSTOMER_LIMIT=3;
  const $=id=>document.getElementById(id);
  const customerMode=()=>new URLSearchParams(location.search).get('customerTest')==='1';

  function getCustomerState(){
    try{
      const s=JSON.parse(localStorage.getItem(CUSTOMER_KEY)||'{"used":0}');
      return s&&typeof s==='object'?s:{used:0};
    }catch{return {used:0}}
  }
  function saveCustomerState(s){
    try{
      localStorage.setItem(CUSTOMER_KEY,JSON.stringify({
        used:Math.max(0,Math.min(CUSTOMER_LIMIT,Number(s.used)||0)),
        createdAt:s.createdAt||Date.now()
      }));
    }catch{}
  }
  function remaining(){return Math.max(0,CUSTOMER_LIMIT-getCustomerState().used)}

  function showCustomerLimit(){
    if(!customerMode())return;
    const e=$('trialNote');
    if(e)e.textContent=`Customer Trial: ${remaining()} print${remaining()===1?'':'s'} remaining. One-time allowance; refresh will NOT reset it.`;
  }

  function enforceCustomer(){
    if(!customerMode())return true;
    const copies=Math.max(1,Number($('copies')?.value)||1);
    const left=remaining();
    if(left<=0){
      alert('Customer trial is finished. No trial prints remain.');
      return false;
    }
    if(copies>left){
      alert(`Only ${left} trial print${left===1?'':'s'} remain. Please reduce Copies.`);
      return false;
    }
    return true;
  }

  function consumeCustomer(){
    if(!customerMode())return;
    const copies=Math.max(1,Number($('copies')?.value)||1);
    const s=getCustomerState();
    s.used=Math.min(CUSTOMER_LIMIT,(Number(s.used)||0)+copies);
    saveCustomerState(s);
    showCustomerLimit();
    if(typeof window.updateLicense==='function')window.updateLicense();
  }

  // Continue button: allow customer-test entry even without a billing login.
  window.enterPrint=function(){
    if(customerMode()){
      if(typeof window.showWorkspace==='function')return window.showWorkspace();
      $('gate')?.classList.add('hidden');
      $('workspace')?.classList.remove('hidden');
      showCustomerLimit();
      return;
    }
    if(typeof window.getAccount==='function' && window.getAccount()){
      if(typeof window.showWorkspace==='function')return window.showWorkspace();
    }
    alert('Please login to your NR BizPro account first.');
  };

  window.runScannerPreview=async function(){
    if(!enforceCustomer())return;
    if(typeof window.previewPrint==='function')return window.previewPrint();
    alert('Smart Print preview controller is loading. Please try once more.');
  };

  window.__finalDirectPrint=async function(){
    if(!enforceCustomer())return;
    if(typeof window.printNow==='function')return window.printNow();
    alert('Smart Print print controller is loading. Please try once more.');
  };

  window.confirmScannerPrint=function(){
    if(typeof window.confirmPrint!=='function'){
      alert('Print controller is loading. Please try once more.');
      return;
    }
    const old=window.confirmPrint;
    window.confirmPrint=function(){
      const r=old.apply(this,arguments);
      if(customerMode())setTimeout(consumeCustomer,1200);
      return r;
    };
    return window.confirmPrint();
  };

  window.closePreview=window.closePreview||function(){$('preview')?.classList.add('hidden')};
  window.openManualCrop=window.openManualCrop||function(){alert('Manual Crop: upload the document first, then use Scanner Preview.')};

  function start(){
    showCustomerLimit();
    if(customerMode()){
      // If the customer opens the link directly, never force a login gate.
      if($('gate')&&!$('workspace')?.classList.contains('hidden'))$('gate').classList.add('hidden');
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();