(() => {
  const notify = (message) => {
    const status = document.getElementById('directStatus');
    if (status) status.innerHTML = `<div class="notice">${String(message).replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}</div>`;
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    ta.remove();
    if (!ok) throw new Error('Copy was blocked by the browser.');
  };

  const handleUpiClick = async (event) => {
    const copyBtn = event.target.closest('#copyUpiBtn');
    if (copyBtn) {
      event.preventDefault();
      const text = copyBtn.dataset.upi || copyBtn.getAttribute('data-upi');
      if (!text) return;
      const old = copyBtn.textContent;
      try {
        await copyText(text);
        copyBtn.textContent = 'UPI ID Copied ✓';
        setTimeout(() => { if (copyBtn.isConnected) copyBtn.textContent = old; }, 1800);
      } catch {
        window.prompt('Copy this UPI ID:', text);
      }
      return;
    }

    const openBtn = event.target.closest('#openUpiBtn');
    if (openBtn) {
      event.preventDefault();
      const intent = openBtn.dataset.intent || openBtn.getAttribute('data-intent');
      if (!intent) return;
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isAndroid && !isIOS) {
        notify('Open UPI App works on a mobile device with a UPI app installed. You can use Copy UPI ID on this computer.');
        return;
      }
      try {
        window.location.href = intent;
      } catch {
        notify('Unable to open a UPI app on this device. Please use Copy UPI ID.');
      }
    }
  };

  document.addEventListener('click', handleUpiClick, true);

  const enhance = () => {
    const box = document.getElementById('upiBox');
    if (!box) return;
    const upiText = box.querySelector('strong');
    const copyBtn = document.getElementById('copyUpiBtn');
    const upiLink = box.querySelector('a.portal-secondary[href^="upi://"]');
    if (copyBtn && upiText) copyBtn.dataset.upi = upiText.textContent.trim();
    if (upiLink) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'openUpiBtn';
      btn.className = upiLink.className;
      btn.textContent = 'Open UPI App';
      btn.dataset.intent = upiLink.getAttribute('href');
      upiLink.replaceWith(btn);
    }
  };

  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
  setTimeout(enhance, 100);
  setTimeout(enhance, 500);
})();
