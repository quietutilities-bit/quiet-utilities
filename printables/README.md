# Printables (Pantry Printable Co., by Quiet Utilities)

Holiday digital downloads sold on Etsy. Operating manual: Claude project doc `claude/holiday/plan.md`; queue: `claude/holiday/queue.md`.

- `_brand/` shared CSS (`brand.css`), palette (`palette.json`), OFL fonts (`fonts/`), render tool (`render.mjs`).
- `<slug>/src/` HTML/SVG sources + `render.json`; `<slug>/out/` rendered deliverables (PDFs, listing images, pins).
- Upload kit for the owner: `../downloads/holiday/<slug>/`.

Render: `node _brand/render.mjs build <slug>` then `node _brand/render.mjs check <slug>` (page PNGs in `out/_check/`, not committed).
Needs Playwright + Chromium (preinstalled in the Claude sandbox; elsewhere `npm i playwright && npx playwright install chromium`).
