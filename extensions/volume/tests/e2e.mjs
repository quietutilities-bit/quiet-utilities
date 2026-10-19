// End-to-end: loads the real extension in Chromium against local "websites" that play audio.
// Usage: node tests/e2e.mjs pro|free
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/'); const { chromium } = require('playwright');

const MODE = process.argv[2] === 'free' ? 'free' : 'pro';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'test-output', MODE); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let failures = 0; const check = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  [${MODE}] ${m}`); if (!c) failures++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const near = (a, b, tol = 0.05) => typeof a === 'number' && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

// A quiet 440 Hz tone (amplitude 0.1), 3 seconds, mono 16-bit WAV.
function tone() {
  const rate = 22050, n = rate * 3, buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * i / rate) * 0.1 * 32767), 44 + i * 2);
  return buf;
}
const WAV = tone();

let UB = '';
const page = (title, color, other) => `<!doctype html><title>${title}</title><body style="margin:0;font:18px system-ui">
<header style="background:${color};color:#fff;padding:24px 32px;font-size:28px;font-weight:700">${title}</header>
<main style="padding:24px 32px"><p>Test page with players.</p>
<audio id="same" src="/tone.wav" loop controls></audio>
${other ? `<audio id="cross" src="${other}/tone.wav" loop controls></audio>
<audio id="cors" src="${other}/tone-cors.wav" crossorigin="anonymous" loop controls></audio>` : ''}
</main>`;
const mk = (title, color, withOther) => http.createServer((q, r) => {
  if (q.url.startsWith('/tone')) {
    const h = { 'content-type': 'audio/wav', 'content-length': WAV.length };
    if (q.url.includes('cors')) h['access-control-allow-origin'] = '*';
    r.writeHead(200, h); r.end(WAV); return;
  }
  r.writeHead(200, { 'content-type': 'text/html' }); r.end(page(title, color, withOther ? UB : ''));
});
const A = mk('Site A', '#3f6f62', true), B = mk('Site B', '#457b9d', false);
await new Promise((r) => A.listen(0, '127.0.0.1', r)); await new Promise((r) => B.listen(0, '127.0.0.1', r));
const UA = `http://127.0.0.1:${A.address().port}`; UB = `http://127.0.0.1:${B.address().port}`;
const UC = `http://localhost:${A.address().port}`; // same server, different site

const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'qv-ext-'));
fs.cpSync(path.join(ROOT, 'extension'), ext, { recursive: true });
const m = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json')));
m.host_permissions = ['<all_urls>']; // lets permission requests succeed without a prompt in tests
fs.writeFileSync(path.join(ext, 'manifest.json'), JSON.stringify(m));
fs.writeFileSync(path.join(ext, 'lib/config.js'), `self.QV_CONFIG={TEST_BUILD:${MODE === 'pro'},EXTPAY_ID:'',PRO_PRICE:'$4.99 one-time',REVIEW_URL:'https://example.com/reviews',MORE_URL:'https://quietutilities-bit.github.io/#extensions',REVIEW_AFTER_USES:3};`);

const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'qv-p-')); const port = 9400 + Math.floor(Math.random() * 400);
const proc = spawn(CHROME, [`--user-data-dir=${prof}`, `--remote-debugging-port=${port}`, `--disable-extensions-except=${ext}`, `--load-extension=${ext}`,
  '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-sandbox', 'about:blank'], { stdio: 'ignore' });
let b; for (let i = 0; i < 50 && !b; i++) { try { b = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await wait(200); } }
const ctx = b.contexts()[0];
let id; for (let i = 0; i < 50 && !id; i++) { const t = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()); const s = t.find((x) => x.type === 'service_worker'); if (s) id = new URL(s.url).host; else await wait(200); }
check(Boolean(id), 'extension loaded');

