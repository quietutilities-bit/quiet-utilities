const R = self.QVRules;
const CFG = self.QV_CONFIG;
const $ = (id) => document.getElementById(id);
const KEYS = Object.keys(R.DEFAULTS);

let state = R.normalize({});
let tab = null;
let origin = '';
let granted = false; // page script registered for this site (survives reloads)
let askedThisTime = false;

// For automated testing the popup can be opened as popup.html?tab=<id>.
async function currentTab() {
  const forced = new URLSearchParams(location.search).get('tab');
  if (forced) return chrome.tabs.get(Number(forced));
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  return t;
}

// ---- Pro (ExtensionPay). Paid status is cached so Pro keeps working offline.
let extpay = null;
function payClient() {
  if (!extpay && CFG.EXTPAY_ID && typeof self.ExtPay === 'function') extpay = self.ExtPay(CFG.EXTPAY_ID);
  return extpay;
}
async function checkPro() {
  if (CFG.TEST_BUILD) return true;
  const pay = payClient();
  if (!pay) return state.pro;
  try { const user = await pay.getUser(); return Boolean(user.paid); } catch { return state.pro; }
}

async function save(patch) {
  state = R.normalize(Object.assign({}, state, patch));
  const out = {};
  for (const k of Object.keys(patch)) out[k] = state[k];
  await chrome.storage.local.set(out);
}

// Load the page script into the open tab now (activeTab), so changes are heard right away.
async function inject() {
  if (!tab?.id || !origin) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['lib/rules.js', 'volume.js'] });
  } catch { /* page not scriptable */ }
}

async function pageStatus() {
  if (!tab?.id || !origin) return null;
  try {
    const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.__qv?.status() || null });
    return res?.result || null;
  } catch { return null; }
}

async function countUse() {
  const { uses = 0 } = await chrome.storage.local.get('uses');
  await chrome.storage.local.set({ uses: uses + 1 });
}

function setNote(text, warn) {
  $('site-note').textContent = text;
  $('site-note').classList.toggle('warn', Boolean(warn));
}

async function renderNote() {
  if (!origin) { setNote("Browser pages and store pages can't be changed. Open a normal website."); $('remember').hidden = true; return; }
  const remembered = granted || state.everywhere;
  $('remember').hidden = remembered || !(origin in state.levels);
  const st = await pageStatus();
  if (st && st.refused > 0 && st.routed === 0 && st.level !== 100) {
    setNote("This player streams from another site, so it can't be changed here. The page's own volume still works.", true);
  } else if (st && st.waiting) {
    setNote('Click anywhere on the page once and the new level kicks in.', true);
  } else if (origin in state.levels) {
    setNote(remembered ? 'Remembered for this site.' : 'Works now. Not remembered after you reload.');
  } else {
    setNote('Drag to boost or quiet this site.');
  }
}

function renderLevel(level) {
  $('level').value = level;
  $('level-out').textContent = `${level}%`;
  $('level-out').classList.toggle('low', level < 100);
  for (const b of document.querySelectorAll('.presets button')) b.setAttribute('aria-pressed', String(Number(b.dataset.level) === level));
}

function render() {
  const level = R.levelFor(state, origin);
  renderLevel(level);
  $('level').disabled = !origin;
  for (const b of document.querySelectorAll('.presets button')) b.disabled = !origin;
  $('every-toggle').checked = state.everywhere;

  const pro = state.pro;
  $('pro-card').classList.toggle('locked', !pro);
  for (const id of ['eq', 'mono', 'quiet-on', 'quiet-from', 'quiet-to', 'quiet-cap']) $(id).disabled = !pro;
  if (pro) { $('quiet-from').disabled = $('quiet-to').disabled = $('quiet-cap').disabled = !state.quietOn; }
  $('eq').value = state.eq;
  $('mono').checked = state.mono;
  $('quiet-on').checked = state.quietOn;
  $('quiet-from').value = state.quietFrom;
  $('quiet-to').value = state.quietTo;
  $('quiet-cap').value = String(state.quietCap);
  $('quiet-detail').hidden = $('quiet-cap-row').hidden = !(pro && state.quietOn);
  const canBuy = !pro && Boolean(payClient());
  $('upgrade').hidden = !canBuy;
  $('pro-note').hidden = pro;
  if (!pro) {
    $('pro-note').innerHTML = canBuy
      ? `Equalizer, mono and quiet hours. ${CFG.PRO_PRICE}, no subscription. <button id="restore" class="link-btn">Already paid?</button>`
      : 'Equalizer, mono and quiet hours are coming soon.';
    $('restore')?.addEventListener('click', () => payClient()?.openLoginPage().catch(() => {}));
  }
}

