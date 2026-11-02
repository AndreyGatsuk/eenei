const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { prepareGrammars } = require('../scripts/grammar-cache');

const file = 'python/syntaxes/test.tmLanguage.json';
const source = JSON.stringify({ scopeName: 'source.test', patterns: [] });
function temporary(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eenei-grammars-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

test('prepared grammars survive a new invocation without network access', async (t) => {
  const directory = temporary(t);
  let calls = 0;
  assert.equal(await prepareGrammars([file, file], { directory, fetchImpl: async (url) => {
    calls++;
    assert.ok(url.includes(require('../scripts/coverage/catalogs/vscode.json').revision));
    return new Response(source);
  } }), 1);
  assert.equal(calls, 1);
  assert.equal(await prepareGrammars([file], { directory, fetchImpl: () => {
    assert.fail('A prepared cache must not need the network');
  } }), 0);
  assert.equal(fs.readFileSync(path.join(directory, file), 'utf8'), source);
});

test('rate limits and temporary server errors retry before publishing a cache file', async (t) => {
  const directory = temporary(t);
  const waits = [];
  const statuses = [429, 503, 200];
  assert.equal(await prepareGrammars([file], {
    directory, wait: async (ms) => waits.push(ms), fetchImpl: async () => {
      assert.equal(fs.existsSync(path.join(directory, file)), false);
      const status = statuses.shift();
      return new Response(status === 200 ? source : '', { status, headers: { 'retry-after': '3' } });
    },
  }), 1);
  assert.deepEqual(waits, [3000, 3000]);
});

test('permanent failures leave no cache entry and a later run can recover', async (t) => {
  const directory = temporary(t);
  await assert.rejects(prepareGrammars([file], { directory,
    fetchImpl: async () => new Response('', { status: 404 }),
    wait: () => assert.fail('A missing pinned grammar should not retry'),
  }), /HTTP 404/);
  assert.equal(fs.existsSync(path.join(directory, file)), false);
  assert.equal(await prepareGrammars([file], { directory, fetchImpl: async () => new Response(source) }), 1);
});

test('a truncated cache entry is replaced with a validated grammar', async (t) => {
  const directory = temporary(t);
  fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
  fs.writeFileSync(path.join(directory, file), '{');
  assert.equal(await prepareGrammars([file], { directory, fetchImpl: async () => new Response(source) }), 1);
  assert.equal(fs.readFileSync(path.join(directory, file), 'utf8'), source);
});
