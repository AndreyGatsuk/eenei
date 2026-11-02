const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { getVariants } = require('../src/catalog');
const { getFixtures } = require('./fixtures');
const { measureVariant } = require('./coverage/measure-coverage');
const { reportHtml } = require('./coverage/report-ui');
const { coverageGaps } = require('./coverage/report-gaps');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
if (args.some((arg) => !['--no-editor', '--strict'].includes(arg))) throw new Error('Usage: npm run report -- [--no-editor] [--strict]');
const output = path.join(root, 'reports');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-lab-coverage-'));
const startedAt = new Date().toISOString();
fs.mkdirSync(output, { recursive: true });
for (const file of ['coverage.json', 'coverage.html', 'checks.log', 'editor.log', 'generation-error.log']) {
  fs.rmSync(path.join(output, file), { force: true });
}

function run(command, parameters, env = process.env) {
  const result = spawnSync(command, parameters, { cwd: root, env, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return { passed: result.status === 0 && !result.error, exitCode: result.status,
    log: (result.stdout || '') + (result.stderr || '') + (result.error?.message || '') };
}
function testCounts(log) {
  return Object.fromEntries(['tests', 'pass', 'fail'].map((name) => [name,
    Number(log.match(new RegExp(`(?:ℹ |# )${name} (\\d+)`))?.[1] || 0)]));
}

async function main() {
  console.log('Running build, sample type-checks and instrumented assertions…');
  const check = run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'check'], {
    ...process.env, THEME_LAB_COVERAGE_DIR: temp,
  });
  fs.writeFileSync(path.join(output, 'checks.log'), check.log);
  const assertions = fs.readdirSync(temp).filter((file) => file.endsWith('.jsonl')).flatMap((file) =>
    fs.readFileSync(path.join(temp, file), 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line)));
  const fixtures = getFixtures();
  const report = {
    schemaVersion: 1, generatedAt: startedAt,
    environment: { node: process.version, grammars: process.env.VSCODE_EXTENSIONS_DIR
      || `VS Code ${require('./coverage/catalogs/vscode.json').ref} official grammars (revision cache); framework grammars bundled locally` },
    reference: require('./coverage/reference-coverage').referenceCoverage(fixtures),
    checks: { passed: check.passed, exitCode: check.exitCode, ...testCounts(check.log) },
    native: { skipped: true, success: false, files: [] }, variants: [], errors: [],
  };
  for (const entry of report.reference.files) if (!entry.covered) report.errors.push(`Reference language missing: ${entry.upstream}`);
  if (!check.passed) report.errors.push('Build, sample type-check or test suite failed; see checks.log.');
  for (const variant of getVariants()) {
    console.log(`Measuring selectors and samples: ${variant.label}`);
    const measured = await measureVariant(variant, fixtures, assertions.filter((assertion) => assertion.variant === variant.label));
    report.variants.push(measured);
    for (const file of measured.files) if (file.grammar === 'failed' || file.grammar === 'missing-file') {
      report.errors.push(`${variant.id}: ${file.sample}: ${file.error || file.grammar}`);
    }
  }
  report.coverageGaps = coverageGaps(report.variants);
  report.strict = args.includes('--strict');
  if (report.strict && report.coverageGaps.length) {
    report.errors.push(`Strict coverage check failed: ${report.coverageGaps.length} gaps require explicit expectations.`);
  }
  if (!args.includes('--no-editor')) {
    console.log('Checking automatic language detection and native tokens in isolated VS Code…');
    const nativeFile = path.join(temp, 'editor.json');
    const native = run(process.execPath, [path.join(__dirname, 'check-editor.js')], {
      ...process.env, THEME_LAB_EDITOR_OUTPUT: nativeFile,
    });
    fs.writeFileSync(path.join(output, 'editor.log'), native.log);
    report.native = fs.existsSync(nativeFile) ? { skipped: false, ...JSON.parse(fs.readFileSync(nativeFile, 'utf8')) }
      : { skipped: false, success: false, error: 'Editor did not produce a report', files: [] };
    if (!native.passed || !report.native.success) report.errors.push('Editor integration check failed; see editor.log.');
  }
  report.languageMatrix = require('./coverage/language-matrix').languageMatrix(fixtures, report.variants, report.native);
  fs.writeFileSync(path.join(output, 'coverage.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'coverage.html'), reportHtml(report));
  console.log(`Report: ${path.join(output, 'coverage.html')}`);
  console.log(`Assertions: ${assertions.filter(({ passed }) => passed).length}/${assertions.length}; formats: ${fixtures.length}`);
  for (const variant of report.variants) console.log(`${variant.id}: ${variant.summary.facetsVerified}/${variant.summary.facets} selector properties explicitly verified`);
  if (report.errors.length) process.exitCode = 1;
}
main().catch((error) => {
  console.error(error.stack || error.message);
  fs.writeFileSync(path.join(output, 'generation-error.log'), error.stack || error.message);
  const failed = { schemaVersion: 1, generatedAt: startedAt,
    environment: { node: process.version, grammars: process.env.VSCODE_EXTENSIONS_DIR || 'pinned VS Code grammars' },
    checks: { passed: false, exitCode: 1, tests: 0, pass: 0, fail: 0 },
    native: { skipped: true, success: false, files: [] }, variants: [], errors: [error.message] };
  fs.writeFileSync(path.join(output, 'coverage.json'), JSON.stringify(failed, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'coverage.html'), reportHtml(failed));
  process.exitCode = 1;
}).finally(() => fs.rmSync(temp, { recursive: true, force: true }));
