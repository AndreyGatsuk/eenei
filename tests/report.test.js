const test = require('node:test');
const assert = require('node:assert/strict');
const { createRegistry } = require('../scripts/grammars');
const { createTrace, verifiesStyle } = require('../scripts/coverage/rule-coverage');
const { getFixtures } = require('../scripts/fixtures');

const theme = {
  name: 'Coverage regression', colors: { 'editor.foreground': '#dddddd' },
  tokenColors: [
    { scope: 'source', settings: { foreground: '#dddddd' } },
    { scope: 'string', settings: { foreground: '#dddddd' } },
    { scope: 'string variable', settings: { foreground: '#dddddd' } },
    { scope: 'variable', settings: { fontStyle: 'bold' } },
  ],
};
const factory = async (theme) => {
  const registry = await createRegistry(theme);
  await registry.addGrammar({ scopeName: 'source.coverage', patterns: [
    { begin: '"', end: '"', name: 'string.quoted', patterns: [{ match: 'name', name: 'variable.other' }] },
  ] });
  return registry;
};

test('coverage identifies the winning selector even when all original colors match', async () => {
  const trace = await createTrace(theme, 'foreground', factory);
  try {
    const tokens = await trace.winners('source.coverage', '"name" plain');
    assert.equal(tokens.find(({ text }) => text === 'name').index, 2);
    assert.equal(tokens.find(({ text }) => text.includes('plain')).index, 0);
    assert.ok(!tokens.some(({ index }) => index === 3), 'Style-only rule must not claim foreground proof');
  } finally { trace.dispose(); }
});

test('font-style coverage is independent of foreground and requires explicit positive assertions', async () => {
  const trace = await createTrace(theme, 'fontStyle', factory);
  try {
    const tokens = await trace.winners('source.coverage', '"name"');
    assert.equal(tokens.find(({ text }) => text === 'name').index, 3);
    assert.equal(verifiesStyle('bold', { italic: false }), false);
    assert.equal(verifiesStyle('bold', { bold: true }), true);
    assert.equal(verifiesStyle('bold italic', { bold: true }), false);
  } finally { trace.dispose(); }
});

test('fixture discovery includes supplementary samples without losing filename recognition', () => {
  const fixtures = getFixtures();
  assert.ok(fixtures.some(({ sample }) => sample === 'notes.md'));
  assert.ok(fixtures.some(({ sample }) => sample === 'pyproject.toml'));
  assert.equal(new Set(fixtures.map(({ sample }) => sample)).size, fixtures.length);
  assert.deepEqual(fixtures.find(({ sample }) => sample === 'compose.yaml').acceptedLanguageIds, ['yaml', 'dockercompose']);
});

test('report keeps unasserted styles and skipped editor checks visible', () => {
  const { selectorStatus } = require('../scripts/coverage/measure-coverage');
  const { reportHtml } = require('../scripts/coverage/report-ui');
  const vm = require('node:vm');
  assert.equal(selectorStatus({
    foreground: { assertions: 1, observedSamples: ['sample.md'] },
    fontStyle: { assertions: 0, observedSamples: ['sample.md'] },
  }), 'partial');
  const payload = '</script><script>unsafe()</script>';
  const html = reportHtml({ generatedAt: 'test', environment: { node: 'test', grammars: 'test' },
    native: { skipped: true, files: [] }, checks: { passed: false }, errors: [payload], variants: [] });
  assert.ok(!html.includes(payload), 'Embedded JSON must not break out of its script element');
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(script), 'Report browser code must be syntactically valid');
  assert.ok(html.includes('Не запускался'));
});

test('strict coverage refuses missing style assertions and untested file grammars', () => {
  const { coverageGaps } = require('../scripts/coverage/report-gaps');
  const variant = { id: 'test', assertions: { untraced: 0 }, rules: [{ name: 'A rule', selectors: [{
    scope: 'markup.italic', foreground: { assertions: 2 }, fontStyle: { assertions: 0, status: 'observed' },
  }] }], files: [{ sample: 'sample.md', grammar: 'passed', colorAssertions: 2, styleAssertions: 0, failedAssertions: 0 }] };
  assert.deepEqual(coverageGaps([variant]).map(({ kind }) => kind), ['selector-property', 'file']);
  variant.rules[0].selectors[0].fontStyle.assertions = 1;
  variant.files[0].styleAssertions = 1;
  assert.deepEqual(coverageGaps([variant]), []);
  variant.files[0].grammar = 'unknown-format';
  assert.equal(coverageGaps([variant])[0].kind, 'file');
});


test('every format in the pinned Pustota test catalog has an independent registered sample', () => {
  const { referenceCoverage } = require('../scripts/coverage/reference-coverage');
  const reference = referenceCoverage(getFixtures());
  assert.match(reference.revision, /^[a-f0-9]{40}$/);
  assert.equal(reference.files.length, 38);
  assert.deepEqual(reference.files.filter((entry) => !entry.covered), []);
  const incomplete = referenceCoverage(getFixtures().filter(({ sample }) => sample !== 'sample.lua'));
  assert.equal(incomplete.files.find(({ upstream }) => upstream === 'Lua.lua').covered, false);
});
