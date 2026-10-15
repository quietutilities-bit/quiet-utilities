// Checks the free (unpaid) experience: Pro features locked, free download still works.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let failures = 0;
const check = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) failures++; };

const server = http.createServer((req, res) => {
  if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end('<a href="/a.pdf">A</a><a href="/b.pdf">B</a>'); }
  res.writeHead(200, { 'content-type': 'application/pdf', 'content-disposition': 'attachment' }); res.end('pdf ' + req.url);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'qbd-free-'));
fs.cpSync(path.join(ROOT, 'extension'), ext, { recursive: true });
const m = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json')));
m.host_permissions = ['<all_urls>'];
fs.writeFileSync(path.join(ext, 'manifest.json'), JSON.stringify(m));
fs.writeFileSync(path.join(ext, 'lib/config.js'), "self.QBD_CONFIG = { TEST_BUILD: false, EXTPAY_ID: '', PRO_PRICE: '$9.99 one-time', REVIEW_URL: 'https://example.com/reviews', MORE_URL: 'https://quietutilities-bit.github.io/#extensions', REVIEW_AFTER_BATCHES: 3 };");

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qbd-fp-'));
const dl = fs.mkdtempSync(path.join(os.tmpdir(), 'qbd-fdl-'));
fs.mkdirSync(path.join(profile, 'Default'));
fs.writeFileSync(path.join(profile, 'Default', 'Preferences'), JSON.stringify({ download: { default_directory: dl, prompt_for_download: false } }));
const port = 9800 + Math.floor(Math.random() * 100);
const proc = spawn(CHROME, [`--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--no-first-run', '--no-sandbox', 'about:blank'], { stdio: 'ignore' });
let browser; for (let i = 0; i < 50 && !browser; i++) { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await new Promise((r) => setTimeout(r, 200)); } }
const ctx = browser.contexts()[0];
await (await browser.newBrowserCDPSession()).send('Browser.setDownloadBehavior', { behavior: 'default' });
let id; for (let i = 0; i < 50 && !id; i++) { const t = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()); const s = t.find((x) => x.type === 'service_worker'); if (s) id = new URL(s.url).host; else await new Promise((r) => setTimeout(r, 200)); }
const errors = [];
try {
  const site = await ctx.newPage(); await site.goto(BASE + '/');
  const pop = await ctx.newPage();
  pop.on('pageerror', (e) => errors.push(e.message));
  await pop.goto(`chrome-extension://${id}/popup.html?tab=-1`);
  const tabId = await pop.evaluate(async (u) => (await chrome.tabs.query({ url: u + '/*' }))[0].id, BASE);
  await pop.goto(`chrome-extension://${id}/popup.html?tab=${tabId}`);
  await pop.waitForSelector('.chip');
  check(await pop.isDisabled('#mask'), 'rename pattern is locked');
  check(await pop.isDisabled('#regex'), 'advanced filter is locked');
  check(await pop.isVisible('#upgrade-row'), 'upgrade and restore links shown');
  check(/come with Pro \(\$9\.99 one-time\)/.test(await pop.textContent('#pro-note')), 'Pro note shows the price');
  await pop.click('#rename summary');
  check(!(await pop.$eval('#rename', (d) => d.open)), 'clicking Rename does not open it for free users');
  await pop.click('#scope-all');
  check(await pop.$eval('#scope-tab', (b) => b.classList.contains('on')), 'All tabs stays off for free users');
  await pop.click('#download');
  let files = [];
  for (let i = 0; i < 50 && files.length < 2; i++) { await new Promise((r) => setTimeout(r, 200)); try { files = fs.readdirSync(path.join(dl, 'Quiet Downloads')).filter((f) => !f.endsWith('.crdownload')); } catch {} }
  check(files.length === 2, 'free download still works (2 files)');
  await pop.screenshot({ path: path.join(ROOT, 'test-output', 'popup-free.png') });
  check(!(await pop.isVisible('#rate')), 'no rating prompt for a brand-new user');
  check(errors.length === 0, `no script errors in popup${errors.length ? ': ' + errors.join('; ') : ''}`);
} catch (e) { failures++; console.log('FAIL  ', e.message); }
finally { await browser.close().catch(() => {}); proc.kill(); server.close(); }
console.log(failures ? `\n${failures} check(s) failed` : '\nAll free-mode checks passed');
process.exit(failures ? 1 : 0);
