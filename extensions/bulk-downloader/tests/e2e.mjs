// End-to-end test: loads the real extension into Chromium, scans local test
// pages, downloads files through chrome.downloads and checks them on disk.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = process.env.E2E_OUT || path.join(ROOT, 'test-output');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures++;
};

// ---------- local test site ----------
const files = {
  '/files/report-q1.pdf': 'application/pdf',
  '/files/report-q2.pdf': 'application/pdf',
  '/files/notes.docx': 'application/octet-stream',
  '/files/bundle.zip': 'application/zip',
  '/files/song.mp3': 'audio/mpeg',
  '/files/clip.mp4': 'video/mp4',
  '/img/one.png': 'image/png',
  '/img/two.jpg': 'image/jpeg',
  '/img/big.webp': 'image/webp',
  '/img/small.webp': 'image/webp',
  '/frame/inside.pdf': 'application/pdf'
};
const png = fs.readFileSync(path.join(ROOT, 'extension/icons/icon32.png'));

const mainPage = `<!doctype html><title>Test page</title>
<h1>Files</h1>
<a href="/files/report-q1.pdf">Q1 report</a>
<a href="/files/report-q2.pdf">Q2 report</a>
<a href="/files/report-q2.pdf#page=3">Q2 report again (duplicate)</a>
<a href="files/notes.docx">Meeting notes</a>
<a href="/files/bundle.zip">Bundle</a>
<a href="/files/song.mp3">Song</a>
<a href="/about">About us</a>
<a href="javascript:void(0)">JS link</a>
<a href="mailto:hi@example.com">Mail</a>
<img src="/img/one.png" alt="One">
<img src="/img/two.jpg" alt="Two">
<img src="/img/small.webp" srcset="/img/small.webp 1x, /img/big.webp 2x" alt="Responsive">
<video src="/files/clip.mp4"></video>
<iframe src="/frame"></iframe>`;

