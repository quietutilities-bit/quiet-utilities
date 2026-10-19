// Pure decision logic, shared by the popup, background and page script.
// Classic script (no modules) so it can run as a content script too.
(function (root) {
  const MIN = 0, MAX = 600, NORMAL = 100;

  // Equalizer presets (Pro): gain in dB for low shelf (120 Hz), mid peak (1.5 kHz), high shelf (6 kHz).
  const EQ_PRESETS = {
    off: { label: 'Off', low: 0, mid: 0, high: 0 },
    bass: { label: 'Bass boost', low: 8, mid: 0, high: 0 },
    voice: { label: 'Voice clarity', low: -4, mid: 5, high: 2 },
    treble: { label: 'Treble boost', low: 0, mid: 0, high: 7 },
    night: { label: 'Less bass (night)', low: -10, mid: 0, high: 0 }
  };

  const DEFAULTS = {
    levels: {}, everywhere: false, pro: false,
    eq: 'off', mono: false,
    quietOn: false, quietFrom: '22:00', quietTo: '07:00', quietCap: 100
  };

  function clampLevel(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return NORMAL;
    return Math.min(MAX, Math.max(MIN, Math.round(v / 5) * 5));
  }

  function validTime(t, fallback) {
    return typeof t === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(t) ? t : fallback;
  }

  function normalize(state) {
    const s = Object.assign({}, DEFAULTS, state || {});
    const levels = {};
    if (s.levels && typeof s.levels === 'object') {
      for (const [o, v] of Object.entries(s.levels)) if (originOf(o) === o) levels[o] = clampLevel(v);
    }
    s.levels = levels;
    s.everywhere = Boolean(s.everywhere);
    s.pro = Boolean(s.pro);
    s.eq = Object.prototype.hasOwnProperty.call(EQ_PRESETS, s.eq) ? s.eq : 'off';
    s.mono = Boolean(s.mono);
    s.quietOn = Boolean(s.quietOn);
    s.quietFrom = validTime(s.quietFrom, DEFAULTS.quietFrom);
    s.quietTo = validTime(s.quietTo, DEFAULTS.quietTo);
    s.quietCap = Math.min(NORMAL, Math.max(10, clampLevel(s.quietCap)));
    return s;
  }

  // Only normal web pages can be changed (not browser pages, files or the store).
  function originOf(url) {
    try {
      const u = new URL(url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return u.origin;
    } catch { return ''; }
  }

  function levelFor(state, origin) {
    const s = normalize(state);
    return origin && origin in s.levels ? s.levels[origin] : NORMAL;
  }

  // Returns a new state with this site's level. 100% is stored too, so the
  // site stays "remembered" (the user may come back and change it).
  function setLevel(state, origin, level) {
    const s = normalize(state);
    if (!origin) return s;
    s.levels = Object.assign({}, s.levels, { [origin]: clampLevel(level) });
    return s;
  }

  function forget(state, origin) {
    const s = normalize(state);
    const levels = Object.assign({}, s.levels);
    delete levels[origin];
    s.levels = levels;
    return s;
  }

  function minutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

  // Is the clock inside the quiet window? Handles windows that cross midnight.
  function inQuietHours(from, to, date) {
    const now = date.getHours() * 60 + date.getMinutes();
    const a = minutes(from), b = minutes(to);
    if (a === b) return true; // whole day
    return a < b ? now >= a && now < b : now >= a || now < b;
  }

  // The level actually used right now (Pro quiet hours can cap it).
  function effectiveLevel(state, origin, date) {
    const s = normalize(state);
    let level = levelFor(s, origin);
    if (s.pro && s.quietOn && inQuietHours(s.quietFrom, s.quietTo, date || new Date())) level = Math.min(level, s.quietCap);
    return level;
  }

  // Pro sound settings, or flat if Pro is off.
  function soundFor(state) {
    const s = normalize(state);
    const eq = s.pro ? EQ_PRESETS[s.eq] : EQ_PRESETS.off;
    return { low: eq.low, mid: eq.mid, high: eq.high, mono: s.pro && s.mono };
  }

  // Only take over a page's audio when something actually changes the sound.
  function needsAudio(state, origin, date) {
    const snd = soundFor(state);
    return effectiveLevel(state, origin, date) !== NORMAL || snd.low !== 0 || snd.mid !== 0 || snd.high !== 0 || snd.mono;
  }

  // Can this media element be routed through Web Audio without going silent?
  // Cross-origin media without CORS plays as silence once routed, so leave it alone.
  function canRoute(src, pageOrigin, crossOriginAttr, hasStream) {
    if (hasStream) return true;
    if (!src) return false;
    if (/^(blob|data|mediastream):/i.test(src)) return true;
    let origin;
    try { origin = new URL(src, pageOrigin).origin; } catch { return false; }
    if (origin === pageOrigin) return true;
    return crossOriginAttr === 'anonymous' || crossOriginAttr === 'use-credentials';
  }

  function pattern(origin) { return `${origin}/*`; }

  // Where the page script should be registered.
  function registration(state) {
    const s = normalize(state);
    if (s.everywhere) return ['<all_urls>'];
    return Object.keys(s.levels).map(pattern);
  }

  function badgeText(level) {
    return level === NORMAL ? '' : String(level);
  }

  const api = {
    MIN, MAX, NORMAL, EQ_PRESETS, DEFAULTS, clampLevel, normalize, originOf, levelFor, setLevel, forget,
    inQuietHours, effectiveLevel, soundFor, needsAudio, canRoute, pattern, registration, badgeText
  };
  root.QVRules = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis);
