const path = require('node:path');
const { getVariants } = require('../src/catalog');
const { render } = require('./render');

async function main() {
  for (const variant of getVariants()) {
    for (const language of ['python']) {
      const output = path.join(__dirname, '..', 'assets', 'previews', variant.id, `${language}.png`);
      await render(language, output, variant.id, path.join(__dirname, '..', 'assets', 'previews', 'example.py'));
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