const manyPage = '<!doctype html><title>Many</title>' +
  Array.from({ length: 60 }, (_, i) => `<a href="/many/file-${i + 1}.txt">File ${i + 1}</a>`).join('\n');

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/') return send(res, 200, 'text/html', mainPage);
  if (url === '/many') return send(res, 200, 'text/html', manyPage);
  if (url === '/frame') return send(res, 200, 'text/html', '<a href="/frame/inside.pdf">Inside frame</a>');
  if (url === '/about') return send(res, 200, 'text/html', '<p>About</p>');
  if (url.startsWith('/many/')) return send(res, 200, 'text/plain', `contents of ${url}`, true);
  if (files[url]) {
    const body = files[url].startsWith('image/') ? png : `fake ${url}`;
    return send(res, 200, files[url], body, true);
  }
  send(res, 404, 'text/plain', 'not found');
});
function send(res, code, type, body, attach = false) {
  const headers = { 'content-type': type };
  if (attach && !type.startsWith('image/')) headers['content-disposition'] = 'attachment';
  res.writeHead(code, headers);
  res.end(body);
}
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// ---------- extension copy with host access for testing ----------
// When opened from the toolbar, the popup gets access to the current tab
// through activeTab. In this test the popup is opened as a normal tab, so the
// test copy is given host access instead. Nothing else changes.
const extDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qbd-ext-'));
fs.cpSync(path.join(ROOT, 'extension'), extDir, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
manifest.host_permissions = ['<all_urls>'];
fs.writeFileSync(path.join(extDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(extDir, 'lib/config.js'), "self.QBD_CONFIG = { TEST_BUILD: true, EXTPAY_ID: '', PRO_PRICE: '$9.99 one-time' };");

// ---------- launch Chromium ----------
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qbd-profile-'));
const downloads = path.join(OUT, 'downloads');
fs.mkdirSync(path.join(profile, 'Default'), { recursive: true });
fs.mkdirSync(downloads, { recursive: true });
fs.writeFileSync(path.join(profile, 'Default', 'Preferences'), JSON.stringify({
  download: { default_directory: downloads, prompt_for_download: false, directory_upgrade: true },
  profile: { default_content_setting_values: { automatic_downloads: 1 } }
}));

const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(CHROME, [
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${port}`,
  `--disable-extensions-except=${extDir}`,
  `--load-extension=${extDir}`,
  '--no-first-run', '--no-default-browser-check', '--no-sandbox',
  '--window-size=1200,900', 'about:blank'
], { stdio: 'ignore' });

let browser;
for (let i = 0; i < 50 && !browser; i++) {
  try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); }
  catch { await new Promise((r) => setTimeout(r, 200)); }
}
if (!browser) throw new Error('Chromium did not start');
const ctx = browser.contexts()[0];
// Playwright normally captures downloads itself; hand them back to Chrome so
// files land in the folder set in the profile, exactly like for a real user.
const cdp = await browser.newBrowserCDPSession();
await cdp.send('Browser.setDownloadBehavior', { behavior: 'default' });

// Find the extension's ID from the DevTools target list.
let extId;
for (let i = 0; i < 50 && !extId; i++) {
  const targets = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()).catch(() => []);
  const t = targets.find((x) => x.type === 'service_worker' && x.url.startsWith('chrome-extension://'));
  if (t) extId = new URL(t.url).host;
  else await new Promise((r) => setTimeout(r, 200));
}
// An extension page we can use to call chrome.* APIs from the test.
const sw = await ctx.newPage();
await sw.goto(`chrome-extension://${extId}/popup.html?tab=-1`);
check(Boolean(extId), `extension loaded (id ${extId})`);

async function tabIdFor(urlPattern) {
  return sw.evaluate(async (pattern) => {
    const tabs = await chrome.tabs.query({ url: pattern });
    return tabs[0]?.id;
  }, urlPattern);
}

async function waitForFiles(dir, count, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const done = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => !f.endsWith('.crdownload'))
      : [];
    if (done.length >= count) return done;
    await new Promise((r) => setTimeout(r, 200));
  }
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

try {
  // ---- Test 1: scan main page ----
  const site = await ctx.newPage();
  await site.goto(BASE + '/');
  await site.waitForLoadState('load');
  const siteTab = await tabIdFor(BASE + '/*');

  const popup = await ctx.newPage();
  await popup.setViewportSize({ width: 420, height: 600 });
  await popup.goto(`chrome-extension://${extId}/popup.html?tab=${siteTab}`);
  await popup.waitForSelector('.chip');

  const chips = await popup.$$eval('.chip', (els) => Object.fromEntries(
    els.map((e) => [e.dataset.cat, { n: Number(e.querySelector('.n').textContent), on: e.classList.contains('on') }])
  ));
  console.log('      chips:', JSON.stringify(chips));
  check(chips.documents?.n === 4, 'finds 4 documents (incl. one inside an iframe, duplicate removed)');
  check(chips.images?.n === 3, 'finds 3 images (srcset picks the large version)');
  check(chips.archives?.n === 1 && chips.audio?.n === 1 && chips.video?.n === 1, 'finds archive, audio and video');
  check(chips.links?.n >= 1 && chips.links.on === false, 'plain page links are found but off by default');

  const names = await popup.$$eval('.row .name', (els) => els.map((e) => e.textContent));
  check(names.includes('big.webp') && !names.includes('small.webp'), 'largest srcset image chosen');
  check(!names.some((n) => /javascript|mailto/.test(n)), 'javascript: and mailto: links ignored');

  await popup.screenshot({ path: path.join(OUT, 'popup-scan.png') });

  // ---- Test 2: filter + untick + download into folder ----
  await popup.click('.chip[data-cat="images"]');           // turn images off
  await popup.click('.chip[data-cat="audio"]');            // audio off
  await popup.click('.chip[data-cat="video"]');            // video off
  await popup.fill('#search', 'report');
  const afterSearch = await popup.$$eval('.row .name', (els) => els.map((e) => e.textContent));
  check(afterSearch.length === 2 && afterSearch.every((n) => n.startsWith('report')), 'text filter narrows to the 2 reports');
  await popup.fill('#search', '');

  // untick notes.docx
  const rows = await popup.$$('.row');
  for (const r of rows) {
    if ((await r.$eval('.name', (e) => e.textContent)) === 'notes.docx') await r.click();
  }
  const btnText = await popup.textContent('#download');
  check(btnText === 'Download 4 files', `button reads "${btnText}" (5 shown, 1 unticked)`);

  await popup.fill('#folder', 'QA Test');
  await popup.click('#download');
  const got = await waitForFiles(path.join(downloads, 'QA Test'), 4);
  if (process.env.DEBUG) console.log('      job:', JSON.stringify(await sw.evaluate(() => chrome.storage.session.get('job'))));
  console.log('      saved:', got.sort().join(', '));
  check(got.length === 4 && !got.includes('notes.docx') && got.includes('inside.pdf') && got.includes('bundle.zip'),
    'downloads exactly the 4 selected files into Downloads/QA Test');
  await popup.waitForFunction(() => /Done/.test(document.getElementById('progress-text').textContent), null, { timeout: 10000 });
  check(true, 'progress shows Done');
  const firstPdf = fs.readFileSync(path.join(downloads, 'QA Test', 'report-q1.pdf'), 'utf8');
  check(firstPdf === 'fake /files/report-q1.pdf', 'file contents are intact');

  // ---- Test 3: rename mask (Pro) ----
  await popup.click('.chip[data-cat="images"]');           // images back on
  await popup.click('.chip[data-cat="documents"]');        // documents off
  await popup.click('.chip[data-cat="archives"]');         // archives off
  await popup.fill('#folder', 'QA Renamed');
  await popup.click('#rename summary');
  await popup.fill('#mask', 'photo-{n}');
  const preview = await popup.textContent('#preview');
  check(/QA Renamed\/photo-001\.png$/.test(preview), `preview shows renamed path (${preview})`);
  await popup.click('#download');
  const renamed = (await waitForFiles(path.join(downloads, 'QA Renamed'), 3)).sort();
  console.log('      saved:', renamed.join(', '));
  check(JSON.stringify(renamed) === JSON.stringify(['photo-001.png', 'photo-002.jpg', 'photo-003.webp']),
    'rename mask numbers files and keeps extensions');
  await popup.fill('#mask', '');

  // ---- Test 3b: web pages need a second click ----
  await popup.fill('#mask', '');
  await popup.click('.chip[data-cat="images"]');           // images off
  await popup.click('.chip[data-cat="links"]');            // page links on
  await popup.fill('#folder', 'QA Pages');
  await popup.click('#download');
  const warnText = await popup.textContent('#download');
  check(/web page.*Click again/.test(warnText), `first click warns about web pages ("${warnText}")`);
  await new Promise((r) => setTimeout(r, 800));
  check(!fs.existsSync(path.join(downloads, 'QA Pages')), 'nothing downloaded on the first click');
  await popup.click('#download');
  const pages = await waitForFiles(path.join(downloads, 'QA Pages'), 1);
  check(pages.includes('about.html'), `second click downloads the page as about.html (${pages.join(', ')})`);
  await popup.click('.chip[data-cat="links"]');

  // ---- Test 4: settings remembered ----
  await popup.reload();
  await popup.waitForSelector('.chip');
  check(await popup.inputValue('#folder') === 'QA Pages', 'folder setting remembered after reopening');

  // ---- Test 5: big batch through the queue ----
  const many = await ctx.newPage();
  await many.goto(BASE + '/many');
  const manyTab = await tabIdFor(BASE + '/many');
  await popup.goto(`chrome-extension://${extId}/popup.html?tab=${manyTab}`);
  await popup.waitForSelector('.chip');
  await popup.fill('#folder', 'QA Batch');
  const t0 = Date.now();
  await popup.click('#download');
  const batch = await waitForFiles(path.join(downloads, 'QA Batch'), 60, 60000);
  check(batch.length === 60, `60-file batch completes through the queue (${batch.length} files, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  const badge = await sw.evaluate(() => chrome.action.getBadgeText({}));
  check(badge === '', 'toolbar badge clears when finished');

  // ---- Test 5b: "All tabs" (Pro) scans every open page ----
  await popup.goto(`chrome-extension://${extId}/popup.html?tab=${siteTab}`);
  await popup.waitForSelector('.chip');
  await popup.click('#scope-all');
  await popup.waitForFunction(() => document.querySelector('.chip[data-cat="documents"] .n')?.textContent === '64', null, { timeout: 10000 })
    .catch(() => {});
  const allDocs = await popup.$eval('.chip[data-cat="documents"] .n', (e) => e.textContent).catch(() => 'none');
  check(allDocs === '64', `All tabs combines both pages (documents: ${allDocs}, expected 4 + 60)`);

  // ---- Test 6: restricted page gives a friendly message ----
  const settings = await ctx.newPage();
  await settings.goto('chrome://version');
  const settingsTab = await sw.evaluate(async () =>
    // Chrome hides chrome:// addresses from extensions, so it's the tab with no URL.
    (await chrome.tabs.query({})).find((t) => !t.url && !t.pendingUrl)?.id);
  await popup.goto(`chrome-extension://${extId}/popup.html?tab=${settingsTab}`);
  await popup.waitForSelector('#empty:not([hidden])');
  const msg = await popup.textContent('#empty');
  if (process.env.DEBUG) console.log('      tab:', settingsTab, 'msg:', msg);
  check(/doesn't let extensions read this page/.test(msg), 'browser pages show a clear explanation');
  check(await popup.isDisabled('#download'), 'download button disabled when nothing found');

  // ---- Test 7: dark mode screenshot ----
  await popup.emulateMedia({ colorScheme: 'dark' });
  await popup.goto(`chrome-extension://${extId}/popup.html?tab=${siteTab}`);
  await popup.waitForSelector('.chip');
  await popup.screenshot({ path: path.join(OUT, 'popup-dark.png') });
  check(true, 'dark mode renders');
} catch (e) {
  failures++;
  console.log('FAIL  unexpected error:', e.message);
} finally {
  await browser.close().catch(() => {});
  proc.kill();
  server.close();
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll end-to-end checks passed');
process.exit(failures ? 1 : 0);
