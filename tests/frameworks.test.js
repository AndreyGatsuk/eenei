const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const textmate = require('vscode-textmate');
const frameworks = require('../scripts/frameworks.json');
const { getVariants } = require('../src/catalog');
const { compile } = require('../src/compile');
const { createRegistry } = require('../scripts/grammars');
const { checkTokens } = require('./helpers');

// Use only the grammars registered by the packaged extension, with no test-only loading.
const cases = {
  vue: [
    ['const name', 'Navigate', 'string'],
    ['v-if=', 'v-if', 'important'],
    ['v-if=', 'active', 'regular'],
    ['v-if=', '"', 'insignificant'],
    ['{{ name }}', 'name', 'regular'],
    ['<!-- Directives', 'Directives', 'comment', { italic: true }],
  ],
  svelte: [
    ['let name', 'Navigate', 'string'],
    ['{#if active}', 'if', 'important'],
    ['{#if active}', 'active', 'regular'],
    ['<button onclick', 'active', 'regular'],
    ['<button onclick', 'name', 'regular'],
    ['<!-- Control flow', 'Control flow', 'comment', { italic: true }],
  ],
  astro: [
    ['const name', 'Navigate', 'string'],
    ['<h1>{name}', 'name', 'regular'],
    ['{active &&', 'active', 'regular'],
    ['{active &&', 'status', 'string'],
    ['<!-- Frontmatter', 'Frontmatter', 'comment', { italic: true }],
  ],
  mdx: [
    ['export const', 'Navigate', 'string'],
    ['# Project overview', 'Project overview', 'important', { bold: true }],
    // Upstream MDX leaves link labels unscoped; the destination carries the link role.
    ['Read the', 'project guide', 'regular'],
    ['Read the', 'https://example.com', 'important'],
    ['Read the', 'compose.yaml', 'string'],
    ['<ProjectCard', 'project}', 'regular'],
    ['const label', 'Project:', 'string'],
    ['const label', 'project', 'regular'],
    ['read_only:', 'true', 'regular'],
    ['replicas:', '2', 'regular'],
  ],
  jinja: [
    ['{# A server', 'server-rendered', 'comment', { italic: true }],
    ['{% for', 'for', 'important'],
    ['{% for', 'projects', 'regular'],
    ['{% if', 'if', 'important'],
    ['<a href', 'project.url', 'regular'],
    ['<a href', '{{', 'insignificant'],
    ['<a href', 'escape', 'regular'],
    ['<a href', 'Open project', 'string'],
  ],
  graphql: [
    ['# Select active', 'Select active', 'comment', { italic: true }],
    ['query Projects', 'query', 'insignificant'],
    ['projects(limit', 'projects', 'regular'],
    ['projects(limit', 'Navigate', 'string'],
    ['projects(limit', 'true', 'regular'],
  ],
};

test('Framework samples have packaged language associations, grammars and licenses', () => {
  const manifest = require('../vscode/package.json');
  for (const framework of frameworks) {
    const main = manifest.contributes.grammars.find(({ scopeName }) => scopeName === framework.scope);
    assert.ok(main?.language, `${framework.id}: no registered language grammar`);
    const language = manifest.contributes.languages.find(({ id }) => id === main.language);
    assert.ok(language, `${framework.id}: missing language definition`);
    assert.ok(language.extensions.some((extension) => framework.sample.endsWith(extension)),
      `${framework.sample}: no filename association`);
    for (const grammar of framework.grammars) {
      const registered = manifest.contributes.grammars.find(({ scopeName }) => scopeName === grammar.scopeName);
      assert.ok(registered, grammar.scopeName);
      assert.ok(fs.existsSync(path.join(__dirname, '..', 'vscode', registered.path)), registered.path);
    }
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'vscode', language.configuration)), language.configuration);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'vscode/syntaxes/frameworks', framework.id, 'LICENSE.txt')));
  }
});

for (const framework of frameworks) {
  for (const variant of getVariants()) {
    test(`${variant.id}: ${framework.id} packaged grammar preserves language roles`, async (t) => {
      const registry = await createRegistry(compile(variant));
      t.after(() => registry.dispose());
      const grammar = await registry.loadGrammar(framework.scope);
      assert.ok(grammar, framework.scope);
      const source = fs.readFileSync(path.join(__dirname, '..', 'samples', framework.sample), 'utf8');
      const lines = source.split('\n');
      let stack = textmate.INITIAL;
      const scopes = new Set();
      for (const line of lines) {
        const result = grammar.tokenizeLine(line, stack);
        assert.equal(result.stoppedEarly, false);
        stack = result.ruleStack;
        for (const token of result.tokens) for (const scope of token.scopes) scopes.add(scope);
      }
      assert.ok([...scopes].some((scope) => scope.startsWith('string.')), 'String grammar was not loaded');
      assert.ok([...scopes].some((scope) => scope.startsWith('comment.')), 'Comment grammar was not loaded');
      const checks = (cases[framework.id] || require('./coverage-cases.json')[framework.sample]).map(([lineText, token, role, styles]) => {
        const line = lines.findIndex((line) => line.includes(lineText));
        assert.ok(line >= 0, `Missing fixture line: ${lineText}`);
        return [line, token, role, styles];
      });
      checkTokens(registry, grammar, variant.colors, source, checks);
    });
  }
}
