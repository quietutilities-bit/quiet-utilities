// Pure helpers: no chrome.* calls, so they can be unit-tested in Node.

export const CATEGORIES = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico', 'tif', 'tiff', 'heic'],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt', 'ods', 'odp', 'epub', 'json', 'xml', 'md'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'iso', 'dmg'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'oga', 'm4a', 'opus', 'wma'],
  video: ['mp4', 'webm', 'mkv', 'mov', 'avi', 'm4v', 'wmv', 'mpg', 'mpeg'],
  executables: ['exe', 'msi', 'apk', 'deb', 'rpm', 'pkg', 'appimage']
};

export const CATEGORY_LABELS = {
  images: 'Images',
  documents: 'Documents',
  archives: 'Archives',
  audio: 'Audio',
  video: 'Video',
  executables: 'Programs',
  links: 'Other links'
};

const EXT_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORIES).flatMap(([cat, exts]) => exts.map((e) => [e, cat]))
);

export function getExtension(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    const dot = last.lastIndexOf('.');
    if (dot <= 0 || dot === last.length - 1) return '';
    const ext = last.slice(dot + 1).toLowerCase();
    return /^[a-z0-9]{1,10}$/.test(ext) ? ext : '';
  } catch {
    return '';
  }
}

export function categorize(url, kind) {
  const ext = getExtension(url);
  if (ext && EXT_TO_CATEGORY[ext]) return EXT_TO_CATEGORY[ext];
  if (kind === 'image') return 'images';
  if (kind === 'video') return 'video';
  if (kind === 'audio') return 'audio';
  return 'links';
}

export function filenameFromUrl(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    let name = last;
    try { name = decodeURIComponent(last); } catch { /* keep raw */ }
    return name || u.hostname || 'download';
  } catch {
    return 'download';
  }
}

const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

export function sanitize(name, fallback = 'download') {
  let s = String(name ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/:*?"<>|~]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s]+|[.\s]+$/g, '');
  if (!s) s = fallback;
  if (RESERVED.test(s)) s = '_' + s;
  if (s.length > 150) {
    const dot = s.lastIndexOf('.');
    const ext = dot > 0 && s.length - dot <= 11 ? s.slice(dot) : '';
    s = s.slice(0, 150 - ext.length) + ext;
  }
  return s;
}

export function sanitizeFolder(folder) {
  return String(folder ?? '')
    .split(/[\\/]+/)
    .map((seg) => seg.trim())
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .map((seg) => sanitize(seg, 'folder'))
    .join('/');
}

export function splitName(filename) {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) return { base: filename, ext: '' };
  return { base: filename.slice(0, dot), ext: filename.slice(dot + 1) };
}

// Normalize and de-duplicate raw page items into display items.
export function prepareItems(raw) {
  const seen = new Set();
  const out = [];
  for (const r of raw || []) {
    if (!r || !r.url) continue;
    let url;
    try {
      const u = new URL(r.url);
      if (!['http:', 'https:', 'ftp:'].includes(u.protocol)) continue;
      u.hash = '';
      url = u.href;
    } catch {
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    const category = categorize(url, r.kind);
    let name = filenameFromUrl(url);
    // Plain page links download as HTML; give them a proper extension.
    if (category === 'links' && !getExtension(url)) name = `${name}.html`;
    out.push({
      url,
      name,
      ext: getExtension(url),
      text: (r.text || '').trim().slice(0, 200),
      kind: r.kind || 'link',
      category,
      domain: safeHost(url),
      pageUrl: r.pageUrl || ''
    });
  }
  return out;
}

function safeHost(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

export function countByCategory(items) {
  const counts = {};
  for (const it of items) counts[it.category] = (counts[it.category] || 0) + 1;
  return counts;
}

// opts: { categories: Set|array, text: string, regex: string }
export function filterItems(items, opts = {}) {
  const cats = opts.categories ? new Set(opts.categories) : null;
  const text = (opts.text || '').trim().toLowerCase();
  let re = null;
  if (opts.regex) {
    try { re = new RegExp(opts.regex, 'i'); } catch { re = null; }
  }
  return items.filter((it) => {
    if (cats && !cats.has(it.category)) return false;
    const hay = `${it.url} ${it.name} ${it.text}`.toLowerCase();
    if (text && !hay.includes(text)) return false;
    if (re && !re.test(it.url) && !re.test(it.name)) return false;
    return true;
  });
}

export function isValidRegex(pattern) {
  if (!pattern) return true;
  try { new RegExp(pattern); return true; } catch { return false; }
}

function pad(n, width) {
  return String(n).padStart(width, '0');
}

function today(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}

// Mask tokens: {name} {ext} {n} {domain} {date} {text}
export function applyMask(mask, item, index, total, date) {
  const original = sanitize(item.name || filenameFromUrl(item.url));
  if (!mask || !mask.trim()) return original;
  const { base, ext } = splitName(original);
  const width = Math.max(3, String(total || 1).length);
  let out = mask
    .replace(/\{name\}/g, base)
    .replace(/\{ext\}/g, ext)
    .replace(/\{n\}/g, pad(index + 1, width))
    .replace(/\{domain\}/g, item.domain || '')
    .replace(/\{date\}/g, today(date))
    .replace(/\{text\}/g, item.text || base);
  const usedExt = /\{ext\}/.test(mask);
  out = sanitize(out, base);
  if (!usedExt && ext && !out.toLowerCase().endsWith('.' + ext.toLowerCase())) {
    out = `${out}.${ext}`;
  }
  return out;
}

// Ensure no two files in one batch share a name.
export function uniquify(names) {
  const used = new Map();
  return names.map((n) => {
    const key = n.toLowerCase();
    if (!used.has(key)) { used.set(key, 1); return n; }
    let i = used.get(key) + 1;
    const { base, ext } = splitName(n);
    let candidate;
    do {
      candidate = ext ? `${base} (${i}).${ext}` : `${base} (${i})`;
      i++;
    } while (used.has(candidate.toLowerCase()));
    used.set(key, i - 1);
    used.set(candidate.toLowerCase(), 1);
    return candidate;
  });
}

// Build the final download jobs for the background queue.
export function buildJobs(items, { folder, mask, date } = {}) {
  const dir = sanitizeFolder(folder);
  const names = uniquify(items.map((it, i) => applyMask(mask, it, i, items.length, date)));
  return items.map((it, i) => ({
    url: it.url,
    filename: dir ? `${dir}/${names[i]}` : names[i]
  }));
}

export const BIG_BATCH = 100;

// Returns a warning to confirm before downloading, or '' if none is needed.
export function downloadWarning(items) {
  const pages = items.filter((it) => it.category === 'links').length;
  if (pages) return pages === 1 ? '1 is a web page, not a file.' : `${pages} are web pages, not files.`;
  if (items.length > BIG_BATCH) return `That's ${items.length} files.`;
  return '';
}
