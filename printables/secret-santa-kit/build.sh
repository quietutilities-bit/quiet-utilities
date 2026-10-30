#!/usr/bin/env bash
# Rebuild the Secret Santa Kit: flat PDFs + images, then add the fillable fields.
# Listing previews (src/listing/img/pNN.png) come from the filled-in sample PDF.
set -euo pipefail
cd "$(dirname "$0")/.."
node _brand/render.mjs build secret-santa-kit
node secret-santa-kit/src/fields.mjs
SAMPLE=${SAMPLE:-$(mktemp -d)}
python3 secret-santa-kit/src/add_fields.py --sample "$SAMPLE"
for i in $(seq -w 1 11); do pdftoppm -r 110 -png -singlefile -f $((10#$i)) -l $((10#$i)) "$SAMPLE/sample-US-Letter.pdf" secret-santa-kit/src/listing/img/p$i; done
echo "sample PDFs: $SAMPLE (if previews changed, run build.sh again so the listing images use them)"
