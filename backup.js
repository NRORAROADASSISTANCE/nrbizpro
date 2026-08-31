/* NR BizPro secure backup foundation
 * Client-side encrypted export/import. The application data is never rendered to an admin.
 * Restore is sent through the authenticated /api/data endpoint so the server remains the source of truth.
 */
(() => {
  const BACKUP_VERSION = 1;
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  const getData = () => {
    if (typeof state !== 'undefined' && state) return structuredClone(state);
    if (typeof serverData !== 'undefined' && serverData) return structuredClone(serverData);
    throw new Error('No business data is loaded.');
  };

  const deriveKey = async (password, salt) => {
    const base = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const bytesToB64 = bytes => {
    let s = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
    return btoa(s);
  };
  const b64ToBytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

  async function exportEncryptedBackup() {
    const password = prompt('Create a backup password. Keep it safe; it is required to restore this backup.');
    if (!password || password.length < 8) return alert('Backup password must be at least 8 characters.');
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      const payload = JSON.stringify({ version: BACKUP_VERSION, createdAt: new Date().toISOString(), data: getData() });
      const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEncoder.encode(payload)));
      const file = { format: 'NRBIZPRO-ENCRYPTED-BACKUP', version: BACKUP_VERSION, salt: bytesToB64(salt), iv: bytesToB64(iv), ciphertext: bytesToB64(encrypted) };
      const blob = new Blob([JSON.stringify(file)], { type: 'application/nrbizpro-backup+json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nrbizpro-backup-${new Date().toISOString().slice(0,10)}.nrbak`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      alert('Encrypted backup created successfully. Store the file and password safely.');
    } catch (e) { alert(`Backup failed: ${e.message}`); }
  }

  async function importEncryptedBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.nrbak,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const password = prompt('Enter the backup password.');
      if (!password) return;
      try {
        const raw = JSON.parse(await file.text());
        if (raw.format !== 'NRBIZPRO-ENCRYPTED-BACKUP') throw new Error('This is not a valid NR BizPro backup.');
        const key = await deriveKey(password, b64ToBytes(raw.salt));
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(raw.iv) }, key, b64ToBytes(raw.ciphertext));
        const payload = JSON.parse(textDecoder.decode(decrypted));
        if (payload.version !== BACKUP_VERSION || !payload.data) throw new Error('Unsupported or damaged backup.');
        if (!confirm('Restore this backup? Current server data will be replaced with the backup data.')) return;
        if (typeof api !== 'function') throw new Error('Secure server connection is unavailable.');
        await api('/api/data', { method: 'PUT', body: JSON.stringify({ data: payload.data }) });
        state = payload.data;
        if (typeof serverData !== 'undefined') serverData = payload.data;
        alert('Restore completed successfully. The application will reload.');
        location.reload();
      } catch (e) { alert(`Restore failed: ${e.message}. Check the backup password and file.`); }
    };
    input.click();
  }

  function installBackupControls() {
    if (document.getElementById('backupControls')) return;
    const settingsPanel = document.getElementById('settings');
    if (!settingsPanel) return;
    const box = document.createElement('div');
    box.id = 'backupControls';
    box.className = 'panel-head';
    box.style.marginTop = '24px';
    box.innerHTML = '<div><h2>Data Backup & Restore</h2><p class="muted">Your backup is encrypted before it leaves this device. Keep the backup file and password safely.</p></div><div class="modal-actions"><button class="secondary" id="backupNowBtn">🔐 Backup Now</button><button class="secondary" id="restoreBtn">♻️ Restore Backup</button></div>';
    settingsPanel.appendChild(box);
    document.getElementById('backupNowBtn').onclick = exportEncryptedBackup;
    document.getElementById('restoreBtn').onclick = importEncryptedBackup;
  }

  const originalShowApp = typeof showApp === 'function' ? showApp : null;
  if (originalShowApp) {
    window.showApp = function() { originalShowApp(); setTimeout(installBackupControls, 0); };
  } else {
    document.addEventListener('DOMContentLoaded', installBackupControls);
  }
  window.nrBizProBackup = { exportEncryptedBackup, importEncryptedBackup };
})();
