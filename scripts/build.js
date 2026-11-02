const fs = require('node:fs');
const path = require('node:path');
const { getVariants } = require('../src/catalog');
const { compile } = require('../src/compile');

const ROOT = path.join(__dirname, '..');
const extension = path.join(ROOT, 'vscode');
const output = path.join(extension, 'themes');
const variants = getVariants();

console.log('Building themes');
require('./documentation').writeDocumentation(ROOT, variants);
fs.mkdirSync(output, { recursive: true });
const expected = new Set(variants.map((variant) => variant.filename));
for (const file of fs.readdirSync(output)) {
  if (!expected.has(file) && file.endsWith('-color-theme.json')) fs.unlinkSync(path.join(output, file));
}
for (const variant of variants) {
  fs.writeFileSync(path.join(output, variant.filename), JSON.stringify(compile(variant), null, 2) + '\n');
}

const manifestFile = path.join(extension, 'package.json');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
manifest.contributes.themes = variants.map((variant) => ({
  label: variant.label,
  uiTheme: variant.appearance === 'dark' ? 'vs-dark' : 'vs',
  path: `./themes/${variant.filename}`,
}));
const manifestText = JSON.stringify(manifest, null, 2) + '\n';
if (fs.readFileSync(manifestFile, 'utf8') !== manifestText) fs.writeFileSync(manifestFile, manifestText);
fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(extension, 'LICENSE'));
fs.copyFileSync(path.join(ROOT, 'assets', 'branding', 'logo.png'), path.join(extension, 'icon.png')); 
fs.copyFileSync(path.join(ROOT, 'README.md'), path.join(extension, 'README.md'));
console.log(`Build complete: ${variants.length} themes`);
