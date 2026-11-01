// Sample "photo" illustrations for the listing mockups (original, hand-drawn SVG, no AI).
// They stand in for the buyer's own photo; listing images label them "sample image".
// SCENE.cabin() / SCENE.forest() / SCENE.window() return an SVG string that fills its box (slice).
(function () {
  const pine = (x, y, s, c = '#24493F') => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -60 L16 -34 L9 -34 L22 -14 L13 -14 L28 8 L-28 8 L-13 -14 L-22 -14 L-9 -34 L-16 -34 Z" fill="${c}"/>
    <path transform="translate(${x} ${y}) scale(${s})" d="M0 -60 L7 -49 L-7 -49 Z M-12 -30 L0 -36 L12 -30 L9 -26 L-9 -26 Z M-18 -10 L0 -17 L18 -10 L14 -6 L-14 -6 Z" fill="#fff" opacity=".85"/>
    <rect transform="translate(${x} ${y}) scale(${s})" x="-3" y="8" width="6" height="8" fill="#5A3E2B"/>`;
  const stars = (n, w, h, seed = 7) => {
    let s = seed, out = '';
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) out += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(0.8 + r() * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
    return out;
  };
  const flakes = (n, w, h, seed = 3) => {
    let s = seed, out = '';
    const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < n; i++) out += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(1.2 + r() * 2.4).toFixed(1)}" fill="#fff" opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>`;
    return out;
  };
  const wrap = (body, id) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block">${body}</svg>`;

  window.SCENE = {
    // dusk: cabin with warm windows, pines, snowy hills
    cabin: () => wrap(`
      <defs><linearGradient id="skyA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22364A"/><stop offset=".6" stop-color="#4E6E86"/><stop offset="1" stop-color="#C9A98B"/></linearGradient></defs>
      <rect width="400" height="400" fill="url(#skyA)"/>
      ${stars(60, 400, 200)}
      <circle cx="318" cy="72" r="22" fill="#F6EBD2"/><circle cx="328" cy="66" r="20" fill="#2C4459" opacity=".35"/>
      <path d="M-10 270 C60 220 130 230 200 252 C270 230 340 214 410 240 L410 410 L-10 410 Z" fill="#D9E4E8"/>
      ${pine(40, 250, 1.3, '#1F3F37')}${pine(85, 262, 1.0, '#24493F')}${pine(352, 238, 1.4, '#1F3F37')}${pine(310, 252, 0.9, '#24493F')}
      <g transform="translate(150 230)">
        <path d="M-6 40 L50 0 L106 40 Z" fill="#7A4A35"/><path d="M-10 42 L50 -4 L110 42 L104 46 L50 6 L-4 46 Z" fill="#fff"/>
        <rect x="4" y="40" width="92" height="56" fill="#8A5A3B"/>
        <rect x="16" y="54" width="20" height="18" fill="#F3C25B"/><rect x="64" y="54" width="20" height="18" fill="#F3C25B"/>
        <rect x="42" y="62" width="16" height="34" fill="#5A3E2B"/>
        <rect x="72" y="2" width="12" height="26" fill="#6B4A3A"/><path d="M78 -2 C70 -14 86 -22 78 -36" stroke="#E8E2DA" stroke-width="4" fill="none" opacity=".6"/>
      </g>
      <path d="M-10 318 C90 296 200 304 410 292 L410 410 L-10 410 Z" fill="#F4F7F8"/>
      ${pine(110, 330, 0.8, '#2F5D50')}${pine(282, 326, 0.75, '#2F5D50')}
      ${flakes(70, 400, 400)}`),

    // snowy forest under a starry night
    forest: () => wrap(`
      <defs><linearGradient id="skyB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14263A"/><stop offset="1" stop-color="#3E5F78"/></linearGradient></defs>
      <rect width="400" height="400" fill="url(#skyB)"/>
      ${stars(90, 400, 260, 11)}
      <path d="M200 40 L204 52 L216 52 L206 60 L210 72 L200 64 L190 72 L194 60 L184 52 L196 52 Z" fill="#F3D27A"/>
      <path d="M-10 250 C80 210 160 240 230 226 C300 212 350 230 410 222 L410 410 L-10 410 Z" fill="#CFDDE3"/>
      ${pine(30, 240, 1.6, '#173A31')}${pine(95, 236, 1.2, '#1F3F37')}${pine(160, 248, 1.0, '#24493F')}${pine(250, 236, 1.1, '#1F3F37')}${pine(320, 230, 1.5, '#173A31')}${pine(380, 246, 1.2, '#24493F')}
      <path d="M-10 300 C100 280 260 292 410 280 L410 410 L-10 410 Z" fill="#EEF3F5"/>
      ${pine(70, 330, 1.3, '#2F5D50')}${pine(200, 326, 0.9, '#2F5D50')}${pine(340, 334, 1.2, '#2F5D50')}
      <path d="M-10 360 C120 344 280 352 410 346 L410 410 L-10 410 Z" fill="#fff"/>
      ${flakes(90, 400, 400, 5)}`),

    // cozy room: decorated tree beside a frosty window
    window: () => wrap(`
      <rect width="400" height="400" fill="#E9DCC8"/>
      <rect y="300" width="400" height="100" fill="#B98E6A"/><rect y="300" width="400" height="6" fill="#9C7556"/>
      <g transform="translate(36 60)">
        <rect width="150" height="190" rx="4" fill="#F7F1E7"/>
        <rect x="10" y="10" width="130" height="170" fill="#36566E"/>
        ${'<circle cx="30" cy="40" r="2" fill="#fff"/><circle cx="90" cy="30" r="2.4" fill="#fff"/><circle cx="60" cy="80" r="2" fill="#fff"/><circle cx="110" cy="100" r="2.2" fill="#fff"/><circle cx="40" cy="130" r="2" fill="#fff"/><circle cx="120" cy="150" r="1.8" fill="#fff"/><circle cx="80" cy="120" r="1.6" fill="#fff"/>'}
        <path d="M10 150 C50 136 90 146 140 138 L140 180 L10 180 Z" fill="#E7EEF1"/>
        <rect x="72" y="10" width="6" height="170" fill="#F7F1E7"/><rect x="10" y="92" width="130" height="6" fill="#F7F1E7"/>
        <rect x="-8" y="186" width="166" height="10" rx="3" fill="#F7F1E7"/>
      </g>
      <g transform="translate(290 300)">
        <path d="M0 -230 L44 -150 L26 -150 L66 -80 L44 -80 L88 0 L-88 0 L-44 -80 L-66 -80 L-26 -150 L-44 -150 Z" fill="#2F5D50"/>
        <path d="M-30 -140 C0 -128 26 -132 40 -146 M-52 -66 C-10 -52 30 -56 60 -74" stroke="#D9A441" stroke-width="3" fill="none" stroke-dasharray="2 8" stroke-linecap="round"/>
        <circle cx="-14" cy="-180" r="7" fill="#B23A3A"/><circle cx="20" cy="-118" r="8" fill="#D9A441"/><circle cx="-30" cy="-100" r="8" fill="#B23A3A"/>
        <circle cx="40" cy="-50" r="9" fill="#EAF1EE"/><circle cx="-50" cy="-30" r="9" fill="#D9A441"/><circle cx="6" cy="-30" r="9" fill="#B23A3A"/>
        <path d="M0 -252 L6 -238 L21 -238 L9 -229 L13 -214 L0 -223 L-13 -214 L-9 -229 L-21 -238 L-6 -238 Z" fill="#D9A441"/>
        <rect x="-10" y="0" width="20" height="16" fill="#6B4A3A"/>
      </g>
      <g transform="translate(170 300)">
        <rect x="0" y="-34" width="44" height="34" fill="#B23A3A"/><rect x="18" y="-34" width="8" height="34" fill="#D9A441"/>
        <rect x="56" y="-26" width="34" height="26" fill="#2F5D50"/><rect x="56" y="-16" width="34" height="6" fill="#EAF1EE"/>
      </g>`),
  };
})();
