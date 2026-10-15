# Quiet Utilities

Small, focused Chrome extensions. Free core features, one-time Pro upgrades.

| Extension | Folder | Status |
|---|---|---|
| Quiet Bulk Downloader | `extensions/bulk-downloader` | v0.1.0 test build |

## Working on an extension

```bash
cd extensions/bulk-downloader
npm test        # unit tests
npm run e2e     # loads the extension into Chromium and downloads real files (needs xvfb on Linux)
```

To try one by hand: Chrome → `chrome://extensions` → Developer mode → Load unpacked → pick the `extension` folder.

See `STATUS.md` for the current plan, account checklist and log.
