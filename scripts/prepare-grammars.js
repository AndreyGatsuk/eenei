const { grammarPaths } = require('./grammars');
const { cacheDirectory, prepareGrammars } = require('./grammar-cache');
const bundledScopes = new Set(require('../vscode/package.json').contributes.grammars.map(({ scopeName }) => scopeName));

async function main() {
  if (process.env.VSCODE_EXTENSIONS_DIR) {
    console.log(`Using installed grammars: ${process.env.VSCODE_EXTENSIONS_DIR}`);
    return;
  }
  const downloaded = await prepareGrammars(Object.entries(grammarPaths).filter(([scope]) => !bundledScopes.has(scope)).map(([, file]) => file));
  console.log(`Grammar cache ready: ${cacheDirectory} (${downloaded} downloaded)`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
