// Shared settings for the popup and background script.
// TEST_BUILD unlocks Pro without paying (for development only).
// The publish workflow refuses to run while it is true.
self.QBD_CONFIG = {
  TEST_BUILD: false,
  EXTPAY_ID: 'quiet-bulk-downloader',
  PRO_PRICE: '$9.99 one-time',
  REVIEW_URL: 'https://chromewebstore.google.com/detail/egekfgjldnkhelljbpbkgebahhgikjej/reviews',
  MORE_URL: 'https://quietutilities-bit.github.io/#extensions',
  REVIEW_AFTER_BATCHES: 3
};
