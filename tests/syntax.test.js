const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const textmate = require('vscode-textmate');
const { getVariants } = require('../src/catalog');
const { compile } = require('../src/compile');
const { languages, createRegistry } = require('../scripts/grammars');

const SAMPLES = path.join(__dirname, '..', 'samples');

const { checkTokens } = require('./helpers');

for (const variant of getVariants()) {
  test(`${variant.id}: representative syntax and sample grammars`, async (t) => {
    const registry = await createRegistry(compile(variant));
    t.after(() => registry.dispose());

    for (const [language, { scope, sample }] of Object.entries(languages)) {
      await t.test(`${language}: tokenize the complete sample`, async () => {
        const grammar = await registry.loadGrammar(scope);
        assert.ok(grammar, `Missing grammar ${scope}`);
        let stack = textmate.INITIAL;
        for (const line of fs.readFileSync(path.join(SAMPLES, sample), 'utf8').split('\n')) {
          const result = grammar.tokenizeLine2(line, stack);
          assert.equal(result.stoppedEarly, false, `${sample}: tokenization exceeded its time limit`);
          assert.ok(result.tokens.length >= 2, `${sample}: missing token metadata`);
          const colorMap = registry.getColorMap();
          for (let index = 1; index < result.tokens.length; index += 2) {
            assert.match(colorMap[(result.tokens[index] >>> 15) & 511], /^#[\da-f]{6}$/i);
          }
          stack = result.ruleStack;
        }
      });
    }

    await t.test('JSON and JSONC distinguish keys, values and comments', async () => {
      for (const language of ['json', 'jsonc']) {
        const grammar = await registry.loadGrammar(languages[language].scope);
        const source = '{"name": "Preview", "enabled": true, "port": 8080}';
        checkTokens(registry, grammar, variant.colors, source, [
          [0, 'name', 'regular'], [0, 'enabled', 'regular'], [0, 'port', 'regular'],
          [0, 'Preview', 'string'], [0, 'true', 'regular'], [0, '8080', 'regular'],
          [0, '{', 'insignificant'], [0, ':', 'insignificant'],
        ]);
      }
      const grammar = await registry.loadGrammar(languages.jsonc.scope);
      checkTokens(registry, grammar, variant.colors, '// A JSONC comment', [
        [0, 'A JSONC', 'comment', { italic: true }],
      ]);
    });

    await t.test('Markdown navigation and fenced code retain their own roles', async () => {
      const grammar = await registry.loadGrammar(languages.markdown.scope);
      const source = [
        '# Project overview',
        '',
        'Use `compose.yaml` and [Docs](https://example.com).',
        '',
        '> A helpful note with **emphasis**.',
        '',
        '```typescript',
        'if (active) return "Ready";',
        '```',
        '',
        '```yaml',
        'read_only: true',
        'replicas: 2',
        'command: |',
        '  echo ready',
        '```',
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, 'Project overview', 'important', { bold: true }],
        [0, '#', 'insignificant'],
        [2, 'compose.yaml', 'string'],
        [2, 'Docs', 'important'],
        [2, 'https://example.com', 'important'],
        [4, 'A helpful note', 'comment'],
        [4, 'emphasis', 'comment', { bold: true }],
        [7, 'if', 'important'], [7, 'active', 'regular'],
        [7, 'return', 'important'], [7, 'Ready', 'string'],
        [11, 'true', 'regular'], [12, '2', 'regular'],
        [13, '|', 'insignificant'], [14, 'echo ready', 'string'],
      ]);
    });

    await t.test('JS, TS and JSX interpolation does not leak string color', async () => {
      const source = 'const label = `Project: ${project.name ?? "Untitled"}`;';
      for (const language of ['javascript', 'typescript', 'jsx', 'tsx']) {
        const grammar = await registry.loadGrammar(languages[language].scope);
        checkTokens(registry, grammar, variant.colors, source, [
          [0, 'Project:', 'string'], [0, 'project', 'regular'], [0, 'name', 'regular'],
          [0, 'Untitled', 'string'], [0, '??', 'regular'], [0, '${', 'insignificant'],
        ]);
      }
      for (const language of ['jsx', 'tsx']) {
        const grammar = await registry.loadGrammar(languages[language].scope);
        checkTokens(registry, grammar, variant.colors, '<button title="Preview" disabled={busy}>{project.name}</button>', [
          [0, 'button', 'regular'], [0, 'title', 'regular'], [0, 'Preview', 'string'],
          [0, 'busy', 'regular'], [0, 'project', 'regular'], [0, 'name', 'regular'],
        ]);
      }
    });

    await t.test('Docker RUN shell and exec forms keep separate grammars', async () => {
      const grammar = await registry.loadGrammar(languages.dockerfile.scope);
      const source = [
        '# Build the application',
        'FROM node:24-alpine AS build',
        'RUN if [ "$APP_ENV" = "production" ]; then echo "ready"; fi',
        'RUN ["node", "--version"]',
        'COPY . /app',
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, 'Build the', 'comment', { italic: true }],
        [1, 'FROM', 'insignificant'], [1, 'node:24-alpine', 'regular'],
        [2, 'RUN', 'insignificant'], [2, 'if', 'important'],
        [2, 'APP_ENV', 'regular'], [2, 'production', 'string'], [2, 'ready', 'string'],
        [3, 'RUN', 'insignificant'], [3, 'node', 'string'],
        [4, 'COPY', 'insignificant'],
      ]);
    });

    await t.test('Environment and ignore files remain readable without heuristics', async () => {
      const grammar = await registry.loadGrammar(languages.dotenv.scope);
      const source = [
        '# Public example values',
        'PORT=8080',
        'PUBLIC_URL="http://localhost:${PORT}"',
        "GREETING='Hello # literal text'",
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, 'Public example', 'comment', { italic: true }],
        [1, 'PORT', 'regular'], [1, '=', 'insignificant'], [1, '8080', 'string'],
        [2, 'http://localhost:', 'string'], [2, 'PORT}', 'regular'],
        [3, 'Hello # literal', 'string', { italic: false }],
      ]);
      const ignore = await registry.loadGrammar(languages.gitignore.scope);
      checkTokens(registry, ignore, variant.colors, '# Build output\ndist/\n!.env.example', [
        [0, 'Build output', 'comment', { italic: true }],
        [1, 'dist/', 'regular'], [2, '.env.example', 'regular'],
      ]);
    });

    await t.test('Diff additions and removals use shared status colors', async () => {
      const grammar = await registry.loadGrammar(languages.diff.scope);
      const colors = {
        ...variant.colors,
        added: variant.status['gitDecoration.addedResourceForeground'].slice(0, 7),
        removed: variant.status['gitDecoration.deletedResourceForeground'].slice(0, 7),
      };
      const source = '--- a/name.txt\n+++ b/name.txt\n@@ -1 +1 @@\n-Old name\n+New name';
      checkTokens(registry, grammar, colors, source, [
        [0, 'a/name', 'removed'], [1, 'b/name', 'added'],
        [2, '@@', 'important'], [3, 'Old name', 'removed'], [4, 'New name', 'added'],
      ]);
    });

    await t.test('Lua operator injection preserves comments, long strings and assignment', async () => {
      const grammar = await registry.loadGrammar(languages.lua.scope);
      const source = [
        'local value = 6 - 2 -- subtract without consuming the comment',
        '--[==[ + << { stay in a comment ]==]',
        'local text = [==[ + << { stay in a string ]==]',
        'local quoted = "-- + {"',
        '--- Document the value.',
        'local result = value // 2 & 3',
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, '=', 'insignificant'], [0, '-', 'regular'],
        [0, '-- subtract', 'comment', { italic: true }],
        [0, 'subtract', 'comment', { italic: true }],
        [1, '+', 'comment', { italic: true }],
        [2, '+', 'string'], [2, '{', 'string'], [3, '--', 'string'],
        [4, 'Document', 'docComment', { italic: true }],
        [5, '//', 'regular'], [5, '&', 'regular'],
      ]);
    });

    await t.test('BibTeX strings preserve nesting, comments, numbers and macro names', async () => {
      const grammar = await registry.loadGrammar(languages.bibtex.scope);
      const source = [
        '% "A comment" is not a field.',
        '@article{preview,',
        '  title = {A {nested} preview},',
        '  note = "eenei",',
        '  year = 2026,',
        '  month = jan',
        '}',
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, 'A comment', 'comment', { italic: true }],
        [2, 'nested', 'string', { italic: false }], [3, 'eenei', 'string'],
        [4, '2026', 'regular'], [5, 'jan', 'regular'],
      ]);
    });

    await t.test('Razor markup attributes do not consume C# generics, comments or strings', async () => {
      const grammar = await registry.loadGrammar(languages.razor.scope);
      const source = [
        '@{',
        '  // <h1 class="comment">',
        '  var text = "<h1>";',
        '  var items = new List<Project>();',
        '}',
        '@if (active) {',
        '  <h1 class="preview">Project</h1>',
        '}',
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [1, 'comment', 'comment', { italic: true }], [2, '<h1>', 'string'],
        [3, 'Project', 'regular'], [6, 'preview', 'string', { italic: false }],
      ]);
    });

    await t.test('SQL structure, calculations and literal identifiers have separate roles', async () => {
      const grammar = await registry.loadGrammar(languages.sql.scope);
      const source = [
        "SELECT CASE WHEN active THEN 'WHEN CASE' ELSE 'END' END AS status;",
        '-- SELECT FROM WHERE CASE AND are literal comment text here.',
        'SELECT "WHEN", `FROM`, [WHERE], selected_name, from_table FROM projects;',
        'select id from projects where active and id > 0 or archived;',
        'SELECT p.name FROM projects p LEFT OUTER JOIN events e ON p.id = e.project_id;',
        'SELECT LEFT(name, 2) AS prefix FROM projects;',
        'WITH active_projects AS (SELECT id FROM projects) SELECT id FROM active_projects UNION SELECT id FROM archived;',
        'SELECT category, COUNT(*) FROM projects GROUP BY category HAVING COUNT(*) > 1 ORDER BY category LIMIT 20 OFFSET 5;',
        "INSERT INTO projects (name) VALUES ('SELECT FROM WHERE') RETURNING id;",
        'UPDATE projects SET archived = FALSE WHERE id = 42;',
        'DELETE FROM projects WHERE NOT active OR id IN (1, 2);',
        'SELECT price * quantity, first_name || last_name FROM projects WHERE name LIKE \'A%\' AND rating IS NOT NULL;',
        '/* SELECT JOIN */ SELECT @SELECT, id FROM projects;',
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, 'SELECT', 'important'], [0, 'CASE', 'important'], [0, 'WHEN', 'important'],
        [0, 'THEN', 'important'], [0, 'ELSE', 'important'],
        [0, "'WHEN CASE'", 'string'], [0, "'END'", 'string'], [0, 'AS status', 'insignificant'],
        [1, 'SELECT', 'comment', { italic: true }],
        [2, 'WHEN', 'string'], [2, 'FROM', 'string'], [2, 'WHERE', 'regular'],
        [2, 'selected_name', 'regular'], [2, 'from_table', 'regular'],
        [3, 'select', 'important'], [3, 'from', 'important'], [3, 'where', 'important'],
        [3, 'and', 'regular'], [3, 'or', 'regular'], [3, '>', 'regular'],
        [4, 'LEFT', 'important'], [4, 'OUTER', 'important'], [4, 'JOIN', 'important'], [4, 'ON', 'important'],
        [5, 'LEFT', 'regular'], [5, 'prefix', 'regular'],
        [6, 'WITH', 'important'], [6, 'UNION', 'important'],
        [7, 'GROUP', 'important'], [7, 'BY', 'important'], [7, 'HAVING', 'important'],
        [7, 'ORDER', 'important'], [7, 'LIMIT', 'important'], [7, 'OFFSET', 'important'],
        [7, 'COUNT', 'regular'], [7, '20', 'regular'],
        [8, 'INSERT', 'important'], [8, 'INTO', 'important'], [8, 'VALUES', 'important'], [8, 'RETURNING', 'important'],
        [8, 'SELECT FROM WHERE', 'string'], [9, 'UPDATE', 'important'], [9, 'SET', 'important'], [9, 'FALSE', 'regular'],
        [10, 'DELETE', 'important'], [10, 'NOT', 'regular'], [10, 'OR', 'regular'], [10, 'IN', 'regular'],
        [11, '*', 'regular'], [11, '||', 'regular'], [11, 'LIKE', 'regular'], [11, 'IS', 'regular'], [11, 'NULL', 'regular'],
        [12, 'SELECT JOIN', 'comment', { italic: true }], [12, '@SELECT', 'regular'],
      ]);
    });

    await t.test('Bundled TOML colors lockfile structure without extra extensions', async () => {
      const manifest = require('../vscode/package.json');
      const language = manifest.contributes.languages.find(({ id }) => id === 'toml');
      assert.ok(language.extensions.includes('.toml'));
      assert.ok(language.filenames.includes('Cargo.lock'));
      assert.ok(language.filenames.includes('uv.lock'));
      const grammar = await registry.loadGrammar('source.toml');
      const source = [
        '# Generated lockfile example',
        'version = 1',
        '[[package]]',
        'name = "theme-lab-preview"',
        'requires-python = ">=3.12"',
        'source = { registry = "https://pypi.org/simple" }',
        'dependencies = [',
        '  { name = "idna" },',
        ']',
        'enabled = true',
        `"quoted-key" = 'literal'`,
        'description = """',
        'A multiline value',
        '"""',
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, '# Generated', 'comment', { italic: true }],
        [1, 'version', 'regular'],
        [1, '=', 'insignificant'],
        [1, '1', 'regular'],
        [2, '[[', 'insignificant'],
        [2, 'package', 'regular'],
        [3, 'name', 'regular'],
        [3, 'theme-lab-preview', 'string', { italic: false }],
        [4, 'requires-python', 'regular'],
        [4, '>=3.12', 'string'],
        [5, 'registry', 'regular'],
        [5, '{', 'insignificant'],
        [5, 'https://pypi.org/simple', 'string'],
        [7, 'idna', 'string'],
        [7, ',', 'insignificant'],
        [9, 'true', 'regular'],
        [10, 'quoted-key', 'regular'],
        [10, 'literal', 'string'],
        [12, 'A multiline', 'string'],
      ]);
    });

    await t.test('YAML keys do not inherit string color', async () => {
      const grammar = await registry.loadGrammar(languages.yaml.scope);
      const source = [
        '# Local development',
        'services:',
        '  web:',
        '    image: nginx:alpine',
        '    "APP_ENV": development',
        "    'LOG_LEVEL': \"info\"",
        '    read_only: true',
        '    enabled: false',
        '    replicas: 2',
        '    optional: null',
        '    labels: {app: "example", tier: frontend}',
        '    ports:',
        '      - "8080:80"',
        '    command: |',
        "      echo 'ready'",
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, '# Local', 'comment', { italic: true }],
        [1, 'services', 'regular', { italic: false }],
        [1, ':', 'insignificant'],
        [2, 'web', 'regular'],
        [3, 'image', 'regular'],
        [3, 'nginx:alpine', 'string'],
        [4, 'APP_ENV', 'regular'],
        [4, '"', 'insignificant'],
        [4, 'development', 'string'],
        [5, 'LOG_LEVEL', 'regular'],
        [5, "'", 'insignificant'],
        [5, 'info', 'string'],
        [6, 'true', 'regular'],
        [7, 'false', 'regular'],
        [8, '2', 'regular'],
        [9, 'null', 'regular'],
        [10, 'app', 'regular'],
        [10, 'example', 'string'],
        [10, ',', 'insignificant'],
        [10, 'tier', 'regular'],
        [12, '-', 'insignificant'],
        [12, '8080:80', 'string'],
        [13, '|', 'insignificant'],
        [14, 'echo', 'string'],
      ]);
    });

    await t.test('Rust control flow, strings and definition injections', async () => {
      const grammar = await registry.loadGrammar(languages.rust.scope);
      const source = [
        '/// A documented function.',
        'pub fn project_name() -> Option<&\'static str> {',
        '    // Names are shown in the navigation panel.',
        '    if true {',
        '        return Some("Example");',
        '    }',
        '    None',
        '}',
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, 'A documented', 'docComment', { italic: true }],
        [1, 'fn', 'insignificant'],
        [1, 'project_name', 'regular', { bold: true }],
        [2, 'Names are', 'comment', { italic: true }],
        [3, 'if', 'important'],
        [4, 'return', 'important'],
        [4, 'Some', 'regular'],
        [4, 'Example', 'string', { italic: false }],
        [6, 'None', 'regular'],
      ]);
    });

    await t.test('Python flow, comments, docstrings and injections', async () => {
      const grammar = await registry.loadGrammar(languages.python.scope);
      const source = [
        'from os.path import join',
        '',
        'def project_name(active: bool) -> str:',
        '    """A documented function."""',
        '    # Names are shown in the navigation panel.',
        '    if active:',
        '        return "Example"',
        '    return "Untitled"',
      ].join('\n');
      checkTokens(registry, grammar, variant.colors, source, [
        [0, 'from', 'insignificant'],
        [0, 'os.path', 'insignificant'],
        [0, 'join', 'regular'],
        [2, 'def', 'insignificant'],
        [2, 'project_name', 'regular', { bold: true }],
        [3, 'A documented', 'docComment', { italic: true }],
        [4, 'Names are', 'comment', { italic: true }],
        [5, 'if', 'important'],
        [6, 'return', 'important'],
        [6, 'Example', 'string', { italic: false }],
      ]);
    });
  });
}
