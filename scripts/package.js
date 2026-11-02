const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const extension = path.join(root, 'vscode');
const repository = require('../vscode/package.json').repository.url.replace(/\.git$/, '');
const build = spawnSync(process.execPath, [path.join(__dirname, 'build.js')], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status || 1);

const output = path.join(root, 'dist');
fs.mkdirSync(output, { recursive: true });
const previews = path.join(extension, 'assets', 'previews');
fs.rmSync(previews, { recursive: true, force: true });
fs.cpSync(path.join(root, 'assets', 'previews'), previews, {
  recursive: true, filter: (file) => fs.statSync(file).isDirectory() || file.endsWith('.png'),
});
const palettes = path.join(extension, 'assets', 'palettes');
fs.rmSync(palettes, { recursive: true, force: true });
fs.cpSync(path.join(root, 'assets', 'palettes'), palettes, { recursive: true });
fs.copyFileSync(path.join(root, 'DESIGN.md'), path.join(extension, 'DESIGN.md'));
const branding = path.join(extension, 'assets', 'branding');
fs.mkdirSync(branding, { recursive: true });
fs.copyFileSync(path.join(root, 'assets', 'branding', 'logo.png'), path.join(branding, 'logo.png'));
const documentation = path.join(extension, 'docs');
fs.rmSync(documentation, { recursive: true, force: true });
fs.cpSync(path.join(root, 'docs'), documentation, { recursive: true });
const result = spawnSync(process.execPath, [
  require.resolve('@vscode/vsce/vsce'), 'package',
  '--baseContentUrl', `${repository}/blob/main/`,
  '--baseImagesUrl', `${repository.replace('github.com', 'raw.githubusercontent.com')}/main/`,
  '-o', path.join(output, 'eenei.vsix'),
], { cwd: extension, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exitCode = result.status || (result.error ? 1 : 0);
