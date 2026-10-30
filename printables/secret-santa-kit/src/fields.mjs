#!/usr/bin/env node
// Measure every <span class="fld" data-f> in kit.html, per page size, in PDF points.
//   node src/fields.mjs  -> writes src/fields.json  (then python3 src/add_fields.py)
import { createRequire } from 'node:module';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
let pw; for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) { try { pw = require(p); break; } catch {} }
const here = dirname(fileURLToPath(import.meta.url));
let exe = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
if (!existsSync(exe)) { const d = existsSync('/opt/pw-browsers') ? readdirSync('/opt/pw-browsers').filter((x) => /^chromium-\d+$/.test(x)).sort().pop() : null; exe = d ? ['chrome-linux64/chrome', 'chrome-linux/chrome'].map((s) => `/opt/pw-browsers/${d}/${s}`).find(existsSync) : undefined; }
const SIZES = { letter: '8.5in 11in', a4: '210mm 297mm' };
const browser = await pw.chromium.launch({ executablePath: exe });
const out = {};
for (const [size, css] of Object.entries(SIZES)) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
  await page.goto(pathToFileURL(resolve(here, 'kit.html')).href + `?size=${size}`, { waitUntil: 'networkidle' });
  await page.evaluate(([s, c]) => { document.documentElement.dataset.size = s; const st = document.createElement('style'); st.textContent = `@page { size: ${c}; margin: 0; }`; document.head.appendChild(st); }, [size, css]);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(150);
  out[size] = await page.evaluate(() => {
    const pages = [...document.querySelectorAll('.page')];
    const k = 0.75; // CSS px -> pt
    const fields = [];
    pages.forEach((pg, i) => {
      const pr = pg.getBoundingClientRect();
      pg.querySelectorAll('.fld[data-f]').forEach((el) => {
        const r = el.getBoundingClientRect();
        fields.push({ name: el.dataset.f, page: i, x: (r.left - pr.left) * k, top: (r.top - pr.top) * k, w: r.width * k, h: r.height * k, cls: el.className });
      });
    });
    return { pageH: pages[0].getBoundingClientRect().height * 0.75, pages: pages.length, fields, defaults: window.FIELD_DEFAULTS };
  });
  await page.close();
}
await browser.close();
writeFileSync(resolve(here, 'fields.json'), JSON.stringify(out, null, 1));
console.log('fields:', Object.entries(out).map(([s, v]) => `${s} ${v.fields.length}`).join(', '));
