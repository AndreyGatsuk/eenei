const fs = require('node:fs');
const path = require('node:path');
const textmate = require('vscode-textmate');
const yaml = require('js-yaml');
const frameworks = require('./frameworks.json');
const { applyGrammarPatches, applyGrammarSourcePatches } = require('./grammar-patches');

const root = path.join(__dirname, '..');
const extension = path.join(root, 'vscode');

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

async function main() {
  const bundled = [];
  const languages = [];
  const files = [];
  // Fetch and parse before replacing existing vendored files or registrations.
  for (const framework of frameworks) {
    const directory = `syntaxes/frameworks/${framework.id}`;
    for (const grammar of framework.grammars) {
      const source = applyGrammarSourcePatches(await download(grammar.url), grammar.sourcePatches);
      let parsed = grammar.format === 'yaml' ? yaml.load(source) : textmate.parseRawGrammar(source, grammar.url);
      parsed = applyGrammarPatches(parsed, grammar.patches);
      if (parsed.scopeName !== grammar.scopeName) throw new Error(`Unexpected scope: ${grammar.url}`);
      const file = `${directory}/${grammar.scopeName}.tmLanguage.json`;
      files.push([file, JSON.stringify(parsed, null, 2) + '\n']);
      bundled.push({ ...grammar.contribution, path: `./${file}` });
    }
    for (const configuration of framework.configurations) {
      files.push([`${directory}/${configuration.filename}`, await download(configuration.source)]);
    }
    for (const license of framework.licenses) {
      files.push([`${directory}/${license.filename}`,
        `Source: ${license.source}\n\n${await download(license.source)}`]);
    }
    files.push([`${directory}/SOURCE.json`, JSON.stringify(framework, null, 2) + '\n']);
    languages.push(...framework.languages);
    console.log(`Prepared ${framework.id}`);
  }
  const manifestFile = path.join(extension, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  const scopes = new Set(bundled.map(({ scopeName }) => scopeName));
  const ids = new Set(languages.map(({ id }) => id));
  manifest.contributes.grammars = [
    ...manifest.contributes.grammars.filter((grammar) => !scopes.has(grammar.scopeName)), ...bundled,
  ];
  manifest.contributes.languages = [
    ...manifest.contributes.languages.filter((language) => !ids.has(language.id)), ...languages,
  ];
  for (const [file, content] of files) {
    const destination = path.join(extension, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content);
  }
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Bundled ${bundled.length} grammars with file recognition, language configurations and licenses`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
