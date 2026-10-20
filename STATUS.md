# Status log

Read this first in every session. Update it last.

## Accounts (2026-10-15)
- [x] Gmail: quietutilities@gmail.com (connected to Claude)
- [x] GitHub: quietutilities-bit / quiet-utilities (private)
- [x] Chrome Web Store developer account. Publisher ID 8469b81e-4d26-4a16-af4a-10c9d2d30661
- [x] Service account `store-publisher` (Google Cloud project quiet-utilities) added to the store dashboard; key stored as GitHub secret CWS_SERVICE_ACCOUNT_KEY; variable CWS_PUBLISHER_ID set
- [x] Publish workflow (.github/workflows/publish.yml): Claude starts it with `gh api -X POST repos/quietutilities-bit/quiet-utilities/actions/workflows/publish.yml/dispatches`. PROVEN 2026-10-15: status-only run (inputs[status_only]=true) logged in as the service account and read item egekfgjldnkhelljbpbkgebahhgikjej. Token comes from scripts/cws-token.mjs (JWT signed in the job; no extra Cloud APIs). Store replies appear as a ::notice:: readable via gh api repos/.../check-runs/<job id>/annotations.
- [x] Website: https://quietutilities-bit.github.io (repo quietutilities-bit/quietutilities-bit.github.io, public). Home, privacy.html, terms.html. Privacy URL for store listing: https://quietutilities-bit.github.io/privacy.html
- [x] Stripe (owner finishing activation: identity + bank)
- [x] ExtensionPay: extension ID `quiet-bulk-downloader` (re-registered; old `quiet-bulk-bownloader` entry unused). Confirm Stripe is connected inside ExtensionPay.
- [ ] ExtensionPay
- [ ] Optional: Chrome profile + Claude in Chrome for self-publishing

## Rules
Claude does without asking: bug fixes, small improvements, review/support replies, weekly report.
Claude asks first: new extensions, price changes, spending money, legal/policy issues.

## Quiet Bulk Downloader — v0.2.0 (payments wired)
- Free: scan current tab, type filters, text filter, select, save into a Downloads subfolder, queued downloads with progress.
- Pro ($9.99 one-time, planned): all tabs, rename patterns, regex filter.
- Tests: 10 unit + 22 end-to-end checks in real Chromium, all passing.
- Payments: ExtPay.js 3.1.2 bundled; settings in `extension/lib/config.js` (TEST_BUILD false, EXTPAY_ID set).
- Before publishing: owner tests checkout with Stripe test card; write store listing, 1280x800 screenshots, 440x280 tile, privacy policy.
- Waiting on: owner's hands-on test on real websites.

## Backlog
- Grayscale-the-web toggle (free)
- Highlight word counter (free)
- Favorites new-tab page (free)

## Log
- 2026-10-14: Chose Chrome extension portfolio. Built + tested bulk downloader v0.1.0.
- 2026-10-15: GitHub repo connected; code uploaded. Store developer account, service account and publish workflow set up.

- 2026-10-15: Owner ran a Stripe test-card purchase of v1.0.0: checkout opened, payment went through, Pro unlocked. Payments confirmed end to end. Owner resubmitted Google identity check.

- 2026-10-15: v1.0.2 checked by owner on cnbc.com (only Images on by default, links off). Restore-purchase flow confirmed working after reinstall. Ready to submit 1.0.2.

- 2026-10-15: Store item created (ID egekfgjldnkhelljbpbkgebahhgikjej, draft with v1.0.2). Automatic publishing proven with a read-only status check. 2-Step Verification on. Waiting on identity verification + Submit for review.

- 2026-10-15: v1.0.3 (one-time rating prompt after 3 batches, 'More free tools' link). Uploaded into the Chrome draft through the GitHub workflow (upload path proven). Added scripts/build.mjs for Chrome/Edge/Firefox packages. Owner creating Edge (Microsoft account) and Firefox developer accounts.

- 2026-10-15: Edge listing submitted for Microsoft review (v1.0.4; product cee6f808-8a8c-4fe0-8b99-6a06664383fe, CRX cboiddakcfeodjbjgkhampacjakaopaa, Store ID 0RDCKFMQB7HG). Chrome draft holds v1.0.4, waiting on Google identity check. Edge Publish API secrets pending.

- 2026-10-15: Edge Publish API connected (secrets EDGE_CLIENT_ID + EDGE_API_KEY). Read-only check: credentials accepted (HTTP 404 for a dummy operation, not 401/403). Updates: dispatch publish.yml with inputs[store]=edge or both. Note: owner pasted an earlier API key in chat and was told to regenerate it.

- 2026-10-15: Built Quiet Grayscale 1.0.0 (free). 6/6 unit tests and the full browser test pass. Store images, listing, Edge description (803 chars) and Chrome/Edge/Firefox packages are in downloads/quiet-grayscale. Website card and privacy policy updated. Waiting on owner: create the Edge item now, Chrome item after Google identity check, then send back the IDs for extensions/grayscale/store.json.
- 2026-10-19: Edge published Bulk Downloader 1.0.4 (10-15). Google identity verified; owner submitted Bulk Downloader 1.0.4 to Chrome review. Quiet Grayscale Chrome item ogbffiiboabbpcjgekdkackmgfhfggkl created and submitted for review (store.json updated). Website links the Edge listing. Waiting on owner: Grayscale Edge item, Firefox account + Grayscale Firefox submission.
- 2026-10-19: Quiet Grayscale submitted to Edge (product 085fbdd1-d83f-49fd-9752-15f5dce16a2f); CRX nnmpboogglfnjoddhmpjcakbihffiaja. Add website Edge link once Microsoft's 'published' email arrives.
- 2026-10-19: Product studio (owner-requested): built Quiet Volume Booster 1.0.0 (extensions/volume): per-site volume 0–600% with limiter, badge, Alt+Shift+Up/Down, optional every-website; Pro $4.99 (EQ presets, mono, quiet hours) via ExtensionPay id quiet-volume-booster (owner must register it before upload). 11/11 unit tests, e2e pass in Pro and Free modes (real loudness measured 3x at 300%; cross-site non-CORS media left alone). Store kit in downloads/quiet-volume-booster; website card + privacy policy updated. Firefox data_collection_permissions still 'none' for paid products: recheck before Firefox submission.
- 2026-10-20: Edge published Quiet Grayscale (10-19) and Quiet Volume Booster (10-19; product 5adfdfac-cc4a-483a-b139-f573ba7ef32a, CRX dkpmmlinfldfdhbpjomabmnhfjhincik). Website links both Edge listings. Stripe payout bank added 10-19.

## Notes
- From Claude sessions: GitHub Actions secrets/variables can't be read or set (proxy blocks it); dispatching workflows and reading runs works via `gh api` REST. GraphQL is blocked.
- Chrome Web Store API hosts are blocked from the Claude workspace; all store calls go through GitHub Actions.
- First listing for each new extension must be created in the dashboard by hand (API can't create items). Then put its ID in extensions/<name>/store.json.
