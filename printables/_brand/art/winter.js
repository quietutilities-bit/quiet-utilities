// Hand-drawn winter / Christmas SVG art for Pantry Printable Co. (original, no AI).
// Usage: <script src="../../_brand/art/winter.js"></script> then WINTER.tree() returns an SVG string.
// Every function takes an optional { color, rotate, w, h, style } object.
(function () {
  const C = { pine: '#2F5D50', pineLight: '#4C7A68', berry: '#B23A3A', berryDark: '#8E2C2C', gold: '#D9A441', frost: '#EAF1EE', ink: '#3B2F2A', cream: '#FBF6EE', bark: '#8A5A3B', snow: '#FFFFFF', ice: '#A9C6D3', ginger: '#B9773F' };
  const svg = (vb, body, o = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${o.w ? `width="${o.w}"` : ''} ${o.h ? `height="${o.h}"` : ''} style="${o.style || ''}">${o.rotate ? `<g transform="rotate(${o.rotate} ${vb.split(' ')[2] / 2} ${vb.split(' ')[3] / 2})">${body}</g>` : body}</svg>`;

  const W = {
    C,
    tree(o = {}) {
      const c = o.color || C.pine;
      const lights = [[44, 40, C.gold], [58, 52, C.berry], [38, 64, C.frost], [64, 72, C.gold], [30, 86, C.berry], [52, 84, C.frost], [72, 92, C.berry], [46, 100, C.gold]];
      return svg('0 0 100 130', `
        <rect x="43" y="108" width="14" height="16" rx="2" fill="${C.bark}"/>
        <path d="M50 14 L76 52 L64 52 L84 80 L70 80 L92 110 L8 110 L30 80 L16 80 L36 52 L24 52 Z" fill="${c}"/>
        <path d="M50 14 L76 52 L64 52 L84 80 L70 80 L92 110 L50 110 Z" fill="#000" fill-opacity=".10"/>
        <path d="M34 58 Q52 66 70 56 M26 86 Q50 96 78 84" stroke="${C.gold}" stroke-width="2" fill="none" stroke-dasharray="1 5" stroke-linecap="round"/>
        ${lights.map(([x, y, f]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${f}"/>`).join('')}
        <path d="M50 2 L53.5 10.5 L62.5 11 L55.5 16.8 L57.8 25.5 L50 20.6 L42.2 25.5 L44.5 16.8 L37.5 11 L46.5 10.5 Z" fill="${C.gold}"/>`, o);
    },
    ornament(o = {}) {
      const c = o.color || C.berry;
      return svg('0 0 80 100', `
        <path d="M40 4 C34 4 34 12 40 12 C46 12 46 4 40 4" stroke="${C.ink}" stroke-opacity=".5" stroke-width="2" fill="none"/>
        <rect x="31" y="12" width="18" height="11" rx="2" fill="${C.gold}"/>
        <circle cx="40" cy="58" r="34" fill="${c}"/>
        <path d="M8 52 Q40 62 72 52 L73 60 Q40 70 7 60 Z" fill="${C.gold}" fill-opacity=".9"/>
        <path d="M14 76 Q40 84 66 76" stroke="#fff" stroke-opacity=".55" stroke-width="2.5" fill="none" stroke-dasharray="2 6" stroke-linecap="round"/>
        <ellipse cx="28" cy="40" rx="7" ry="10" fill="#fff" fill-opacity=".28" transform="rotate(30 28 40)"/>`, o);
    },
    gift(o = {}) {
      const c = o.color || C.berry, r = o.ribbon || C.gold;
      return svg('0 0 100 100', `
        <path d="M50 30 C40 12 22 14 26 24 C30 32 44 30 50 30 Z M50 30 C60 12 78 14 74 24 C70 32 56 30 50 30 Z" fill="${r}"/>
        <rect x="12" y="30" width="76" height="20" rx="3" fill="${c}"/>
        <rect x="18" y="50" width="64" height="44" rx="2" fill="${c}"/>
        <rect x="18" y="50" width="64" height="44" fill="#000" fill-opacity=".08"/>
        <rect x="44" y="30" width="12" height="64" fill="${r}"/>`, o);
    },
    star(o = {}) {
      return svg('0 0 100 100', `<path d="M50 6 L61.8 36.2 L94 38 L69 58.6 L77.2 90 L50 72.4 L22.8 90 L31 58.6 L6 38 L38.2 36.2 Z" fill="${o.color || C.gold}" stroke="${o.stroke || 'none'}" stroke-width="3" stroke-linejoin="round"/>`, o);
    },
    snowflake(o = {}) {
      const c = o.color || C.ice;
      let arms = '';
      for (let i = 0; i < 6; i++) arms += `<g transform="rotate(${i * 60} 50 50)"><path d="M50 50 L50 8 M50 22 L40 14 M50 22 L60 14 M50 34 L42 28 M50 34 L58 28" stroke="${c}" stroke-width="4.5" stroke-linecap="round" fill="none"/></g>`;
      return svg('0 0 100 100', `${arms}<circle cx="50" cy="50" r="5" fill="${c}"/>`, o);
    },
    candycane(o = {}) {
      return svg('0 0 60 120', `
        <defs><clipPath id="cc${(o.id || 'a')}"><path d="M18 116 L18 36 C18 16 30 6 40 6 C52 6 58 18 58 30 L46 30 C46 22 44 18 40 18 C34 18 30 24 30 36 L30 116 Z"/></clipPath></defs>
        <path d="M18 116 L18 36 C18 16 30 6 40 6 C52 6 58 18 58 30 L46 30 C46 22 44 18 40 18 C34 18 30 24 30 36 L30 116 Z" fill="#fff" stroke="${C.ink}" stroke-opacity=".25" stroke-width="1.5"/>
        <g clip-path="url(#cc${(o.id || 'a')})">${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${i * 12 - 2} L70 ${i * 12 - 30} L70 ${i * 12 - 23} L0 ${i * 12 + 5} Z" fill="${o.color || C.berry}"/>`).join('')}</g>`, o);
    },
    holly(o = {}) {
      const leaf = (rot) => `<path transform="rotate(${rot} 50 46)" d="M50 46 C46 38 36 36 30 30 C30 26 24 24 22 20 C18 22 12 20 10 18 C12 24 10 28 12 32 C16 34 16 38 18 42 C26 44 40 44 50 46 Z" fill="${o.color || C.pine}"/>`;
      return svg('0 0 100 80', `
        ${leaf(0)}${leaf(180)}
        <path transform="rotate(-24 50 46)" d="M50 46 C46 38 36 36 30 30" stroke="#fff" stroke-opacity=".25" stroke-width="1.6" fill="none"/>
        <circle cx="46" cy="48" r="8" fill="${C.berry}"/><circle cx="57" cy="52" r="7.5" fill="${C.berryDark}"/><circle cx="50" cy="38" r="7" fill="${C.berry}"/>
        <circle cx="43" cy="45" r="2.2" fill="#fff" fill-opacity=".5"/><circle cx="48" cy="35.5" r="2" fill="#fff" fill-opacity=".5"/>`, o);
    },
    stocking(o = {}) {
      const c = o.color || C.berry;
      return svg('0 0 80 110', `
        <path d="M22 26 L56 26 L56 70 C56 70 70 74 72 88 C74 100 62 106 50 104 C34 102 26 92 22 80 Z" fill="${c}"/>
        <path d="M50 104 C62 106 74 100 72 88 C70 80 62 76 56 74 C56 86 52 96 50 104 Z" fill="#fff" fill-opacity=".85" stroke="${C.ice}" stroke-width="1.5"/>
        <rect x="16" y="10" width="46" height="20" rx="8" fill="#fff" stroke="${C.ice}" stroke-width="2"/>
        <path d="M24 46 L54 46 M24 56 L54 56" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="4 4"/>
        <path d="M56 16 C66 8 72 12 70 18" stroke="${C.gold}" stroke-width="3" fill="none" stroke-linecap="round"/>`, o);
    },
    mitten(o = {}) {
      const c = o.color || C.pine;
      return svg('0 0 80 100', `
        <path d="M22 72 L20 40 C18 22 30 10 44 12 C58 14 64 26 62 42 L60 72 Z" fill="${c}"/>
        <path d="M22 50 C10 44 6 34 12 28 C18 24 22 30 24 38 Z" fill="${c}"/>
        <rect x="16" y="70" width="48" height="20" rx="6" fill="#fff" stroke="${C.ice}" stroke-width="2"/>
        <path d="M28 36 L36 44 L44 36 L52 44" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M28 52 L36 60 L44 52 L52 60" stroke="${C.berry}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`, o);
    },
    gingerbread(o = {}) {
      const c = o.color || C.ginger;
      return svg('0 0 100 110', `
        <path d="M50 4 C62 4 68 14 66 24 C64 30 62 33 60 35 L82 40 C92 42 92 56 82 56 L64 54 L66 70 L76 96 C80 106 66 110 62 102 L50 82 L38 102 C34 110 20 106 24 96 L34 70 L36 54 L18 56 C8 56 8 42 18 40 L40 35 C38 33 36 30 34 24 C32 14 38 4 50 4 Z" fill="${c}"/>
        <path d="M16 46 Q20 50 16 52 M84 46 Q80 50 84 52 M30 98 Q34 94 36 98 M64 98 Q66 94 70 98" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <circle cx="44" cy="18" r="3" fill="${C.ink}"/><circle cx="56" cy="18" r="3" fill="${C.ink}"/>
        <path d="M43 25 Q50 30 57 25" stroke="${C.ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <circle cx="50" cy="46" r="3.6" fill="${C.berry}"/><circle cx="50" cy="58" r="3.6" fill="${C.pine}"/><circle cx="50" cy="70" r="3.6" fill="${C.berry}"/>`, o);
    },
    bell(o = {}) {
      const c = o.color || C.gold;
      return svg('0 0 100 100', `
        <path d="M50 12 C32 12 26 28 26 46 C26 60 20 68 14 74 L86 74 C80 68 74 60 74 46 C74 28 68 12 50 12 Z" fill="${c}"/>
        <path d="M50 12 C68 12 74 28 74 46 C74 60 80 68 86 74 L60 74 C64 60 66 36 50 12 Z" fill="#000" fill-opacity=".08"/>
        <rect x="12" y="72" width="76" height="8" rx="4" fill="${c}"/>
        <circle cx="50" cy="86" r="8" fill="${C.bark}"/>
        <circle cx="50" cy="10" r="5" fill="none" stroke="${C.bark}" stroke-width="3"/>
        <path d="M36 30 C34 38 34 46 35 54" stroke="#fff" stroke-opacity=".45" stroke-width="4" fill="none" stroke-linecap="round"/>`, o);
    },
    snowman(o = {}) {
      return svg('0 0 100 130', `
        <circle cx="50" cy="96" r="30" fill="#fff" stroke="${C.ice}" stroke-width="2.5"/>
        <circle cx="50" cy="54" r="21" fill="#fff" stroke="${C.ice}" stroke-width="2.5"/>
        <rect x="34" y="8" width="32" height="22" rx="2" fill="${C.ink}"/><rect x="26" y="28" width="48" height="6" rx="3" fill="${C.ink}"/>
        <rect x="34" y="22" width="32" height="5" fill="${C.berry}"/>
        <circle cx="43" cy="49" r="2.6" fill="${C.ink}"/><circle cx="57" cy="49" r="2.6" fill="${C.ink}"/>
        <path d="M50 54 L64 57 L50 58 Z" fill="#E08A3C"/>
        <path d="M30 70 Q50 80 70 70 L72 76 Q50 86 28 76 Z" fill="${o.color || C.berry}"/>
        <path d="M62 76 L68 96 L60 96 L56 78 Z" fill="${o.color || C.berry}"/>
        <circle cx="50" cy="90" r="3" fill="${C.ink}"/><circle cx="50" cy="104" r="3" fill="${C.ink}"/>`, o);
    },
    sprig(o = {}) {
      let needles = '';
      for (let i = 0; i < 18; i++) { const x = 12 + i * 10, up = i % 2 === 0; needles += `<path d="M${x} 20 L${x + 9} ${up ? 6 : 34}" stroke="${o.color || C.pine}" stroke-width="3" stroke-linecap="round"/>`; }
      return svg('0 0 200 40', `
        <path d="M6 20 L194 20" stroke="${C.bark}" stroke-width="2.5" stroke-linecap="round"/>
        ${needles}
        <circle cx="96" cy="22" r="6" fill="${C.berry}"/><circle cx="108" cy="25" r="5" fill="${C.berryDark}"/><circle cx="104" cy="14" r="4.5" fill="${C.berry}"/>`, o);
    },
    sleigh(o = {}) {
      return svg('0 0 140 90', `
        <path d="M10 76 L120 76 C134 76 136 62 128 60" stroke="${C.gold}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M30 76 L34 62 M96 76 L92 62" stroke="${C.gold}" stroke-width="4"/>
        <path d="M18 24 C18 50 26 62 40 62 L104 62 C118 62 124 50 122 34 L108 34 C100 34 96 40 92 46 L44 46 C38 46 34 40 34 28 Z" fill="${o.color || C.berry}"/>
        <path d="M24 30 C24 46 30 54 42 54 L96 54" stroke="${C.gold}" stroke-width="2.5" fill="none"/>
        <rect x="52" y="22" width="22" height="24" rx="2" fill="${C.pine}"/><rect x="61" y="22" width="5" height="24" fill="${C.gold}"/>
        <rect x="74" y="30" width="18" height="16" rx="2" fill="${C.gold}"/><rect x="81" y="30" width="4" height="16" fill="${C.berry}"/>`, o);
    },
    mug(o = {}) {
      const c = o.color || C.berry;
      return svg('0 0 100 100', `
        <path d="M40 10 C34 18 46 22 40 30 M54 8 C48 16 60 20 54 28" stroke="${C.ice}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M76 46 C92 46 92 72 74 72" stroke="${c}" stroke-width="8" fill="none"/>
        <path d="M18 36 L80 36 L76 86 C76 92 70 94 64 94 L34 94 C28 94 22 92 22 86 Z" fill="${c}"/>
        <ellipse cx="49" cy="36" rx="31" ry="6" fill="#7A4E36"/>
        <circle cx="40" cy="34" r="5" fill="#fff"/><circle cx="52" cy="33" r="5" fill="#fff"/><circle cx="60" cy="36" r="4" fill="#fff"/>
        <path d="M30 56 L68 56" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-dasharray="6 6"/>`, o);
    },
  };
  window.WINTER = W;
})();
