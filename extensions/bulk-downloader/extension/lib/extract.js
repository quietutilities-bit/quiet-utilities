// Injected into the page with chrome.scripting.executeScript.
// Must be fully self-contained: no imports, no outside variables.
export function extractFromPage() {
  const out = [];
  const pageUrl = location.href;
  const add = (url, text, kind) => {
    if (!url || typeof url !== 'string') return;
    url = url.trim();
    if (!url || url.startsWith('javascript:') || url.startsWith('mailto:') ||
        url.startsWith('tel:') || url.startsWith('data:') || url.startsWith('blob:') ||
        url.startsWith('#')) return;
    try { url = new URL(url, document.baseURI).href; } catch { return; }
    out.push({ url, text: (text || '').replace(/\s+/g, ' ').trim().slice(0, 200), kind, pageUrl });
  };

  // Largest candidate from a srcset string.
  const bestFromSrcset = (srcset) => {
    if (!srcset) return null;
    let best = null, bestScore = -1;
    for (const part of srcset.split(',')) {
      const [u, d] = part.trim().split(/\s+/);
      if (!u) continue;
      const score = d ? parseFloat(d) || 0 : 1;
      if (score > bestScore) { best = u; bestScore = score; }
    }
    return best;
  };

  document.querySelectorAll('a[href], area[href]').forEach((a) => {
    add(a.href, a.textContent || a.getAttribute('title') || a.getAttribute('aria-label'), 'link');
  });

  document.querySelectorAll('img').forEach((img) => {
    const src = bestFromSrcset(img.getAttribute('srcset')) || img.currentSrc || img.src ||
      img.getAttribute('data-src') || img.getAttribute('data-original');
    add(src, img.alt || img.title, 'image');
  });

  document.querySelectorAll('picture source[srcset]').forEach((s) => {
    add(bestFromSrcset(s.getAttribute('srcset')), '', 'image');
  });

  document.querySelectorAll('video, audio').forEach((m) => {
    const kind = m.tagName === 'VIDEO' ? 'video' : 'audio';
    if (m.currentSrc || m.src) add(m.currentSrc || m.src, m.title, kind);
    m.querySelectorAll('source[src]').forEach((s) => add(s.src, m.title, kind));
    if (kind === 'video' && m.poster) add(m.poster, 'poster', 'image');
  });

  document.querySelectorAll('embed[src], object[data]').forEach((e) => {
    add(e.getAttribute('src') || e.getAttribute('data'), '', 'link');
  });

  return { title: document.title, url: pageUrl, items: out };
}
