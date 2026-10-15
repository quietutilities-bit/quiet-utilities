import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getExtension, categorize, filenameFromUrl, sanitize, sanitizeFolder,
  prepareItems, filterItems, applyMask, uniquify, buildJobs, countByCategory, isValidRegex
} from '../extension/lib/core.js';

test('getExtension ignores query strings and odd endings', () => {
  assert.equal(getExtension('https://x.com/a/b/report.PDF?v=2#top'), 'pdf');
  assert.equal(getExtension('https://x.com/a/archive.tar.gz'), 'gz');
  assert.equal(getExtension('https://x.com/a/'), '');
  assert.equal(getExtension('https://x.com/.hidden'), '');
  assert.equal(getExtension('https://x.com/file.'), '');
  assert.equal(getExtension('not a url'), '');
});

test('categorize uses extension first, then element kind', () => {
  assert.equal(categorize('https://x.com/a.jpg'), 'images');
  assert.equal(categorize('https://x.com/a.docx'), 'documents');
  assert.equal(categorize('https://x.com/a.zip'), 'archives');
  assert.equal(categorize('https://x.com/a.mp3'), 'audio');
  assert.equal(categorize('https://x.com/a.mp4'), 'video');
  assert.equal(categorize('https://cdn.x.com/img?id=5', 'image'), 'images');
  assert.equal(categorize('https://x.com/about'), 'links');
});

test('filenameFromUrl decodes and falls back', () => {
  assert.equal(filenameFromUrl('https://x.com/my%20file.pdf'), 'my file.pdf');
  assert.equal(filenameFromUrl('https://x.com/bad%E0%A4%A.pdf'), 'bad%E0%A4%A.pdf');
  assert.equal(filenameFromUrl('https://x.com/'), 'x.com');
});

test('sanitize removes illegal characters and reserved names', () => {
  assert.equal(sanitize('a/b\\c:d*e?f"g<h>i|j.txt'), 'a_b_c_d_e_f_g_h_i_j.txt');
  assert.equal(sanitize('  ..hidden. '), 'hidden');
  assert.equal(sanitize(''), 'download');
  assert.equal(sanitize('CON.txt'), '_CON.txt');
  const long = sanitize('x'.repeat(300) + '.pdf');
  assert.ok(long.length <= 150 && long.endsWith('.pdf'));
});

test('sanitizeFolder blocks escaping the Downloads folder', () => {
  assert.equal(sanitizeFolder('../../etc'), 'etc');
  assert.equal(sanitizeFolder('Photos/2026'), 'Photos/2026');
  assert.equal(sanitizeFolder('/abs/../x'), 'abs/x');
  assert.equal(sanitizeFolder(''), '');
  assert.equal(sanitizeFolder('C:\\Users\\me'), 'C_/Users/me');
});

test('prepareItems drops junk and duplicates', () => {
  const items = prepareItems([
    { url: 'https://x.com/a.pdf', text: 'A', kind: 'link' },
    { url: 'https://x.com/a.pdf#page=2', text: 'A again', kind: 'link' },
    { url: 'javascript:void(0)' },
    { url: 'mailto:hi@x.com' },
    { url: 'chrome://settings' },
    { url: 'https://x.com/pic.png', kind: 'image' },
    null
  ]);
  assert.deepEqual(items.map((i) => i.name), ['a.pdf', 'pic.png']);
  assert.deepEqual(countByCategory(items), { documents: 1, images: 1 });
});

test('filterItems by category, text and regex', () => {
  const items = prepareItems([
    { url: 'https://x.com/report-1.pdf', text: 'Q1 report' },
    { url: 'https://x.com/report-2.pdf', text: 'Q2 report' },
    { url: 'https://x.com/photo.jpg', kind: 'image' },
    { url: 'https://x.com/about' }
  ]);
  assert.equal(filterItems(items, { categories: ['documents'] }).length, 2);
  assert.equal(filterItems(items, { text: 'q2' }).length, 1);
  assert.equal(filterItems(items, { regex: 'report-1' }).length, 1);
  assert.equal(filterItems(items, { regex: '([' }).length, 4, 'invalid regex is ignored');
  assert.equal(isValidRegex('(['), false);
});

test('applyMask fills tokens and keeps the extension', () => {
  const [item] = prepareItems([{ url: 'https://img.site.com/cat.jpg', text: 'Cute cat' }]);
  const date = new Date(2026, 9, 14);
  assert.equal(applyMask('', item, 0, 1), 'cat.jpg');
  assert.equal(applyMask('{domain}-{n}', item, 4, 12, date), 'img.site.com-005.jpg');
  assert.equal(applyMask('{date} {text}', item, 0, 1, date), '2026-10-14 Cute cat.jpg');
  assert.equal(applyMask('{name}.{ext}', item, 0, 1), 'cat.jpg');
  assert.equal(applyMask('a/b', item, 0, 1), 'a_b.jpg');
});

test('uniquify avoids name clashes within a batch', () => {
  assert.deepEqual(uniquify(['a.jpg', 'a.jpg', 'A.jpg', 'b.jpg', 'a (2).jpg']),
    ['a.jpg', 'a (2).jpg', 'A (3).jpg', 'b.jpg', 'a (2) (2).jpg']);
});

test('buildJobs combines folder, mask and unique names', () => {
  const items = prepareItems([
    { url: 'https://a.com/x/img.png' },
    { url: 'https://b.com/y/img.png' }
  ]);
  const jobs = buildJobs(items, { folder: '../Quiet Downloads' });
  assert.deepEqual(jobs.map((j) => j.filename), ['Quiet Downloads/img.png', 'Quiet Downloads/img (2).png']);
  const masked = buildJobs(items, { folder: '', mask: '{domain}' });
  assert.deepEqual(masked.map((j) => j.filename), ['a.com.png', 'b.com.png']);
});
