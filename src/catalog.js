const fs = require('node:fs');
const path = require('node:path');

const PALETTES = path.join(__dirname, 'palettes');
const FAMILY_ORDER = ['on-rose.json', 'on-dahlia.json', 'on-lilac.json', 'on-hellebore.json'];
const familyRank = (file) => {
  const index = FAMILY_ORDER.indexOf(file);
  return index < 0 ? FAMILY_ORDER.length : index;
};
const read = (file) => JSON.parse(fs.readFileSync(path.join(PALETTES, file), 'utf8'));
const roles = ['background', 'surface', 'raised', 'border', 'regular', 'insignificant',
  'docComment', 'important', 'string', 'comment', 'accent'];

function getVariants() {
  const base = read('base.json');
  const status = read('status.json');
  const ids = new Set();
  const variants = [];
  for (const file of fs.readdirSync(PALETTES).sort((a, b) => familyRank(a) - familyRank(b) || a.localeCompare(b))) {
    if (!file.endsWith('.json') || ['base.json', 'status.json'].includes(file)) continue;
    const family = read(file);
    if (!/^[a-z][a-z0-9-]*$/.test(family.id) || typeof family.name !== 'string' || !family.name.trim()) {
      throw new Error(`Invalid palette identity: ${file}`);
    }
    if (ids.has(family.id)) throw new Error(`Duplicate palette: ${family.id}`);
    ids.add(family.id);
    for (const appearance of ['dark', 'light']) {
      if (!family[appearance]) throw new Error(`Missing ${appearance} palette: ${file}`);
      const colors = { ...base[appearance], ...family[appearance] };
      colors.accent ??= colors.important;
      for (const role of roles) {
        if (!/^#[\da-f]{6}$/i.test(colors[role])) throw new Error(`Invalid ${role}: ${file} (${appearance})`);
      }
      variants.push({
        id: `${family.id}-${appearance}`,
        family: family.id,
        appearance,
        label: `Eenei ${family.name} ${appearance === 'dark' ? 'Dark' : 'Light'}`,
        filename: `${family.id}-${appearance}-color-theme.json`,
        colors,
        status: status[appearance],
      });
    }
  }
  if (!variants.length) throw new Error('No palettes found');
  return variants;
}

module.exports = { getVariants };
