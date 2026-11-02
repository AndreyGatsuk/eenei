const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const build = () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
};
let pending;
for (const directory of ['src', 'scripts']) {
  fs.watch(path.join(root, directory), { recursive: true }, () => {
    clearTimeout(pending);
    pending = setTimeout(build, 100);
  });
}
build();
console.log('Watching source files. Press Ctrl+C to stop.');
