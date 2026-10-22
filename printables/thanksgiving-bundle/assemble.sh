#!/usr/bin/env bash
# Thanksgiving Bundle buyer files, assembled from the finished product PDFs (no new pages).
# Etsy allows max 5 files: 3 US Letter PDFs (open on any phone) + 1 zip with the 3 A4 PDFs.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=thanksgiving-bundle/out/files
rm -rf "$OUT"; mkdir -p "$OUT"
PRODUCTS="thanksgiving-game-pack:Thanksgiving-Family-Game-Pack turkey-escape-room:Turkey-Trouble-Escape-Room thanksgiving-host-planner:Thanksgiving-Host-Planner"
TMP=$(mktemp -d); mkdir -p "$TMP/Thanksgiving-Bundle-A4"
for p in $PRODUCTS; do
  slug=${p%%:*}; name=${p##*:}
  cp "$slug/out/$name-US-Letter.pdf" "$OUT/"
  cp "$slug/out/$name-A4.pdf" "$TMP/Thanksgiving-Bundle-A4/"
done
(cd "$TMP" && TZ=UTC zip -qX -r Thanksgiving-Bundle-A4-all-3-PDFs.zip Thanksgiving-Bundle-A4)
mv "$TMP/Thanksgiving-Bundle-A4-all-3-PDFs.zip" "$OUT/"
rm -rf "$TMP"
ls -la "$OUT"
