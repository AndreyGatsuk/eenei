const fs = require('node:fs');
const path = require('node:path');
const textmate = require('vscode-textmate');
const { createRegistry } = require('../grammars');
const { fixturePath } = require('../fixtures');
const { compile } = require('../../src/compile');
const { createTrace, verifiesStyle } = require('./rule-coverage');

const root = path.join(__dirname, '../..');
const facetStatus = (facet) => !facet ? 'not-applicable'
  : facet.assertions > 0 ? 'verified' : facet.observedSamples.length ? 'observed' : 'unobserved';
function selectorStatus(selector) {
  const applicable = ['foreground', 'fontStyle'].map((field) => selector[field]).filter(Boolean);
  if (applicable.every((facet) => facet.assertions > 0)) return 'verified';
  if (applicable.some((facet) => facet.assertions > 0)) return 'partial';
  return applicable.some((facet) => facet.observedSamples.length) ? 'observed' : 'unobserved';
}

async function measureVariant(variant, fixtures, assertions) {
  const theme = compile(variant);
  const registry = await createRegistry(theme);
  const foreground = await createTrace(theme, 'foreground');
  const fontStyle = await createTrace(theme, 'fontStyle');
  const selectors = foreground.entries.map((entry, index) => ({
    index, ruleIndex: entry.ruleIndex, name: entry.name, scope: entry.scope,
    ...Object.fromEntries(['foreground', 'fontStyle'].map((field) => [field,
      entry.settings[field] === undefined ? null : {
        value: entry.settings[field], observedSamples: new Set(), assertions: 0,
      },
    ])),
  }));
  const rows = [];
  try {
    for (const fixture of fixtures) {
      const row = { sample: fixture.sample, format: fixture.id, scope: fixture.scope,
        languageId: fixture.languageId, inferred: Boolean(fixture.inferred),
        grammar: 'not-checked', tokens: 0, observedScopes: 0, colors: [],
        selectorsObserved: [], colorAssertions: 0, styleAssertions: 0, failedAssertions: 0 };
      rows.push(row);
      if (!fixture.scope || !fixture.exists) {
        row.grammar = fixture.exists ? 'unknown-format' : 'missing-file';
        continue;
      }
      try {
        const source = fs.readFileSync(fixturePath(fixture), 'utf8');
        const grammar = await registry.loadGrammar(fixture.scope);
        if (!grammar) throw new Error(`Missing grammar: ${fixture.scope}`);
        const colors = new Set();
        const scopes = new Set();
        let stack = textmate.INITIAL;
        for (const line of source.split('\n')) {
          const scoped = grammar.tokenizeLine(line, stack);
          const result = grammar.tokenizeLine2(line, stack);
          if (scoped.stoppedEarly || result.stoppedEarly) throw new Error('Tokenization timed out');
          stack = result.ruleStack;
          for (const token of scoped.tokens) for (const scope of token.scopes) scopes.add(scope);
          for (let index = 0; index < result.tokens.length; index += 2) {
            const end = index + 2 < result.tokens.length ? result.tokens[index + 2] : line.length;
            if (!line.slice(result.tokens[index], end).trim()) continue;
            colors.add(registry.getColorMap()[(result.tokens[index + 1] >>> 15) & 511]);
            row.tokens++;
          }
        }
        for (const required of fixture.requiredScopes || []) {
          if (!scopes.has(required)) throw new Error(`Embedded scope missing: ${required}`);
        }
        const seen = new Set();
        for (const [field, trace] of [['foreground', foreground], ['fontStyle', fontStyle]]) {
          await trace.scan(fixture.scope, source, (index) => {
            if (index === null) return;
            selectors[index][field].observedSamples.add(fixture.sample);
            seen.add(index);
          });
        }
        row.grammar = 'passed';
        row.colors = [...colors].sort();
        row.observedScopes = scopes.size;
        row.selectorsObserved = [...seen].sort((a, b) => a - b);
      } catch (error) {
        row.grammar = 'failed';
        row.error = error.message;
      }
      const related = assertions.filter((assertion) => assertion.actual.scopes[0] === fixture.scope
        && (!fixture.assertionScope || assertion.actual.scopes.includes(fixture.assertionScope)));
      row.colorAssertions = related.length;
      row.styleAssertions = related.filter((assertion) => Object.keys(assertion.styles).length).length;
      row.failedAssertions = related.filter((assertion) => !assertion.passed).length;
    }

    // A selector receives proof only when the engine chose it at an independently
    // asserted position, not merely when its color happens to equal another rule.
    const cache = { foreground: new Map(), fontStyle: new Map() };
    let untracedAssertions = 0;
    for (const assertion of assertions) {
      if (!assertion.passed) continue;
      const scope = assertion.actual.scopes[0];
      if (!scope) { untracedAssertions++; continue; }
      const offset = assertion.source.split('\n')[assertion.line].indexOf(assertion.text);
      const key = `${scope}\u0000${assertion.source}`;
      for (const [field, trace] of [['foreground', foreground], ['fontStyle', fontStyle]]) {
        if (field === 'fontStyle' && !Object.keys(assertion.styles).length) continue;
        if (!cache[field].has(key)) cache[field].set(key, await trace.winners(scope, assertion.source));
        const token = cache[field].get(key).find((token) =>
          token.line === assertion.line && token.start <= offset && token.end > offset);
        if (token?.index === null || token?.index === undefined) continue;
        const selector = selectors[token.index];
        if (field === 'foreground' && selector.foreground.value.toLowerCase() === assertion.expectedColor.toLowerCase()) {
          selector.foreground.assertions++;
        }
        if (field === 'fontStyle' && verifiesStyle(selector.fontStyle.value, assertion.styles)) {
          selector.fontStyle.assertions++;
        }
      }
    }
    for (const selector of selectors) {
      for (const field of ['foreground', 'fontStyle']) {
        if (!selector[field]) continue;
        selector[field].observedSamples = [...selector[field].observedSamples].sort();
        selector[field].status = facetStatus(selector[field]);
      }
      selector.status = selectorStatus(selector);
    }
    const rules = theme.tokenColors.map((rule, index) => {
      const branches = selectors.filter(({ ruleIndex }) => ruleIndex === index);
      return {
        index, name: rule.name || (Array.isArray(rule.scope) ? rule.scope.join(', ') : rule.scope),
        selectors: branches,
        status: branches.every(({ status }) => status === 'verified') ? 'verified'
          : branches.some(({ status }) => status === 'verified' || status === 'partial') ? 'partial'
            : branches.some(({ status }) => status === 'observed') ? 'observed' : 'unobserved',
      };
    });
    const facets = selectors.flatMap((selector) => [selector.foreground, selector.fontStyle].filter(Boolean));
    return {
      id: variant.id, label: variant.label, colors: variant.colors, files: rows, rules,
      assertions: { total: assertions.length, passed: assertions.filter(({ passed }) => passed).length,
        styles: assertions.filter(({ styles }) => Object.keys(styles).length).length, untraced: untracedAssertions },
      summary: {
        rules: rules.length, rulesVerified: rules.filter(({ status }) => status === 'verified').length,
        selectors: selectors.length, selectorsVerified: selectors.filter(({ status }) => status === 'verified').length,
        facets: facets.length, facetsVerified: facets.filter(({ status }) => status === 'verified').length,
      },
    };
  } finally {
    registry.dispose(); foreground.dispose(); fontStyle.dispose();
  }
}
module.exports = { measureVariant, facetStatus, selectorStatus };
