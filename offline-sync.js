/* NR BizPro offline data resilience layer.
 * Caches authenticated business data locally and queues /api/data PUTs when offline.
 * It never exposes cached business data to the server/admin; queued writes use the
 * same authenticated endpoint when connectivity returns.
 */
(() => {
  const CACHE_PREFIX = 'nr-bizpro-offline-data-v1:';
  const QUEUE_KEY = 'nr-bizpro-offline-queue-v1';
  const originalFetch = window.fetch.bind(window);

  const userKey = () => {
    try { return window.currentUser?.id || 'anonymous'; } catch { return 'anonymous'; }
  };
  const cacheKey = () => CACHE_PREFIX + userKey();
  const readCache = () => { try { return JSON.parse(localStorage.getItem(cacheKey()) || 'null'); } catch { return null; } };
  const writeCache = data => { try { localStorage.setItem(cacheKey(), JSON.stringify({ savedAt: new Date().toISOString(), data })); } catch {} };
  const readQueue = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } };
  const writeQueue = q => { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {} };

  const isDataGet = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = (init.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase();
    return url.includes('/api/data') && method === 'GET';
  };
  const isDataPut = (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = (init.method || (typeof input !== 'string' && input?.method) || 'GET').toUpperCase();
    return url.includes('/api/data') && method === 'PUT';
  };

  window.fetch = async (input, init = {}) => {
    if (isDataGet(input, init)) {
      try {
        const response = await originalFetch(input, init);
        if (response.ok) {
          const clone = response.clone();
          clone.json().then(payload => { if (payload?.data) writeCache(payload.data); }).catch(() => {});
        }
        return response;
      } catch (error) {
        const cached = readCache();
        if (cached?.data) return new Response(JSON.stringify({ data: cached.data, offline: true, savedAt: cached.savedAt }), { status: 200, headers: { 'Content-Type': 'application/json', 'X-NR-Offline': '1' } });
        throw error;
      }
    }

    if (isDataPut(input, init)) {
      try {
        const response = await originalFetch(input, init);
        if (response.ok) {
          try {
            const body = typeof init.body === 'string' ? JSON.parse(init.body) : null;
            if (body?.data) writeCache(body.data);
          } catch {}
        }
        return response;
      } catch (error) {
        try {
          const body = typeof init.body === 'string' ? JSON.parse(init.body) : null;
          if (body?.data) {
            const q = readQueue();
            q.push({ id: crypto.randomUUID(), userId: userKey(), queuedAt: new Date().toISOString(), data: body.data });
            writeQueue(q);
            writeCache(body.data);
            return new Response(JSON.stringify({ data: body.data, offline: true, queued: true }), { status: 200, headers: { 'Content-Type': 'application/json', 'X-NR-Offline': '1' } });
          }
        } catch {}
        throw error;
      }
    }
    return originalFetch(input, init);
  };

  async function flushQueue() {
    if (!navigator.onLine) return;
    const all = readQueue();
    if (!all.length) return;
    const remaining = [];
    for (const item of all) {
      if (item.userId !== userKey()) { remaining.push(item); continue; }
      try {
        const response = await originalFetch('/api/data', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: item.data }) });
        if (!response.ok) { remaining.push(item); break; }
      } catch { remaining.push(item); break; }
    }
    writeQueue(remaining);
    if (!remaining.length) window.dispatchEvent(new CustomEvent('nrbizpro-sync-complete'));
  }

  window.nrBizProOffline = {
    flushQueue,
    getStatus: () => ({ online: navigator.onLine, queued: readQueue().filter(x => x.userId === userKey()).length, cached: !!readCache() })
  };
  window.addEventListener('online', flushQueue);
  window.addEventListener('load', () => setTimeout(flushQueue, 1000));
})();
