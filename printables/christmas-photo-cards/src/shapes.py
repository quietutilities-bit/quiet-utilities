"""Hand-drawn Christmas shapes for the Canva photo-card templates (original, no AI).
Paths use only M/L/H/V/C/S/A/Z (Canva insert_shape limits). Each entry: (path, vbw, vbh)."""
import json, math

def circle():
    return ("M0 50 A50 50 0 1 0 100 50 A50 50 0 1 0 0 50 Z", 100, 100)

SHAPES = {
  # 4-point sparkle
  "sparkle": ("M50 0 C53 33 67 47 100 50 C67 53 53 67 50 100 C47 67 33 53 0 50 C33 47 47 33 50 0 Z", 100, 100),
  # scalloped holly leaf, tip-to-tip horizontal
  "leaf": ("M0 22 C7 12 13 5 21 9 C23 2 31 0 37 6 C43 0 51 -1 56 5 C62 -1 70 1 74 8 C82 3 92 10 100 22 "
           "C92 34 82 41 74 36 C70 43 62 45 56 39 C51 45 43 44 37 38 C31 44 23 42 21 35 C13 39 7 32 0 22 Z", 100, 44),
  "vein": ("M6 22 C30 20 70 20 94 22", 100, 44),
  "berry": circle(),
  # six-arm snowflake (stroke only)
  "flake": ("M50 4 L50 96 M10 27 L90 73 M10 73 L90 27 "
            "M50 20 L40 10 M50 20 L60 10 M50 80 L40 90 M50 80 L60 90 "
            "M24 35 L12 40 M24 35 L22 22 M76 65 L88 60 M76 65 L78 78 "
            "M24 65 L12 60 M24 65 L22 78 M76 35 L88 40 M76 35 L78 22", 100, 100),
  "rect": ("M0 0 L100 0 L100 100 L0 100 Z", 100, 100),
  "line": ("M0 1 L100 1", 100, 2),
  # tiered tree
  "tree": ("M50 4 L74 40 L63 40 L84 70 L71 70 L94 104 L6 104 L29 70 L16 70 L37 40 L26 40 Z", 100, 110),
  "trunk": ("M43 0 L57 0 L57 14 L43 14 Z", 100, 14),
  "star5": ("M50 0 L61 35 L98 35 L68 57 L79 92 L50 70 L21 92 L32 57 L2 35 L39 35 Z", 100, 95),
  # little camera icon for the photo label
  "camera": ("M10 30 L30 30 L38 18 L62 18 L70 30 L90 30 C95 30 98 33 98 38 L98 80 C98 85 95 88 90 88 L10 88 C5 88 2 85 2 80 "
             "L2 38 C2 33 5 30 10 30 Z M50 40 A20 20 0 1 0 50 80 A20 20 0 1 0 50 40 Z", 100, 100),
  # garland swag (stroke)
  "swag": ("M0 4 C30 34 70 34 100 4", 100, 30),
}
