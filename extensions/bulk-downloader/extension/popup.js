import {
  prepareItems, filterItems, countByCategory, buildJobs, isValidRegex,
  CATEGORY_LABELS, applyMask
} from './lib/core.js';
import { extractFromPage } from './lib/extract.js';
import { isPro, openUpgrade, TEST_BUILD, PRO_PRICE } from './lib/license.js';

const MAX_ROWS = 400;
const $ = (id) => document.getElementById(id);

const state = {
  pro: false,
  scope: 'tab',
  items: [],
  active: new Set(),      // selected categories
  unchecked: new Set(),   // urls the user unticked
  text: '',
  regex: '',
  folder: 'Quiet Downloads',
  mask: ''
};

// ---------- settings ----------
async function loadSettings() {
  const s = await chrome.storage.local.get(['folder', 'mask']);
  if (typeof s.folder === 'string') state.folder = s.folder;
  if (typeof s.mask === 'string') state.mask = s.mask;
  $('folder').value = state.folder;
  $('mask').value = state.mask;
  if (state.mask) $('rename').open = true;
}
function saveSettings() {
  chrome.storage.local.set({ folder: state.folder, mask: state.mask });
}

// ---------- scanning ----------
// For automated testing the popup can be opened as popup.html?tab=<id>.
async function currentTabId() {
  const forced = new URLSearchParams(location.search).get('tab');
  if (forced) return Number(forced);
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function scanTab(tabId) {
  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: extractFromPage
    });
  } catch {
    // Some embedded frames may be off-limits; fall back to the main page.
    results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractFromPage
    });
  }
  return results.flatMap((r) => r?.result?.items || []);
}

async function scan() {
  setStatus('Scanning…');
  $('download').disabled = true;
  try {
    let raw = [];
    if (state.scope === 'all') {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const scannable = tabs.filter((t) => /^(https?|file):/.test(t.url || ''));
      const parts = await Promise.allSettled(scannable.map((t) => scanTab(t.id)));
      raw = parts.flatMap((p) => (p.status === 'fulfilled' ? p.value : []));
    } else {
      const id = await currentTabId();
      const tab = await chrome.tabs.get(id);
      // Chrome hides the address of pages extensions can't read (settings, Web Store).
      if (!tab.url || !/^(https?|file|ftp):/.test(tab.url)) {
        throw new Error('Cannot access this page');
      }
      raw = await scanTab(id);
    }
    state.items = prepareItems(raw);
    state.unchecked.clear();
    pickDefaultCategories();
    render();
  } catch (e) {
    state.items = [];
    render();
    showEmpty(friendlyError(e));
  }
}

function friendlyError(e) {
  const msg = String(e?.message || e);
  if (/Cannot access|cannot be scripted|chrome:\/\/|Chrome Web Store|extensions gallery/i.test(msg)) {
    return "Chrome doesn't let extensions read this page (browser settings, the Web Store and similar pages). Open a normal website and try again.";
  }
  return "Couldn't scan this page. Try reloading it and opening the downloader again.";
}

function pickDefaultCategories() {
  const counts = countByCategory(state.items);
  const fileCats = Object.keys(counts).filter((c) => c !== 'links');
  state.active = new Set(fileCats.length ? fileCats : Object.keys(counts));
}

// ---------- rendering ----------
function visibleItems() {
  return filterItems(state.items, {
    categories: state.active,
    text: state.text,
    regex: state.pro ? state.regex : ''
  });
}
function selectedItems() {
  return visibleItems().filter((it) => !state.unchecked.has(it.url));
}

function render() {
  renderChips();
  renderList();
  renderFooter();
}

function renderChips() {
  const counts = countByCategory(state.items);
  const order = ['images', 'documents', 'archives', 'audio', 'video', 'executables', 'links'];
  const box = $('chips');
  box.replaceChildren();
  for (const cat of order) {
    if (!counts[cat]) continue;
    const b = document.createElement('button');
    b.className = 'chip' + (state.active.has(cat) ? ' on' : '');
    b.setAttribute('aria-pressed', String(state.active.has(cat)));
    b.dataset.cat = cat;
    b.append(CATEGORY_LABELS[cat]);
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = counts[cat];
    b.append(n);
    b.addEventListener('click', () => {
      if (state.active.has(cat)) state.active.delete(cat); else state.active.add(cat);
      render();
    });
    box.append(b);
  }
}

function renderList() {
  const list = $('list');
  list.replaceChildren();
  const items = visibleItems();
  $('empty').hidden = true;

  if (!state.items.length) {
    showEmpty('No files or links found on this page.');
  } else if (!items.length) {
    showEmpty('Nothing matches these filters.');
  }

  const frag = document.createDocumentFragment();
  for (const it of items.slice(0, MAX_ROWS)) {
    const li = document.createElement('li');
    li.className = 'row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !state.unchecked.has(it.url);
    cb.setAttribute('aria-label', it.name);
    cb.addEventListener('change', () => {
      if (cb.checked) state.unchecked.delete(it.url); else state.unchecked.add(it.url);
      renderFooter();
    });
    li.addEventListener('click', (ev) => {
      if (ev.target !== cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event('change')); }
    });

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    if (it.category === 'images') {
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.alt = '';
      img.src = it.url;
      img.addEventListener('error', () => { img.remove(); thumb.textContent = it.ext || 'img'; });
      thumb.append(img);
    } else {
      thumb.textContent = it.ext || (it.category === 'links' ? 'link' : '');
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = it.name;
    name.title = it.url;
    const sub = document.createElement('div');
    sub.className = 'sub';
    sub.textContent = it.text && it.text !== it.name ? `${it.domain} · ${it.text}` : it.domain;
    meta.append(name, sub);

    li.append(cb, thumb, meta);
    frag.append(li);
  }
  if (items.length > MAX_ROWS) {
    const li = document.createElement('li');
    li.className = 'sub';
    li.style.padding = '6px';
    li.textContent = `Showing the first ${MAX_ROWS} of ${items.length}. All ${items.length} will be downloaded if selected.`;
    frag.append(li);
  }
  list.append(frag);
}

