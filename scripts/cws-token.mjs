// Exchanges the service account key (env CWS_KEY, JSON) for a Chrome Web Store access token.
// Signs a JWT locally, so no extra Google Cloud APIs are needed.
import crypto from 'node:crypto';
const key = JSON.parse(process.env.CWS_KEY || '{}');
if (!key.client_email || !key.private_key) { console.error('CWS_KEY is missing or not a service account key'); process.exit(1); }
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
  iss: key.client_email, scope: 'https://www.googleapis.com/auth/chromewebstore',
  aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key).toString('base64url');
const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` })
});
const data = await res.json();
if (!data.access_token) { console.error('Token request failed:', JSON.stringify(data)); process.exit(1); }
console.log(`::add-mask::${data.access_token}`);
console.log(data.access_token);
