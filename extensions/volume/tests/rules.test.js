import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Load the file the same way the browser does (a plain script that sets self.QVRules).
const sandbox = { self: {}, URL };
vm.runInNewContext(fs.readFileSync(new URL('../extension/lib/rules.js', import.meta.url), 'utf8'), sandbox);
const R = sandbox.self.QVRules;
const plain = (x) => JSON.parse(JSON.stringify(x));
const at = (h, m = 0) => new Date(2026, 9, 19, h, m);
const A = 'https://a.example', B = 'http://b.example:8080';

test('clampLevel keeps 0–600 in steps of 5', () => {
  assert.equal(R.clampLevel(250), 250);
  assert.equal(R.clampLevel(252), 250);
  assert.equal(R.clampLevel(253), 255);
  assert.equal(R.clampLevel(-20), 0);
  assert.equal(R.clampLevel(9999), 600);
  assert.equal(R.clampLevel('abc'), 100);
  assert.equal(R.clampLevel(undefined), 100);
});

test('normalize repairs bad stored data', () => {
  const s = R.normalize({ levels: { [A]: 1000, 'chrome://settings': 300, 'https://x.example/path': 200, [B]: '150' }, eq: 'nope', quietFrom: '25:00', quietCap: 400 });
  assert.deepEqual(plain(s.levels), { [A]: 600, [B]: 150 });
  assert.equal(s.eq, 'off');
  assert.equal(s.quietFrom, '22:00');
  assert.equal(s.quietCap, 100);
  assert.equal(R.normalize(null).everywhere, false);
  assert.equal(R.normalize({ quietCap: 0 }).quietCap, 10);
});

test('originOf accepts only web pages', () => {
  assert.equal(R.originOf('https://a.example/watch?v=1'), A);
  assert.equal(R.originOf('chrome://extensions'), '');
  assert.equal(R.originOf('file:///home/x.mp3'), '');
  assert.equal(R.originOf('not a url'), '');
});

test('levels are remembered per site', () => {
  let s = R.setLevel({}, A, 300);
  s = R.setLevel(s, B, 50);
  assert.equal(R.levelFor(s, A), 300);
  assert.equal(R.levelFor(s, B), 50);
  assert.equal(R.levelFor(s, 'https://other.example'), 100);
  assert.equal(R.levelFor(s, ''), 100);
  s = R.forget(s, A);
  assert.equal(R.levelFor(s, A), 100);
  assert.deepEqual(plain(R.setLevel({}, '', 300).levels), {});
});

test('quiet hours handle windows across midnight', () => {
  assert.equal(R.inQuietHours('22:00', '07:00', at(23)), true);
  assert.equal(R.inQuietHours('22:00', '07:00', at(3)), true);
  assert.equal(R.inQuietHours('22:00', '07:00', at(7)), false);
  assert.equal(R.inQuietHours('22:00', '07:00', at(12)), false);
  assert.equal(R.inQuietHours('13:00', '14:30', at(14, 15)), true);
  assert.equal(R.inQuietHours('13:00', '14:30', at(14, 30)), false);
  assert.equal(R.inQuietHours('09:00', '09:00', at(18)), true);
});

test('quiet hours cap the level only for Pro, only inside the window', () => {
  const base = R.setLevel({ quietOn: true, quietFrom: '22:00', quietTo: '07:00', quietCap: 60 }, A, 400);
  assert.equal(R.effectiveLevel(base, A, at(23)), 400, 'free: no cap');
  const pro = Object.assign({}, base, { pro: true });
  assert.equal(R.effectiveLevel(pro, A, at(23)), 60);
  assert.equal(R.effectiveLevel(pro, A, at(12)), 400);
  assert.equal(R.effectiveLevel(R.setLevel(pro, A, 30), A, at(23)), 30, 'never raises a lower level');
  assert.equal(R.effectiveLevel(Object.assign({}, pro, { quietOn: false }), A, at(23)), 400);
});

test('equalizer and mono need Pro', () => {
  const s = { eq: 'bass', mono: true };
  assert.deepEqual(plain(R.soundFor(s)), { low: 0, mid: 0, high: 0, mono: false });
  assert.deepEqual(plain(R.soundFor(Object.assign({ pro: true }, s))), { low: 8, mid: 0, high: 0, mono: true });
});

test('audio is only taken over when the sound changes', () => {
  assert.equal(R.needsAudio({}, A), false);
  assert.equal(R.needsAudio(R.setLevel({}, A, 100), A), false);
  assert.equal(R.needsAudio(R.setLevel({}, A, 200), A), true);
  assert.equal(R.needsAudio(R.setLevel({}, A, 0), A), true);
  assert.equal(R.needsAudio({ eq: 'bass' }, A), false, 'free user with leftover Pro setting');
  assert.equal(R.needsAudio({ pro: true, eq: 'voice' }, A), true);
  assert.equal(R.needsAudio({ pro: true, mono: true }, A), true);
});

test('canRoute avoids media that would go silent', () => {
  const page = 'https://a.example';
  assert.equal(R.canRoute('blob:https://a.example/123', page, null, false), true);
  assert.equal(R.canRoute('https://a.example/song.mp3', page, null, false), true);
  assert.equal(R.canRoute('/song.mp3', page, null, false), true);
  assert.equal(R.canRoute('https://cdn.example/song.mp3', page, null, false), false);
  assert.equal(R.canRoute('https://cdn.example/song.mp3', page, 'anonymous', false), true);
  assert.equal(R.canRoute('', page, null, true), true, 'live streams (calls)');
  assert.equal(R.canRoute('', page, null, false), false);
});

test('registration follows remembered sites or every site', () => {
  assert.deepEqual(plain(R.registration({})), []);
  assert.deepEqual(plain(R.registration(R.setLevel({}, A, 200))), [`${A}/*`]);
  assert.deepEqual(plain(R.registration({ everywhere: true, levels: { [A]: 200 } })), ['<all_urls>']);
});

test('badge shows the level only when it is not 100%', () => {
  assert.equal(R.badgeText(100), '');
  assert.equal(R.badgeText(250), '250');
  assert.equal(R.badgeText(0), '0');
});
