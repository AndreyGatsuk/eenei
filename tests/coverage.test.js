const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getVariants } = require('../src/catalog');
const { compile } = require('../src/compile');
const { getFixtures, fixturePath } = require('../scripts/fixtures');
const { createRegistry } = require('../scripts/grammars');
const { checkTokens } = require('./helpers');
const cases = require('./coverage-cases.json');

// Expectations are authored from the design roles, never inferred from the
// current theme colors or from which selector the analyzer happens to choose.
for (const variant of getVariants()) {
  test(`${variant.id}: explicit expectations for the full sample corpus`, async (t) => {
    const registry = await createRegistry(compile(variant));
    t.after(() => registry.dispose());
    for (const [sample, assertions] of Object.entries(cases)) {
      await t.test(sample, async () => {
        const fixture = getFixtures().find((fixture) => fixture.sample === sample);
        assert.ok(fixture?.scope, `Missing fixture registration: ${sample}`);
        const source = fs.readFileSync(fixturePath(fixture), 'utf8');
        const lines = source.split('\n');
        const checks = assertions.map(([fragment, token, role, styles]) => {
          const matches = lines.flatMap((line, index) => line.includes(fragment) ? [index] : []);
          assert.equal(matches.length, 1, `Expected exactly one ${JSON.stringify(fragment)} in ${sample}`);
          return [matches[0], token, role, styles];
        });
        const colors = { ...variant.colors,
          added: variant.status['gitDecoration.addedResourceForeground'].slice(0, 7),
          removed: variant.status['gitDecoration.deletedResourceForeground'].slice(0, 7),
        };
        checkTokens(registry, await registry.loadGrammar(fixture.scope), colors, source, checks);
      });
    }
  });
}
