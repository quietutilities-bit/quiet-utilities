#!/usr/bin/env python3
"""Secret Santa Kit (adapted from santa-letter-kit/src/add_fields.py; Helvetica fields).
Turn the flat Chromium PDFs into fillable PDFs (AcroForm text fields).

  node _brand/render.mjs build secret-santa-kit   # flat PDFs in out/
  node secret-santa-kit/src/fields.mjs             # field boxes -> src/fields.json
  python3 secret-santa-kit/src/add_fields.py       # adds fields to out/*.pdf in place
  python3 secret-santa-kit/src/add_fields.py --sample DIR   # also writes filled-in sample PDFs (listing previews)

Fields use the standard Helvetica font (every PDF reader has it) and carry their own
appearance streams, so pre-filled text shows and prints even in readers that don't redraw fields.
Readers show these appearances and redraw a field from its /DA once it is edited.
"""
import json, os, sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (ArrayObject, BooleanObject, DecodedStreamObject, DictionaryObject, FloatObject,
                           NameObject, NumberObject, TextStringObject)
from reportlab.pdfbase.pdfmetrics import stringWidth

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'out')
NAME = 'Secret-Santa-Kit'
FONT, FONT_RL, BASEFONT = '/Helv', 'Helvetica', '/Helvetica'
LINE_PITCH = 22.1  # .lined boxes in kit.html: a rule every 22.1pt, text sits on it
INK, BERRY, PINE = (0.231, 0.184, 0.165), (0.698, 0.227, 0.227), (0.184, 0.365, 0.314)

# per-field style: size, alignment (0 left, 1 center), color
STYLE = {'r_group': (15, 1, BERRY), 'r_budget': (14, 1, PINE), 'r_wish': (12, 1, PINE), 'r_date': (12, 1, PINE),
         'w_name': (13, 0, BERRY), 'm1_name': (13, 0, BERRY), 'm2_name': (13, 0, PINE)}
SAMPLE = {
    'i1_who': 'The Miller family and friends', 'i1_date': 'Sat, Dec 20', 'i1_time': '6:00 pm', 'i1_where': "Grandma Rose's house, 48 Oak Lane",
    'i1_budget': '$25', 'i1_draw': 'Nov 30', 'i1_rsvp': 'Jenna, 555-0142',
    'i2_who': 'Design team', 'i2_date': 'Fri, Dec 19', 'i2_time': '3:30 pm', 'i2_where': 'Break room, 2nd floor',
    'i2_budget': '$20', 'i2_draw': 'Dec 5', 'i2_rsvp': 'Sam by Dec 3',
    'r_group': 'The Miller Family', 'r_budget': '$25', 'r_wish': 'December 6', 'r_date': 'December 20', 'r_org': 'Jenna',
    'w_name': 'Jenna Miller', 'w_group': 'Miller family', 'w_color': 'forest green', 'w_snack': 'salted caramel popcorn',
    'w_drink': 'peppermint tea', 'w_sweet': 'salty, always', 'w_hobby': 'baking, hiking, puzzles', 'w_scent': 'pine and cedar',
    'w_store': 'the local bookshop', 'w_team': 'cozy mysteries', 'w_cup': 'tea', 'w_collect': 'enamel pins',
    'w_shirt': 'M', 'w_socks': '7-9', 'w_gloves': 'S', 'w_size': 'hat: one size',
    'w_wish1': 'A 1000-piece puzzle (mountains or maps)', 'w_wish2': 'Cozy wool socks', 'w_wish3': 'Fancy baking sprinkles',
    'w_no': 'Nuts (allergy)\nScented candles\nMugs, I have plenty!',
    'w_joy': 'Handwritten notes\nDark chocolate\nA good mystery novel',
    'm1_name': 'Leo', 'm1_color': 'blue', 'm1_treat': 'gummy bears', 'm1_hobby': 'drawing, soccer', 'm1_drink': 'hot cocoa',
    'm1_wish1': 'Sketchbook', 'm1_wish2': 'Glow-in-the-dark stars', 'm1_wish3': 'Card game', 'm1_size': 'kids M',
    'm1_no': 'Nothing with peanuts, please',
    's1': 'Jenna', 's2': 'Leo', 's3': 'Grandma Rose', 's4': 'Uncle Dan', 's5': 'Priya', 's6': 'Sam',
    's7': 'Maya', 's8': 'Grandpa Joe', 's9': 'Aunt Lisa', 's10': 'Ben', 's11': 'Olivia', 's12': 'Marcus',
    'k_group': 'Miller family', 'k_budget': '$25', 'k_date': 'Dec 20',
    'k_g1': 'Jenna', 'k_r1': 'Uncle Dan', 'k_n1': 'loves puzzles', 'k_g2': 'Leo', 'k_r2': 'Priya', 'k_g3': 'Grandma Rose', 'k_r3': 'Leo',
    'k_n3': 'no peanuts', 'k_g4': 'Uncle Dan', 'k_r4': 'Sam', 'k_g5': 'Priya', 'k_r5': 'Jenna', 'k_n5': 'nut allergy!',
    'k_g6': 'Sam', 'k_r6': 'Grandma Rose',
    'g_to1': 'Jenna', 'g_to2': 'Leo', 'g_to3': 'Grandma Rose', 'g_to4': 'Uncle Dan', 'g_to5': 'Priya', 'g_to6': 'Sam',
}


