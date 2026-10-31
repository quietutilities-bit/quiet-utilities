#!/usr/bin/env bash
# Christmas Mega Bundle buyer files, assembled from the finished product files (no new pages except Start Here).
# Etsy allows max 5 files: Start Here PDF + US Letter zip (7 PDFs) + A4 zip (7 PDFs) + the tracker's 2 .xlsx.
# Run from anywhere:  bash printables/christmas-mega-bundle/assemble.sh
set -euo pipefail
cd "$(dirname "$0")/.."
B=christmas-mega-bundle
OUT=$B/out/files
rm -rf "$OUT"; mkdir -p "$OUT"
node _brand/render.mjs pdf $B/src/start.html "$OUT/Christmas-Mega-Bundle-START-HERE.pdf" letter
TMP=$(mktemp -d); node _brand/render.mjs pdf $B/src/start.html "$TMP/start-a4.pdf" a4
PRODUCTS="christmas-game-night:Christmas-Family-Game-Night north-pole-escape-room:North-Pole-Escape-Room christmas-countdown:Christmas-Countdown-for-Kids christmas-coloring-book:Bold-Easy-Christmas-Coloring-Book santa-letter-kit:Letter-from-Santa-Kit secret-santa-kit:Secret-Santa-Kit gift-budget-planner:Christmas-Gift-Budget-Planner"
L="$TMP/Christmas-Mega-Bundle-US-Letter"; A="$TMP/Christmas-Mega-Bundle-A4"; mkdir -p "$L" "$A"
cp "$OUT/Christmas-Mega-Bundle-START-HERE.pdf" "$L/00-START-HERE.pdf"; cp "$TMP/start-a4.pdf" "$A/00-START-HERE.pdf"
i=1
for p in $PRODUCTS; do
  slug=${p%%:*}; name=${p##*:}
  cp "$slug/out/$name-US-Letter.pdf" "$L/0$i-$name-US-Letter.pdf"
  cp "$slug/out/$name-A4.pdf" "$A/0$i-$name-A4.pdf"
  i=$((i+1))
done
touch -d '2026-11-01 00:00:00 UTC' "$L" "$A" "$L"/* "$A"/*
(cd "$TMP" && TZ=UTC zip -qX -r Christmas-Mega-Bundle-US-Letter-7-PDFs.zip Christmas-Mega-Bundle-US-Letter && TZ=UTC zip -qX -r Christmas-Mega-Bundle-A4-7-PDFs.zip Christmas-Mega-Bundle-A4)
mv "$TMP"/*.zip "$OUT/"
cp gift-budget-tracker/out/Christmas-Gift-Budget-Tracker.xlsx gift-budget-tracker/out/Christmas-Gift-Budget-Tracker-Example.xlsx "$OUT/"
rm -rf "$TMP"
ls -la "$OUT"
