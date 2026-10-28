#!/usr/bin/env bash
# Rebuild the Letter from Santa Kit: flat PDFs + images, then add the fillable fields.
# Listing previews (src/listing/img/pNN.png) come from the filled-in sample PDF.
set -euo pipefail
cd "$(dirname "$0")/.."
node _brand/render.mjs build santa-letter-kit
node santa-letter-kit/src/fields.mjs
SAMPLE=$(mktemp -d)
python3 santa-letter-kit/src/add_fields.py --sample "$SAMPLE"
for i in 1 2 3 4 5 6 7 8; do pdftoppm -r 110 -png -singlefile -f $i -l $i "$SAMPLE/sample-US-Letter.pdf" santa-letter-kit/src/listing/img/p0$i; done
echo "sample PDFs: $SAMPLE (if previews changed, run build.sh again so the listing images use them)"
