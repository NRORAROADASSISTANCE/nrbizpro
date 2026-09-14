/* Use final 6-year/lifetime payment approval route. */
(function(){
'use strict';
window.approvePayment=async function(id){if(!confirm('Confirm UTR/payment verification and activate this membership under the final plan?'))return;try{const r=await fetch('/api/admin-payment-final',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'approve-final-payment',paymentId:decodeURIComponent(id)})});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Payment approval failed.');if(typeof window.loadPayments==='function')await window.loadPayments();if(typeof window.render==='function')await window.render();alert(`Payment approved. Final plan: ${j.plan}.`)}catch(err){alert(err.message)}};
})();
