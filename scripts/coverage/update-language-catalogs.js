const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const directory = path.join(__dirname, 'catalogs');
const args = process.argv.slice(2);
const options = { '--vscode-ref': '1.143.1', '--linguist-ref': 'main' };
for (let i = 0; i < args.length; i += 2) {
  if (!(args[i] in options) || !args[i + 1]) throw new Error('Use --vscode-ref <tag/sha> --linguist-ref <branch/sha>');
  options[args[i]] = args[i + 1];
}
async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}
const api = async (url) => JSON.parse(await fetchText(url));
async function concurrent(items, action) {
  const results = new Array(items.length);
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(8, items.length) }, async () => {
    while (index < items.length) { const current = index++; results[current] = await action(items[current]); }
  }));
  return results;
}
async function main() {
  const [tree, head] = await Promise.all([
    api(`https://api.github.com/repos/microsoft/vscode/git/trees/${encodeURIComponent(options['--vscode-ref'])}?recursive=1`),
    api(`https://api.github.com/repos/github-linguist/linguist/commits/${encodeURIComponent(options['--linguist-ref'])}`),
  ]);
  if (tree.truncated) throw new Error('VS Code source tree was truncated');
  const manifests = tree.tree.filter(({ path: file }) => /^extensions\/[^/]+\/package\.json$/.test(file));
  const packages = await concurrent(manifests, async ({ path: file }) => ({ file,
    data: JSON.parse(await fetchText(`https://raw.githubusercontent.com/microsoft/vscode/${tree.sha}/${file}`)),
  }));
  const grammars = packages.flatMap(({ file, data }) => (data.contributes?.grammars || []).map((grammar) => ({
    ...grammar, path: path.posix.join(path.posix.dirname(file), grammar.path).replace(/^extensions\//, ''),
  })));
  const byId = new Map();
  const language = (id) => {
    if (!byId.has(id)) byId.set(id, { id, name: id, aliases: [], extensions: [], filenames: [], filenamePatterns: [], grammars: [] });
    return byId.get(id);
  };
  for (const { file, data } of packages) {
    for (const entry of data.contributes?.languages || []) {
      const row = language(entry.id);
      row.name = entry.aliases?.[0] || row.name;
      for (const key of ['aliases', 'extensions', 'filenames', 'filenamePatterns']) row[key] = [...new Set([...row[key], ...(entry[key] || [])])];
    }
    for (const grammar of data.contributes?.grammars || []) if (grammar.language) {
      language(grammar.language).grammars.push({ scope: grammar.scopeName, manifest: file, path: grammar.path });
    }
  }
  const linguistRepository = 'https://github.com/github-linguist/linguist';
  const linguistRaw = `https://raw.githubusercontent.com/github-linguist/linguist/${head.sha}`;
  const [source, vscodeLicense, linguistLicense] = await Promise.all([
    fetchText(`${linguistRaw}/lib/linguist/languages.yml`),
    fetchText(`https://raw.githubusercontent.com/microsoft/vscode/${tree.sha}/LICENSE.txt`),
    fetchText(`${linguistRaw}/LICENSE`),
  ]);
  const entries = Object.entries(yaml.load(source)).map(([name, entry]) => ({
    id: String(entry.language_id), name, type: entry.type, scope: entry.tm_scope === 'none' ? null : entry.tm_scope || null,
    aliases: entry.aliases || [], extensions: entry.extensions || [], filenames: entry.filenames || [],
    group: entry.group || null,
  }));
  const vscode = { repository: 'https://github.com/microsoft/vscode', revision: tree.sha, ref: options['--vscode-ref'],
    path: 'extensions', grammars, entries: [...byId.values()].sort((a, b) => a.id.localeCompare(b.id)) };
  const linguist = { repository: linguistRepository, revision: head.sha, ref: options['--linguist-ref'],
    path: 'lib/linguist/languages.yml', entries };
  // All remote reads and validation finish before existing snapshots change.
  fs.mkdirSync(directory, { recursive: true });
  for (const [name, value] of [['vscode', vscode], ['linguist', linguist]]) {
    fs.writeFileSync(path.join(directory, `${name}.json`), JSON.stringify(value, null, 2) + '\n');
    console.log(`${name}: ${value.entries.length} entries at ${value.revision}`);
  }
  fs.writeFileSync(path.join(directory, 'vscode.LICENSE.txt'), vscodeLicense);
  fs.writeFileSync(path.join(directory, 'linguist.LICENSE.txt'), linguistLicense);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
