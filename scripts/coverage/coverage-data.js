const fs = require('node:fs');
const path = require('node:path');

const themes = new WeakMap();
function registerRegistry(registry, theme) {
  themes.set(registry, theme.name);
}
function recordAssertion(registry, assertion) {
  const directory = process.env.THEME_LAB_COVERAGE_DIR;
  if (!directory) return;
  fs.mkdirSync(directory, { recursive: true });
  fs.appendFileSync(path.join(directory, `assertions-${process.pid}.jsonl`),
    JSON.stringify({ variant: themes.get(registry), ...assertion }) + '\n');
}
module.exports = { registerRegistry, recordAssertion };
