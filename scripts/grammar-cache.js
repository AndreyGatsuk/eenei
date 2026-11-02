const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { setTimeout: delay } = require('node:timers/promises');
const textmate = require('vscode-textmate');
const catalog = require('./coverage/catalogs/vscode.json');

const cacheDirectory = path.join(__dirname, '..', '.cache', 'grammars', catalog.revision);
const baseUrl = `https://raw.githubusercontent.com/microsoft/vscode/${catalog.revision}/extensions`;

function validate(source, file) {
  const grammar = textmate.parseRawGrammar(source, file);
  if (!grammar.scopeName) throw new Error(`Grammar has no scopeName: ${file}`);
  return source;
}

async function downloadGrammar(file, { fetchImpl = fetch, wait = delay } = {}) {
  const url = `${baseUrl}/${file.split('/').map(encodeURIComponent).join('/')}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    let response;
    try {
      response = await fetchImpl(url, { signal: AbortSignal.timeout(30_000) });
      if (response.ok) return validate(await response.text(), file);
    } catch (error) {
      if (attempt === 4) throw new Error(`Cannot download grammar ${url}: ${error.message}`, { cause: error });
      await wait(1000 * 2 ** attempt);
      continue;
    }
    if (attempt === 4 || (response.status !== 429 && response.status < 500)) {
      throw new Error(`Cannot download grammar ${url}: HTTP ${response.status}`);
    }
    const retryAfter = response.headers.get('retry-after');
    const seconds = Number(retryAfter);
    const requested = retryAfter === null ? 0 : Number.isFinite(seconds)
      ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
    await response.body?.cancel();
    await wait(Math.min(30_000, Math.max(1000 * 2 ** attempt, requested || 0)));
  }
}

async function prepareGrammars(files, { directory = cacheDirectory, ...options } = {}) {
  let downloaded = 0;
  // Prepare once before test workers start; no parallel requests to raw GitHub.
  for (const file of [...new Set(files)].sort()) {
    const destination = path.join(directory, file);
    if (fs.existsSync(destination)) {
      try { validate(fs.readFileSync(destination, 'utf8'), file); continue; }
      catch { /* Replace an incomplete or corrupt cache entry. */ }
    }
    const source = await downloadGrammar(file, options);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, source);
      fs.renameSync(temporary, destination);
    } finally { fs.rmSync(temporary, { force: true }); }
    downloaded++;
  }
  return downloaded;
}

function readGrammar(file) {
  const source = path.join(cacheDirectory, file);
  if (!fs.existsSync(source)) {
    throw new Error(`Grammar cache is missing ${file}. Run npm run prepare:grammars first.`);
  }
  return fs.readFileSync(source, 'utf8');
}

module.exports = { cacheDirectory, prepareGrammars, readGrammar };
