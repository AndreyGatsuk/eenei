const path = require('node:path');
const vscode = require('./catalogs/vscode.json');
const linguist = require('./catalogs/linguist.json');
const manifest = require('../../vscode/package.json');
const notes = require('./catalog-notes.json');

// These are identity links, never an inference from a shared extension or scope.
const links = { 'C++': ['cpp'], 'C#': ['csharp'], 'JavaScript': ['javascript', 'javascriptreact'],
  'TypeScript': ['typescript'], JSX: ['javascriptreact'], TSX: ['typescriptreact'],
  'Shell': ['shellscript'], 'Common Lisp': ['lisp'], 'Jinja': ['jinja-html', 'jinja'],
  'Ignore List': ['ignore'], 'Batchfile': ['bat'], 'JSON with Comments': ['jsonc'], 'Go': ['go'], 'reStructuredText': ['restructuredtext'] };
const normalized = (name) => name.toLowerCase();
function bundledEntries() {
  return manifest.contributes.languages.map((language) => ({
    id: language.id, name: language.aliases?.[0] || language.id,
    aliases: language.aliases || [], extensions: language.extensions || [],
    filenames: language.filenames || [], filenamePatterns: language.filenamePatterns || [],
    grammars: manifest.contributes.grammars.filter((grammar) => grammar.language === language.id)
      .map((grammar) => ({ scope: grammar.scopeName, path: grammar.path })),
  }));
}
function catalogEntries() {
  const bundled = bundledEntries();
  const identities = new Map();
  for (const entry of [...vscode.entries, ...bundled]) {
    for (const alias of [entry.id, entry.name]) {
      const key = normalized(alias);
      if (!identities.has(key)) identities.set(key, new Set());
      identities.get(key).add(entry.id);
    }
  }
  const known = [...vscode.entries.map((entry) => ({ ...entry, source: 'vscode' })),
    ...bundled.map((entry) => ({ ...entry, source: 'bundled' }))];
  return [...known.map((entry) => ({ ...entry, key: `${entry.source}:${entry.id}`,
    languageIds: [entry.id], scopes: entry.grammars.map((grammar) => grammar.scope) })),
  ...linguist.entries.map((entry) => ({ ...entry, source: 'linguist', key: `linguist:${entry.id}`,
    // Match the canonical name only. Broad upstream aliases can designate other
    // dialects; scopes and extensions alone must never confer test evidence.
    languageIds: links[entry.name] || [...(identities.get(normalized(entry.name)) || [])],
    scopes: entry.scope ? [entry.scope] : [], filenamePatterns: [],
  }))];
}
function languageMatrix(fixtures, variants, native) {
  const entries = catalogEntries();
  const registrations = entries.filter((entry) => entry.source !== 'linguist');
  const rows = entries.map((entry) => {
    const direct = registrations.filter((candidate) => entry.languageIds.includes(candidate.id));
    const available = direct.flatMap((candidate) => candidate.grammars.map((grammar) => ({
      scope: grammar.scope, source: candidate.source, languageId: candidate.id,
    })));
    const shared = available.length ? [] : registrations.flatMap((candidate) => candidate.grammars
      .filter((grammar) => entry.scopes.includes(grammar.scope))
      .map((grammar) => ({ scope: grammar.scope, source: candidate.source, languageId: candidate.id })));
    const samples = fixtures.filter((fixture) => fixture.exists && fixture.scope
      && [...fixture.acceptedLanguageIds, ...(fixture.coverageLanguageIds || [])].some((id) => entry.languageIds.includes(id)));
    const measured = variants.map((variant) => {
      const files = samples.map((sample) => variant.files.find((file) => file.sample === sample.sample));
      return { variant: variant.id, grammarPassed: files.length > 0 && files.every((file) => file?.grammar === 'passed'),
        colorsPassed: files.length > 0 && files.every((file) => file?.colorAssertions > 0),
        stylesPassed: files.length > 0 && files.every((file) => file?.styleAssertions > 0),
        colors: Math.max(0, ...files.map((file) => file?.colorAssertions || 0)),
        styles: Math.max(0, ...files.map((file) => file?.styleAssertions || 0)),
        failed: files.some((file) => !file || file.failedAssertions || file.grammar === 'failed'),
      };
    });
    const nativeFiles = native?.files || [];
    const editor = native?.skipped ? 'skipped' : samples.length && samples.every((sample) =>
      nativeFiles.some((file) => file.file === sample.sample && file.passed)) ? 'verified'
      : samples.some((sample) => nativeFiles.some((file) => file.file === sample.sample && !file.passed)) ? 'failed' : 'unobserved';
    const bindings = [
      ...entry.extensions.map((value) => ({ type: 'extension', value,
        samples: samples.filter((sample) => sample.sample.endsWith(value)).map((sample) => sample.sample) })),
      ...entry.filenames.map((value) => ({ type: 'filename', value,
        samples: samples.filter((sample) => path.posix.basename(sample.sample) === value).map((sample) => sample.sample) })),
      ...(entry.filenamePatterns || []).map((value) => ({ type: 'pattern', value, samples: [] })),
    ];
    for (const binding of bindings) {
      const matching = samples.filter((sample) => binding.samples.includes(sample.sample));
      const results = matching.map((sample) => {
        const result = nativeFiles.find((file) => file.file === sample.sample);
        if (!result) return 'unobserved';
        // Filename recognition is independent of grammar capture/color checks.
        return sample.acceptedLanguageIds.includes(result.language) ? 'verified' : 'failed';
      });
      binding.status = !matching.length ? 'missing-example' : native?.skipped ? 'skipped'
        : results.includes('failed') ? 'failed' : results.every((status) => status === 'verified') ? 'verified' : 'unobserved';
    }
    const untestedScopes = [...new Set(available.map((grammar) => grammar.scope))]
      .filter((scope) => !samples.some((sample) => sample.scope === scope || sample.coverageScopes?.includes(scope)));
    const evidence = measured.length > 0 && measured.every((row) => row.grammarPassed && row.colorsPassed && row.stylesPassed && !row.failed);
    const tested = evidence && editor === 'verified';
    const note = entry.source === 'vscode' ? notes[entry.id] : null;
    const syntax = {
      status: note?.kind === 'internal' ? 'internal' : !samples.length ? 'no-sample'
        : measured.some((row) => row.failed) ? 'failed' : evidence ? 'sample-tested' : 'needs-assertions',
      tested: evidence, gap: note?.kind !== 'internal' && (!evidence || untestedScopes.length > 0),
    };
    const recognition = { total: bindings.length,
      verified: bindings.filter((binding) => binding.status === 'verified').length,
      failed: bindings.filter((binding) => binding.status === 'failed').length,
      pending: bindings.filter((binding) => !['verified', 'failed'].includes(binding.status)).length,
    };
    return { ...entry, syntax, recognition, note, embedded: samples.some((sample) => sample.coverageLanguageIds?.some((id) => entry.languageIds.includes(id))), grammars: available, sharedGrammars: shared, samples: samples.map((sample) => sample.sample),
      measured, editor, bindings, untestedScopes, untestedBindings: bindings.filter((binding) => binding.status !== 'verified').length,
      status: note?.kind === 'internal' ? 'internal' : !samples.length ? 'no-sample' : measured.some((row) => row.failed) || editor === 'failed' ? 'failed'
        : !evidence ? 'needs-assertions' : editor !== 'verified' ? 'needs-editor' : 'sample-tested',
      tested,
    };
  });
  return { sources: [
    { id: 'vscode', name: `VS Code ${vscode.ref}`, repository: vscode.repository,
      revision: vscode.revision, url: `${vscode.repository}/tree/${vscode.revision}/extensions` },
    { id: 'linguist', name: 'GitHub Linguist', repository: linguist.repository,
      revision: linguist.revision, url: `${linguist.repository}/blob/${linguist.revision}/${linguist.path}` },
    { id: 'bundled', name: 'Наше расширение', url: null },
  ], rows, summary: ['vscode', 'bundled', 'linguist'].map((source) => {
    const selected = rows.filter((row) => row.source === source);
    return { source, total: selected.length, withSamples: selected.filter((row) => row.samples.length).length,
      tested: selected.filter((row) => row.tested).length,
      missingSamples: selected.filter((row) => row.status === 'no-sample').length,
      internal: selected.filter((row) => row.status === 'internal').length,
      syntaxTested: selected.filter((row) => row.syntax.tested).length,
      syntaxGaps: selected.filter((row) => row.syntax.gap).length,
      recognition: selected.reduce((total, row) => ({ total: total.total + row.recognition.total,
        verified: total.verified + row.recognition.verified, failed: total.failed + row.recognition.failed,
        pending: total.pending + row.recognition.pending }), { total: 0, verified: 0, failed: 0, pending: 0 }),
      untestedBindings: selected.reduce((total, row) => total + row.untestedBindings, 0) };
  }) };
}
module.exports = { languageMatrix, catalogEntries };
