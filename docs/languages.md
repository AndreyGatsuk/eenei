# Language support

The review samples cover JSON/JSONC, TOML and lockfiles, YAML/Compose, Markdown,
Dockerfile, dotenv, ignore files, JSX/TSX, SCSS/Less and diff, alongside the
programming-language samples. Checks verify representative colors and styles as
well as complete-file tokenization across every palette.

JSON keys stay regular while string values use the string color. Markdown headings,
links, inline code and quotations have separate roles; fenced code keeps its language
rules. Embedded expressions in JS/TS template strings stay regular. Dotenv values
are strings, including values such as `8080` and `false`. Diff additions/removals
retain their status colors rather than adopting a decorative palette accent.

The extension adds small grammar injections for shell-form Docker `RUN` instructions
and Jinja expressions inside HTML attribute strings. Docker exec-form instructions
continue using the original Dockerfile grammar. `.dockerignore` uses VS Code's
built-in ignore grammar. No editor settings are changed.

The following pinned upstream grammars and filename associations are bundled in
the extension. Their samples highlight without additional language extensions:

| Samples | Language extension providing the grammar |
| --- | --- |
| `sample.vue` | [Vue - Official](https://github.com/vuejs/language-tools) |
| `sample.svelte` | [Svelte](https://github.com/sveltejs/language-tools) |
| `sample.astro` | [Astro](https://github.com/withastro/astro/tree/main/packages/language-tools) |
| `sample.mdx` | [MDX](https://github.com/mdx-js/mdx-analyzer) |
| `sample.html.jinja` | [Jinja](https://github.com/wholroyd/vscode-jinja) |
| `sample.graphql` | [GraphQL](https://github.com/graphql/vscode-graphql) |
| `sample.ex` | [ElixirLS](https://github.com/elixir-lsp/vscode-elixir-ls) |
| `sample.hs` | [Haskell syntax](https://github.com/JustusAdam/language-haskell) |
| `sample.lisp` | [Lisp](https://github.com/mattn/vscode-lisp) |
| `sample.templ` | [templ](https://github.com/templ-go/templ-vscode) |
| `sample.zig` | [Zig](https://codeberg.org/ziglang/vscode-zig) |
| `sample.nix` | [Nix IDE](https://github.com/nix-community/vscode-nix-ide) |

Bundled support covers syntax highlighting and basic language configuration.
The linked language extensions remain optional for completion, formatting, validation
and framework tooling. Pinned sources and registrations are in `scripts/frameworks.json`;
licenses and source metadata ship alongside each grammar in
`vscode/syntaxes/frameworks/`. Run `npm run vendor:grammars` only when deliberately
refreshing those vendored files. Normal builds and framework tests use the local
files and do not download framework grammars.

React and its types are development dependencies for `samples/`. The sample
`tsconfig.json` checks the actual TS/TSX files using the React JSX runtime.
`npm run check:samples` catches missing types and runtime imports before preview.
These dependencies are not shipped in the theme extension.

`npm run check:editor` opens a temporary isolated VS Code instance, verifies automatic
language detection and native grammar tokenization for all known sample files with no third-party extensions,
and closes it. It requires an installed `code` command and a desktop display;
`CODE_BIN` can select another VS Code executable. The editor test does not change
your installed extensions or editor preferences.

The pinned MDX grammar leaves link labels unscoped. Their text stays regular;
link destinations use the navigation accent. The theme does not guess scopes from
unmarked prose. Coverage here concerns syntax colors, not framework completions,
formatting, validation or language-server features.

```sh
npm run render -- vue /tmp/vue.png on-rose-dark
npm run render -- dockerfile /tmp/dockerfile.png on-lilac-light
```


[Back to Eenei](../README.md)
