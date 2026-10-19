// Builds the store screenshots, promo tiles and Edge logo from the real popup.
// Usage: xvfb-run -a node store/make-images.mjs   (run from extensions/volume)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { spawn } from 'node:child_process'; import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/'); const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const STORE = path.join(ROOT, 'store');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Silent-but-real audio so the popup has a playing player to work with.
function wav() {
  const rate = 8000, n = rate * 30, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  return b;
}
const WAV = wav();

const sites = {
  video: { title: 'Lecture 7: Coastal ecosystems', kind: 'video' },
  news: { title: 'Morning briefing', kind: 'news' },
  podcast: { title: 'The Long Walk, episode 42', kind: 'podcast' }
};
function sitePage(kind, title) {
  const player = `<div style="aspect-ratio:16/9;background:linear-gradient(135deg,#24433b,#0f1c18);border-radius:10px;position:relative;overflow:hidden">
    <div style="position:absolute;inset:auto 0 0 0;height:46px;background:linear-gradient(transparent,rgba(0,0,0,.6));display:flex;align-items:center;gap:12px;padding:0 16px;color:#fff;font-size:13px">
      <span style="font-size:16px">❚❚</span><div style="flex:1;height:4px;background:rgba(255,255,255,.3);border-radius:2px"><div style="width:38%;height:100%;background:#79b3a2;border-radius:2px"></div></div><span>14:02 / 36:40</span><span>🔈</span></div>
    <div style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.12)"></div></div>`;
  const lines = (n) => Array.from({ length: n }, (_, i) => `<div style="height:10px;border-radius:5px;background:#e3e1db;margin:10px 0;width:${90 - (i * 13) % 40}%"></div>`).join('');
  const body = kind === 'video'
    ? `${player}<h2 style="margin:18px 0 4px;font-size:22px">${title}</h2><p style="color:#6b736f;margin:0">Field Research 210 · 1,204 views</p>${lines(3)}`
    : kind === 'news'
      ? `<div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">${player}<div>${lines(8)}</div></div><h2 style="margin:18px 0 4px;font-size:22px">${title}</h2>${lines(4)}`
      : `<div style="display:flex;gap:20px;align-items:center"><div style="width:160px;height:160px;border-radius:12px;background:linear-gradient(135deg,#9b5de5,#457b9d)"></div><div style="flex:1"><h2 style="margin:0 0 6px;font-size:22px">${title}</h2>${lines(3)}</div></div>${lines(6)}`;
  return `<!doctype html><title>${title}</title><body style="margin:0;font:15px Inter,system-ui;background:#fff;color:#1f2522">
  <div style="padding:22px 28px;max-width:820px">${body}</div><audio id="a" src="/a.wav" loop></audio>`;
}
const server = http.createServer((q, r) => {
  if (q.url === '/a.wav') { r.writeHead(200, { 'content-type': 'audio/wav' }); r.end(WAV); return; }
  const host = (q.headers.host || '').split('.')[0];
  const s = sites[host] || sites.video;
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); r.end(sitePage(s.kind, s.title));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const P = server.address().port;
const url = (h) => `http://${h}.example.com:${P}/`;

const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'qv-img-'));
fs.cpSync(path.join(ROOT, 'extension'), ext, { recursive: true });
const m = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'))); m.host_permissions = ['<all_urls>'];
fs.writeFileSync(path.join(ext, 'manifest.json'), JSON.stringify(m));
fs.writeFileSync(path.join(ext, 'lib/config.js'), "self.QV_CONFIG={TEST_BUILD:true,EXTPAY_ID:'',PRO_PRICE:'$4.99 one-time',REVIEW_URL:'',MORE_URL:'https://quietutilities-bit.github.io/#extensions',REVIEW_AFTER_USES:3};");
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'qv-ip-')); const port = 9800 + Math.floor(Math.random() * 100);
const proc = spawn(CHROME, [`--user-data-dir=${prof}`, `--remote-debugging-port=${port}`, `--disable-extensions-except=${ext}`, `--load-extension=${ext}`,
  `--host-resolver-rules=MAP *.example.com 127.0.0.1`, '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--no-sandbox', 'about:blank'], { stdio: 'ignore' });
