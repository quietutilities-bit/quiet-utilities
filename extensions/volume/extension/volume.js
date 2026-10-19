// Runs in web pages. Routes the page's audio and video through a volume and
// equalizer chain, and follows setting changes live without reloading.
// It only takes over a player when the sound actually changes, and never
// touches players that would go silent (cross-site media without CORS).
(function () {
  if (window.__qv) { window.__qv.refresh(); return; }
  const R = self.QVRules;
  const KEYS = ['levels', 'everywhere', 'pro', 'eq', 'mono', 'quietOn', 'quietFrom', 'quietTo', 'quietCap'];

  // Settings follow the site in the address bar, also inside embedded players.
  function siteOrigin() {
    try {
      if (window.top === window) return location.origin;
      const a = location.ancestorOrigins;
      if (a && a.length) return a[a.length - 1];
    } catch { /* fall through */ }
    return location.origin;
  }
  const site = siteOrigin();

  let state = R.normalize({});
  let ctx = null, chain = null;
  const routed = new WeakSet(), refused = new WeakSet(), failed = new WeakSet();
  let routedCount = 0, refusedCount = 0, waitingForGesture = false, timer = null;

  function buildChain() {
    const input = ctx.createGain();
    const low = ctx.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 120;
    const mid = ctx.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1500; mid.Q.value = 0.9;
    const high = ctx.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 6000;
    const mono = ctx.createGain();
    const gain = ctx.createGain();
    // Soft limiter so big boosts don't crackle.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1; limiter.knee.value = 0; limiter.ratio.value = 20;
    limiter.attack.value = 0.003; limiter.release.value = 0.25;
    input.connect(low); low.connect(mid); mid.connect(high); high.connect(mono);
    mono.connect(gain); gain.connect(limiter); limiter.connect(ctx.destination);
    return { input, low, mid, high, mono, gain, limiter };
  }

  // An AudioContext only plays after the user has interacted with the page.
  // Never route a player into a context that can't play, or it would go silent.
  async function audioReady() {
    if (!ctx) {
      try { ctx = new AudioContext({ latencyHint: 'playback' }); } catch { return false; }
      chain = buildChain();
      applySound();
    }
    if (ctx.state !== 'running') {
      await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
    }
    return ctx.state === 'running';
  }

  function waitForGesture() {
    if (waitingForGesture) return;
    waitingForGesture = true;
    const go = () => {
      waitingForGesture = false;
      window.removeEventListener('pointerdown', go, true);
      window.removeEventListener('keydown', go, true);
      scan();
    };
    window.addEventListener('pointerdown', go, true);
    window.addEventListener('keydown', go, true);
  }

  async function route(el) {
    if (routed.has(el) || failed.has(el)) return;
    if (!R.needsAudio(state, site)) return;
    const ok = R.canRoute(el.currentSrc || el.src, location.origin, el.crossOrigin, Boolean(el.srcObject));
    if (!ok) {
      // Checked again each time it plays: the same player may load other media later.
      if ((el.currentSrc || el.src) && !refused.has(el)) { refused.add(el); refusedCount++; publish(); }
      return;
    }
    if (!(await audioReady())) { waitForGesture(); return; }
    if (routed.has(el)) return;
    if (refused.has(el)) { refused.delete(el); refusedCount--; }
    try {
      ctx.createMediaElementSource(el).connect(chain.input);
      routed.add(el); routedCount++;
    } catch {
      failed.add(el); refusedCount++;
    }
    publish();
  }

  function applySound() {
    if (!chain) return;
    const level = R.effectiveLevel(state, site, new Date());
    const snd = R.soundFor(state);
    const t = ctx.currentTime;
    chain.gain.gain.setTargetAtTime(level / 100, t, 0.03);
    chain.low.gain.setTargetAtTime(snd.low, t, 0.03);
    chain.mid.gain.setTargetAtTime(snd.mid, t, 0.03);
    chain.high.gain.setTargetAtTime(snd.high, t, 0.03);
    chain.mono.channelCount = snd.mono ? 1 : 2;
    chain.mono.channelCountMode = snd.mono ? 'explicit' : 'max';
    chain.mono.channelInterpretation = 'speakers';
  }

  // Route players that are playing now (others are picked up when they start).
  function scan() {
    if (!R.needsAudio(state, site)) return;
    for (const el of document.querySelectorAll('video, audio')) if (!el.paused) route(el);
  }

  // Lets the popup and badge show what's happening on the page.
  function publish() {
    if (window.top !== window) return;
    const root = document.documentElement;
    if (!root) return;
    root.dataset.qvRouted = String(routedCount);
    root.dataset.qvRefused = String(refusedCount);
  }

  async function refresh() {
    try { state = R.normalize(await chrome.storage.local.get(KEYS)); } catch { return; }
    applySound();
    scan();
    // Quiet hours start and end on the clock, so check once a minute while they're on.
    clearInterval(timer);
    if (state.pro && state.quietOn) timer = setInterval(applySound, 60000);
  }

  document.addEventListener('play', (e) => {
    const el = e.target;
    if (el instanceof HTMLMediaElement) route(el);
  }, true);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && KEYS.some((k) => k in changes)) refresh();
  });

  window.__qv = {
    refresh,
    status: () => ({
      site, routed: routedCount, refused: refusedCount,
      players: document.querySelectorAll('video, audio').length,
      waiting: waitingForGesture, level: R.effectiveLevel(state, site, new Date())
    }),
    // For automated tests: the live audio graph.
    _graph: () => ({ ctx, chain })
  };
  refresh();
})();
