"""Builds Canva edit-design operation lists for the 3 photo-card templates.
Run: python3 build_ops.py <design> <page_id>  -> JSON ops (stdout)."""
import json, math, sys
from shapes import SHAPES

PINE, BERRY, GOLD, CREAM, INKSOFT, FROST = '#2F5D50', '#B23A3A', '#D9A441', '#FBF6EE', '#6E5F57', '#EAF1EE'
PLACEHOLDER = 'MAHZqynS--o'   # neutral grey photo placeholder from Canva's own layout

def snowflake_path():
    """Filled six-arm snowflake built from thin bars (closed polygons only)."""
    parts = []
    def bar(x1, y1, x2, y2, t):
        dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy); nx, ny = -dy / L * t / 2, dx / L * t / 2
        pts = [(x1 + nx, y1 + ny), (x2 + nx, y2 + ny), (x2 - nx, y2 - ny), (x1 - nx, y1 - ny)]
        area = sum(pts[i][0] * pts[(i + 1) % 4][1] - pts[(i + 1) % 4][0] * pts[i][1] for i in range(4))
        if area < 0: pts.reverse()   # same winding everywhere so overlaps stay filled (nonzero rule)
        parts.append('M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + ' Z')
    c = 50
    for k in range(6):
        a = math.radians(k * 60 - 90); ex, ey = c + 46 * math.cos(a), c + 46 * math.sin(a)
        bar(c, c, ex, ey, 6)
        bx, by = c + 28 * math.cos(a), c + 28 * math.sin(a)
        for s in (-1, 1):
            b = a + s * math.radians(45)
            bar(bx, by, bx + 14 * math.cos(b), by + 14 * math.sin(b), 5)
    return ' '.join(parts)
SHAPES['flakefill'] = (snowflake_path(), 100, 100)

def shape(page, name, cx, cy, w, h, color=None, rot=0, stroke=None, sw=None, opacity=None, rounding=None):
    p, vw, vh = SHAPES[name]
    op = {"type": "insert_shape", "page_id": page, "left": round(cx - w / 2, 1), "top": round(cy - h / 2, 1),
          "width": w, "height": h, "path": p, "view_box_width": vw, "view_box_height": vh}
    if color: op["color"] = color
    if rot: op["rotation"] = rot
    if stroke: op["stroke_color"] = stroke; op["stroke_weight"] = sw or 2
    if opacity is not None: op["opacity"] = opacity
    if rounding: op["corner_rounding"] = rounding
    return op

def box(page, left, top, w, h, **k):
    return shape(page, 'rect', left + w / 2, top + h / 2, w, h, **k)

def holly(page, px, py, angles=(215, 270, 325), L=72, H=32, leaf=PINE, berry=BERRY):
    ops = []
    for a in angles:
        r = math.radians(a)
        ops.append(shape(page, 'leaf', px + L / 2 * math.cos(r), py + L / 2 * math.sin(r), L, H, color=leaf, rot=((a + 180) % 360) - 180))
    for dx, dy in ((-8, 3), (8, 3), (0, -8)):
        ops.append(shape(page, 'berry', px + dx, py + dy, 15, 15, color=berry))
    return ops

def photo(page, left, top, w, h):
    return {"type": "insert_fill", "page_id": page, "asset_type": "image", "asset_id": PLACEHOLDER,
            "alt_text": "Your photo here", "left": left, "top": top, "width": w, "height": h}

def label(page, cx, cy):
    """'Drag your photo here' pill (3 elements; grouped in a 2nd call)."""
    return [box(page, cx - 105, cy - 40, 210, 80, color=CREAM, opacity=0.92, rounding=14),
            shape(page, 'camera', cx, cy - 14, 30, 30, color=INKSOFT),
            {"type": "add_text", "page_id": page, "text": "Drag your photo here", "left": cx - 100, "top": cy + 6, "width": 200}]

def merry(page):
    ops = [photo(page, 30, 30, 420, 408),
           box(page, 20, 20, 440, 428, stroke=PINE, sw=2.5),
           box(page, 13, 13, 454, 442, stroke=GOLD, sw=1.2)]
    ops += holly(page, 70, 640) + holly(page, 410, 640)
    for x, y, s in ((34, 486, 24), (446, 486, 24), (18, 530, 12), (462, 530, 12), (178, 611, 12), (302, 611, 12)):
        ops.append(shape(page, 'sparkle', x, y, s, s, color=GOLD))
    ops += label(page, 240, 234)
    return ops

if __name__ == '__main__':
    fn = {'merry': merry}[sys.argv[1]]
    print(json.dumps(fn(sys.argv[2])))
