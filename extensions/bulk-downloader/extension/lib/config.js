// Shared settings for the popup and background script.
// TEST_BUILD unlocks Pro without paying (for development only).
// The publish workflow refuses to run while it is true.
self.QBD_CONFIG = {
  TEST_BUILD: false,
  EXTPAY_ID: 'quiet-bulk-bownloader',
  PRO_PRICE: '$9.99 one-time'
};
