const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vscode = require('vscode');
const frameworks = require('../../scripts/frameworks.json');
const { getFixtures, fixturePath } = require('../../scripts/fixtures');

exports.run = async function () {
  const root = path.join(__dirname, '..', '..');
  const report = { success: false, generatedAt: new Date().toISOString(), editorVersion: vscode.version, files: [] };
  const writeReport = () => {
    if (process.env.THEME_LAB_EDITOR_REPORT) fs.writeFileSync(process.env.THEME_LAB_EDITOR_REPORT, JSON.stringify(report, null, 2));
  };
  writeReport();
  for (const framework of frameworks) {
    assert.equal(vscode.extensions.getExtension(framework.extension), undefined,
      `Test must run without the ${framework.extension} language extension`);
  }
  for (const fixture of getFixtures().filter((fixture) => fixture.scope && fixture.exists)) {
    const entry = { file: fixture.sample, passed: false };
    try {
      const file = vscode.Uri.file(fixturePath(fixture));
      const document = await vscode.workspace.openTextDocument(file);
      entry.language = document.languageId;
      assert.ok(fixture.acceptedLanguageIds.includes(document.languageId),
        `${fixture.sample}: expected ${fixture.acceptedLanguageIds.join(' / ')}, received ${document.languageId}`);
      const tokens = await vscode.commands.executeCommand('_workbench.captureSyntaxTokens', file);
      assert.ok(Array.isArray(tokens) && tokens.length > 0, `${fixture.id}: no native syntax tokens`);
      assert.ok(tokens.some((token) => token.t.split(' ').includes(fixture.scope)),
        `${fixture.id}: native grammar is not ${fixture.scope}`);
      for (const scope of fixture.requiredScopes || []) {
        assert.ok(tokens.some((token) => token.t.split(' ').includes(scope)), `Missing embedded scope: ${scope}`);
      }
      entry.tokens = tokens.length;
      entry.passed = true;
    } catch (error) {
      entry.error = error.message;
    }
    report.files.push(entry);
    writeReport();
  }
  try {
    const tsx = vscode.Uri.file(path.join(root, 'samples', 'sample.tsx'));
    const document = await vscode.workspace.openTextDocument(tsx);
    assert.equal(document.languageId, 'typescriptreact');
    await vscode.window.showTextDocument(document);
    const line = document.getText().split('\n').findIndex((line) => line.includes('aria-label='));
    const hover = await vscode.commands.executeCommand('vscode.executeHoverProvider', tsx, new vscode.Position(line, 10));
    assert.ok(hover?.length, 'TypeScript did not resolve the React attribute');
    const errors = vscode.languages.getDiagnostics(tsx).filter((diagnostic) =>
      diagnostic.severity === vscode.DiagnosticSeverity.Error);
    report.tsxErrors = errors.length;
    assert.deepEqual(errors.map(({ message }) => message), [], 'React sample has editor errors');
  } catch (error) {
    report.tsxError = error.message;
  }
  report.success = report.files.every(({ passed }) => passed) && !report.tsxError;
  writeReport();
  assert.ok(report.success, 'One or more editor integration checks failed; see the JSON report');
};