def tooltip(n):
    if n.startswith('s') and n[1:].isdigit():
        return f'name slip {n[1:]}'
    return n.split('_', 1)[-1].replace('_', ' ')


def style(f):
    if f['name'] in STYLE:
        return STYLE[f['name']]
    n = f['name']
    if n.startswith('s') and n[1:].isdigit():
        return (13, 1, BERRY)
    if n.startswith('g_to'):
        return (11, 0, INK)
    if n.startswith('k_') and 'cell' in f['cls']:
        return (10.5, 0, INK)
    if 'box' in f['cls']:
        return (12, 0, INK)
    return (11.5, 0, INK)


def esc(s):
    b = s.encode('cp1252', errors='replace')
    return b.replace(b'\\', b'\\\\').replace(b'(', b'\\(').replace(b')', b'\\)').decode('latin-1')


def wrap(text, fs, width):
    lines = []
    for para in text.split('\n'):
        words, cur = para.split(' '), ''
        if para == '':
            lines.append('')
            continue
        for w in words:
            t = (cur + ' ' + w).strip()
            if stringWidth(t, FONT_RL, fs) <= width or not cur:
                cur = t
            else:
                lines.append(cur)
                cur = w
        lines.append(cur)
    return lines


def appearance(f, value, fs, q, col, multiline):
    w, h = f['w'], f['h']
    ops = ['/Tx BMC', 'q', f'1 1 {w - 2:.2f} {h - 2:.2f} re W n', 'BT', f'{FONT} {fs} Tf', '%.3f %.3f %.3f rg' % col]
    if value:
        if multiline:
            pad, lead = 2, LINE_PITCH if 'lined' in f.get('cls', '') else fs * 1.25  # roomy letter spacing in big boxes
            lines = wrap(value, fs, w - 2 * pad)
            need = len(lines) * lead + pad
            if need > h:
                print(f"  ! {f['name']}: text needs {need:.0f}pt, box is {h:.0f}pt", file=sys.stderr)
            y = h - 18 if 'lined' in f.get('cls', '') else h - pad - fs * 0.8
            for ln in lines:
                x = pad if q == 0 else (w - stringWidth(ln, FONT_RL, fs)) / 2
                ops.append(f'1 0 0 1 {x:.2f} {y:.2f} Tm ({esc(ln)}) Tj')
                y -= lead
        else:
            tw = stringWidth(value, FONT_RL, fs)
            if tw > w - 4:
                print(f"  ! {f['name']}: '{value}' too wide ({tw:.0f} > {w:.0f})", file=sys.stderr)
            x = 3 if q == 0 else (w - tw) / 2
            y = 4.5 if h < 24 else (h - fs) / 2 + 2
            ops.append(f'1 0 0 1 {x:.2f} {y:.2f} Tm ({esc(value)}) Tj')
    ops += ['ET', 'Q', 'EMC']
    s = DecodedStreamObject()
    s.set_data('\n'.join(ops).encode('latin-1'))
    s.update({NameObject('/Type'): NameObject('/XObject'), NameObject('/Subtype'): NameObject('/Form'),
              NameObject('/BBox'): ArrayObject([FloatObject(0), FloatObject(0), FloatObject(w), FloatObject(h)])})
    return s


