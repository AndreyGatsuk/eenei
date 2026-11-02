const fs = require('node:fs');
const path = require('node:path');
const { palettePng } = require('./palette-image');

const roles = [
  ['background', 'Background'], ['surface', 'Surface'], ['raised', 'Raised surface'],
  ['border', 'Border'], ['regular', 'Text'], ['important', 'Frost blue'],
  ['string', 'Strings'], ['comment', 'Comments'], ['docComment', 'Documentation'],
  ['insignificant', 'Scaffolding'],
];
const stripRoles = ['background', 'surface', 'important', 'string', 'comment', 'docComment'];

function paletteMarkdown(variants) {
  const families = [...new Set(variants.map(({ family }) => family))];
  let text = '| Palette | Dark | Light |\n| --- | --- | --- |\n';
  for (const family of families) {
    const dark = variants.find((v) => v.family === family && v.appearance === 'dark');
    const light = variants.find((v) => v.family === family && v.appearance === 'light');
    const name = dark.label.replace(/ Dark$/, '');
    text += `| **${name}** | ![${dark.label} palette](assets/palettes/${dark.id}.png) | ![${light.label} palette](assets/palettes/${light.id}.png) |\n`;
  }
  text += '\nSwatches: background · surface · frost blue · strings · comments · documentation.\n';
  for (const family of families) {
    const dark = variants.find((v) => v.family === family && v.appearance === 'dark');
    const light = variants.find((v) => v.family === family && v.appearance === 'light');
    text += `\n<details>\n<summary>${dark.label.replace(/ Dark$/, '')} — color values</summary>\n\n| Role | Dark HEX | Light HEX |\n| --- | --- | --- |\n`;
    for (const [role, label] of roles) text += `| ${label} | \`${dark.colors[role].toUpperCase()}\` | \`${light.colors[role].toUpperCase()}\` |\n`;
    text += '\n</details>\n';
  }
  return text.trimEnd();
}
function writeDocumentation(root, variants) {
  const file = path.join(root, 'README.md');
  const current = fs.readFileSync(file, 'utf8');
  const pattern = /<!-- palettes:start -->[\s\S]*?<!-- palettes:end -->/g;
  if ([...current.matchAll(pattern)].length !== 1) throw new Error('README must contain exactly one generated palette section');
  const updated = current.replace(pattern, () => `<!-- palettes:start -->\n${paletteMarkdown(variants)}\n<!-- palettes:end -->`);
  if (updated !== current) fs.writeFileSync(file, updated);
  const output = path.join(root, 'assets', 'palettes');
  fs.mkdirSync(output, { recursive: true });
  const expected = new Set(variants.map(({ id }) => `${id}.png`));
  for (const file of fs.readdirSync(output)) if ((file.endsWith('.png') || file.endsWith('.svg')) && !expected.has(file)) fs.unlinkSync(path.join(output, file));
  for (const variant of variants) {
    const file = path.join(output, `${variant.id}.png`);
    const content = palettePng(stripRoles.map((role) => variant.colors[role]));
    if (!fs.existsSync(file) || !fs.readFileSync(file).equals(content)) fs.writeFileSync(file, content);
  }
}
module.exports = { paletteMarkdown, writeDocumentation };
