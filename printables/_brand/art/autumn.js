// Hand-drawn autumn / Thanksgiving SVG art for Quiet Table Co. (original, no AI).
// Usage in a page: <script src="../../_brand/art/autumn.js"></script> then ART.leaf({color:'#D2733A'}) returns an SVG string.
(function () {
  const C = { pumpkin: '#D2733A', cranberry: '#9E3B3B', sage: '#7D8F69', gold: '#D9A441', bark: '#8A5A3B', ink: '#3B2F2A', cream: '#FBF6EE' };
  const svg = (vb, body, o = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${o.w ? `width="${o.w}"` : ''} ${o.h ? `height="${o.h}"` : ''} style="${o.style || ''}">${body}</svg>`;

  const ART = {
    C,
    leaf(o = {}) {
      const c = o.color || C.pumpkin;
      return svg('0 0 100 100', `
        <g transform="rotate(${o.rotate || 0} 50 50)">
        <path d="M50 6 C66 18 82 34 80 56 C78 76 62 88 50 92 C38 88 22 76 20 56 C18 34 34 18 50 6 Z" fill="${c}"/>
        <path d="M50 14 L50 98" stroke="${C.ink}" stroke-opacity=".35" stroke-width="2.4" stroke-linecap="round" fill="none"/>
        <path d="M50 40 L66 30 M50 54 L70 44 M50 68 L68 60 M50 40 L34 30 M50 54 L30 44 M50 68 L32 60" stroke="${C.ink}" stroke-opacity=".28" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        </g>`, o);
    },
    pumpkin(o = {}) {
      const c = o.color || C.pumpkin;
      return svg('0 0 120 100', `
        <path d="M60 22 C58 14 60 8 66 4" stroke="${C.sage}" stroke-width="6" stroke-linecap="round" fill="none"/>
        <path d="M64 12 C74 6 86 10 88 18 C78 20 70 18 64 12 Z" fill="${C.sage}"/>
        <ellipse cx="34" cy="60" rx="26" ry="34" fill="${c}"/>
        <ellipse cx="86" cy="60" rx="26" ry="34" fill="${c}"/>
        <ellipse cx="60" cy="60" rx="28" ry="37" fill="${c}"/>
        <ellipse cx="60" cy="60" rx="28" ry="37" fill="#fff" fill-opacity=".10"/>
        <path d="M46 28 C40 46 40 76 46 94 M74 28 C80 46 80 76 74 94" stroke="${C.ink}" stroke-opacity=".18" stroke-width="2.4" fill="none"/>`, o);
    },
    acorn(o = {}) {
      return svg('0 0 80 100', `
        <path d="M40 8 C40 4 44 2 46 2" stroke="${C.bark}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M14 40 C14 76 30 94 40 96 C50 94 66 76 66 40 Z" fill="${o.color || C.gold}"/>
        <path d="M8 40 C8 22 22 12 40 12 C58 12 72 22 72 40 Z" fill="${C.bark}"/>
        <path d="M18 26 L62 26 M14 34 L66 34" stroke="${C.ink}" stroke-opacity=".25" stroke-width="2" fill="none"/>`, o);
    },
    pie(o = {}) {
      let scallops = '';
      for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; scallops += `<circle cx="${50 + Math.cos(a) * 42}" cy="${50 + Math.sin(a) * 42}" r="7" fill="#E7B877"/>`; }
      return svg('0 0 100 100', `
        ${scallops}
        <circle cx="50" cy="50" r="40" fill="#E7B877"/>
        <circle cx="50" cy="50" r="34" fill="${o.color || C.pumpkin}"/>
        <circle cx="50" cy="50" r="34" fill="#000" fill-opacity=".06"/>
        <path d="M50 50 L84 50 A34 34 0 0 1 67 79.4 Z" fill="#fff" fill-opacity=".16"/>
        <ellipse cx="46" cy="44" rx="10" ry="6" fill="#fff" fill-opacity=".9"/>`, o);
    },
    wheat(o = {}) {
      let g = '';
      for (let i = 0; i < 6; i++) {
        const y = 14 + i * 11;
        g += `<ellipse cx="42" cy="${y}" rx="5" ry="10" transform="rotate(-28 42 ${y})" fill="${o.color || C.gold}"/>`;
        g += `<ellipse cx="58" cy="${y}" rx="5" ry="10" transform="rotate(28 58 ${y})" fill="${o.color || C.gold}"/>`;
      }
      return svg('0 0 100 140', `<path d="M50 8 L50 136" stroke="${C.bark}" stroke-width="3.5" stroke-linecap="round"/>${g}<ellipse cx="50" cy="6" rx="5" ry="10" fill="${o.color || C.gold}"/>`, o);
    },
    cranberries(o = {}) {
      return svg('0 0 100 80', `
        <path d="M30 30 C40 12 60 8 72 14" stroke="${C.sage}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M60 10 C70 0 86 4 88 12 C78 16 66 16 60 10 Z" fill="${C.sage}"/>
        <circle cx="30" cy="46" r="17" fill="${C.cranberry}"/><circle cx="58" cy="54" r="16" fill="#B5474A"/><circle cx="46" cy="30" r="13" fill="#B5474A"/>
        <circle cx="24" cy="40" r="4" fill="#fff" fill-opacity=".35"/><circle cx="52" cy="48" r="4" fill="#fff" fill-opacity=".35"/>`, o);
    },
    turkey(o = {}) {
      const fc = [C.cranberry, C.pumpkin, C.gold, C.sage, C.gold, C.pumpkin, C.cranberry];
      let feathers = '';
      fc.forEach((c, i) => {
        const a = -150 + i * 20; // degrees across the top
        feathers += `<ellipse cx="100" cy="58" rx="17" ry="52" fill="${c}" transform="rotate(${a + 90} 100 108)"/>`;
      });
      return svg('0 0 200 200', `
        ${feathers}
        <ellipse cx="100" cy="124" rx="46" ry="50" fill="${C.bark}"/>
        <ellipse cx="100" cy="136" rx="30" ry="32" fill="#A87150"/>
        <circle cx="100" cy="76" r="26" fill="${C.bark}"/>
        <circle cx="91" cy="72" r="5.5" fill="#fff"/><circle cx="109" cy="72" r="5.5" fill="#fff"/>
        <circle cx="92" cy="73" r="3" fill="${C.ink}"/><circle cx="108" cy="73" r="3" fill="${C.ink}"/>
        <path d="M93 82 L107 82 L100 94 Z" fill="${C.gold}"/>
        <path d="M100 88 C96 96 96 104 101 108 C105 104 105 96 100 88 Z" fill="${C.cranberry}"/>
        <path d="M84 172 L80 188 M80 188 L72 192 M80 188 L82 196 M116 172 L120 188 M120 188 L128 192 M120 188 L118 196" stroke="${C.gold}" stroke-width="5" stroke-linecap="round" fill="none"/>`, o);
    },
    sprig(o = {}) {
      return svg('0 0 200 40', `
        <path d="M6 20 C60 14 140 26 194 20" stroke="${C.sage}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        ${[30, 62, 94, 126, 158].map((x, i) => `<ellipse cx="${x}" cy="${i % 2 ? 28 : 12}" rx="11" ry="5" fill="${C.sage}" transform="rotate(${i % 2 ? 24 : -24} ${x} ${i % 2 ? 28 : 12})"/>`).join('')}
        <circle cx="100" cy="20" r="5" fill="${C.cranberry}"/><circle cx="110" cy="23" r="4" fill="${C.cranberry}"/>`, o);
    },
  };
  window.ART = ART;
})();
