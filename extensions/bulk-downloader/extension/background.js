// Payments (ExtensionPay). Must start in the background script.
if (typeof importScripts === 'function' && typeof self.ExtPay === 'undefined') importScripts('lib/ExtPay.js', 'lib/config.js');
if (self.QBD_CONFIG.EXTPAY_ID) {
  try { ExtPay(self.QBD_CONFIG.EXTPAY_ID).startBackground(); } catch (e) { console.warn('ExtPay', e); }
}

// Download queue. Runs a few downloads at a time so big batches don't
// overwhelm the browser or the site. State lives in storage.session so the
// queue survives the service worker being put to sleep.

const MAX_ACTIVE = 3;
const KEY = 'job';

const emptyJob = () => ({ queue: [], active: {}, total: 0, done: 0, failed: 0, running: false, errors: [] });

let lock = Promise.resolve();
function withLock(fn) {
  const next = lock.then(fn, fn);
  lock = next.catch(() => {});
  return next;
}

async function load() {
  const { [KEY]: job } = await chrome.storage.session.get(KEY);
  return job || emptyJob();
}

async function save(job) {
  job.running = job.queue.length > 0 || Object.keys(job.active).length > 0;
  await chrome.storage.session.set({ [KEY]: job });
  updateBadge(job);
}

function updateBadge(job) {
  const left = job.queue.length + Object.keys(job.active).length;
  chrome.action.setBadgeBackgroundColor({ color: '#3f6f62' });
  chrome.action.setBadgeText({ text: left > 0 ? String(left > 999 ? '999+' : left) : '' });
}

async function pump(job) {
  while (job.queue.length && Object.keys(job.active).length < MAX_ACTIVE) {
    const item = job.queue.shift();
    try {
      const id = await chrome.downloads.download({
        url: item.url,
        filename: item.filename,
        conflictAction: 'uniquify',
        saveAs: false
      });
      if (typeof id === 'number') {
        job.active[id] = item;
      } else {
        fail(job, item, chrome.runtime.lastError?.message || 'Could not start');
      }
    } catch (e) {
      fail(job, item, e?.message || String(e));
    }
  }
}

function fail(job, item, reason) {
  job.failed++;
  if (job.errors.length < 50) job.errors.push({ url: item.url, reason });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'enqueue') {
    withLock(async () => {
      let job = await load();
      if (!job.running) job = emptyJob();
      const items = (msg.jobs || []).filter((j) => j && j.url && j.filename);
      job.queue.push(...items);
      job.total += items.length;
      await pump(job);
      await save(job);
      return job;
    }).then((job) => sendResponse({ ok: true, job }), (e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  if (msg?.type === 'cancel') {
    withLock(async () => {
      const job = await load();
      for (const id of Object.keys(job.active)) {
        try { await chrome.downloads.cancel(Number(id)); } catch { /* already gone */ }
      }
      job.failed += job.queue.length + Object.keys(job.active).length;
      job.queue = [];
      job.active = {};
      await save(job);
      return job;
    }).then((job) => sendResponse({ ok: true, job }));
    return true;
  }
  return false;
});

chrome.downloads.onChanged.addListener((delta) => {
  const state = delta.state?.current;
  if (state !== 'complete' && state !== 'interrupted') return;
  withLock(async () => {
    const job = await load();
    const item = job.active[delta.id];
    if (!item) return;
    delete job.active[delta.id];
    if (state === 'complete') job.done++;
    else fail(job, item, delta.error?.current || 'Interrupted');
    await pump(job);
    await save(job);
    // Count finished batches with at least one saved file (used for the one-time rating prompt).
    if (!job.running && job.done > 0 && !job.counted) {
      job.counted = true;
      await chrome.storage.session.set({ job });
      const { batchesDone = 0 } = await chrome.storage.local.get('batchesDone');
      await chrome.storage.local.set({ batchesDone: batchesDone + 1 });
    }
  });
});
