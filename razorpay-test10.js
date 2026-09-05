(() => {
  const TEST_PLAN = 'test10';
  const TEST_AMOUNT = 10;
  let injected = false;
  const money = n => `₹${n}`;
  async function api(url, options = {}) {
    const r = await fetch(url, { credentials: 'same-origin', ...options });
    const t = await r.text(); let d = {};
    try { d = JSON.parse(t); } catch { throw Error(r.ok ? 'Unexpected server response.' : 'Server error.'); }
    if (!r.ok) throw Error(d.error || 'Request failed.');
    return d;
  }
  function user() {
    try { return JSON.parse(localStorage.getItem('nr-bizpro-users-v1') || '[]')[0] || {}; } catch { return {}; }
  }
  function inject() {
    if (injected) return;
    const form = document.querySelector('.plans');
    if (!form || document.getElementById('razorpayTest10Btn')) return;
    injected = true;
    const box = document.createElement('div');
    box.id = 'razorpayTest10Box';
    box.style.cssText = 'margin-top:16px;padding:14px;border:1px dashed #1559d6;border-radius:12px;background:#f7fbff';
    box.innerHTML = `<strong>Razorpay Test Payment</strong><div style="font-size:12px;color:#607089;margin:4px 0 10px">Test only — no real ₹${TEST_AMOUNT} charge. Use Razorpay Test Mode.</div><button id="razorpayTest10Btn" type="button" class="portal-primary" style="margin-top:0">Pay ₹10 Test Amount</button><div id="razorpayTest10Status" style="margin-top:8px;font-size:13px"></div>`;
    form.parentElement.appendChild(box);
    document.getElementById('razorpayTest10Btn').onclick = start;
  }
  async function loadRazorpay() {
    if (window.Razorpay) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve; s.onerror = () => reject(Error('Unable to load Razorpay Checkout.')); document.head.appendChild(s);
    });
  }
  async function start() {
    const btn = document.getElementById('razorpayTest10Btn'), status = document.getElementById('razorpayTest10Status'), u = user();
    btn.disabled = true; btn.textContent = 'Opening Razorpay...';
    try {
      await api('/api/auth?action=pending', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'pending', plan:TEST_PLAN}) });
      await loadRazorpay();
      const order = await api('/api/create-order', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({plan:TEST_PLAN,businessName:u.business||'',email:u.email||'',mobile:u.mobile||'',registrationFee:false}) });
      const options = {
        key: order.keyId, amount: order.amount, currency: 'INR', name: 'NR BizPro', description: '₹10 Test Payment', order_id: order.orderId,
        prefill: { name:u.owner||'', email:u.email||'', contact:u.mobile||'' }, theme: { color:'#1559d6' },
        handler: async function(response) {
          status.textContent = 'Verifying test payment...';
          try {
            const v = await api('/api/verify-payment', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(response) });
            status.textContent = v.verified ? '₹10 Test Payment successful ✓' : 'Verification failed.';
            setTimeout(() => location.reload(), 900);
          } catch(e) { status.textContent = e.message; btn.disabled=false; btn.textContent='Pay ₹10 Test Amount'; }
        },
        modal: { ondismiss: () => { btn.disabled=false; btn.textContent='Pay ₹10 Test Amount'; } }
      };
      new window.Razorpay(options).open();
    } catch(e) { status.textContent = e.message; btn.disabled=false; btn.textContent='Pay ₹10 Test Amount'; }
  }
  const observer = new MutationObserver(inject);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  setTimeout(inject, 500); setTimeout(inject, 1500);
})();
