# Chrome Web Store listing: Quiet Bulk Downloader

Paste these into the Developer Dashboard when creating the item.

## Package
Upload: `quiet-bulk-downloader-1.0.2.zip`

## Store listing tab

**Title** (comes from the package): Quiet Bulk Downloader

**Summary** (comes from the package): Download every file, image or link on a page in one click. Filter by type, pick what you want, save it all into one folder.

**Description:**

Download every file on a page in one click.

Quiet Bulk Downloader finds the documents, images, audio, video and archives on the page you're looking at and lists them, sorted by type. Untick anything you don't want, pick a folder, and click Download. That's it.

WHAT IT DOES
• Finds files linked or embedded on the page, including inside embedded frames
• Picks the full-size version of responsive images
• Sorts everything into Images, Documents, Archives, Audio, Video and more
• Filter by type or by name, or untick individual files
• Saves everything into one folder inside your Downloads
• Downloads a few files at a time so big batches don't overwhelm your browser or the site
• Remembers your folder and settings
• Works in light and dark mode

PRO (one-time $9.99, no subscription)
• All tabs: collect files from every open tab at once
• Rename files with simple patterns, like field-trip-001.jpg or 2026-10-15 report.pdf
• Advanced filters using regular expressions
Not happy with Pro? Email us within 30 days for a full refund.

PRIVATE BY DESIGN
No ads, no tracking, no analytics. The extension only reads the page when you open it, and nothing about your browsing leaves your computer.

Please only download content you have the right to download.

Questions or bugs: quietutilities@gmail.com

**Category:** Productivity → Tools (or the closest "Tools"/"Productivity" option)
**Language:** English

**Graphic assets**
- Store icon (128×128): `extension/icons/icon128.png`
- Screenshots (1280×800): `out-screenshot-1-1280x800.png`, `out-screenshot-2-1280x800.png`, `out-screenshot-3-1280x800.png`
- Small promo tile (440×280): `out-promo-tile-440x280.png`
- Marquee: leave empty

**Additional fields**
- Official URL: none (leave empty unless the site is verified in Search Console)
- Homepage URL: https://quietutilities-bit.github.io
- Support URL: https://quietutilities-bit.github.io/#contact
- Mature content: No

## Privacy practices tab

**Single purpose:**
Lets the user find the files, images and media on the current web page (or, optionally, all open tabs) and download the ones they choose into a folder.

**Permission justifications:**
- `activeTab`: Reads the links and media on the current tab, only when the user clicks the extension's icon.
- `scripting`: Runs the small script that lists the links and media on the tab the user opened the extension on.
- `downloads`: Saves the files the user selects into their Downloads folder.
- `storage`: Remembers the user's folder name and rename pattern, and whether they have bought the Pro upgrade.
- Optional host permission `<all_urls>`: Requested only if the user turns on the "All tabs" feature, so the extension can list files from every open tab. Never requested otherwise.
- Host permission `https://extensionpay.com/*` (content script): Confirms a Pro purchase on the ExtensionPay payment page so Pro unlocks right after payment.

**Remote code:** No, I am not using remote code. (All code ships in the package.)

**Data usage, what is collected:**
- Personally identifiable information: YES (the buyer's email address, entered on the ExtensionPay checkout page, only if they buy Pro)
- Financial and payment information: YES (entered on the Stripe/ExtensionPay checkout page only if they buy Pro; never seen or stored by the extension)
- Everything else (health, authentication, personal communications, location, web history, user activity, website content): NO

**Certifications:** tick all three (not sold to third parties; not used for unrelated purposes; not used for creditworthiness or lending).

**Privacy policy URL:** https://quietutilities-bit.github.io/privacy.html

## Distribution tab
- Payments: Free (Pro is sold inside the extension through ExtensionPay). If asked about in-app purchases, answer yes.
- Visibility: Public
- Regions: All regions

## After submitting
Copy the item ID (32 letters, in the dashboard URL) into `extensions/bulk-downloader/store.json` → `extensionId`. From then on updates go out through the GitHub publish workflow.
