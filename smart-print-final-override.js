/* Smart Print FINAL override — stable upload handling + one-time customer test allowance. */
(function(){'use strict';
const CUSTOMER_KEY='nr-bizpro-smart-print-customer-test-v2';
const CUSTOMER_LIMIT=5;
const $=id=>document.getElementById(id);
function customerMode(){return new URLSearchParams(location.search).get('customerTest')==='1'}
function getCustomerState(){try{return JSON.parse(localStorage.getItem(CUSTOMER_KEY)||'{"used":0}')||{used:0}}catch{return {used:0}}}
function saveCustomerState(s){localStorage.setItem(CUSTOMER_KEY,JSON.stringify({used:Math.max(0,Number(s.used)||0),createdAt:s.createdAt||Date.now()}))}
function showCustomerLimit(){if(!customerMode())return;const s=getCustomerState(),left=Math.max(0,CUSTOMER_LIMIT-s.used);const e=$('trialNote');if(e)e.textContent=`Customer Test: ${left} test prints remaining. This allowance is ONE-TIME only and does not reset daily.`}
function enforceCustomer(){if(!customerMode())return true;const s=getCustomerState(),copies=Math.max(1,Number($('copies')?.value)||1);if(s.used+copies>CUSTOMER_LIMIT){alert(`Customer test allowance exhausted. ${Math.max(0,CUSTOMER_LIMIT-s.used)} test print(s) remain.`);return false}return true}
function consumeCustomer(){if(!customerMode())return;const s=getCustomerState();s.used=Math.min(CUSTOMER_LIMIT,(s.used||0)+Math.max(1,Number($('copies')?.value)||1));saveCustomerState(s);showCustomerLimit()}
window.runScannerPreview=async function(){if(!enforceCustomer())return;if(typeof window.previewPrint==='function')return window.previewPrint();alert('Smart Print preview controller is loading. Please try once more.')};
window.__finalDirectPrint=async function(){if(!enforceCustomer())return;if(typeof window.printNow==='function')return window.printNow();alert('Smart Print print controller is loading. Please try once more.')};
window.confirmScannerPrint=function(){if(typeof window.confirmPrint!=='function'){alert('Print controller is loading. Please try once more.');return}const old=window.confirmPrint;window.confirmPrint=function(){const r=old.apply(this,arguments);setTimeout(consumeCustomer,1200);return r};return window.confirmPrint()};
window.closePreview=window.closePreview||function(){$('preview')?.classList.add('hidden')};
window.openManualCrop=window.openManualCrop||function(){alert('Manual Crop: upload the document first, then use Scanner Preview.')};
function start(){showCustomerLimit()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();