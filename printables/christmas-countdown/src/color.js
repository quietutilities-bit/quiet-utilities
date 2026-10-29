// Christmas Countdown for Kids: original hand-coded SVG coloring pages (no AI).
// Helpers copied from christmas-coloring-book/src/art.js; pages drawn in a 1000 x 1300 box,
// white shapes with thick black outlines, back to front. COLOR.on = true gives colored previews.
(function () {
  const K = '#1b1b1b';
  const PAL = { r: '#E36B5D', dr: '#C2473C', g: '#6FAE84', dg: '#3F7F62', y: '#F5CB4E', o: '#F29E4C', b: '#8CC2E3', lb: '#D7ECF7', br: '#B9773F', lbr: '#E2B57C', p: '#F6A9BD', pu: '#B7A1DD', gr: '#C9CDD2', cr: '#FBEBD0', w: '#FFFFFF', k: K, sn: '#EEF5F8' };
  const COLOR = { on: false };
  const f = (t) => (t === 'none' ? 'none' : COLOR.on ? PAL[t] || t : t === 'k' ? K : '#fff');
  const LW = 12; // main line width (page units; 1000 units = printable width)

  // ---------- helpers ----------
  const P = (d, fill = 'w', extra = '') => `<path d="${d}" fill="${f(fill)}" ${extra}/>`;
  const L = (d, w = 9, extra = '') => `<path d="${d}" fill="none" stroke-width="${w}" ${extra}/>`;
  const C = (cx, cy, r, fill = 'w', extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f(fill)}" ${extra}/>`;
  const E = (cx, cy, rx, ry, fill = 'w', extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f(fill)}" ${extra}/>`;
  const R = (x, y, w, h, rx = 0, fill = 'w', extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f(fill)}" ${extra}/>`;
  const G = (tr, body, sw) => `<g transform="${tr}"${sw ? ` stroke-width="${sw}"` : ''}>${body}</g>`;
  const dot = (cx, cy, r = 13) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${K}" stroke="none"/>`;
  const eye = (cx, cy, r = 24) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${K}" stroke="none"/><circle cx="${cx - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.33}" fill="#fff" stroke="none"/>`;
  function starD(cx, cy, R0, r0 = R0 * 0.48, n = 5, rot = -90) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = ((rot + (i * 180) / n) * Math.PI) / 180, rr = i % 2 ? r0 : R0;
      d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)} `;
    }
    return d + 'Z';
  }
  const star = (cx, cy, R0, fill = 'y', extra = '') => P(starD(cx, cy, R0), fill, extra);
  function flake(cx, cy, R0, w = 9) {
    let d = '';
    for (let i = 0; i < 6; i++) {
      const a = (i * 60 - 90) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      const pt = (t, off) => { const px = cx + R0 * t * ca, py = cy + R0 * t * sa; const oa = a + off; return [px, py, oa]; };
      d += `M${cx} ${cy} L${(cx + R0 * ca).toFixed(1)} ${(cy + R0 * sa).toFixed(1)} `;
      const [bx, by] = pt(0.58, 0);
      for (const s of [-1, 1]) { const ba = a + s * 0.75; d += `M${bx.toFixed(1)} ${by.toFixed(1)} L${(bx + R0 * 0.32 * Math.cos(ba)).toFixed(1)} ${(by + R0 * 0.32 * Math.sin(ba)).toFixed(1)} `; }
    }
    return L(d, w);
  }
  const sparkle = (cx, cy, s) => P(`M${cx} ${cy - s} Q${cx + s * 0.18} ${cy - s * 0.18} ${cx + s} ${cy} Q${cx + s * 0.18} ${cy + s * 0.18} ${cx} ${cy + s} Q${cx - s * 0.18} ${cy + s * 0.18} ${cx - s} ${cy} Q${cx - s * 0.18} ${cy - s * 0.18} ${cx} ${cy - s} Z`, 'y', 'stroke-width="8"');
  const heartD = (cx, cy, s) => `M${cx} ${cy + s * 0.9} C${cx - s * 1.4} ${cy - s * 0.1} ${cx - s * 0.8} ${cy - s * 1.1} ${cx} ${cy - s * 0.45} C${cx + s * 0.8} ${cy - s * 1.1} ${cx + s * 1.4} ${cy - s * 0.1} ${cx} ${cy + s * 0.9} Z`;
  const heart = (cx, cy, s, fill = 'r', extra = '') => P(heartD(cx, cy, s), fill, extra);
  // accents: [type, x, y, size] f=flake s=star d=dot k=sparkle h=heart
  const acc = (list) => list.map(([t, x, y, s]) => t === 'f' ? flake(x, y, s) : t === 's' ? star(x, y, s, 'y', 'stroke-width="8"') : t === 'd' ? C(x, y, s, 'b', 'stroke-width="8"') : t === 'k' ? sparkle(x, y, s) : heart(x, y, s, 'p', 'stroke-width="8"')).join('');
  const ground = (y, amp = 40) => P(`M-20 ${y} C200 ${y - amp} 380 ${y - amp} 520 ${y - amp * 0.3} S820 ${y + amp * 0.6} 1020 ${y - amp * 0.4} L1020 1320 L-20 1320 Z`, 'sn');
  // thick tube with an outline (for antlers, handles, branches, strings): draw all black first, then all white
  const tube = (ds, w, fill = 'w') => ds.map((d) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w + LW * 2}"/>`).join('') + ds.map((d) => `<path d="${d}" fill="none" stroke="${f(fill)}" stroke-width="${w}"/>`).join('');
  // box with lid and ribbon (gift)
  function gift(x, y, w, h, fill = 'r', rib = 'y', pattern = '') {
    const lid = Math.min(70, h * 0.28), rw = Math.max(40, w * 0.16), cx = x + w / 2;
    return R(x + 12, y + lid - 4, w - 24, h - lid + 4, 10, fill) + (pattern || '') + R(cx - rw / 2, y + lid - 4, rw, h - lid + 4, 0, rib)
      + R(x, y, w, lid, 12, fill) + R(cx - rw / 2, y, rw, lid, 0, rib);
  }
  function bow(cx, cy, s = 1, fill = 'y') {
    return G(`translate(${cx} ${cy}) scale(${s})`, P('M0 0 C-40 -70 -120 -60 -110 -10 C-105 25 -40 20 0 0 Z', fill) + P('M0 0 C40 -70 120 -60 110 -10 C105 25 40 20 0 0 Z', fill)
      + P('M-8 4 L-45 80 L-25 72 L-15 92 L4 10 Z', fill) + P('M8 4 L45 80 L25 72 L15 92 L-4 10 Z', fill)
      + E(0, 0, 24, 20, fill) + L('M-60 -18 C-50 -8 -30 -4 -14 -4 M60 -18 C50 -8 30 -4 14 -4', 7 / s), LW / s);
  }
  function leaf(cx, cy, len, wid, ang, fill = 'g') {
    const h = len / 2, q = wid / 2;
    const d = `M${-h} 0 C${-h * 0.6} ${-q * 0.6} ${-h * 0.5} ${-q * 1.5} ${-h * 0.15} ${-q * 0.9} C0 ${-q * 1.6} ${h * 0.15} ${-q * 0.9} ${h * 0.2} ${-q * 0.95} C${h * 0.45} ${-q * 1.5} ${h * 0.6} ${-q * 0.6} ${h} 0 C${h * 0.6} ${q * 0.6} ${h * 0.45} ${q * 1.5} ${h * 0.2} ${q * 0.95} C${h * 0.15} ${q * 0.9} 0 ${q * 1.6} ${-h * 0.15} ${q * 0.9} C${-h * 0.5} ${q * 1.5} ${-h * 0.6} ${q * 0.6} ${-h} 0 Z`;
    return G(`translate(${cx} ${cy}) rotate(${ang})`, P(d, fill) + L(`M${-h * 0.8} 0 L${h * 0.7} 0`, 7));
  }
  const berries = (cx, cy, s = 1) => C(cx - 22 * s, cy + 8 * s, 24 * s, 'r') + C(cx + 22 * s, cy + 10 * s, 24 * s, 'r') + C(cx, cy - 18 * s, 24 * s, 'r');
  const hollyBunch = (cx, cy, s = 1, rot = 0) => G(`translate(${cx} ${cy}) rotate(${rot}) scale(${s})`, leaf(-70, 0, 150, 80, -15) + leaf(70, 0, 150, 80, 15) + berries(0, -8), LW / s);

  // candy cane in local coords (shaft down from 0,0; hook to +x); stripes clipped
  function cane(id, tr, len = 600) {
    const sh = `M-40 ${len} L-40 0 A150 150 0 0 1 260 0 L260 50 L180 50 L180 0 A70 70 0 0 0 40 0 L40 ${len} Z`;
    let st = '';
    for (let y = 70; y < len + 60; y += 85) st += `<path d="M-60 ${y + 20} L60 ${y - 30} L60 ${y + 10} L-60 ${y + 60} Z" fill="${f('r')}" stroke-width="7"/>`;
    for (const a of [195, 235, 275, 315, 352]) {
      const r1 = 60, r2 = 160, a1 = (a - 8) * Math.PI / 180, a2 = (a + 8) * Math.PI / 180;
      st += `<path d="M${110 + r1 * Math.cos(a1)} ${r1 * Math.sin(a1)} L${110 + r2 * Math.cos(a1)} ${r2 * Math.sin(a1)} L${110 + r2 * Math.cos(a2)} ${r2 * Math.sin(a2)} L${110 + r1 * Math.cos(a2)} ${r1 * Math.sin(a2)} Z" fill="${f('r')}" stroke-width="7"/>`;
    }
    return G(tr, `<defs><clipPath id="${id}"><path d="${sh}"/></clipPath></defs>` + P(sh) + `<g clip-path="url(#${id})">${st}</g>` + L(sh, LW));
  }

  const PAGES = [];
  const page = (key, title, fn) => PAGES.push({ key, title, fn });
  const bulb = (x, y, ang, fill) => G(`translate(${x} ${y}) rotate(${ang})`, R(-20, 0, 40, 38, 7, 'gr') + L('M-20 13 L20 13 M-20 25 L20 25', 6) + P('M0 36 C-48 62 -50 128 0 150 C50 128 48 62 0 36 Z', fill) + L('M-14 70 C-22 90 -20 108 -10 122', 7));

  page('lights', 'Christmas Lights', () => {
    let s = acc([['s', 500, 150, 60], ['f', 150, 150, 50], ['f', 850, 150, 50], ['k', 140, 545, 30], ['k', 860, 545, 30], ['k', 150, 880, 26], ['k', 850, 880, 26]]);
    const fills = ['r', 'g', 'y', 'b', 'o', 'pu'];
    [[300, 70], [640, 70], [980, 60]].forEach(([y0, amp], row) => {
      const pts = [];
      for (let x = -20; x <= 1020; x += 10) pts.push([x, y0 + amp * Math.sin((x / 1000) * Math.PI * 2 + row)]);
      s += L('M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L'), 10);
      for (let i = 0; i < 6; i++) {
        const x = 95 + i * 162 + (row % 2) * 60, y = y0 + amp * Math.sin((x / 1000) * Math.PI * 2 + row);
        const slope = amp * Math.cos((x / 1000) * Math.PI * 2 + row) * (Math.PI * 2 / 1000);
        if (x > 960) continue;
        s += bulb(x, y - 4, (i % 2 ? 8 : -8) + Math.atan(slope) * 30, fills[(i + row * 2) % 6]);
      }
    });
    return s;
  });

  page('owl', 'Winter Owl', () => {
    let s = C(820, 190, 95, 'y') + C(860, 160, 80, 'sn', 'stroke="none"') + acc([['f', 150, 170, 56], ['f', 470, 120, 40], ['s', 650, 260, 28], ['k', 120, 620, 32], ['k', 900, 600, 32], ['f', 880, 860, 40], ['f', 120, 880, 40]]);
    s += tube(['M-30 1060 C250 1020 700 1080 1030 1010', 'M760 1040 C820 1100 860 1150 900 1170'], 46, 'br');
    s += P('M120 1035 C160 1005 230 1005 280 1028 C230 1040 170 1045 120 1035 Z', 'sn') + P('M650 1040 C700 1012 780 1010 830 1025 C780 1040 700 1046 650 1040 Z', 'sn');
    s += G('translate(270 720) rotate(18)', E(0, 0, 90, 200, 'br')) + G('translate(730 720) rotate(-18)', E(0, 0, 90, 200, 'br'));
    s += P('M500 330 C720 330 770 520 760 720 C750 920 650 1040 500 1040 C350 1040 250 920 240 720 C230 520 280 330 500 330 Z', 'lbr');
    s += P('M500 640 C620 640 660 760 650 860 C640 960 580 1010 500 1010 C420 1010 360 960 350 860 C340 760 380 640 500 640 Z', 'cr');
    s += L('M430 760 Q450 780 470 760 M530 760 Q550 780 570 760 M400 840 Q420 860 440 840 M480 840 Q500 860 520 840 M560 840 Q580 860 600 840 M440 920 Q460 940 480 920 M520 920 Q540 940 560 920', 7);
    s += C(405, 520, 92, 'w') + C(595, 520, 92, 'w') + C(405, 520, 50, 'y', 'stroke-width="8"') + C(595, 520, 50, 'y', 'stroke-width="8"') + eye(405, 522, 26) + eye(595, 522, 26);
    s += P('M470 600 L530 600 L500 660 Z', 'o');
    s += P('M300 410 C300 210 700 210 700 410 C620 380 380 380 300 410 Z', 'r') + R(282, 380, 436, 64, 32, 'w') + C(500, 205, 52, 'w');
    s += L('M360 330 L380 385 M440 300 L448 385 M560 300 L552 385 M640 330 L620 385', 7);
    s += P('M380 1040 L390 1075 M420 1040 L420 1078 M580 1040 L580 1078 M620 1040 L610 1075', 'none');
    s += E(410, 1050, 50, 22, 'o') + E(590, 1050, 50, 22, 'o');
    return s;
  });

  page('bunny', 'Cozy Bunny', () => {
    let s = acc([['f', 150, 170, 56], ['f', 860, 170, 56], ['h', 150, 560, 36], ['h', 860, 560, 36], ['d', 120, 820, 14], ['d', 900, 800, 14], ['k', 150, 1000, 30], ['k', 880, 1080, 26]]);
    s += ground(1150, 26);
    s += G('translate(405 260) rotate(-12)', E(0, 0, 70, 200, 'w') + E(0, 20, 34, 150, 'p', 'stroke-width="8"'));
    s += G('translate(595 260) rotate(12)', E(0, 0, 70, 200, 'w') + E(0, 20, 34, 150, 'p', 'stroke-width="8"'));
    s += C(770, 940, 60, 'w');
    s += E(500, 870, 230, 250, 'w');
    s += E(500, 900, 130, 170, 'cr', 'stroke-width="8"');
    s += E(380, 1110, 90, 45, 'w') + E(620, 1110, 90, 45, 'w');
    s += C(500, 530, 190, 'w');
    s += eye(430, 510, 24) + eye(570, 510, 24);
    s += P('M478 568 L522 568 L500 594 Z', 'p') + L('M500 594 L500 618 M500 618 Q470 640 450 618 M500 618 Q530 640 550 618', 8);
    s += L('M420 590 L320 570 M420 605 L325 615 M580 590 L680 570 M580 605 L675 615', 6);
    s += C(395, 590, 28, 'p', 'stroke-width="7"') + C(605, 590, 28, 'p', 'stroke-width="7"');
    s += R(330, 690, 340, 70, 35, 'g') + P('M560 740 L640 740 L660 950 L580 955 Z', 'g') + L('M590 900 L655 898 M592 860 L652 858', 7);
    s += gift(380, 860, 240, 190, 'r', 'y') + bow(500, 862, 0.7, 'y');
    s += E(370, 900, 70, 50, 'w') + E(630, 900, 70, 50, 'w');
    return s;
  });

  page('sled', 'Sled Full of Presents', () => {
    let s = C(820, 180, 80, 'y') + acc([['f', 160, 160, 56], ['f', 480, 120, 40], ['k', 640, 260, 30], ['f', 140, 520, 40], ['k', 870, 480, 30]]);
    const tree = (x, y, sc) => G(`translate(${x} ${y}) scale(${sc})`, R(-22, 0, 44, 50, 4, 'br') + P('M0 -320 L120 -150 L60 -150 L150 0 L-150 0 L-60 -150 L-120 -150 Z', 'dg'), LW / sc);
    s += P('M-20 760 C250 640 600 700 1020 560 L1020 1320 L-20 1320 Z', 'sn');
    s += tree(830, 640, 0.8) + tree(690, 690, 0.6) + tree(150, 760, 0.55);
    s += P('M-20 1000 C300 900 650 980 1020 860 L1020 1320 L-20 1320 Z', 'w');
    const sled = gift(330, 640, 200, 180, 'r', 'y') + bow(430, 644, 0.6, 'y') + gift(540, 690, 170, 130, 'g', 'r') + bow(625, 694, 0.5, 'r') + gift(420, 480, 150, 150, 'b', 'w') + bow(495, 484, 0.5, 'w')
      + tube(['M250 900 L790 900 C860 900 880 840 840 800', 'M330 860 L330 900 M480 860 L480 900 M630 860 L630 900 M760 860 L760 900'], 22, 'gr')
      + R(270, 820, 520, 52, 14, 'o') + L('M330 846 L720 846', 6) + tube(['M270 846 C200 846 170 790 120 760'], 12, 'r');
    s += G('rotate(-8 500 880)', sled);
    s += P('M120 1180 C200 1150 300 1160 360 1185 M620 1200 C700 1170 820 1170 900 1195', 'none');
    return s;
  });

  page('jar', 'Candy Jar', () => {
    let s = acc([['f', 150, 170, 56], ['f', 860, 180, 56], ['s', 140, 640, 36], ['s', 870, 660, 36], ['k', 150, 1100, 34], ['k', 860, 1110, 34]]);
    const jar = 'M370 380 L630 380 L630 450 C780 470 820 560 820 700 L820 1060 C820 1130 770 1170 700 1170 L300 1170 C230 1170 180 1130 180 1060 L180 700 C180 560 220 470 370 450 Z';
    s += `<defs><clipPath id="jarc"><path d="${jar}"/></clipPath></defs>` + P(jar, 'lb');
    let c = '';
    const wrapped = (x, y, r, fl, a) => G(`translate(${x} ${y}) rotate(${a})`, P(`M${-r} 0 L${-r * 1.9} ${-r * 0.7} L${-r * 1.9} ${r * 0.7} Z`, fl) + P(`M${r} 0 L${r * 1.9} ${-r * 0.7} L${r * 1.9} ${r * 0.7} Z`, fl) + C(0, 0, r, fl) + L(`M${-r * 0.5} ${-r * 0.5} L${r * 0.5} ${r * 0.5}`, 6));
    const mint = (x, y, r) => C(x, y, r, 'w') + [0, 60, 120, 180, 240, 300].map((a) => { const t = a * Math.PI / 180, t2 = (a + 30) * Math.PI / 180; return P(`M${x} ${y} L${x + r * Math.cos(t)} ${y + r * Math.sin(t)} A${r} ${r} 0 0 1 ${x + r * Math.cos(t2)} ${y + r * Math.sin(t2)} Z`, 'r', 'stroke-width="6"'); }).join('') + C(x, y, r * 0.22, 'w', 'stroke-width="6"');
    const items = [[300, 1080, 'm', 72], [470, 1100, 'w', 56, 'y', 15], [640, 1080, 'm', 72], [760, 1000, 'w', 46, 'g', -30], [240, 960, 'w', 48, 'pu', 25], [400, 960, 'm', 66], [560, 960, 'w', 56, 'o', -10], [700, 870, 'm', 62], [300, 830, 'w', 52, 'b', 40], [470, 820, 'm', 70], [620, 760, 'w', 52, 'r', 20], [260, 700, 'm', 58], [420, 680, 'w', 50, 'g', -20], [760, 720, 'm', 54], [550, 620, 'm', 60], [350, 580, 'w', 44, 'y', 30], [690, 590, 'w', 44, 'pu', -25]];
    for (const it of items) c += it[2] === 'm' ? mint(it[0], it[1], it[3]) : wrapped(it[0], it[1], it[3], it[4], it[5]);
    s += `<g clip-path="url(#jarc)">${c}</g>` + `<path d="${jar}" fill="none"/>`;
    s += L('M230 640 C220 720 220 820 225 900', 10) + L('M235 950 L235 990', 10);
    s += R(340, 290, 320, 100, 22, 'r') + L('M380 300 L380 380 M440 300 L440 380 M500 300 L500 380 M560 300 L560 380 M620 300 L620 380', 6);
    s += E(500, 790, 0, 0, 'w');
    s += C(500, 225, 40, 'y') + hollyBunch(500, 280, 0.5, 0);
    return s;
  });

  page('ornaments', 'Ornament Trio', () => {
    let s = acc([['f', 140, 1120, 46], ['f', 860, 1140, 46], ['k', 500, 1180, 32]]);
    s += tube(['M-20 120 C300 170 700 170 1020 120'], 26, 'g');
    const orn = (id, cx, cy, r, fl, pat) => {
      let p = '';
      if (pat === 'bands') p = R(cx - r, cy - 40, 2 * r, 80, 0, 'y', 'stroke-width="8"') + L(`M${cx - r} ${cy - 120} Q${cx} ${cy - 90} ${cx + r} ${cy - 120} M${cx - r} ${cy + 120} Q${cx} ${cy + 150} ${cx + r} ${cy + 120}`, 8) + [-1, 0, 1].map((k) => star(cx + k * 85, cy, 26, 'w', 'stroke-width="6"')).join('');
      if (pat === 'dots') p = [[-80, -90], [40, -110], [110, -20], [-110, 10], [0, 0], [-50, 100], [70, 90], [130, 160], [-150, 130]].map(([dx, dy]) => C(cx + dx, cy + dy, 26, 'w', 'stroke-width="7"')).join('');
      if (pat === 'zig') { let d = ''; for (const yy of [-60, 50]) { d += `M${cx - r} ${cy + yy}`; for (let x = -r; x <= r; x += 40) d += ` L${cx + x} ${cy + yy + ((x + r) / 40 % 2 ? -32 : 32)}`; } p = L(d, 9) + heart(cx, cy + 130, 30, 'w', 'stroke-width="7"') + heart(cx, cy - 150, 26, 'w', 'stroke-width="7"'); }
      return `<defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>` + C(cx, cy, r, fl) + `<g clip-path="url(#${id})">${p}</g>` + C(cx, cy, r, 'none') + R(cx - 45, cy - r - 50, 90, 60, 10, 'gr') + L(`M${cx - 20} ${cy - r - 35} L${cx + 20} ${cy - r - 35}`, 6) + L(`M${cx} ${cy - r - 50} C${cx - 30} ${cy - r - 80} ${cx + 30} ${cy - r - 90} ${cx} ${cy - r - 110}`, 8);
    };
    s += L('M210 150 L210 340 M500 160 L500 560 M790 150 L790 300', 8);
    s += orn('o1', 210, 540, 160, 'r', 'dots') + orn('o3', 790, 500, 160, 'b', 'zig') + orn('o2', 500, 790, 190, 'g', 'bands');
    s += bow(210, 150, 0.6, 'r') + bow(500, 162, 0.6, 'y') + bow(790, 150, 0.6, 'r');
    return s;
  });

  // activity page: an undecorated tree for the child to decorate
  page('decorate', 'Decorate Your Tree', () => {
    let s = '';
    s += ground(1160, 20);
    s += R(440, 1000, 120, 140, 8, 'br');
    s += P('M500 560 L860 1030 Q500 1090 140 1030 Z', 'g');
    s += P('M500 380 L760 760 Q500 810 240 760 Z', 'g');
    s += P('M500 220 L650 520 Q500 560 350 520 Z', 'g');
    s += star(500, 190, 90, 'y');
    s += R(130, 1060, 200, 150, 10, 'w', 'stroke-dasharray="26 18"') + R(670, 1080, 200, 130, 10, 'w', 'stroke-dasharray="26 18"');
    return s;
  });

  window.CD = { PAGES, COLOR, PAL, helpers: { P, L, C, E, R, G, star, flake, heart, tube, gift, bow, hollyBunch, eye, dot } };
})();
