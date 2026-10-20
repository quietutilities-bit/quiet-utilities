#!/usr/bin/env node
// Quiet Table Co. render tool (HTML -> PDF / PNG / JPG) using Playwright + Chromium.
//
//   node _brand/render.mjs build <slug>        render everything listed in <slug>/src/render.json
//   node _brand/render.mjs check <slug>        rasterize every PDF page in <slug>/out to <slug>/out/_check/*.png
//   node _brand/render.mjs pdf <html> <out.pdf> [letter|a4]
//   node _brand/render.mjs img <html> <out.png|jpg> <width> <height>
//
// render.json:
// { "pdfs":   [{ "src": "pack.html", "name": "Thanksgiving-Game-Pack", "sizes": ["letter","a4"] }],
//   "images": [{ "src": "listing.html#1", "out": "listing/01-cover.jpg", "w": 3000, "h": 2250 }] }
// PDFs land in <slug>/out/<name>-US-Letter.pdf and <name>-A4.pdf; images in <slug>/out/<out>.
// Pages get <html data-size="..."> so brand.css switches --pw/--ph.

import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve, extname, basename } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const p of ['playwright', '/opt/npm-tools/node_modules/playwright']) {
    try { return require(p); } catch {}
  }
  throw new Error('playwright not found (npm i playwright, or use the preinstalled one)');
}
const { chromium } = loadPlaywright();
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SIZES = {
  letter: { css: '8.5in 11in', label: 'US-Letter', width: '8.5in', height: '11in' },
  a4: { css: '210mm 297mm', label: 'A4', width: '210mm', height: '297mm' },
};

let browser;
async function getBrowser() {
  if (!browser) browser = await chromium.launch({ executablePath: existsSync(CHROME) ? CHROME : undefined });
  return browser;
}

async function openPage(html, { size, viewport } = {}) {
  const b = await getBrowser();
  const page = await b.newPage({ viewport: viewport || { width: 1200, height: 1600 } });
  const [file, hash] = html.split('#'); // "listing.html#3" -> variant 3 (page reads location.hash)
  await page.goto(pathToFileURL(resolve(file)).href + (size ? `?size=${size}` : '') + (hash ? `#${hash}` : ''), { waitUntil: 'networkidle' });
  if (size) {
    await page.evaluate(([s, css]) => {
      document.documentElement.dataset.size = s;
      const st = document.createElement('style');
      st.textContent = `@page { size: ${css}; margin: 0; }`;
      document.head.appendChild(st);
      window.dispatchEvent(new CustomEvent('qt-size', { detail: s }));
    }, [size, SIZES[size].css]);
  }
  await page.evaluate(async () => { await document.fonts.ready; if (window.qtReady) await window.qtReady; });
  await page.waitForTimeout(150);
  return page;
}

export async function renderPdf(html, out, size = 'letter') {
  const page = await openPage(html, { size });
  mkdirSync(dirname(out), { recursive: true });
  await page.pdf({ path: out, width: SIZES[size].width, height: SIZES[size].height, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  // overflow guard: any .page whose content is taller than the page
  const overflow = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p, i) => (p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1) ? i + 1 : 0).filter(Boolean));
  await page.close();
  if (overflow.length) console.warn(`  ! overflow on page(s) ${overflow.join(', ')} of ${basename(out)}`);
  console.log(`  pdf ${out}`);
}

export async function renderImage(html, out, w, h) {
  const page = await openPage(html, { viewport: { width: +w, height: +h } });
  mkdirSync(dirname(out), { recursive: true });
  const jpg = /\.jpe?g$/i.test(out);
  await page.screenshot({ path: out, type: jpg ? 'jpeg' : 'png', quality: jpg ? 92 : undefined, clip: { x: 0, y: 0, width: +w, height: +h } });
  await page.close();
  console.log(`  img ${out}`);
}

function check(slug) {
  const outDir = join(ROOT, slug, 'out');
  const checkDir = join(outDir, '_check');
  rmSync(checkDir, { recursive: true, force: true });
  mkdirSync(checkDir, { recursive: true });
  for (const f of readdirSync(outDir).filter((f) => f.endsWith('.pdf'))) {
    const prefix = join(checkDir, f.replace(/\.pdf$/, ''));
    execFileSync('pdftoppm', ['-r', '60', '-png', join(outDir, f), prefix]);
    const info = execFileSync('pdfinfo', [join(outDir, f)]).toString();
    const pages = /Pages:\s+(\d+)/.exec(info)?.[1];
    const size = /Page size:\s+(.*)/.exec(info)?.[1];
    console.log(`  ${f}: ${pages} pages, ${size}`);
  }
}

async function build(slug) {
  const src = join(ROOT, slug, 'src');
  const cfg = JSON.parse(readFileSync(join(src, 'render.json'), 'utf8'));
  const out = join(ROOT, slug, 'out');
  for (const p of cfg.pdfs || []) {
    for (const s of p.sizes || ['letter']) await renderPdf(join(src, p.src), join(out, `${p.name}-${SIZES[s].label}.pdf`), s);
  }
  for (const im of cfg.images || []) await renderImage(join(src, im.src), join(out, im.out), im.w, im.h);
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'build') await build(args[0]);
  else if (cmd === 'check') check(args[0]);
  else if (cmd === 'pdf') await renderPdf(args[0], args[1], args[2] || 'letter');
  else if (cmd === 'img') await renderImage(args[0], args[1], args[2], args[3]);
  else { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 13).join('\n')); process.exitCode = 1; }
} finally {
  if (browser) await browser.close();
}
