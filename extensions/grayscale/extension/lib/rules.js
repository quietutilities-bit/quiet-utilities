// Pure decision logic, shared by the popup, background and page script.
// Classic script (no modules) so it can run as a content script too.
(function (root) {
  const DEFAULTS = { everywhere: false, sites: [], skip: [], strength: 100 };

  function normalize(state) {
    const s = Object.assign({}, DEFAULTS, state || {});
    s.sites = Array.isArray(s.sites) ? [...new Set(s.sites)] : [];
    s.skip = Array.isArray(s.skip) ? [...new Set(s.skip)] : [];
    const n = Number(s.strength);
    s.strength = Number.isFinite(n) ? Math.min(100, Math.max(10, Math.round(n))) : 100;
    s.everywhere = Boolean(s.everywhere);
    return s;
  }

  // Only normal web pages can be grayed (not browser pages, files or the store).
  function originOf(url) {
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return u.origin;
    } catch { return ''; }
  }

  function isOn(state, origin) {
    const s = normalize(state);
    if (!origin) return false;
    return s.everywhere ? !s.skip.includes(origin) : s.sites.includes(origin);
  }

  // Returns a new state with this site switched on or off.
  function setSite(state, origin, on) {
    const s = normalize(state);
    if (!origin) return s;
    if (s.everywhere) {
      s.skip = on ? s.skip.filter((o) => o !== origin) : [...new Set([...s.skip, origin])];
    } else {
      s.sites = on ? [...new Set([...s.sites, origin])] : s.sites.filter((o) => o !== origin);
    }
    return s;
  }

  function setEverywhere(state, on) {
    const s = normalize(state);
    s.everywhere = Boolean(on);
    return s;
  }

  function pattern(origin) { return `${origin}/*`; }

  // Where the page script should be registered.
  function registration(state) {
    const s = normalize(state);
    if (s.everywhere) return { matches: ['<all_urls>'], excludeMatches: s.skip.map(pattern) };
    return { matches: s.sites.map(pattern), excludeMatches: [] };
  }

  function filterCss(strength) {
    const v = normalize({ strength }).strength / 100;
    return `html { filter: grayscale(${v}) !important; }`;
  }

  const api = { DEFAULTS, normalize, originOf, isOn, setSite, setEverywhere, pattern, registration, filterCss };
  root.QGRules = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis);
