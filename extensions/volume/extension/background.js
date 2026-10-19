// Payments (ExtensionPay) must start in the background script. It also keeps
// the page script registered on the sites the user has set, and shows each
// tab's level on the toolbar badge.
if (typeof importScripts === 'function' && typeof self.QVRules === 'undefined') importScripts('lib/ExtPay.js', 'lib/config.js', 'lib/rules.js');
const R = self.QVRules;
const CFG = self.QV_CONFIG;
if (CFG.EXTPAY_ID) {
  try { ExtPay(CFG.EXTPAY_ID).startBackground(); } catch (e) { console.warn('ExtPay', e); }
}

const SCRIPT_ID = 'quiet-volume';
const KEYS = ['levels', 'everywhere', 'pro', 'quietOn', 'quietFrom', 'quietTo', 'quietCap'];

let syncing = Promise.resolve();
function sync() {
  syncing = syncing.then(doSync, doSync);
  return syncing;
}

async function doSync() {
  const state = R.normalize(await chrome.storage.local.get(KEYS));
  try { await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] }); } catch { /* none yet */ }
  // Only register where the user actually granted access.
  const allowed = [];
  for (const m of R.registration(state)) {
    const ok = await chrome.permissions.contains({ origins: [m] }).catch(() => false);
    if (ok) allowed.push(m);
  }
  if (!allowed.length) return;
  await chrome.scripting.registerContentScripts([{
    id: SCRIPT_ID, js: ['lib/rules.js', 'volume.js'], matches: allowed,
    runAt: 'document_start', allFrames: true, persistAcrossSessions: true
  }]);
}

async function badgeFor(tabId, url) {
  const origin = R.originOf(url || '');
  if (!origin) return;
  const state = await chrome.storage.local.get(KEYS);
  const level = R.effectiveLevel(state, origin, new Date());
  chrome.action.setBadgeBackgroundColor({ tabId, color: level > 100 ? '#3f6f62' : '#6b736f' }).catch(() => {});
  chrome.action.setBadgeText({ tabId, text: R.badgeText(level) }).catch(() => {});
}

chrome.runtime.onInstalled.addListener(sync);
chrome.runtime.onStartup.addListener(sync);
chrome.permissions.onAdded.addListener(sync);
chrome.permissions.onRemoved.addListener(sync);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && ['levels', 'everywhere'].some((k) => k in changes)) sync();
});
// The URL is only visible on sites the user granted, which is exactly where it matters.
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'loading' || info.url) badgeFor(tabId, tab.url);
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'sync') { sync().then(() => sendResponse({ ok: true })); return true; }
  if (msg?.type === 'badge') { badgeFor(msg.tabId, msg.url).then(() => sendResponse({ ok: true })); return true; }
  if (msg?.type === 'nudge') { // same path as the keyboard shortcuts (used by tests)
    chrome.tabs.get(msg.tabId).then((t) => nudge(t, msg.step)).then(() => sendResponse({ ok: true }), (e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }
  return false;
});

// Keyboard shortcuts: change this site's level in steps of 25%.
async function nudge(tab, step) {
  const origin = R.originOf(tab?.url || '');
  if (!tab?.id || !origin) return;
  const state = R.normalize(await chrome.storage.local.get(['levels']));
  const next = R.setLevel(state, origin, R.levelFor(state, origin) + step);
  await chrome.storage.local.set({ levels: next.levels });
  if (!(origin in state.levels)) { // first change on a site counts toward the rating prompt
    const { uses = 0 } = await chrome.storage.local.get('uses');
    await chrome.storage.local.set({ uses: uses + 1 });
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['lib/rules.js', 'volume.js'] });
  } catch { /* page not scriptable */ }
  await badgeFor(tab.id, tab.url);
}

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== 'volume-up' && command !== 'volume-down') return;
  const target = tab || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  nudge(target, command === 'volume-up' ? 25 : -25).catch(() => {});
});
