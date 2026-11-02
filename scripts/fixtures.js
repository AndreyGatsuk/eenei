const fs = require('node:fs');
const path = require('node:path');
const { languages } = require('./grammars');
const frameworks = require('./frameworks.json');
const extras = require('./extra-fixtures.json');

const root = path.join(__dirname, '..');
const languageIds = {
  jsx: 'javascriptreact', tsx: 'typescriptreact', bash: 'shellscript',
  dockerfile: 'dockerfile', gitignore: 'ignore', dockerignore: 'ignore',
  'cargo-lock': 'toml', 'uv-lock': 'toml',
};
const extensions = {
  '.lua': 'lua', '.bat': 'bat', '.c': 'c', '.clj': 'clojure', '.cs': 'csharp',
  '.dart': 'dart', '.ini': 'ini', '.m': 'objective-c', '.php': 'php',
  '.ps1': 'powershell', '.rst': 'restructuredtext', '.rb': 'ruby', '.xml': 'xml',
  '.md': 'markdown', '.toml': 'toml', '.json': 'json', '.jsonc': 'jsonc',
  '.js': 'javascript', '.jsx': 'jsx', '.ts': 'typescript', '.tsx': 'tsx',
  '.py': 'python', '.rs': 'rust', '.go': 'go', '.java': 'java', '.cpp': 'cpp',
  '.html': 'html', '.css': 'css', '.scss': 'scss', '.less': 'less',
  '.sql': 'sql', '.sh': 'bash', '.yaml': 'yaml', '.yml': 'yaml', '.diff': 'diff',
};
function getFixtures() {
  const catalog = [
    ...Object.entries(languages).map(([id, entry]) => ({ id, ...entry, languageId: languageIds[id] || id })),
    ...frameworks.map((entry) => ({
      id: entry.id, scope: entry.scope, sample: entry.sample,
      languageId: entry.grammars.find(({ scopeName }) => scopeName === entry.scope).contribution.language,
    })),
  ];
  catalog.push(...extras);
  const files = [];
  const visit = (directory, base, prefix) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (['node_modules', 'target', '__pycache__', '.git'].includes(entry.name)) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file, base, prefix);
      else if (entry.isFile()) files.push(prefix + path.relative(base, file).split(path.sep).join('/'));
    }
  };
  const gallery = path.join(root, 'samples');
  visit(gallery, gallery, '');
  const fixtures = path.join(root, 'tests/fixtures');
  if (fs.existsSync(fixtures)) visit(fixtures, fixtures, 'tests/fixtures/');
  const result = new Map(catalog.map((entry) => [entry.sample, { ...entry, exists: files.includes(entry.sample) }]));
  for (const sample of files) {
    if (result.has(sample)) continue;
    const id = extensions[path.extname(sample)];
    const inherited = id && catalog.find((entry) => entry.id === id);
    result.set(sample, inherited
      ? { ...inherited, sample, exists: true, inferred: true }
      : { id: sample, sample, exists: true, scope: null, languageId: null });
  }
  return [...result.values()].map((entry) => ({
    ...entry, file: entry.sample.startsWith('tests/fixtures/') ? entry.sample : `samples/${entry.sample}`,
    acceptedLanguageIds: entry.acceptedLanguageIds || (entry.sample === 'compose.yaml'
      ? ['yaml', 'dockercompose'] : entry.languageId ? [entry.languageId] : []),
  })).sort((a, b) => a.sample.localeCompare(b.sample));
}
function fixturePath(fixture) { return path.join(root, fixture.file); }
module.exports = { getFixtures, fixturePath };
