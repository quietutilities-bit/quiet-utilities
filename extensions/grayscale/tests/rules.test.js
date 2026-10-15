import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Load the file the same way the browser does (a plain script that sets self.QGRules).
const sandbox = { self: {}, URL };
vm.runInNewContext(fs.readFileSync(new URL('../extension/lib/rules.js', import.meta.url), 'utf8'), sandbox);
const R = sandbox.self.QGRules;
const plain = (x) => JSON.parse(JSON.stringify(x));

test('originOf accepts only web pages', () => {
  assert.equal(R.originOf('https://news.example.com/a/b?c=1'), 'https://news.example.com');
  assert.equal(R.originOf('http://localhost:8080/x'), 'http://localhost:8080');
  assert.equal(R.originOf('chrome://settings'), '');
  assert.equal(R.originOf('file:///C:/doc.html'), '');
  assert.equal(R.originOf('not a url'), '');
});

test('normalize fills defaults and clamps strength', () => {
  assert.deepEqual(plain(R.normalize(undefined)), { everywhere: false, sites: [], skip: [], strength: 100 });
  assert.equal(R.normalize({ strength: 3 }).strength, 10);
  assert.equal(R.normalize({ strength: 250 }).strength, 100);
  assert.equal(R.normalize({ strength: 'x' }).strength, 100);
  assert.deepEqual(plain(R.normalize({ sites: ['a', 'a'] }).sites), ['a']);
});

test('per-site mode', () => {
  let s = R.setSite({}, 'https://a.com', true);
  assert.ok(R.isOn(s, 'https://a.com'));
  assert.ok(!R.isOn(s, 'https://b.com'));
  s = R.setSite(s, 'https://a.com', true);
  assert.deepEqual(plain(s.sites), ['https://a.com'], 'no duplicates');
  s = R.setSite(s, 'https://a.com', false);
  assert.ok(!R.isOn(s, 'https://a.com'));
  assert.ok(!R.isOn(s, ''), 'empty origin is never on');
});

test('everywhere mode with skipped sites', () => {
  let s = R.setEverywhere(R.setSite({}, 'https://a.com', true), true);
  assert.ok(R.isOn(s, 'https://b.com'));
  s = R.setSite(s, 'https://b.com', false);
  assert.ok(!R.isOn(s, 'https://b.com'));
  assert.deepEqual(plain(s.skip), ['https://b.com']);
  s = R.setSite(s, 'https://b.com', true);
  assert.deepEqual(plain(s.skip), []);
  s = R.setEverywhere(s, false);
  assert.ok(R.isOn(s, 'https://a.com'), 'per-site choices survive turning everywhere off');
  assert.ok(!R.isOn(s, 'https://b.com'));
});

test('registration patterns', () => {
  assert.deepEqual(plain(R.registration({ sites: ['https://a.com'] })), { matches: ['https://a.com/*'], excludeMatches: [] });
  assert.deepEqual(plain(R.registration({ everywhere: true, skip: ['https://b.com'] })), { matches: ['<all_urls>'], excludeMatches: ['https://b.com/*'] });
  assert.deepEqual(plain(R.registration({}).matches), []);
});

test('filter css', () => {
  assert.equal(R.filterCss(100), 'html { filter: grayscale(1) !important; }');
  assert.equal(R.filterCss(60), 'html { filter: grayscale(0.6) !important; }');
});
