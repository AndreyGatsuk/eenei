const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getVariants } = require('../src/catalog');
const { compile } = require('../src/compile');
const { createRegistry } = require('../scripts/grammars');
const { tokenAt } = require('./helpers');

const root = path.join(__dirname, '..');
const customization = fs.readFileSync(path.join(root, 'docs/customization.md'), 'utf8');
const examples = [...customization.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));

test('documentation images and relative links exist in the repository', () => {
  for (const file of ['README.md', ...fs.readdirSync(path.join(root, 'docs')).map((name) => `docs/${name}`)]) {
    const markdown = fs.readFileSync(path.join(root, file), 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const match of markdown.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), target)), `${file}: ${target}`);
    }
  }
});

test('customization examples target real theme names and do not set unrelated editor preferences', () => {
  assert.equal(examples.length, 3);
  const labels = new Set(getVariants().map(({ label }) => `[${label}]`));
  for (const example of examples) {
    for (const [key, themes] of Object.entries(example)) {
      assert.ok(['workbench.colorCustomizations', 'editor.tokenColorCustomizations'].includes(key), key);
      for (const theme of Object.keys(themes)) assert.ok(labels.has(theme), theme);
    }
  }
});

test('documented no-italics example also clears Python comment and docstring delimiters', async () => {
  const variant = getVariants().find(({ id }) => id === 'on-lilac-dark');
  const theme = compile(variant);
  const overrides = examples[2]['editor.tokenColorCustomizations'][`[${variant.label}]`].textMateRules;
  theme.tokenColors.push(...overrides);
  const registry = await createRegistry(theme);
  try {
    const grammar = await registry.loadGrammar('source.python');
    const source = '# A note\n"""Documentation."""';
    for (const [line, text, color] of [
      [0, '#', variant.colors.comment], [0, 'A note', variant.colors.comment],
      [1, '"""', variant.colors.docComment], [1, 'Documentation', variant.colors.docComment],
    ]) {
      const token = tokenAt(registry, grammar, source, line, text);
      assert.equal(token.italic, false, text);
      assert.equal(token.color, color, text);
    }
  } finally { registry.dispose(); }
});

test('Marketplace README passes standard vsce image and link validation', async () => {
  const { ReadmeProcessor } = require('@vscode/vsce/out/package');
  const manifest = require('../vscode/package.json');
  const repository = manifest.repository.url.replace(/\.git$/, '');
  const processor = new ReadmeProcessor(manifest, {
    baseContentUrl: `${repository}/blob/main/`,
    baseImagesUrl: `${repository.replace('github.com', 'raw.githubusercontent.com')}/main/`,
  });
  const result = await processor.onFile({ path: 'extension/README.md',
    contents: fs.readFileSync(path.join(root, 'README.md')) });
  const readme = result.contents.toString();
  assert.ok(readme.includes(`${repository}/blob/main/docs/development.md`));
  assert.doesNotMatch(readme, /(?:\]\(|src=")[^\s"\)]*\.svg/);
  const images = [...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)|<img\b[^>]*src="([^"]+)"/g)];
  assert.ok(images.length >= 17, 'Validate the logo, palettes and all previews');
  for (const image of images) assert.match(image[1] || image[2], /^https:\/\//);
});
