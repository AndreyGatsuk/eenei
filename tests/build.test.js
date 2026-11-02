const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getVariants } = require('../src/catalog');
const { compile } = require('../src/compile');

const root = path.join(__dirname, '..');
const manifest = require('../vscode/package.json');
const variants = getVariants();
const luminance = (hex) => [1, 3, 5].reduce((sum, offset, i) => {
  const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  return sum + linear * [0.2126, 0.7152, 0.0722][i];
}, 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05)
  / (Math.min(luminance(a), luminance(b)) + 0.05);

test('catalog and extension expose exactly the same standalone variants', () => {
  assert.ok(variants.length >= 4);
  assert.equal(new Set(variants.map(({ id }) => id)).size, variants.length);
  const families = new Map();
  for (const variant of variants) {
    const appearances = families.get(variant.family) || new Set();
    appearances.add(variant.appearance);
    families.set(variant.family, appearances);
  }
  for (const appearances of families.values()) assert.deepEqual([...appearances].sort(), ['dark', 'light']);
  for (const appearance of ['dark', 'light']) {
    const peers = variants.filter((variant) => variant.appearance === appearance);
    const { string: firstString, comment: firstComment, docComment: firstDocComment, ...shared } = peers[0].colors;
    assert.equal(new Set(peers.map((variant) => variant.colors.string)).size, peers.length,
      'Each family must have a distinct secondary color');
    for (const variant of peers) {
      const { string, comment, docComment, ...colors } = variant.colors;
      assert.deepEqual(colors, shared, 'Families share blue and all surfaces');
    }
  }
  assert.deepEqual(manifest.contributes.themes, variants.map((variant) => ({
    label: variant.label,
    uiTheme: variant.appearance === 'dark' ? 'vs-dark' : 'vs',
    path: `./themes/${variant.filename}`,
  })));
  assert.deepEqual(fs.readdirSync(path.join(root, 'vscode/themes')).sort(), variants.map(({ filename }) => filename).sort());
  for (const grammar of manifest.contributes.grammars) {
    const injection = JSON.parse(fs.readFileSync(path.join(root, 'vscode', grammar.path), 'utf8'));
    assert.equal(injection.scopeName, grammar.scopeName);
  }
  assert.equal(manifest.contributes.configurationDefaults, undefined, 'Themes must not override editor settings');
});

for (const variant of variants) {
  test(`${variant.id}: generated output is complete, reproducible and readable`, () => {
    const theme = compile(variant);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'vscode/themes', variant.filename), 'utf8')), theme);
    assert.equal(theme.include, undefined);
    assert.equal(theme.semanticHighlighting, false);
    for (const [key, value] of Object.entries(theme.colors)) assert.match(value, /^#[\da-f]{6}([\da-f]{2})?$/i, key);
    for (const key of ['editor.background', 'sideBar.background', 'button.background', 'textLink.foreground', 'terminal.ansiRed']) assert.ok(theme.colors[key], key);
    const c = theme.colors;
    for (const [foreground, background] of [
      ['editor.foreground', 'editor.background'],
      ['button.foreground', 'button.background'],
      ['button.foreground', 'button.hoverBackground'],
      ['statusBar.debuggingForeground', 'statusBar.debuggingBackground'],
      ['textLink.foreground', 'editorHoverWidget.background'],
    ]) assert.ok(contrast(c[foreground], c[background]) >= 4.5, `${foreground} on ${background}`);
    for (const role of ['regular', 'important', 'string', 'comment', 'docComment', 'insignificant']) {
      assert.ok(contrast(variant.colors[role], c['editor.background']) >= 4.5,
        `${variant.id}: ${role} must remain readable as normal-size editor text`);
    }
    if (variant.appearance === 'light') {
      for (const role of ['docComment', 'insignificant']) {
        assert.ok(contrast(variant.colors[role], c['editor.lineHighlightBackground']) >= 4.5,
          `${variant.id}: ${role} must also remain readable on the active line`);
      }
    }
    const changed = compile({ ...variant, colors: { ...variant.colors, accent: '#9168af' } });
    for (const key of ['button.background', 'editorCursor.foreground', 'textLink.foreground', 'tab.activeBorder']) {
      assert.equal(changed.colors[key], '#9168af', key);
    }
    assert.deepEqual(changed.tokenColors, theme.tokenColors, 'Independent UI accent must not change syntax');
    for (const [key, color] of Object.entries(variant.status)) assert.equal(changed.colors[key], color, key);
  });
}
