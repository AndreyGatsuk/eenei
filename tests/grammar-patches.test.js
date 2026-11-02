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

const { applyGrammarSourcePatches } = require('../scripts/grammar-patches');
const sourcePatches = require('../scripts/frameworks.json').find(({ id }) => id === 'svelte')
  .grammars.find(({ scopeName }) => scopeName === 'source.svelte').sourcePatches;

test('Svelte source repair preserves injection structure and valid block mappings in strict YAML', () => {
  const yaml = require('js-yaml');
  const source = [
    'scopeName: source.svelte',
    'injections:',
    "  'L:source.svelte':",
    "    patterns: [{begin: '>', end: '<',",
    '    contentName: source.js, patterns: [{ include: source.js }]}]',
    "  'L:source.ts':",
    '    patterns: [',
    "      {begin: '>', end: '<', contentName: source.ts}",
    '    ]',
    'repository:',
    '  expression:',
    '    contentName: meta.embedded.expression.svelte',
  ].join('\n');
  const patches = sourcePatches.filter(p => !p.find.includes('text.')).map(p => ({ ...p, count: 1 }));
  const parsed = yaml.load(applyGrammarSourcePatches(source, patches));
  assert.deepEqual(parsed.injections['L:source.svelte'].patterns, [{
    begin: '>', end: '<', contentName: 'source.js', patterns: [{ include: 'source.js' }],
  }]);
  assert.equal(parsed.injections['L:source.ts'].patterns[0].contentName, 'source.ts');
  assert.equal(parsed.repository.expression.contentName, 'meta.embedded.expression.svelte');
});

test('source repairs stop on upstream drift and leave unrelated source intact', () => {
  const patch = sourcePatches[0];
  assert.throws(() => applyGrammarSourcePatches('scopeName: source.svelte', [patch]), /expected 10 matches, found 0/);
  assert.equal(applyGrammarSourcePatches('scopeName: source.svelte'), 'scopeName: source.svelte');
});
