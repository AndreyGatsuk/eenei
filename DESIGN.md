# Design

Eenei uses a small set of visual roles across every palette. Colors come from
syntax grammars; the theme never guesses whether a name is a type or a value and
does not require changes to editor settings.

## Palette families

The name Eenei evokes «иней» (frost). All four families share frost blue for
control flow and UI. Blue, surfaces and scaffolding live in
`src/palettes/base.json`; family files define `string`, `comment` and `docComment`.
Dark and Light use individually chosen values. The flower families are Rose
(pink), Dahlia (peach), Lilac (purple) and Hellebore (soft green).

Comments use restrained companion hues rather than one universal green:
Rose uses warm gray, Dahlia uses blue-green gray, Lilac uses stone gray, and
Hellebore uses mauve gray. Documentation comments use quieter companion shades.
Comments remain italic; their colors must stay distinct from string colors.

| Family | Appearance | Control flow / UI | Strings | Comments | Documentation |
| --- | --- | --- | --- | --- | --- |
| Eenei on Rose | Dark | `#88B4D8` | `#CC9DB8` | `#A6A294` | `#847E77` |
| Eenei on Rose | Light | `#376B93` | `#925471` | `#686354` | `#70695F` |
| Eenei on Dahlia | Dark | `#88B4D8` | `#D8A58B` | `#99AAA8` | `#768987` |
| Eenei on Dahlia | Light | `#376B93` | `#935939` | `#546967` | `#5C706E` |
| Eenei on Lilac | Dark | `#88B4D8` | `#B59BD8` | `#AAA292` | `#867E73` |
| Eenei on Lilac | Light | `#376B93` | `#7952A3` | `#6E6451` | `#736B60` |
| Eenei on Hellebore | Dark | `#88B4D8` | `#A8C79B` | `#AD9DA9` | `#887C85` |
| Eenei on Hellebore | Light | `#376B93` | `#486C3C` | `#75616E` | `#786A74` |

The catalog discovers family files in `src/palettes/`. Every family produces Dark
and Light themes and corresponding entries in the extension manifest.

## Syntax roles

- `important`: control flow and SQL query structure. Rust also
  highlights macros, `?` and `unsafe`, which may conceal control flow.
- `string`: readable string literals and escapes.
- `comment`: notes in italic text.
- `regular`: names, variables, fields, functions, types, constants and numbers;
  also operators that compute or compare values.
- `insignificant`: punctuation, scaffolding keywords, imports, Rust attributes
  and Python decorators.
- `docComment`: documentation comments and Python docstrings, in muted italics.

Definitions recognized by the supported grammars use bold text: Rust type
declarations and implementation targets, Python classes, and top-level Rust and
Python functions. This treatment does not imply equivalent definition recognition
for every language.

For Rust, control flow includes `return`, `break`, `continue`, `if`, `match`,
`for`, `.await`, `?`, `unsafe` and macros. Python also includes `yield`, `try`,
`except`, `raise` and `assert`. Syntax operators such as `::`, `.`, `->`, `=>`,
`=` and ranges stay muted; mathematical and logical operators stay regular.

YAML mapping keys use the regular foreground even when quoted. String values
use the string role; numbers, booleans and null stay regular. Mapping punctuation,
sequence markers and block-scalar markers are muted. These rules cover Compose
files through their YAML grammar without requiring another extension.

SQL also uses `important` for the declarative structure of queries: SELECT/FROM/WHERE,
JOIN/ON, GROUP BY/HAVING/ORDER BY, LIMIT/OFFSET, WITH and set operations, INSERT/INTO/
VALUES, UPDATE/SET, DELETE and RETURNING. CASE/WHEN/THEN/ELSE/END retain that role.
Boolean predicates (AND/OR/NOT, IS, IN, LIKE, BETWEEN, EXISTS), comparisons and
computing operators stay `regular`, along with names, functions, numbers and
constants. AS, sort directions and type scaffolding remain muted. Quoted text and
comments retain their grammar roles; JOIN modifiers are accented as complete JOIN
phrases so ordinary functions such as LEFT() remain regular.

Common TextMate rules provide baseline support for other languages. Markdown
preserves emphasis, bold text and strikethrough; fenced code uses its embedded
language grammar when available. The samples represent a review corpus, not a
promise of identical grammar detail across languages.

## Workbench roles

`background`, `surface`, `raised` and `border` describe editor and UI surfaces.
Text uses `regular`, `insignificant` and their transparent variants.

`accent` drives links, cursor, active tabs, buttons, progress, focus and search.
It defaults to `important` but can differ in an individual family. Transparent
accent colors mark selections and matches. Strong word highlights use the string
color as a secondary accent. Every family uses the shared blue for UI as well as
control flow. Button text must retain readable contrast against both default and
hover backgrounds.

Diagnostic, Git, debugging and terminal ANSI colors live in the shared
`src/palettes/status.json` and retain their meanings independently of decorative
palette changes.

Light documentation colors and shared scaffolding (`#606B78`) exceed 4.5:1 on
both the editor background and active-line surface. Contrast tests guard these
roles and the normal editor text colors across all variants.

## Implementation and review

`src/compile.js` combines syntax and workbench rules into a complete static VS
Code theme. Generated themes do not include or depend on another theme file.
Grammar gaps are addressed by injections in `vscode/syntaxes/`.

Run `npm run check` for catalog, extension-contract, contrast and grammar checks.
Review `samples/` in the Extension Development Host for the full workbench; HTML
screenshots validate token presentation only. `npm run screenshots` produces the
documentation previews for every palette.

Navigate and Pustota are acknowledged in the README. Copyright notices for
inherited portions remain in LICENSE.