def build(pdf_path, geo, values, out_path):
    reader = PdfReader(pdf_path)
    if '/AcroForm' in reader.trailer['/Root']:
        sys.exit(f'{pdf_path} already has form fields: rebuild the flat PDF first (render.mjs build)')
    assert len(reader.pages) == geo['pages'], (pdf_path, len(reader.pages), geo['pages'])
    writer = PdfWriter(clone_from=reader)
    font = DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'),
                             NameObject('/BaseFont'): NameObject(BASEFONT), NameObject('/Encoding'): NameObject('/WinAnsiEncoding')})
    font_ref = writer._add_object(font)
    dr = DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject(FONT): font_ref})})
    fields = ArrayObject()
    for f in geo['fields']:
        page = writer.pages[f['page']]
        ph = float(page.mediabox.height)
        scale = ph / geo['pageH']  # Chromium may round the page box slightly
        g = dict(f, x=f['x'] * scale, top=f['top'] * scale, w=f['w'] * scale, h=f['h'] * scale)
        fs, q, col = style(f)
        multiline = 'box' in f['cls']
        val = values.get(f['name'], '')
        ap = appearance(g, val, fs, q, col, multiline)
        ap.update({NameObject('/Resources'): dr})
        x0, y1 = g['x'], ph - g['top']
        widget = DictionaryObject({
            NameObject('/Type'): NameObject('/Annot'), NameObject('/Subtype'): NameObject('/Widget'),
            NameObject('/FT'): NameObject('/Tx'), NameObject('/T'): TextStringObject(f['name']),
            NameObject('/TU'): TextStringObject(tooltip(f['name'])),
            NameObject('/Rect'): ArrayObject([FloatObject(round(v, 2)) for v in (x0, y1 - g['h'], x0 + g['w'], y1)]),
            NameObject('/F'): NumberObject(4),
            NameObject('/Ff'): NumberObject(4096 if multiline else 0),
            NameObject('/Q'): NumberObject(q),
            NameObject('/DA'): TextStringObject(f'{FONT} {fs} Tf %.3f %.3f %.3f rg' % col),
            NameObject('/V'): TextStringObject(val), NameObject('/DV'): TextStringObject(val),
            NameObject('/MK'): DictionaryObject(),
            NameObject('/AP'): DictionaryObject({NameObject('/N'): writer._add_object(ap)}),
            NameObject('/P'): page.indirect_reference,
        })
        ref = writer._add_object(widget)
        if '/Annots' not in page:
            page[NameObject('/Annots')] = ArrayObject()
        page['/Annots'].append(ref)
        fields.append(ref)
    writer._root_object[NameObject('/AcroForm')] = writer._add_object(DictionaryObject({
        NameObject('/Fields'): fields, NameObject('/DR'): dr,
        NameObject('/DA'): TextStringObject(f'{FONT} 12 Tf 0 g'), NameObject('/NeedAppearances'): BooleanObject(False)}))
    writer.add_metadata({'/Title': 'Secret Santa Kit', '/Author': 'Pantry Printable Co.'})
    with open(out_path, 'wb') as fh:
        writer.write(fh)
    print(f'  fillable {os.path.basename(out_path)}: {len(fields)} fields')


def main():
    geo = json.load(open(os.path.join(HERE, 'fields.json')))
    sample_dir = sys.argv[sys.argv.index('--sample') + 1] if '--sample' in sys.argv else None
    for size, label in (('letter', 'US-Letter'), ('a4', 'A4')):
        p = os.path.join(OUT, f'{NAME}-{label}.pdf')
        g = geo[size]
        defaults = g.get('defaults') or {}
        if sample_dir:
            os.makedirs(sample_dir, exist_ok=True)
            build(p, g, {**defaults, **SAMPLE}, os.path.join(sample_dir, f'sample-{label}.pdf'))
        build(p, g, defaults, p + '.tmp')
        os.replace(p + '.tmp', p)


if __name__ == '__main__':
    main()