const errors = [];
try {
  const a = await ctx.newPage(); await a.goto(UA);
  const bb = await ctx.newPage(); await bb.goto(UB);
  const pop = await ctx.newPage(); pop.on('pageerror', (e) => errors.push(e.message));
  await pop.setViewportSize({ width: 320, height: 600 });
  await pop.goto(`chrome-extension://${id}/popup.html?tab=-1`).catch(() => {});
  const tabOf = (u) => pop.evaluate(async (x) => (await chrome.tabs.query({ url: x + '/*' }))[0].id, u);
  const tabA = await tabOf(UA), tabB = await tabOf(UB);
  const openPop = async (t) => { await pop.bringToFront(); await pop.goto(`chrome-extension://${id}/popup.html?tab=${t}`); await pop.waitForFunction(() => document.getElementById('site-name').textContent !== 'This site'); await wait(300); };
  // Runs inside the page script's world (same isolated world as the content script).
  const inPage = (t, fn, arg) => pop.evaluate(`(async () => {
    try { const [r] = await chrome.scripting.executeScript({ target: { tabId: ${t} }, func: ${fn.toString()}, args: [${JSON.stringify(arg ?? null)}] }); return r?.result; }
    catch (e) { return 'ERR ' + e.message; } })()`);
  const status = (t) => inPage(t, () => window.__qv ? window.__qv.status() : null);
  const graph = (t) => inPage(t, () => {
    const g = window.__qv?._graph(); if (!g?.chain) return null;
    const c = g.chain;
    return { state: g.ctx.state, gain: c.gain.gain.value, low: c.low.gain.value, mid: c.mid.gain.value, high: c.high.gain.value, channels: c.mono.channelCount, mode: c.mono.channelCountMode };
  });
  // Measures the loudness actually leaving the extension's audio chain.
  const rms = (t) => inPage(t, async () => {
    const g = window.__qv?._graph(); if (!g?.chain) return null;
    const an = g.ctx.createAnalyser(); an.fftSize = 2048; g.chain.limiter.connect(an);
    await new Promise((r) => setTimeout(r, 250));
    const d = new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); an.disconnect();
    return Math.sqrt(d.reduce((s, v) => s + v * v, 0) / d.length);
  });
  const play = (p, sel) => p.evaluate((s) => document.querySelector(s).play().then(() => 'ok', (e) => e.message), sel);
  const waitFor = async (fn, ok, ms = 4000) => { const end = Date.now() + ms; let v; while (Date.now() < end) { v = await fn(); if (ok(v)) return v; await wait(100); } return v; };
  const badge = (t) => pop.evaluate((tabId) => chrome.action.getBadgeText({ tabId }), t);

  await openPop(tabA);
  check(await pop.textContent('#site-name') === '127.0.0.1', 'popup shows the site name');
  check(await pop.textContent('#level-out') === '100%', 'starts at 100%');
  await pop.screenshot({ path: path.join(OUT, 'popup-start.png') });

  check(await play(a, '#same') === 'ok', 'test audio plays');
  await wait(300);
  const s0 = await status(tabA);
  check(s0 === null || s0.routed === 0, 'at 100% the page audio is left alone');

  await pop.click('.presets button[data-level="400"]');
  const g4 = await waitFor(() => graph(tabA), (g) => g && near(g.gain, 4));
  check(g4 && near(g4.gain, 4) && g4.state === 'running', `400% preset boosts the playing audio (gain ${g4?.gain})`);
  check((await status(tabA))?.routed >= 1, 'player routed through the booster');
  check(await pop.textContent('#level-out') === '400%', 'popup shows 400%');
  check(await waitFor(() => badge(tabA), (x) => x === '400') === '400', 'toolbar badge shows 400');

  // Real loudness: 300% should be about 3x louder than 100%.
  await pop.locator('#level').fill('100'); await waitFor(() => graph(tabA), (g) => g && near(g.gain, 1)); await wait(300);
  const r1 = await rms(tabA);
  await pop.locator('#level').fill('300'); await waitFor(() => graph(tabA), (g) => g && near(g.gain, 3)); await wait(300);
  const r3 = await rms(tabA);
  check(r1 > 0.02 && near(r3 / r1, 3, 0.08), `output is 3x louder at 300% (rms ${r1?.toFixed(3)} → ${r3?.toFixed(3)})`);
  await pop.locator('#level').fill('250');
  check(near((await waitFor(() => graph(tabA), (g) => g && near(g.gain, 2.5)))?.gain, 2.5), 'slider changes the level live (250%)');
  await pop.locator('#level').dispatchEvent('change'); await wait(500);
  check(/Remembered/.test(await pop.textContent('#site-note')), 'popup says the site is remembered');
  await pop.screenshot({ path: path.join(OUT, 'popup-boosted.png') });

  // Cross-site media: CORS-enabled is boosted, the other is left alone (it would go silent).
  await play(a, '#cross'); await play(a, '#cors');
  const sx = await waitFor(() => status(tabA), (s) => s && s.routed >= 2 && s.refused >= 1);
  check(sx?.routed === 2 && sx?.refused === 1, `cross-site player without CORS is left alone, CORS one is boosted (${JSON.stringify(sx)})`);
  check(await a.evaluate(() => !document.querySelector('#cross').paused), 'the untouched player keeps playing');

  // Remembered after reload, without opening the popup.
  await a.reload(); await a.waitForLoadState('domcontentloaded');
  await play(a, '#same');
  const gr = await waitFor(() => graph(tabA), (g) => g && near(g.gain, 2.5));
  check(gr && near(gr.gain, 2.5), 'level comes back after reload (remembered)');
  check(await waitFor(() => badge(tabA), (x) => x === '250') === '250', 'badge restored after reload');

  // Other sites are unaffected.
  await play(bb, '#same'); await wait(500);
  const sb = await status(tabB);
  check(sb === null || sb.routed === 0, 'another site keeps its normal volume');

  // Keyboard shortcut path (Alt+Shift+Up/Down).
  await pop.evaluate((t) => chrome.runtime.sendMessage({ type: 'nudge', tabId: t, step: 25 }), tabA);
  check(near((await waitFor(() => graph(tabA), (g) => g && near(g.gain, 2.75)))?.gain, 2.75), 'shortcut turns the site up by 25%');
  await pop.evaluate((t) => chrome.runtime.sendMessage({ type: 'nudge', tabId: t, step: -50 }), tabB);
  const gb = await waitFor(() => graph(tabB), (g) => g && near(g.gain, 0.5));
  check(gb && near(gb.gain, 0.5), 'shortcut turns a loud site down to 50%');
  await openPop(tabB);
  check(await pop.textContent('#level-out') === '50%', 'popup reflects the shortcut change');

  // Third site, to reach the rating prompt (counts first change on 3 sites).
  const c = await ctx.newPage(); await c.goto(UC); const tabC = await tabOf(UC);
  await play(c, '#same');
  await openPop(tabC); await pop.click('.presets button[data-level="200"]'); await wait(300);
  await openPop(tabC);
  const shown = await pop.waitForSelector('#rate:not([hidden])', { timeout: 3000 }).then(() => true, () => false);
  check(shown, 'one-time rating prompt appears after 3 uses');
  if (shown) await pop.click('#rate-no');
  await openPop(tabC); await wait(300);
  check(!(await pop.isVisible('#rate')), 'rating prompt never returns after "Not now"');

  // Pro sound settings.
  await openPop(tabA);
  if (MODE === 'pro') {
    check(!(await pop.isDisabled('#eq')), 'Pro: equalizer enabled');
    await pop.selectOption('#eq', 'bass');
    const ge = await waitFor(() => graph(tabA), (g) => g && near(g.low, 8));
    check(ge && near(ge.low, 8), 'Pro: bass boost applied live');
    await pop.click('#mono');
    const gm = await waitFor(() => graph(tabA), (g) => g && g.channels === 1);
    check(gm?.channels === 1 && gm?.mode === 'explicit', 'Pro: mono applied');
    // Quiet hours around the current time, capped at 50%.
    const hh = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const now = new Date();
    await pop.click('#quiet-on');
    await pop.fill('#quiet-from', hh(new Date(now - 3600e3))); await pop.locator('#quiet-from').dispatchEvent('change');
    await pop.fill('#quiet-to', hh(new Date(+now + 3600e3))); await pop.locator('#quiet-to').dispatchEvent('change');
    await pop.selectOption('#quiet-cap', '50');
    const gq = await waitFor(() => graph(tabA), (g) => g && near(g.gain, 0.5));
    check(gq && near(gq.gain, 0.5), `Pro: quiet hours cap the level (gain ${gq?.gain})`);
    await pop.screenshot({ path: path.join(OUT, 'popup-pro.png') });
    await pop.click('#quiet-on');
    check(near((await waitFor(() => graph(tabA), (g) => g && near(g.gain, 2.75)))?.gain, 2.75), 'Pro: quiet hours off restores the level');
    // Every website: the equalizer reaches a site that was never set.
    const UD = `http://localhost:${B.address().port}`;
    const d = await ctx.newPage(); await d.goto(UD); const tabD = await tabOf(UD);
    await openPop(tabA); await pop.click('#every-toggle'); await wait(500);
    await d.reload(); await d.waitForLoadState('domcontentloaded'); await play(d, '#same');
    const gd = await waitFor(() => graph(tabD), (g) => g && near(g.low, 8));
    check(gd && near(gd.low, 8), 'every website: sound settings apply on other sites');
    await d.close();
  } else {
    check(await pop.isDisabled('#eq') && await pop.isDisabled('#mono') && await pop.isDisabled('#quiet-on'), 'Free: Pro controls are locked');
    check(/coming soon|no subscription/.test(await pop.textContent('#pro-note')), 'Free: Pro note explains what Pro adds');
    // Even if a Pro setting is stored, it does nothing without Pro.
    await pop.evaluate(() => chrome.storage.local.set({ eq: 'bass', mono: true }));
    await wait(500);
    const gf = await graph(tabA);
    check(gf && gf.low === 0 && gf.channels === 2, 'Free: stored Pro settings are not applied');
    await pop.screenshot({ path: path.join(OUT, 'popup-free.png') });
  }

  const h = await pop.evaluate(() => Math.ceil(document.querySelector('footer').getBoundingClientRect().bottom));
  check(h <= 600, `popup fits (${h}px tall)`);

  // Browser page
  const s = await ctx.newPage(); await s.goto('chrome://version');
  const tabS = await pop.evaluate(async () => (await chrome.tabs.query({})).find((t) => !t.url && !t.pendingUrl)?.id);
  await pop.goto(`chrome-extension://${id}/popup.html?tab=${tabS}`); await wait(500);
  check(await pop.isDisabled('#level') && /can't be changed/.test(await pop.textContent('#site-note')), 'browser pages: slider disabled with an explanation');

  await pop.emulateMedia({ colorScheme: 'dark' }); await openPop(tabA);
  await pop.screenshot({ path: path.join(OUT, 'popup-dark.png') });
  check(errors.length === 0, `no script errors${errors.length ? ': ' + errors.join('; ') : ''}`);
} catch (e) { failures++; console.log('FAIL  unexpected error:', e.stack); }
finally { await b.close().catch(() => {}); proc.kill(); A.close(); B.close(); }
console.log(failures ? `\n${failures} check(s) failed` : `\nAll end-to-end checks passed (${MODE})`);
process.exit(failures ? 1 : 0);
