// Keeps the page script registered on exactly the sites the user picked,
// and handles the quick-toggle keyboard shortcut.
if (typeof importScripts === 'function' && typeof self.QGRules === 'undefined') importScripts('lib/rules.js');
const R = self.QGRules;
const SCRIPT_ID = 'quiet-gray';
const KEYS = ['everywhere', 'sites', 'skip', 'strength'];

let syncing = Promise.resolve();
function sync() {
  syncing = syncing.then(doSync, doSync);
  return syncing;
}

async function doSync() {
  const state = R.normalize(await chrome.storage.local.get(KEYS));
  try { await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] }); } catch { /* none yet */ }
  let { matches, excludeMatches } = R.registration(state);
  // Only register where the user actually granted access.
  const allowed = [];
  for (const m of matches) {
    const ok = await chrome.permissions.contains({ origins: [m] }).catch(() => false);
    if (ok) allowed.push(m);
  }
  if (!allowed.length) return;
  const script = {
    id: SCRIPT_ID, js: ['lib/rules.js', 'gray.js'], matches: allowed,
    runAt: 'document_start', allFrames: true, persistAcrossSessions: true
  };
  if (excludeMatches.length) script.excludeMatches = excludeMatches;
  await chrome.scripting.registerContentScripts([script]);
}

chrome.runtime.onInstalled.addListener(sync);
chrome.runtime.onStartup.addListener(sync);
chrome.permissions.onAdded.addListener(sync);
chrome.permissions.onRemoved.addListener(sync);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && ['everywhere', 'sites', 'skip'].some((k) => k in changes)) sync();
});

// Injected into the tab by the shortcut. Pauses/resumes a site that is gray,
// or adds/removes a temporary filter on a site that isn't.
function quickToggle(css) {
  const root = document.documentElement;
  const site = document.getElementById('quiet-gray');
  if (site) {
    const paused = root.dataset.qgPaused === '1';
    site.disabled = !paused;
    if (paused) delete root.dataset.qgPaused; else root.dataset.qgPaused = '1';
    return paused ? 'on' : 'off';
  }
  const temp = document.getElementById('quiet-gray-temp');
  if (temp) { temp.remove(); return 'off'; }
  const style = document.createElement('style');
  style.id = 'quiet-gray-temp';
  style.textContent = css;
  root.appendChild(style);
  return 'on';
}

async function quickToggleTab(tabId) {
  const { strength } = await chrome.storage.local.get('strength');
  const [res] = await chrome.scripting.executeScript({
    target: { tabId }, func: quickToggle, args: [R.filterCss(strength)]
  });
  if (res?.result === 'on') {
    const { uses = 0 } = await chrome.storage.local.get('uses');
    await chrome.storage.local.set({ uses: uses + 1 });
  }
  return res?.result;
}

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'quick-toggle') return;
  const target = tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (target?.id) quickToggleTab(target.id).catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'sync') { sync().then(() => sendResponse({ ok: true })); return true; }
  if (msg?.type === 'quick-toggle') {
    quickToggleTab(msg.tabId).then((r) => sendResponse({ ok: true, result: r }), (e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  return false;
});
