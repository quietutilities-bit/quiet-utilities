#!/usr/bin/env bash
# Rebuild the Christmas Photo Card Templates kit.
# The cards themselves live in Canva (owner's account, folder "Pantry Printable Co - Photo Cards").
# This builds the buyer's START HERE PDF (template links from src/links.js) and the listing images,
# then copies everything into downloads/holiday/christmas-photo-cards/.
# Card previews (src/previews/cardN.png) are Canva thumbnails; cardN-3x.png = Lanczos x3 of them.
set -euo pipefail
cd "$(dirname "$0")/.."
node _brand/render.mjs build christmas-photo-cards
node _brand/render.mjs check christmas-photo-cards
rm -rf christmas-photo-cards/out/_check
K=../downloads/holiday/christmas-photo-cards
mkdir -p "$K/1-files" "$K/2-listing-images" "$K/4-pins"
rm -f "$K"/1-files/* "$K"/2-listing-images/* "$K"/4-pins/*
cp christmas-photo-cards/out/*.pdf "$K/1-files/"
cp christmas-photo-cards/out/listing/*.jpg "$K/2-listing-images/"
cp christmas-photo-cards/out/pins/*.jpg "$K/4-pins/"
if grep -q "1: ''\|2: ''\|3: ''" christmas-photo-cards/src/links.js; then
  echo "!! template links missing in src/links.js: the START HERE PDF shows red warnings. Do not upload yet."
fi
