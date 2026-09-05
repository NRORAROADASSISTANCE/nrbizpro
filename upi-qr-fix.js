(() => {
  const QR_API = 'https://api.qrserver.com/v1/create-qr-code/';
  let lastUpi = '';

  function esc(v) {
    return String(v ?? '').replace(/[&<>\"]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' }[m]));
  }

  function addQr() {
    const box = document.getElementById('upiBox');
    if (!box) return;
    const text = box.textContent || '';
    const match = text.match(/UPI ID:\s*([^\s]+)/i);
    if (!match) return;
    const upi = match[1].trim();
    if (!upi || upi === lastUpi) return;

    const amountMatch = document.querySelector('.summary .total b');
    const amountText = amountMatch?.textContent || '';
    const amount = (amountText.match(/[\d,]+/) || ['0'])[0].replace(/,/g, '');
    if (!amount || amount === '0') return;

    const intent = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent('NR BizPro')}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent('NR BizPro Membership')}`;
    const qrUrl = `${QR_API}?size=240x240&margin=12&data=${encodeURIComponent(intent)}`;

    lastUpi = upi;
    const old = document.getElementById('upiQrSection');
    if (old) old.remove();

    const section = document.createElement('div');
    section.id = 'upiQrSection';
    section.style.cssText = 'margin-top:14px;padding:14px;background:#fff;border:1px solid #dce6f2;border-radius:12px;text-align:center;';
    section.innerHTML = `
      <div style="font-weight:800;color:#10233f;font-size:15px">Scan QR Code to Pay</div>
      <div style="font-size:12px;color:#607089;margin:4px 0 10px">Scan with any UPI app and pay the exact amount.</div>
      <img src="${esc(qrUrl)}" alt="UPI payment QR code" width="240" height="240" style="display:block;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;background:#fff" loading="eager">
      <div style="font-size:12px;color:#607089;margin-top:8px">Amount: <strong style="color:#10233f">₹${esc(amount)}</strong></div>`;

    box.parentNode.insertBefore(section, box.nextSibling);
  }

  const observer = new MutationObserver(addQr);
  observer.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  setTimeout(addQr, 300);
  setTimeout(addQr, 1000);
  setTimeout(addQr, 2000);
})();
