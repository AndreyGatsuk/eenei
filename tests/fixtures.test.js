const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getFixtures, fixturePath } = require('../scripts/fixtures');
const { languageMatrix } = require('../scripts/coverage/language-matrix');

test('all baseline file languages and bundled modes have samples; only jsx-tags is internal', () => {
  const matrix = languageMatrix(getFixtures(), [], { skipped: true });
  const adopted = matrix.rows.filter((row) => ['vscode', 'bundled'].includes(row.source));
  assert.deepEqual(adopted.filter((row) => row.status === 'no-sample').map((row) => row.id), []);
  assert.deepEqual(adopted.filter((row) => row.status === 'internal').map((row) => row.id), ['jsx-tags']);
});

test('gallery and supplemental fixtures have unique, existing repository paths', () => {
  const fixtures = getFixtures();
  assert.equal(new Set(fixtures.map((fixture) => fixture.sample)).size, fixtures.length);
  for (const fixture of fixtures) {
    assert.ok(fixture.scope, fixture.sample);
    assert.ok(fixture.acceptedLanguageIds.length, fixture.sample);
    assert.ok(fs.existsSync(fixturePath(fixture)), fixture.sample);
  }
  const header = fixtures.find((fixture) => fixture.sample === 'tests/fixtures/extensions/preview.hpp');
  assert.ok(header);
  assert.equal(header.languageId, 'cpp');
  assert.equal(path.basename(fixturePath(header)), 'preview.hpp');
});

test('embedded coverage requires both host recognition and specific embedded assertions', () => {
  const embedded = getFixtures().filter((fixture) => fixture.coverageScopes);
  assert.ok(embedded.length >= 3);
  for (const fixture of embedded) {
    assert.ok(fixture.requiredScopes.includes(fixture.assertionScope), fixture.sample);
    assert.ok(!fixture.acceptedLanguageIds.some((id) => fixture.coverageLanguageIds?.includes(id)),
      'The embedded grammar must not be disguised as the host file language');
  }
});


test('additional C++ and PHP grammar coverage depends on their dedicated scope witnesses', () => {
  const fixtures = getFixtures();
  let rows = languageMatrix(fixtures, [], { skipped: true }).rows;
  for (const id of ['cpp', 'php']) assert.deepEqual(rows.find((row) => row.source === 'vscode' && row.id === id).untestedScopes, []);
  rows = languageMatrix(fixtures.filter((fixture) => !['tests/fixtures/embedded/macros.cpp', 'tests/fixtures/embedded/code.php'].includes(fixture.sample)), [], { skipped: true }).rows;
  assert.deepEqual(rows.find((row) => row.source === 'vscode' && row.id === 'cpp').untestedScopes, ['source.cpp.embedded.macro']);
  assert.deepEqual(rows.find((row) => row.source === 'vscode' && row.id === 'php').untestedScopes, ['source.php']);
});