function showEmpty(text) {
  $('empty').textContent = text;
  $('empty').hidden = false;
}

function setStatus(text) {
  $('count-label').textContent = text;
}

function renderFooter() {
  const visible = visibleItems();
  const selected = selectedItems();
  setStatus(state.items.length ? `${selected.length} of ${visible.length} selected` : 'Nothing to select');
  const all = $('select-all');
  all.checked = selected.length > 0 && selected.length === visible.length;
  all.indeterminate = selected.length > 0 && selected.length < visible.length;
  const btn = $('download');
  btn.disabled = selected.length === 0;
  btn.textContent = selected.length === 1 ? 'Download 1 file' : `Download ${selected.length} files`;
  renderPreview(selected);
}

function renderPreview(selected) {
  const mask = state.pro ? state.mask : '';
  if (!selected.length) { $('preview').textContent = ''; return; }
  const name = applyMask(mask, selected[0], 0, selected.length);
  const folder = state.folder.trim() ? `${state.folder.trim()}/` : '';
  $('preview').textContent = `First file: Downloads/${folder}${name}`;
}

function renderPro() {
  // Paying users don't need the "Pro" labels; the test build keeps them visible.
  const hideTags = state.pro && !TEST_BUILD;
  document.querySelectorAll('.pro-tag').forEach((t) => { t.hidden = hideTags; });
  $('mask').disabled = !state.pro;
  $('regex').disabled = !state.pro;
  $('mask').closest('.field').classList.toggle('locked', !state.pro);
  $('pro-note').textContent = TEST_BUILD
    ? 'Test build: Pro features unlocked.'
    : state.pro ? '' : `All tabs, renaming and advanced filters come with Pro (${PRO_PRICE}).`;
}

// ---------- progress ----------
function showProgress(job) {
  if (!job || !job.total) { $('progress').hidden = true; return; }
  const finished = job.done + job.failed;
  $('progress').hidden = false;
  $('bar-fill').style.width = `${Math.round((finished / job.total) * 100)}%`;
  $('progress-text').textContent = job.running
    ? `${finished} / ${job.total}`
    : job.failed ? `Done · ${job.done} saved, ${job.failed} failed` : `Done · ${job.done} saved`;
  $('cancel').hidden = !job.running;
}

chrome.storage.session.onChanged.addListener((changes) => {
  if (changes.job) showProgress(changes.job.newValue);
});

// ---------- events ----------
$('scope-tab').addEventListener('click', () => setScope('tab'));
$('scope-all').addEventListener('click', async () => {
  if (!state.pro) { await openUpgrade(); return; }
  // Must be requested directly from the click.
  const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
  if (granted) setScope('all');
});

function setScope(scope) {
  state.scope = scope;
  $('scope-tab').classList.toggle('on', scope === 'tab');
  $('scope-all').classList.toggle('on', scope === 'all');
  $('scope-tab').setAttribute('aria-selected', String(scope === 'tab'));
  $('scope-all').setAttribute('aria-selected', String(scope === 'all'));
  scan();
}

$('search').addEventListener('input', (e) => { state.text = e.target.value; renderList(); renderFooter(); });
$('regex').addEventListener('input', (e) => {
  const v = e.target.value;
  const ok = isValidRegex(v);
  $('regex-error').hidden = ok;
  state.regex = ok ? v : '';
  renderList(); renderFooter();
});
$('select-all').addEventListener('change', (e) => {
  const visible = visibleItems();
  if (e.target.checked) visible.forEach((it) => state.unchecked.delete(it.url));
  else visible.forEach((it) => state.unchecked.add(it.url));
  renderList(); renderFooter();
});
$('rescan').addEventListener('click', scan);
$('folder').addEventListener('input', (e) => { state.folder = e.target.value; saveSettings(); renderFooter(); });
$('mask').addEventListener('input', (e) => { state.mask = e.target.value; saveSettings(); renderFooter(); });
$('cancel').addEventListener('click', () => chrome.runtime.sendMessage({ type: 'cancel' }));

$('download').addEventListener('click', async () => {
  const selected = selectedItems();
  if (!selected.length) return;
  const jobs = buildJobs(selected, { folder: state.folder, mask: state.pro ? state.mask : '' });
  $('download').disabled = true;
  const res = await chrome.runtime.sendMessage({ type: 'enqueue', jobs });
  if (res?.job) showProgress(res.job);
  renderFooter();
});

// ---------- start ----------
(async function init() {
  state.pro = await isPro();
  renderPro();
  await loadSettings();
  const { job } = await chrome.storage.session.get('job');
  showProgress(job);
  await scan();
})();
