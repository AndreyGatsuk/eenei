const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { languageMatrix } = require('../scripts/coverage/language-matrix');

const fixture = { sample: 'sample.sh', exists: true, scope: 'source.shell', acceptedLanguageIds: ['shellscript'] };
const variant = { id: 'test', files: [{ sample: 'sample.sh', grammar: 'passed',
  colorAssertions: 3, styleAssertions: 1, failedAssertions: 0 }] };
const native = { skipped: false, files: [{ file: 'sample.sh', passed: true, language: 'shellscript' }] };
const row = (matrix, source, name) => matrix.rows.find((entry) => entry.source === source && entry.name === name);

test('a shared grammar and broad aliases cannot confer language test evidence', () => {
  const matrix = languageMatrix([fixture], [variant], native);
  assert.equal(row(matrix, 'linguist', 'Shell').status, 'sample-tested');
  for (const name of ['fish', 'Alpine Abuild']) {
    const entry = row(matrix, 'linguist', name);
    assert.ok(entry, name);
    assert.equal(entry.status, 'no-sample');
    assert.deepEqual(entry.samples, []);
    if (name === 'Alpine Abuild') assert.ok(entry.sharedGrammars.length, 'The shared grammar stays visible separately');
  }
});

test('a representative file never proves every extension, filename or grammar', () => {
  const sample = { sample: 'sample.cpp', exists: true, scope: 'source.cpp', acceptedLanguageIds: ['cpp'] };
  const matrix = languageMatrix([sample], [], { skipped: true, files: [] });
  const entry = matrix.rows.find((entry) => entry.source === 'vscode' && entry.id === 'cpp');
  assert.deepEqual(entry.bindings.find((binding) => binding.value === '.cpp').samples, ['sample.cpp']);
  assert.deepEqual(entry.bindings.find((binding) => binding.value === '.hpp').samples, []);
  assert.ok(entry.untestedBindings > 0);
  assert.ok(entry.untestedScopes.includes('source.cpp.embedded.macro'));
  const c = row(matrix, 'linguist', 'C');
  assert.equal(c.status, 'no-sample');
});

test('native checks and every measured palette are required for a verified example', () => {
  let matrix = languageMatrix([fixture], [variant], { skipped: true, files: [] });
  assert.equal(row(matrix, 'linguist', 'Shell').status, 'needs-editor');
  matrix = languageMatrix([fixture], [variant, { id: 'other', files: [{ ...variant.files[0], styleAssertions: 0 }] }], native);
  assert.equal(row(matrix, 'linguist', 'Shell').status, 'needs-assertions');
  matrix = languageMatrix([fixture], [variant], { skipped: false, files: [{ file: 'sample.sh', passed: false }] });
  assert.equal(row(matrix, 'linguist', 'Shell').status, 'failed');
  const missing = languageMatrix([{ ...fixture, exists: false }], [variant], native);
  assert.equal(row(missing, 'linguist', 'Shell').status, 'no-sample');
});

test('catalog snapshots have immutable provenance, unique identities and licenses', () => {
  for (const source of ['vscode', 'linguist']) {
    const catalog = require(`../scripts/coverage/catalogs/${source}.json`);
    assert.match(catalog.revision, /^[a-f0-9]{40}$/);
    assert.ok(catalog.entries.length > 50);
    assert.equal(new Set(catalog.entries.map((entry) => entry.id)).size, catalog.entries.length);
    assert.ok(fs.readFileSync(path.join(__dirname, '../scripts/coverage/catalogs', `${source}.LICENSE.txt`), 'utf8').includes('Copyright'));
  }
});


test('one tested grammar cannot hide missing assertions for another grammar of the same catalog language', () => {
  const fixtures = [
    { sample: 'sample.js', exists: true, scope: 'source.js', acceptedLanguageIds: ['javascript'] },
    { sample: 'sample.jsx', exists: true, scope: 'source.js.jsx', acceptedLanguageIds: ['javascriptreact'] },
  ];
  const variant = { id: 'test', files: fixtures.map((fixture, index) => ({ sample: fixture.sample,
    grammar: 'passed', colorAssertions: 3, styleAssertions: index ? 0 : 1, failedAssertions: 0 })) };
  const native = { skipped: false, files: fixtures.map((fixture) => ({ file: fixture.sample, passed: true })) };
  const entry = row(languageMatrix(fixtures, [variant], native), 'linguist', 'JavaScript');
  assert.equal(entry.status, 'needs-assertions');
  assert.equal(entry.measured[0].stylesPassed, false);
});


test('filename aliases remain pending without creating syntax gaps for a tested grammar', () => {
  const fixture = { sample: 'sample.py', exists: true, scope: 'source.python', acceptedLanguageIds: ['python'] };
  const variant = { id: 'test', files: [{ sample: fixture.sample, grammar: 'passed', colorAssertions: 3, styleAssertions: 1, failedAssertions: 0 }] };
  const native = { skipped: false, files: [{ file: fixture.sample, language: 'python', passed: true }] };
  const entry = languageMatrix([fixture], [variant], native).rows.find((row) => row.source === 'vscode' && row.id === 'python');
  assert.equal(entry.syntax.tested, true);
  assert.equal(entry.syntax.gap, false);
  assert.equal(entry.bindings.find((binding) => binding.value === '.py').status, 'verified');
  assert.equal(entry.bindings.find((binding) => binding.value === '.pyw').status, 'missing-example');
  assert.ok(entry.recognition.pending > 0);
});

test('skipping the editor preserves syntax evidence but cannot verify filename recognition', () => {
  const entry = row(languageMatrix([fixture], [variant], { skipped: true, files: [] }), 'linguist', 'Shell');
  assert.equal(entry.syntax.status, 'sample-tested');
  assert.equal(entry.bindings.find((binding) => binding.value === '.sh').status, 'skipped');
  assert.equal(entry.recognition.verified, 0);
});

test('recognition and syntax failures are independently attributable', () => {
  let entry = row(languageMatrix([fixture], [variant], { skipped: false,
    files: [{ file: fixture.sample, passed: false, language: 'plaintext' }] }), 'linguist', 'Shell');
  assert.equal(entry.syntax.tested, true);
  assert.equal(entry.bindings.find((binding) => binding.value === '.sh').status, 'failed');
  entry = row(languageMatrix([fixture], [{ ...variant, files: [{ ...variant.files[0], failedAssertions: 1 }] }],
    { skipped: false, files: [{ file: fixture.sample, passed: false, language: 'shellscript' }] }), 'linguist', 'Shell');
  assert.equal(entry.syntax.status, 'failed');
  assert.equal(entry.bindings.find((binding) => binding.value === '.sh').status, 'verified');
  const unobserved = row(languageMatrix([fixture], [variant], { skipped: false, files: [] }), 'linguist', 'Shell');
  assert.equal(unobserved.bindings.find((binding) => binding.value === '.sh').status, 'unobserved');
});
