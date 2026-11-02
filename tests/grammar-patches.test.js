const test = require('node:test');
const assert = require('node:assert/strict');
const { applyGrammarPatches } = require('../scripts/grammar-patches');
const patch = { find: { name: 'keyword.other', match: 'if' }, replace: { name: 'keyword.control' }, reason: 'test scope correction' };

test('scope adaptation preserves grammar order and leaves the source untouched', () => {
  const grammar = { patterns: [{ name: 'string', match: 'path' }, { name: 'keyword.other', match: 'if' }] };
  const changed = applyGrammarPatches(grammar, [patch]);
  assert.equal(grammar.patterns[1].name, 'keyword.other');
  assert.deepEqual(changed.patterns, [{ name: 'string', match: 'path' }, { name: 'keyword.control', match: 'if' }]);
});

test('upstream drift and ambiguous rules stop adaptation instead of silently producing stale scopes', () => {
  assert.throws(() => applyGrammarPatches({ patterns: [] }, [patch]), /found 0/);
  const grammar = { patterns: [structuredClone(patch.find), structuredClone(patch.find)] };
  assert.throws(() => applyGrammarPatches(grammar, [patch]), /found 2/);
  assert.equal(grammar.patterns[0].name, 'keyword.other');
});
