# Development

Use Node.js 24 or newer. Run commands from the repository root.

```sh
npm ci
npm run build
```

Open the repository in VS Code and press **F5 → Preview Eenei**. In the new window,
select an Eenei theme and open `samples/`. The source watcher rebuilds all variants.
Restart the preview after adding a variant or changing grammar registrations.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Watch palette and theme sources |
| `npm run prepare:grammars` | Download pinned grammars once into the shared cache |
| `npm run check` | Build, check TS/TSX examples, run tests |
| `npm run check:editor` | Check filenames and native tokens in isolated VS Code |
| `npm run report -- --strict` | Generate the full coverage report |
| `npm run screenshots` | Render `assets/previews/example.py` for all variants |
| `npm run package` | Create `dist/eenei.vsix` |
| `npm run vendor:grammars` | Deliberately refresh bundled upstream grammars |
| `npm run catalog:update` | Deliberately refresh language inventories |

Screenshots require Chrome or Chromium (`CHROME_BIN` selects the executable).
Grammar checks use official VS Code grammars pinned to the catalog revision.
`check`, `render` and `screenshots` prepare them sequentially in
`.cache/grammars/<revision>/` before workers start. Subsequent runs read local
files; CI restores this directory with Actions cache. Transient download errors
retry with backoff. Delete the revision directory to refresh a damaged cache.
To use an installed copy instead:

```sh
VSCODE_EXTENSIONS_DIR=/usr/share/code/resources/app/extensions npm run check
npm run render -- markdown /tmp/markdown.png on-rose-dark
```

The gallery renderer can render other registered languages without adding their
PNG files to the repository. Committed previews use the same Python sample so
palette differences are easy to compare.

## Source layout

| Path | Contents |
| --- | --- |
| `src/palettes/` | Shared surfaces/status and per-family strings/comments |
| `src/syntax/` | Grammar scope rules |
| `src/workbench.js` | UI colors derived from semantic roles |
| `src/compile.js` | Static theme compiler |
| `scripts/` | Build, preview, render, package and grammar tools |
| `scripts/coverage/` | Report analysis and pinned language inventories |
| `samples/` | Human-readable review gallery |
| `tests/fixtures/` | Extra filenames and embedded grammar cases |
| `docs/` | Customization, language support and development guides |
| `assets/` | Branding, generated palette strips and current previews |
| `vscode/` | Extension manifest, grammar assets and generated theme JSON |
| `dist/` | Local VSIX output, ignored by Git |
| `reports/` | Local coverage output, ignored by Git |

Add a family file with an `id`, `name`, and `dark`/`light` colors for `string`,
`comment` and `docComment`. Shared blue and surfaces come from `base.json`.
`src/catalog.js` controls family order and generates Dark before Light.

The compiler also accepts a family `accent` override for a personal build; it
changes the UI accent independently of control-flow highlighting. Current release
palettes deliberately share frost blue. Check readability after any override.

`npm run build` regenerates themes, manifest theme entries, README palette tables
and PNG swatches from the same catalog. Edit source palettes, not generated values.
The extension README, docs, license and image assets are staged during packaging.
Generated `vscode/themes/`, manifest entries and documentation assets are committed;
local staging copies and build outputs are ignored.

[DESIGN.md](../DESIGN.md) defines the visual roles. Ask before modifying it.
Use [language support](languages.md) and [coverage](coverage.md) when adding examples
or grammar adaptations. The full test corpus is retained even though the README
shows one comparison sample per theme.

## Packaging and release

`npm run package` builds and packages only the extension files. It does not publish.
The extension ID is `AndreyGatsuk.eenei`, published by `AndreyGatsuk`. Sources live
at `https://github.com/AndreyGatsuk/eenei`. Eenei is separate from Navigate.

The release is deliberate: merging a commit or a Dependabot PR does not publish
anything. The version in `vscode/package.json` is the source of truth.

Use a patch release for fixes to colors, grammars or UI; a minor release for new
palettes or features; and a major release for incompatible changes such as removing
or renaming existing themes. Development dependency updates alone usually do not
need an extension release.

For example, to prepare the next patch from 0.1.0:

```sh
npm version patch --prefix vscode --no-git-tag-version
npm run check
npm run package
git add vscode/package.json
git commit -m "Release 0.1.1"
git push origin main
```

After the main CI passes, create and push the matching tag:

```sh
git tag v0.1.1
git push origin v0.1.1
```

For the initial release, the manifest already contains 0.1.0, so use `v0.1.0`
without bumping it first. The `release` workflow in `.github/workflows/publish.yml`
verifies the version and that the commit is in main, runs checks, builds one VSIX,
and creates a GitHub Release with `eenei.vsix` attached. Store jobs use that same
artifact. Release notes are generated from the merged changes.

A private repository can create GitHub Releases and share VSIX files with people
who have repository access. Registry publishing is enabled separately, after the
repository is public so the README images and guide links are accessible.

### Enable automatic store publishing

1. Create the `AndreyGatsuk` publisher in Visual Studio Marketplace and/or its
   namespace in Open VSX.
2. Configure trusted publishing in each selected registry for GitHub owner
   `AndreyGatsuk`, repository `eenei`, workflow `publish.yml`. Leave environment
   empty; the workflow does not configure one. No long-lived token is required.
3. In GitHub **Settings → Secrets and variables → Actions → Variables**, set
   `PUBLISH_MARKETPLACE=true` and/or `PUBLISH_OPEN_VSX=true`. Both default to false.
4. Future version tags publish automatically to the enabled registries after the
   release build succeeds. Each registry has its own job, so a failure in one does
   not prevent the other from publishing.

To publish an existing GitHub release after enabling a registry, dispatch the
workflow explicitly on its tag:

```sh
gh workflow run publish.yml --ref v0.1.0
```

The workflow can reattach the VSIX to an existing GitHub Release. Rerun only a
failed store job if another registry already accepted that version. A subsequent
release must have a new version; do not move a published release tag.

## Editor ports

This is one repository for shared palettes, documentation and editor ports.
The current VS Code implementation lives in `vscode/`; future Zed and Neovim ports
can live in `zed/` and `nvim/` and use the same palette sources. Create those
folders when the ports are implemented. Each port should get its own validation
and packaging; the current release workflow publishes only the VS Code extension.

[Back to Eenei](../README.md)
