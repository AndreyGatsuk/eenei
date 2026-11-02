# Coverage

```sh
npm run report -- --strict
```

Open `reports/coverage.html` for the interactive report or inspect
`reports/coverage.json`. Select a palette, search filenames or scopes, and filter
gaps. Every run rebuilds themes, type-checks samples and reruns instrumented tests.

The full run also opens an isolated VS Code instance to check automatic filename
recognition and native tokens for the known sample corpus. It requires `code`
and a desktop display; `CODE_BIN` selects a different executable. The test uses
a temporary profile and does not change installed extensions or user preferences.

For CI or machines without a display:

```sh
npm run report -- --no-editor --strict
```

Skipped editor checks are reported as skipped, never as a successful native run.
CI uploads HTML, JSON and check logs as a `theme-coverage` artifact. Generated
reports are ignored by Git. `VSCODE_EXTENSIONS_DIR` selects local built-in grammars.

## What is verified

The report separates grammar availability, native filename recognition, expected
colors/styles, and selector coverage. Foreground and font-style winners are traced
independently with marker values. A property counts as verified only when a
passing independent assertion covers its position. A scope appearing in a sample
alone is not evidence that its styling is correct.

Strict mode fails for unknown sample formats, missing role/style expectations,
unverified selector properties or assertions that cannot be traced. All files in
`samples/` and `tests/fixtures/` are discovered; new files do not silently disappear
from measurement. Expectations live in `tests/coverage-cases.json` and the tests,
not in generated theme output.

## Language inventory

The matrix has separate **Syntax** and **Filenames** views. Syntax evidence belongs
to the tested grammar and assertions. Filename recognition requires VS Code to
report an accepted language for the matching fixture. Sharing a scope or alias
does not transfer evidence to another dialect, and `sample.cpp` does not prove
recognition of `.hpp`.

Pinned VS Code and GitHub Linguist inventories are in `scripts/coverage/catalogs/`.
The adopted VS Code baseline and bundled modes require representative fixtures.
The larger Linguist inventory is an expansion backlog. The internal `jsx-tags`
mode is recorded separately in `scripts/coverage/catalog-notes.json`.

The report also maps languages/formats in Pustota's pinned test catalog to local
examples. `scripts/coverage/reference-corpus.json` records the revision and filename
mappings. This checks correspondence; it does not execute upstream tests.

To refresh snapshots deliberately (network required):

```sh
npm run catalog:update -- --vscode-ref 1.143.1 --linguist-ref main
```

Resolved hashes, sources and licenses are stored with the inventories. Review
changes before committing. Bundled grammar patches are guarded by exact upstream
matches; see `scripts/grammar-patches.js` and the [language guide](languages.md).

Coverage concerns the finite corpus and its explicit assertions. It does not
prove every construct of every language or every workbench interaction. Contrast
tests check text roles on normal editor backgrounds, Light documentation and
scaffolding on active-line surfaces, and selected UI foreground/background pairs;
they do not certify all editor states against a complete accessibility standard.

[Back to Eenei](../README.md)
