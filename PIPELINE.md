# Product pipeline

Statuses: idea → building → ready-for-owner → submitted → live (or rejected/parked).
Rule: start a new build only when nothing is in `building`, and at most one product is waiting in `ready-for-owner`.

| Product | Status | Price | Evidence | Notes |
|---|---|---|---|---|
| Quiet Bulk Downloader | Edge: live (2026-10-15) · Chrome: in review (2026-10-19) · Firefox: not yet | Free + $9.99 Pro | MV2 removal stranded Simple Mass Downloader users; same-named copy rated 3.0 with ~10K users; similar extension earns ~$700/mo | Chrome egekfgjldnkhelljbpbkgebahhgikjej · Edge CRX cboiddakcfeodjbjgkhampacjakaopaa |
| Quiet Grayscale (`extensions/grayscale`, 1.0.0) | Chrome + Edge: in review (2026-10-19) · Firefox: not yet | Free | Requested in r/chrome Manifest V3 alternatives megathread | Reputation builder; per-site on/off |
| Quiet Volume Booster (`extensions/volume`, 1.0.0) | ready-for-owner (built and tested 2026-10-19; store kit in downloads/quiet-volume-booster) | Free + $4.99 Pro (EQ presets, mono, quiet hours) | Largest no-server category we can serve: Volume Master ~7M users (4.8★, 49K ratings); EQ extensions 20K–500K users with complaints (settings not saved per site, promo tabs); MV2 write-ups rate audio boosters the weakest-replaced category. Score: demand 5, competition 2, fit 5, buildable 5, Pro 4 | Differentiator: remembers each site (content-script Web Audio; tabCapture boosters reset on reload) |
| Highlight word counter | idea | Free | Requested in same megathread ("Count me up lite") | Right-click → word/character count |
| Favorites new-tab page | idea | Free or Pro themes | Requested in same megathread | Check competition first |
