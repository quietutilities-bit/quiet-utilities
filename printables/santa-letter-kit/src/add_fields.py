#!/usr/bin/env python3
"""Turn the flat Chromium PDFs into fillable PDFs (AcroForm text fields).

  node _brand/render.mjs build santa-letter-kit   # flat PDFs in out/
  node santa-letter-kit/src/fields.mjs             # field boxes -> src/fields.json
  python3 santa-letter-kit/src/add_fields.py       # adds fields to out/*.pdf in place
  python3 santa-letter-kit/src/add_fields.py --sample DIR   # also writes filled-in sample PDFs (listing previews)

Fields use the standard Times-Italic font (every PDF reader has it) and carry their own
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
FONT, FONT_RL = '/TiIt', 'Times-Italic'
INK, BERRY, PINE = (0.231, 0.184, 0.165), (0.698, 0.227, 0.227), (0.184, 0.365, 0.314)

# per-field style: size, alignment (0 left, 1 center), color
STYLE = {
    'a_name': (18, 0, BERRY), 'b_name': (18, 0, BERRY), 'c_name': (28, 1, BERRY), 'c_elf': (19, 1, BERRY),
    'c_year': (14, 1, INK), 'a_age': (14, 1, INK), 'c_reason': (14, 1, INK), 'e_to': (19, 0, INK),
    'n1_name': (15, 0, BERRY), 'n2_name': (15, 0, PINE), 'b_body': (15, 0, INK), 'n1_msg': (14.5, 0, INK), 'n2_msg': (14.5, 0, INK),
}
SAMPLE = {
    'a_date': 'December 24, 2026', 'a_name': 'Emma', 'a_age': '6',
    'a_deed': 'shared your favorite blanket with your little brother when he was sick, and helped Grandpa rake all the leaves.',
    'a_learned': 'ride your bike', 'a_remember': 'brush your teeth', 'a_town': 'Maple Street',
    'a_ps': 'Dasher says thank you for the carrots last year!',
    'b_date': 'December 24, 2026', 'b_name': 'Emma', 'b_ps': 'Mrs. Claus says your drawing is on our fridge!',
    'c_name': 'Emma Johnson', 'c_reason': 'kindness, sharing and the best hugs at the North Pole', 'c_date': 'December 24, 2026',
    'e_to': 'Emma Johnson', 'e_line1': '12 Maple Street', 'e_line2': 'Springfield',
    't_by1': 'Emma', 't_by2': 'Emma', 't_by3': 'Leo', 't_by4': 'Leo', 't_by5': 'Grandma',
    'n1_name': 'Emma', 'n2_name': 'Emma',
}


def style(f):
    if f['name'] in STYLE:
        return STYLE[f['name']]
    if f['name'].startswith('t_by'):
        return (11, 0, INK)
    if 'box' in f['cls']:
        return (14, 0, INK)
    return (13.5, 0, INK)


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
            pad, lead = 2, fs * (1.5 if f['h'] > 90 else 1.2)  # roomy letter spacing in big boxes
            lines = wrap(value, fs, w - 2 * pad)
            need = len(lines) * lead + pad
            if need > h:
                print(f"  ! {f['name']}: text needs {need:.0f}pt, box is {h:.0f}pt", file=sys.stderr)
            y = h - pad - fs * 0.8
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
                             NameObject('/BaseFont'): NameObject('/Times-Italic'), NameObject('/Encoding'): NameObject('/WinAnsiEncoding')})
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
            NameObject('/TU'): TextStringObject(f['name'].split('_', 1)[1].replace('_', ' ')),
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
    writer.add_metadata({'/Title': 'Letter from Santa Kit', '/Author': 'Pantry Printable Co.'})
    with open(out_path, 'wb') as fh:
        writer.write(fh)
    print(f'  fillable {os.path.basename(out_path)}: {len(fields)} fields')


def main():
    geo = json.load(open(os.path.join(HERE, 'fields.json')))
    sample_dir = sys.argv[sys.argv.index('--sample') + 1] if '--sample' in sys.argv else None
    for size, label in (('letter', 'US-Letter'), ('a4', 'A4')):
        p = os.path.join(OUT, f'Letter-from-Santa-Kit-{label}.pdf')
        g = geo[size]
        defaults = g['defaults']
        if sample_dir:
            os.makedirs(sample_dir, exist_ok=True)
            build(p, g, {**defaults, **SAMPLE}, os.path.join(sample_dir, f'sample-{label}.pdf'))
        build(p, g, defaults, p + '.tmp')
        os.replace(p + '.tmp', p)


if __name__ == '__main__':
    main()
