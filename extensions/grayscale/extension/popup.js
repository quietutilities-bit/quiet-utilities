const R = self.QGRules;
const CFG = self.QG_CONFIG;
const $ = (id) => document.getElementById(id);
const KEYS = ['everywhere', 'sites', 'skip', 'strength'];

let state = R.normalize({});
let tab = null;
let origin = '';

// For automated testing the popup can be opened as popup.html?tab=<id>.
async function currentTab() {
  const forced = new URLSearchParams(location.search).get('tab');
  if (forced) return chrome.tabs.get(Number(forced));
  const [t] = await chrome.tabs.query({ active: true, currentWindow: true });
  return t;
}

async function save(next) {
  state = R.normalize(next);
  await chrome.storage.local.set({ everywhere: state.everywhere, sites: state.sites, skip: state.skip, strength: state.strength });
  chrome.runtime.sendMessage({ type: 'sync' }).catch(() => {});
}

// Apply right away to the open tab (the registered script covers future page loads).
async function applyNow() {
  if (!tab?.id || !origin) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['lib/rules.js', 'gray.js'] });
  } catch { /* page not scriptable; the next page load will pick it up */ }
}

async function countUse() {
  const { uses = 0 } = await chrome.storage.local.get('uses');
  await chrome.storage.local.set({ uses: uses + 1 });
}

function render() {
  const on = R.isOn(state, origin);
  $('site-toggle').checked = on;
  $('site-toggle').disabled = !origin;
  $('every-toggle').checked = state.everywhere;
  $('site-label').textContent = state.everywhere ? 'Gray on this site (off = skip it)' : 'Grayscale this site';
  $('strength').value = state.strength;
  $('strength-out').textContent = `${state.strength}%`;
  $('site-note').hidden = Boolean(origin);
  if (!origin) $('site-note').textContent = "Browser pages and store pages can't be changed. Open a normal website.";
}

$('site-toggle').addEventListener('change', async (e) => {
  const want = e.target.checked;
  if (want && !state.everywhere) {
    // Ask only for this one site (must happen right after the click).
    const granted = await chrome.permissions.request({ origins: [R.pattern(origin)] }).catch(() => false);
    if (!granted) { e.target.checked = false; return; }
  }
  await save(R.setSite(state, origin, want));
  if (want) { await applyNow(); await countUse(); }
  render();
});

$('every-toggle').addEventListener('change', async (e) => {
  const want = e.target.checked;
  if (want) {
    const granted = await chrome.permissions.request({ origins: ['<all_urls>'] }).catch(() => false);
    if (!granted) { e.target.checked = false; return; }
  }
  await save(R.setEverywhere(state, want));
  if (want) { await applyNow(); await countUse(); }
  render();
});

let strengthTimer;
$('strength').addEventListener('input', (e) => {
  state.strength = Number(e.target.value);
  $('strength-out').textContent = `${state.strength}%`;
  clearTimeout(strengthTimer);
  strengthTimer = setTimeout(() => save(state), 120);
});

// One-time rating prompt and cross-promotion.
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
  render();
  maybeAskForRating();
})();
