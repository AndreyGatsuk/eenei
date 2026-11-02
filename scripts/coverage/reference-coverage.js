const corpus = require('./reference-corpus.json');

// Correspondence of languages/formats only: it does not assert that the two
// sample files contain identical constructs or that upstream tests were run.
function referenceCoverage(fixtures) {
  const bySample = new Map(fixtures.map((fixture) => [fixture.sample, fixture]));
  return { ...corpus, files: corpus.files.map((entry) => {
    const fixture = bySample.get(entry.sample);
    return { ...entry, covered: Boolean(fixture?.exists && fixture.scope),
      scope: fixture?.scope || null, languageId: fixture?.languageId || null };
  }) };
}
module.exports = { referenceCoverage };
