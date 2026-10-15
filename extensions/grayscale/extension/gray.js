// Runs in web pages on sites the user chose. Applies or removes grayscale and
// follows setting changes live, so open tabs update without reloading.
(function () {
  if (window.__quietGray) { window.__quietGray(); return; }
  const R = self.QGRules;
  const KEYS = ['everywhere', 'sites', 'skip', 'strength'];

  async function apply() {
    let state;
    try { state = await chrome.storage.local.get(KEYS); } catch { return; }
    const root = document.documentElement;
    if (!root) return;
    let style = document.getElementById('quiet-gray');
    if (R.isOn(state, location.origin)) {
      if (!style) {
        style = document.createElement('style');
        style.id = 'quiet-gray';
        root.appendChild(style);
      }
      style.textContent = R.filterCss(state.strength);
      style.disabled = root.dataset.qgPaused === '1';
    } else if (style) {
      style.remove();
      delete root.dataset.qgPaused;
    }
  }

  window.__quietGray = apply;
  apply();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && KEYS.some((k) => k in changes)) apply();
  });
})();
