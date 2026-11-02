const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { getFixtures } = require('./fixtures');

const root = path.join(__dirname, '..');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-lab-editor-'));
const reportFile = path.join(profile, 'report.json');
const env = { ...process.env, THEME_LAB_EDITOR_REPORT: reportFile,
  XDG_CONFIG_HOME: path.join(profile, 'config'), XDG_CACHE_HOME: path.join(profile, 'cache') };
for (const key of ['VSCODE_IPC_HOOK_CLI', 'VSCODE_PID', 'VSCODE_CWD']) delete env[key];
const result = spawnSync(process.env.CODE_BIN || 'code', [
  '--new-window', '--wait', '--skip-welcome', '--skip-release-notes',
  '--disable-workspace-trust', '--disable-extensions', '--disable-gpu',
  `--user-data-dir=${path.join(profile, 'user')}`,
  `--extensions-dir=${path.join(profile, 'extensions')}`,
  `--extensionDevelopmentPath=${path.join(root, 'vscode')}`,
  `--extensionTestsPath=${path.join(root, 'tests', 'editor', 'index.js')}`,
  path.join(root, 'samples'),
], { env, stdio: 'inherit', timeout: 240_000 });
if (result.error) console.error(result.error.message);
const report = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : undefined;
if (process.env.THEME_LAB_EDITOR_OUTPUT) {
  fs.writeFileSync(process.env.THEME_LAB_EDITOR_OUTPUT, JSON.stringify(report || {
    success: false, error: result.error?.message || 'VS Code did not return a report', files: [],
  }, null, 2) + '\n');
}
const verified = report?.success && report.files.length === getFixtures().filter((fixture) => fixture.scope && fixture.exists).length;
if (!verified) console.error('VS Code did not report successful editor integration checks.');
if (result.status !== 0 || result.error || !verified) console.error(`VS Code test profile and logs: ${profile}`);
else {
  console.log(`VS Code ${report.editorVersion}: ${report.files.length} languages recognized, native tokens captured; TSX errors: ${report.tsxErrors}`);
  fs.rmSync(profile, { recursive: true, force: true });
}
process.exitCode = result.status || (result.error || !verified ? 1 : 0);
