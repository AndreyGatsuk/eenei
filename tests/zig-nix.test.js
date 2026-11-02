const test = require('node:test');
const { getVariants } = require('../src/catalog');
const { compile } = require('../src/compile');
const { createRegistry } = require('../scripts/grammars');
const { checkTokens } = require('./helpers');

for (const variant of getVariants()) {
  test(`${variant.id}: Nix keeps paths, accessors, strings and interpolated flow distinct`, async (t) => {
    const registry = await createRegistry(compile(variant));
    t.after(() => registry.dispose());
    const grammar = await registry.loadGrammar('source.nix');
    const source = [
      '{ active ? true }:',
      'let',
      '  # if then else + / stay in this comment.',
      '  name = "if then else + /";',
      '  dotted = { iffy-name = "Ready"; };',
      '  path = /tmp/theme-lab;',
      '  relative = ./project-name;',
      '  nested = "Project: ${if active then name else "Archived"}";',
      '  math = 12 / 3 + 2;',
      '  access = dotted.iffy-name;',
      '  negated = !active;',
      '  old = /* if + remain a comment */ 2;',
      'in',
      'assert active;',
      '{ inherit path relative nested math access negated old; }',
    ].join('\n');
    checkTokens(registry, grammar, variant.colors, source, [
      [1, 'let', 'insignificant'], [2, 'if', 'comment', { italic: true }],
      [3, 'if', 'string'], [4, 'iffy-name', 'regular'],
      [5, '/tmp/theme-lab', 'string'], [6, './project-name', 'string'],
      [7, 'Project:', 'string'], [7, 'if', 'important'], [7, 'then', 'important'],
      [7, 'name', 'regular'], [7, 'else', 'important'], [7, 'Archived', 'string'],
      [8, '/', 'regular'], [8, '+', 'regular'], [9, '.', 'insignificant'],
      [9, 'iffy-name', 'regular'], [10, '!', 'regular'],
      [11, 'if', 'comment', { italic: true }], [12, 'in', 'insignificant'], [13, 'assert', 'important'],
    ]);
    checkTokens(registry, grammar, variant.colors, 'with { title = "eenei"; }; title', [
      [0, 'with', 'insignificant'], [0, 'eenei', 'string'],
    ]);
  });

  test(`${variant.id}: Zig imports and logical operators do not alter strings or ordinary builtins`, async (t) => {
    const registry = await createRegistry(compile(variant));
    t.after(() => registry.dispose());
    const grammar = await registry.loadGrammar('source.zig');
    const source = [
      '// @import and or remain a comment.',
      '/// Document and @import.',
      'const text = "and or @import";',
      'const ready = active and count > 0 or fallback;',
      'const std = @import("std");',
      'const value = @as(u8, 1);',
      'const android = 1;',
      'test "and or" {}',
    ].join('\n');
    checkTokens(registry, grammar, variant.colors, source, [
      [0, '@import', 'comment', { italic: true }], [1, 'Document', 'docComment', { italic: true }],
      [2, 'and', 'string'], [2, '@import', 'string'],
      [3, 'and', 'regular'], [3, 'or', 'regular'], [3, '>', 'regular'],
      [4, '@import', 'insignificant'], [4, 'std"', 'string'],
      [5, '@as', 'regular'], [6, 'android', 'regular'],
      [7, 'test', 'insignificant'], [7, 'and', 'string'],
    ]);
  });
}
