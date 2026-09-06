(() => {
  const QR_API = 'https://api.qrserver.com/v1/create-qr-code/';
  let lastKey = '';

  function esc(v) {
    return String(v ?? '').replace(/[&<>\"]/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;'
    }[m]));
  }

  function getUpi(box) {
    // IMPORTANT: read only the UPI <strong>, never box.textContent.
    // box.textContent also contains "Copy UPI ID", which previously got
    // appended to the UPI address and produced an invalid QR payload.
    const strong = box.querySelector('strong');
    const value = strong?.textContent?.trim() || '';
    if (value && /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(value)) return value;

    const match = (box.textContent || '').match(/UPI ID:\s*([A-Za-z0-9._-]+@[A-Za-z0-9.-]+)/i);
    return match ? match[1].trim() : '';
  }

  function getAmount() {
    const amountMatch = document.querySelector('.summary .total b');
    const amountText = amountMatch?.textContent || '';
    return (amountText.match(/[\d,]+(?:\.\d+)?/) || ['0'])[0].replace(/,/g, '');
  }

  function addQr() {
    const box = document.getElementById('upiBox');
    if (!box) return;

    const upi = getUpi(box);
    const amount = getAmount();
    if (!upi || !amount || amount === '0') return;

    const key = `${upi}|${amount}`;
    if (key === lastKey && document.getElementById('upiQrSection')) return;

    // Keep the UPI payload short and standards-friendly.
    const intent = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent('NR BizPro')}&am=${encodeURIComponent(amount)}&cu=INR`;
    const qrUrl = `${QR_API}?size=300x300&margin=12&data=${encodeURIComponent(intent)}`;

    lastKey = key;
    const old = document.getElementById('upiQrSection');
    if (old) old.remove();

    const section = document.createElement('div');
    section.id = 'upiQrSection';
    section.style.cssText = 'margin-top:14px;padding:14px;background:#fff;border:1px solid #dce6f2;border-radius:12px;text-align:center;';
    section.innerHTML = `
      <div style="font-weight:800;color:#10233f;font-size:15px">Scan QR Code to Pay</div>
      <div style="font-size:12px;color:#607089;margin:4px 0 10px">Scan with any UPI app and pay the exact amount.</div>
      <img src="${esc(qrUrl)}" alt="UPI payment QR code" width="300" height="300" style="display:block;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;background:#fff;max-width:100%;height:auto" loading="eager">
      <div style="font-size:12px;color:#607089;margin-top:8px">Amount: <strong style="color:#10233f">₹${esc(amount)}</strong></div>`;

    box.parentNode.insertBefore(section, box.nextSibling);
  }

  const observer = new MutationObserver(addQr);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  setTimeout(addQr, 300);
  setTimeout(addQr, 1000);
  setTimeout(addQr, 2000);
})();