// ---- Level
async function setSiteLevel(level) {
  const first = !(origin in state.levels);
  await save({ levels: R.setLevel(state, origin, level).levels });
  renderLevel(R.levelFor(state, origin));
  await inject();
  chrome.runtime.sendMessage({ type: 'badge', tabId: tab.id, url: tab.url }).catch(() => {});
  if (first && level !== 100) countUse();
}

// Ask once per popup for this one site, so the level comes back after reloads.
// Must be called straight from the click/drag, before anything else is awaited.
function askToRemember() {
  if (granted || state.everywhere || askedThisTime || !origin) return Promise.resolve();
  askedThisTime = true;
  return chrome.permissions.request({ origins: [R.pattern(origin)] }).then((ok) => {
    granted = Boolean(ok);
    if (ok) chrome.runtime.sendMessage({ type: 'sync' }).catch(() => {});
  }).catch(() => {});
}

let levelTimer;
$('level').addEventListener('input', (e) => {
  const level = R.clampLevel(e.target.value);
  renderLevel(level);
  clearTimeout(levelTimer);
  levelTimer = setTimeout(() => setSiteLevel(level), 60);
});
$('level').addEventListener('change', (e) => {
  const asking = askToRemember();
  clearTimeout(levelTimer);
  Promise.all([asking, setSiteLevel(R.clampLevel(e.target.value))]).then(() => setTimeout(renderNote, 300));
});
for (const b of document.querySelectorAll('.presets button')) {
  b.addEventListener('click', () => {
    const asking = askToRemember();
    Promise.all([asking, setSiteLevel(Number(b.dataset.level))]).then(() => setTimeout(renderNote, 300));
  });
}
$('remember').addEventListener('click', () => {
  askedThisTime = false;
  askToRemember().then(renderNote);
});

// ---- Every website
$('every-toggle').addEventListener('change', async (e) => {
  const want = e.target.checked;
  if (want) {
    const ok = await chrome.permissions.request({ origins: ['<all_urls>'] }).catch(() => false);
    if (!ok) { e.target.checked = false; return; }
  }
  await save({ everywhere: want });
  chrome.runtime.sendMessage({ type: 'sync' }).catch(() => {});
  await inject();
  render(); renderNote();
});

// ---- Pro sound settings
for (const k of Object.keys(R.EQ_PRESETS)) $('eq').add(new Option(R.EQ_PRESETS[k].label, k));
async function proChange(patch) { await save(patch); await inject(); render(); }
$('eq').addEventListener('change', (e) => proChange({ eq: e.target.value }));
$('mono').addEventListener('change', (e) => proChange({ mono: e.target.checked }));
$('quiet-on').addEventListener('change', (e) => proChange({ quietOn: e.target.checked }));
$('quiet-from').addEventListener('change', (e) => proChange({ quietFrom: e.target.value }));
$('quiet-to').addEventListener('change', (e) => proChange({ quietTo: e.target.value }));
$('quiet-cap').addEventListener('change', (e) => proChange({ quietCap: Number(e.target.value) }));
$('upgrade').addEventListener('click', () => payClient()?.openPaymentPage().catch(() => {}));

// ---- One-time rating prompt and cross-promotion.
$('more').href = CFG.MORE_URL;
async function maybeAskForRating() {
  const { uses = 0, ratingAsked = false } = await chrome.storage.local.get(['uses', 'ratingAsked']);
  $('rate').hidden = !CFG.REVIEW_URL || ratingAsked || uses < CFG.REVIEW_AFTER_USES;
}
async function closeRating() { await chrome.storage.local.set({ ratingAsked: true }); $('rate').hidden = true; }
$('rate-yes').addEventListener('click', async () => { await closeRating(); chrome.tabs.create({ url: CFG.REVIEW_URL }); });
$('rate-no').addEventListener('click', closeRating);

(async function init() {
  state = R.normalize(await chrome.storage.local.get(KEYS));
  tab = await currentTab().catch(() => null);
  origin = R.originOf(tab?.url || '');
  $('site-name').textContent = origin ? new URL(origin).hostname : 'This page';
  if (origin) granted = await chrome.permissions.contains({ origins: [R.pattern(origin)] }).catch(() => false);
  render();
  // A site set earlier but not remembered: opening the popup brings its level back.
  if (origin && origin in state.levels) await inject();
  renderNote();
  maybeAskForRating();
  const pro = await checkPro();
  if (pro !== state.pro) { await save({ pro }); await inject(); }
  render();
})();
