// End-to-end: loads the real extension in Chromium against two local "websites".
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/'); const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'test-output'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let failures = 0; const check = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) failures++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const page = (title, color) => `<!doctype html><title>${title}</title><body style="margin:0;font:18px system-ui">
<header style="background:${color};color:#fff;padding:24px 32px;font-size:28px;font-weight:700">${title}</header>
<main style="padding:24px 32px"><p>Colorful test page.</p>
<div style="display:flex;gap:12px">${['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#9b5de5'].map((c) => `<div style="width:90px;height:90px;border-radius:12px;background:${c}"></div>`).join('')}</div>
<iframe src="/frame" style="margin-top:16px;border:0;height:60px"></iframe></main>`;
const mk = (title, color) => http.createServer((q, r) => { r.writeHead(200, { 'content-type': 'text/html' }); r.end(q.url === '/frame' ? '<p style="color:red">frame</p>' : page(title, color)); });
const A = mk('Site A', '#e63946'), B = mk('Site B', '#2a9d8f');
await new Promise((r) => A.listen(0, '127.0.0.1', r)); await new Promise((r) => B.listen(0, '127.0.0.1', r));
const UA = `http://127.0.0.1:${A.address().port}`, UB = `http://127.0.0.1:${B.address().port}`;

const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'qg-ext-'));
fs.cpSync(path.join(ROOT, 'extension'), ext, { recursive: true });
const m = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json')));
m.host_permissions = ['<all_urls>']; // lets permission requests succeed without a prompt in tests
fs.writeFileSync(path.join(ext, 'manifest.json'), JSON.stringify(m));
fs.writeFileSync(path.join(ext, 'lib/config.js'), "self.QG_CONFIG={REVIEW_URL:'https://example.com/reviews',MORE_URL:'https://quietutilities-bit.github.io/#extensions',REVIEW_AFTER_USES:3};");

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'qg-p-')); const port = 9400 + Math.floor(Math.random() * 400);
const proc = spawn(CHROME, [`--user-data-dir=${prof}`, `--remote-debugging-port=${port}`, `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, '--no-first-run', '--no-sandbox', 'about:blank'], { stdio: 'ignore' });
let b; for (let i = 0; i < 50 && !b; i++) { try { b = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await wait(200); } }
const ctx = b.contexts()[0];
let id; for (let i = 0; i < 50 && !id; i++) { const t = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()); const s = t.find((x) => x.type === 'service_worker'); if (s) id = new URL(s.url).host; else await wait(200); }
check(Boolean(id), 'extension loaded');

const errors = [];
const filterOf = (p) => p.evaluate(() => getComputedStyle(document.documentElement).filter);
async function waitFilter(p, want, ms = 4000) {
  const end = Date.now() + ms; let f;
  while (Date.now() < end) { f = await filterOf(p); if (f === want) return f; await wait(100); }
  return f;
}

try {
  const a = await ctx.newPage(); await a.goto(UA);
  const bb = await ctx.newPage(); await bb.goto(UB);
  const pop = await ctx.newPage(); pop.on('pageerror', (e) => errors.push(e.message));
  await pop.setViewportSize({ width: 320, height: 600 });
  await pop.goto(`chrome-extension://${id}/popup.html?tab=-1`);
  const tabOf = (u) => pop.evaluate(async (x) => (await chrome.tabs.query({ url: x + '/*' }))[0].id, u);
  const tabA = await tabOf(UA), tabB = await tabOf(UB);
  const openPop = async (t) => { await pop.bringToFront(); await pop.goto(`chrome-extension://${id}/popup.html?tab=${t}`); await pop.waitForFunction(() => document.getElementById('site-name').textContent !== 'This site'); };

  await openPop(tabA);
  check(await pop.textContent('#site-name') === '127.0.0.1', 'popup shows the site name');
  check(!(await pop.isChecked('#site-toggle')) && await filterOf(a) === 'none', 'starts off');
  await pop.screenshot({ path: path.join(OUT, 'popup-off.png') });

  await pop.click('#site-toggle');
  check(await waitFilter(a, 'grayscale(1)') === 'grayscale(1)', 'turning the site on grays the open page immediately');
  const frameGray = await a.frames()[1]?.evaluate(() => getComputedStyle(document.documentElement).filter).catch(() => 'n/a');
  check(frameGray === 'grayscale(1)' || frameGray === 'none', `embedded frame handled (${frameGray})`);
  check(await filterOf(bb) === 'none', 'other site stays in color');

  await a.reload(); await a.waitForLoadState('domcontentloaded');
  check(await waitFilter(a, 'grayscale(1)') === 'grayscale(1)', 'still gray after reloading (remembered)');

  await pop.locator('#strength').fill('60');
  check(await waitFilter(a, 'grayscale(0.6)') === 'grayscale(0.6)', 'strength slider updates the page live');
  check(await pop.textContent('#strength-out') === '60%', 'strength label shows 60%');
  await pop.screenshot({ path: path.join(OUT, 'popup-on.png') });
  await pop.locator('#strength').fill('100');
  await waitFilter(a, 'grayscale(1)');

  await openPop(tabB);
  await pop.click('#every-toggle');
  check(await waitFilter(bb, 'grayscale(1)') === 'grayscale(1)', '"Every website" grays the other site');
  await bb.reload(); await bb.waitForLoadState('domcontentloaded');
  check(await waitFilter(bb, 'grayscale(1)') === 'grayscale(1)', 'every-site mode survives reload');

  await pop.click('#site-toggle'); // skip site B
  check(await waitFilter(bb, 'none') === 'none', 'skipping a site turns it back to color live');
  await bb.reload(); await bb.waitForLoadState('domcontentloaded'); await wait(500);
  check(await filterOf(bb) === 'none', 'skipped site stays in color after reload');
  check(await filterOf(a) === 'grayscale(1)', 'site A unaffected');

  await pop.click('#every-toggle'); // every off
  await wait(500);
  check(await filterOf(a) === 'grayscale(1)', 'turning "Every website" off keeps per-site choices');

  // Quick toggle shortcut (sent the same way the keyboard command is handled)
  const qt = (t) => pop.evaluate((tabId) => chrome.runtime.sendMessage({ type: 'quick-toggle', tabId }), t);
  await qt(tabB);
  check(await waitFilter(bb, 'grayscale(1)') === 'grayscale(1)', 'shortcut grays a site temporarily');
  await qt(tabB);
  check(await waitFilter(bb, 'none') === 'none', 'shortcut again restores color');
  await qt(tabA);
  check(await waitFilter(a, 'none') === 'none', 'shortcut pauses a gray site');
  await qt(tabA);
  check(await waitFilter(a, 'grayscale(1)') === 'grayscale(1)', 'shortcut resumes it');

  await openPop(tabA);
  await pop.click('#site-toggle'); // site A off
  check(await waitFilter(a, 'none') === 'none', 'turning the site off restores color live');
  await a.reload(); await a.waitForLoadState('domcontentloaded'); await wait(500);
  check(await filterOf(a) === 'none', 'and it stays off after reload');

  // Rating prompt after 3 uses (2 site-ons + 1 every-on so far)
  await openPop(tabA);
  const shown = await pop.waitForSelector('#rate:not([hidden])', { timeout: 3000 }).then(() => true, () => false);
  check(shown, 'one-time rating prompt appears after 3 uses');
  const h = await pop.evaluate(() => Math.ceil(document.querySelector('footer').getBoundingClientRect().bottom));
  check(h <= 600, `popup fits (${h}px tall)`);
  if (shown) await pop.click('#rate-no');
  await openPop(tabA); await wait(400);
  check(!(await pop.isVisible('#rate')), 'rating prompt never returns after "Not now"');

  // Browser page
  const s = await ctx.newPage(); await s.goto('chrome://version');
  const tabS = await pop.evaluate(async () => (await chrome.tabs.query({})).find((t) => !t.url && !t.pendingUrl)?.id);
  await pop.goto(`chrome-extension://${id}/popup.html?tab=${tabS}`); await wait(500);
  check(await pop.isDisabled('#site-toggle') && /can't be changed/.test(await pop.textContent('#site-note')), 'browser pages: switch disabled with an explanation');

  await pop.emulateMedia({ colorScheme: 'dark' }); await openPop(tabB);
  await pop.screenshot({ path: path.join(OUT, 'popup-dark.png') });
  check(errors.length === 0, `no script errors${errors.length ? ': ' + errors.join('; ') : ''}`);
} catch (e) { failures++; console.log('FAIL  unexpected error:', e.message); }
finally { await b.close().catch(() => {}); proc.kill(); A.close(); B.close(); }
console.log(failures ? `\n${failures} check(s) failed` : '\nAll end-to-end checks passed');
process.exit(failures ? 1 : 0);
