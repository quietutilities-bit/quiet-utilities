// Builds store-ready zips for one extension: Chrome, Edge and Firefox.
// Usage: node scripts/build.mjs <folder-under-extensions> [outDir]
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { execFileSync } from 'node:child_process';
const name = process.argv[2]; const out = path.resolve(process.argv[3] || 'dist');
const root = path.resolve('extensions', name); const src = path.join(root, 'extension');
const store = JSON.parse(fs.readFileSync(path.join(root, 'store.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(src, 'manifest.json'), 'utf8'));
fs.mkdirSync(out, { recursive: true });

const targets = {
  chrome: { reviewUrl: store.extensionId ? `https://chromewebstore.google.com/detail/${store.extensionId}/reviews` : '' },
  edge: { reviewUrl: store.edgeId ? `https://microsoftedge.microsoft.com/addons/detail/${store.edgeId}` : '' },
  firefox: { reviewUrl: store.firefoxSlug ? `https://addons.mozilla.org/firefox/addon/${store.firefoxSlug}/reviews/` : '' }
};

for (const [target, opts] of Object.entries(targets)) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `build-${target}-`));
  fs.cpSync(src, dir, { recursive: true });
  // Per-store rating link (empty = rating prompt stays off until the listing exists).
  const cfgPath = path.join(dir, 'lib/config.js');
  if (fs.existsSync(cfgPath)) {
    let cfg = fs.readFileSync(cfgPath, 'utf8');
    cfg = cfg.replace(/REVIEW_URL: '[^']*'/, `REVIEW_URL: '${opts.reviewUrl}'`);
    fs.writeFileSync(cfgPath, cfg);
  }
  const m = structuredClone(manifest);
  if (target === 'firefox') {
    // Firefox has no extension service workers: load the same files as an event page.
    const imports = fs.readFileSync(path.join(dir, m.background.service_worker), 'utf8')
      .match(/importScripts\(([^)]*)\)/);
    const libs = imports ? [...imports[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
    m.background = { scripts: [...libs, m.background.service_worker] };
    m.browser_specific_settings = { gecko: {
      id: store.firefoxId || `${name}@quietutilities`,
      strict_min_version: '140.0',
      data_collection_permissions: { required: ['none'] }
    } };
    delete m.minimum_chrome_version;
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m, null, 2) + '\n');
  const zip = path.join(out, `${name}-${m.version}-${target}.zip`);
  fs.rmSync(zip, { force: true });
  execFileSync('zip', ['-qr', zip, '.', '-x', '.*'], { cwd: dir });
  console.log(zip);
}
