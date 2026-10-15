# Status log

Read this first in every session. Update it last.

## Accounts (2026-10-15)
- [x] Gmail: quietutilities@gmail.com (connected to Claude)
- [x] GitHub: quietutilities-bit / quiet-utilities (private)
- [x] Chrome Web Store developer account. Publisher ID 8469b81e-4d26-4a16-af4a-10c9d2d30661
- [x] Service account `store-publisher` (Google Cloud project quiet-utilities) added to the store dashboard; key stored as GitHub secret CWS_SERVICE_ACCOUNT_KEY; variable CWS_PUBLISHER_ID set
- [x] Publish workflow (.github/workflows/publish.yml): Claude starts it with `gh api -X POST repos/quietutilities-bit/quiet-utilities/actions/workflows/publish.yml/dispatches`. Test run 2026-10-15: unit tests pass, stops at missing extensionId as designed. Service-account login not yet proven (needs first listing).
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

## Notes
- From Claude sessions: GitHub Actions secrets/variables can't be read or set (proxy blocks it); dispatching workflows and reading runs works via `gh api` REST. GraphQL is blocked.
- Chrome Web Store API hosts are blocked from the Claude workspace; all store calls go through GitHub Actions.
- First listing for each new extension must be created in the dashboard by hand (API can't create items). Then put its ID in extensions/<name>/store.json.