let b; for (let i = 0; i < 50 && !b; i++) { try { b = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); } catch { await wait(200); } }
const ctx = b.contexts()[0];
let id; for (let i = 0; i < 50 && !id; i++) { const t = await fetch(`http://127.0.0.1:${port}/json`).then((r) => r.json()); const s = t.find((x) => x.type === 'service_worker'); if (s) id = new URL(s.url).host; else await wait(200); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qv-shots-'));
const pop = await ctx.newPage(); await pop.setViewportSize({ width: 320, height: 600 });
await pop.goto(`chrome-extension://${id}/popup.html?tab=-1`).catch(() => {});
async function shoot(host, setup, file, dark = false) {
  const pg = await ctx.newPage(); await pg.setViewportSize({ width: 880, height: 640 }); await pg.goto(url(host));
  await pg.evaluate(() => document.getElementById('a').play());
  await pg.screenshot({ path: path.join(tmp, `${host}-page.png`) });
  const tabId = await pop.evaluate(async (u) => (await chrome.tabs.query({ url: u + '*' }))[0].id, url(host));
  await pop.bringToFront(); await pop.emulateMedia({ colorScheme: dark ? 'dark' : 'light' });
  await pop.goto(`chrome-extension://${id}/popup.html?tab=${tabId}`); await wait(500);
  await setup(pop); await wait(700);
  const h = await pop.evaluate(() => Math.ceil(document.querySelector('footer').getBoundingClientRect().bottom));
  await pop.screenshot({ path: path.join(tmp, file), clip: { x: 0, y: 0, width: 320, height: h } });
}
await shoot('video', async (p) => { await p.click('.presets button[data-level="400"]'); await p.locator('#level').fill('350'); await p.locator('#level').dispatchEvent('change'); }, 'pop-video.png');
await shoot('podcast', async (p) => { await p.click('.presets button[data-level="200"]'); }, 'pop-podcast.png');
await shoot('news', async (p) => { await p.click('.presets button[data-level="50"]'); await p.locator('#level').dispatchEvent('change'); }, 'pop-news.png');
await shoot('video', async (p) => {
  await p.selectOption('#eq', 'voice'); await p.click('#mono'); await p.click('#mono');
  await p.click('#quiet-on'); await p.fill('#quiet-from', '22:00'); await p.locator('#quiet-from').dispatchEvent('change');
  await p.fill('#quiet-to', '07:00'); await p.locator('#quiet-to').dispatchEvent('change'); await p.selectOption('#quiet-cap', '50');
  await p.evaluate(() => document.activeElement?.blur());
}, 'pop-pro-dark.png', true);
await b.close().catch(() => {}); proc.kill(); server.close();

// ---- Compose the store images with plain HTML.
const img = (f) => `data:image/png;base64,${fs.readFileSync(path.join(tmp, f)).toString('base64')}`;
const icon = `data:image/png;base64,${fs.readFileSync(path.join(STORE, 'store-icon-512.png')).toString('base64')}`;
const css = `*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui;color:#1f2522}
.brand{display:flex;align-items:center;gap:12px;font-size:20px;font-weight:600;color:#3f6f62}.brand img{width:36px;height:36px}
h1{font-size:54px;line-height:1.08;letter-spacing:-.02em;margin:26px 0 18px}p{font-size:22px;line-height:1.45;color:#4c5550;margin:0}
.win{position:absolute;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 30px 70px rgba(30,45,40,.18)}
.bar{height:40px;background:#e9e7e1;display:flex;align-items:center;gap:8px;padding:0 14px;font-size:13px;color:#6b736f}
.bar i{width:11px;height:11px;border-radius:50%;background:#cfccc4;display:inline-block}
.url{margin-left:14px;background:#fff;border-radius:6px;padding:4px 12px;flex:1;max-width:420px}
.pop{position:absolute;border-radius:12px;box-shadow:0 18px 50px rgba(30,45,40,.28);border:1px solid #e6e3dc}`;
const shotPage = (headline, sub, host, popFile, dark = false) => `<style>${css}</style>
<body style="width:1280px;height:800px;position:relative;background:${dark ? '#171a19' : '#eef2ef'};overflow:hidden">
<div style="position:absolute;left:72px;top:150px;width:470px">
<div class="brand" ${dark ? 'style="color:#79b3a2"' : ''}><img src="${icon}">Quiet Volume Booster</div>
<h1 ${dark ? 'style="color:#e8ece9"' : ''}>${headline}</h1><p ${dark ? 'style="color:#98a19c"' : ''}>${sub}</p></div>
<div class="win" style="left:600px;top:70px;width:780px;height:560px"><div class="bar"><i></i><i></i><i></i><span class="url">${host}.example.com</span></div>
<img src="${img(`${host}-page.png`)}" style="width:880px"></div>
<img class="pop" src="${img(popFile)}" style="left:${dark ? 860 : 900}px;top:${dark ? 60 : 110}px;width:320px"></body>`;

const b2 = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const page = await b2.newPage();
async function render(html, w, h, file) { await page.setViewportSize({ width: w, height: h }); await page.setContent(html); await wait(200); await page.screenshot({ path: path.join(STORE, file) }); console.log(file); }
await render(shotPage('Too quiet? Turn it up to 600%.', 'Boost any video or audio on the web, with a limiter that keeps it clean instead of crackly.', 'video', 'pop-video.png'), 1280, 800, 'screenshot-1-1280x800.png');
await render(shotPage('Every site keeps its own volume.', 'Set a podcast to 200% and a loud news site to 50%. They come back that way every visit.', 'news', 'pop-news.png'), 1280, 800, 'screenshot-2-1280x800.png');
await render(shotPage('Better sound with Pro.', 'Voice clarity, bass boost, mono for one earbud, and quiet hours so nothing blasts at night. One-time purchase.', 'video', 'pop-pro-dark.png', true), 1280, 800, 'screenshot-3-1280x800.png');
const tile = (w, h, big) => `<style>${css}</style><body style="width:${w}px;height:${h}px;background:#3f6f62;color:#fbfaf7;position:relative;overflow:hidden">
<div style="position:absolute;left:${big ? 110 : 36}px;top:${big ? 150 : 34}px">
<img src="${icon}" style="width:${big ? 110 : 76}px;height:${big ? 110 : 76}px;border-radius:${big ? 26 : 18}px;border:2px solid rgba(255,255,255,.25)">
<div style="font-size:${big ? 58 : 30}px;font-weight:700;line-height:1.1;margin-top:${big ? 30 : 16}px">Quiet Volume${big ? ' Booster' : '<br>Booster'}</div>
<div style="font-size:${big ? 26 : 15}px;opacity:.85;margin-top:10px">Louder when you need it. Quieter when you don't.</div></div>
${big ? `<img class="pop" src="${img('pop-video.png')}" style="left:930px;top:60px;width:320px;border:0">` : ''}</body>`;
await render(tile(440, 280, false), 440, 280, 'promo-tile-440x280.png');
await render(tile(1400, 560, true), 1400, 560, 'marquee-1400x560.png');
await render(`<body style="margin:0;width:300px;height:300px;display:grid;place-items:center;background:#fff"><img src="${icon}" style="width:300px;height:300px"></body>`, 300, 300, 'edge-logo-300.png');
await b2.close();
