// Pro license check through ExtensionPay (lib/ExtPay.js, loaded by popup.html).
const cfg = self.QBD_CONFIG;
export const TEST_BUILD = cfg.TEST_BUILD;
export const PRO_PRICE = cfg.PRO_PRICE;

let extpay = null;
function client() {
  if (!extpay && cfg.EXTPAY_ID && typeof self.ExtPay === 'function') extpay = self.ExtPay(cfg.EXTPAY_ID);
  return extpay;
}

// Paid status is cached so Pro keeps working offline.
export async function isPro() {
  if (TEST_BUILD) return true;
  const { proCache } = await chrome.storage.local.get('proCache');
  const pay = client();
  if (!pay) return Boolean(proCache);
  try {
    const user = await pay.getUser();
    await chrome.storage.local.set({ proCache: Boolean(user.paid) });
    return Boolean(user.paid);
  } catch {
    return Boolean(proCache);
  }
}

export async function openUpgrade() {
  const pay = client();
  if (!pay) return false;
  try { await pay.openPaymentPage(); return true; } catch { return false; }
}

export async function openRestore() {
  const pay = client();
  if (!pay) return false;
  try { await pay.openLoginPage(); return true; } catch { return false; }
}
