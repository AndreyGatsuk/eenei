const fs = require('node:fs');
const path = require('node:path');
const textmate = require('vscode-textmate');
const oniguruma = require('vscode-oniguruma');
const { registerRegistry } = require('./coverage/coverage-data');

const ROOT = path.join(__dirname, '..');
const { readGrammar } = require('./grammar-cache');

// Samples and grammars share one catalog for screenshots and syntax checks.
const languages = {
  "bibtex": {"scope": "text.bibtex", "grammar": "latex/syntaxes/Bibtex.tmLanguage.json", "sample": "sample.bib"},
  "coffeescript": {"scope": "source.coffee", "grammar": "coffeescript/syntaxes/coffeescript.tmLanguage.json", "sample": "sample.coffee"},
  "cuda-cpp": {"scope": "source.cuda-cpp", "grammar": "cpp/syntaxes/cuda-cpp.tmLanguage.json", "sample": "sample.cu"},
  "fsharp": {"scope": "source.fsharp", "grammar": "fsharp/syntaxes/fsharp.tmLanguage.json", "sample": "sample.fs"},
  "groovy": {"scope": "source.groovy", "grammar": "groovy/syntaxes/groovy.tmLanguage.json", "sample": "sample.groovy"},
  "handlebars": {"scope": "text.html.handlebars", "grammar": "handlebars/syntaxes/Handlebars.tmLanguage.json", "sample": "sample.hbs"},
  "hlsl": {"scope": "source.hlsl", "grammar": "hlsl/syntaxes/hlsl.tmLanguage.json", "sample": "sample.hlsl"},
  "jade": {"scope": "text.pug", "grammar": "pug/syntaxes/pug.tmLanguage.json", "sample": "sample.pug"},
  "jsonl": {"scope": "source.json.lines", "grammar": "json/syntaxes/JSONL.tmLanguage.json", "sample": "sample.jsonl"},
  "julia": {"scope": "source.julia", "grammar": "julia/syntaxes/julia.tmLanguage.json", "sample": "sample.jl"},
  "latex": {"scope": "text.tex.latex", "grammar": "latex/syntaxes/LaTeX.tmLanguage.json", "sample": "sample.tex"},
  "log": {"scope": "text.log", "grammar": "log/syntaxes/log.tmLanguage.json", "sample": "sample.log"},
  "objective-cpp": {"scope": "source.objcpp", "grammar": "objective-c/syntaxes/objective-c++.tmLanguage.json", "sample": "sample.mm"},
  "perl": {"scope": "source.perl", "grammar": "perl/syntaxes/perl.tmLanguage.json", "sample": "sample.pl"},
  "r": {"scope": "source.r", "grammar": "r/syntaxes/r.tmLanguage.json", "sample": "sample.R"},
  "raku": {"scope": "source.perl.6", "grammar": "perl/syntaxes/perl6.tmLanguage.json", "sample": "sample.raku"},
  "razor": {"scope": "text.html.cshtml", "grammar": "razor/syntaxes/cshtml.tmLanguage.json", "sample": "sample.cshtml"},
  "shaderlab": {"scope": "source.shaderlab", "grammar": "shaderlab/syntaxes/shaderlab.tmLanguage.json", "sample": "sample.shader"},
  "swift": {"scope": "source.swift", "grammar": "swift/syntaxes/swift.tmLanguage.json", "sample": "sample.swift"},
  "vb": {"scope": "source.asp.vb.net", "grammar": "vb/syntaxes/asp-vb-net.tmLanguage.json", "sample": "sample.vb"},
  "xsl": {"scope": "text.xml.xsl", "grammar": "xml/syntaxes/xsl.tmLanguage.json", "sample": "sample.xsl"},
  "jinja": {"scope": "source.jinja", "grammar": "bundled", "sample": "sample.jinja"},
  "jinja-yaml": {"scope": "text.yaml.jinja", "grammar": "bundled", "sample": "sample.yaml.jinja"},
  "tex": {"scope": "text.tex", "grammar": "latex/syntaxes/TeX.tmLanguage.json", "sample": "sample.sty"},
  "juliamarkdown": {"scope": "text.html.markdown.julia", "grammar": "bundled", "sample": "sample.jmd"},
  "lua": {"scope": "source.lua", "grammar": "lua/syntaxes/lua.tmLanguage.json", "sample": "sample.lua"},
  "bat": {"scope": "source.batchfile", "grammar": "bat/syntaxes/batchfile.tmLanguage.json", "sample": "sample.bat"},
  "c": {"scope": "source.c", "grammar": "cpp/syntaxes/c.tmLanguage.json", "sample": "sample.c"},
  "clojure": {"scope": "source.clojure", "grammar": "clojure/syntaxes/clojure.tmLanguage.json", "sample": "sample.clj"},
  "csharp": {"scope": "source.cs", "grammar": "csharp/syntaxes/csharp.tmLanguage.json", "sample": "sample.cs"},
  "dart": {"scope": "source.dart", "grammar": "dart/syntaxes/dart.tmLanguage.json", "sample": "sample.dart"},
  "ini": {"scope": "source.ini", "grammar": "ini/syntaxes/ini.tmLanguage.json", "sample": "sample.ini"},
  "makefile": {"scope": "source.makefile", "grammar": "make/syntaxes/make.tmLanguage.json", "sample": "Makefile"},
  "objective-c": {"scope": "source.objc", "grammar": "objective-c/syntaxes/objective-c.tmLanguage.json", "sample": "sample.m"},
  "php": {"scope": "text.html.php", "grammar": "php/syntaxes/html.tmLanguage.json", "sample": "sample.php"},
  "powershell": {"scope": "source.powershell", "grammar": "powershell/syntaxes/powershell.tmLanguage.json", "sample": "sample.ps1"},
  "restructuredtext": {"scope": "source.rst", "grammar": "restructuredtext/syntaxes/rst.tmLanguage.json", "sample": "sample.rst"},
  "ruby": {"scope": "source.ruby", "grammar": "ruby/syntaxes/ruby.tmLanguage.json", "sample": "sample.rb"},
  "xml": {"scope": "text.xml", "grammar": "xml/syntaxes/xml.tmLanguage.json", "sample": "sample.xml"},
  "jsonc": {"scope": "source.json.comments", "grammar": "json/syntaxes/JSONC.tmLanguage.json", "sample": "tsconfig.json"},
  "jsx": {"scope": "source.js.jsx", "grammar": "javascript/syntaxes/JavaScriptReact.tmLanguage.json", "sample": "sample.jsx"},
  "dockerfile": {"scope": "source.dockerfile", "grammar": "docker/syntaxes/docker.tmLanguage.json", "sample": "Dockerfile"},
  "dotenv": {"scope": "source.dotenv", "grammar": "dotenv/syntaxes/dotenv.tmLanguage.json", "sample": ".env.example"},
  "gitignore": {"scope": "source.ignore", "grammar": "git-base/syntaxes/ignore.tmLanguage.json", "sample": ".gitignore"},
  "dockerignore": {"scope": "source.ignore", "grammar": "git-base/syntaxes/ignore.tmLanguage.json", "sample": ".dockerignore"},
  "scss": {"scope": "source.css.scss", "grammar": "scss/syntaxes/scss.tmLanguage.json", "sample": "sample.scss"},
  "less": {"scope": "source.css.less", "grammar": "less/syntaxes/less.tmLanguage.json", "sample": "sample.less"},
  "diff": {"scope": "source.diff", "grammar": "diff/syntaxes/diff.tmLanguage.json", "sample": "sample.diff"},

  toml: { scope: 'source.toml', grammar: 'toml.tmLanguage.json', sample: 'Cargo.toml' },
  'cargo-lock': { scope: 'source.toml', grammar: 'toml.tmLanguage.json', sample: 'Cargo.lock' },
  'uv-lock': { scope: 'source.toml', grammar: 'toml.tmLanguage.json', sample: 'uv.lock' },
  rust: { scope: 'source.rust', grammar: 'rust/syntaxes/rust.tmLanguage.json', sample: 'sample.rs' },
  python: { scope: 'source.python', grammar: 'python/syntaxes/MagicPython.tmLanguage.json', sample: 'sample.py' },
  yaml: { scope: 'source.yaml', grammar: 'yaml/syntaxes/yaml.tmLanguage.json', sample: 'compose.yaml' },
  javascript: { scope: 'source.js', grammar: 'javascript/syntaxes/JavaScript.tmLanguage.json', sample: 'sample.js' },
  typescript: { scope: 'source.ts', grammar: 'typescript-basics/syntaxes/TypeScript.tmLanguage.json', sample: 'sample.ts' },
  tsx: { scope: 'source.tsx', grammar: 'typescript-basics/syntaxes/TypeScriptReact.tmLanguage.json', sample: 'sample.tsx' },
  markdown: { scope: 'text.html.markdown', grammar: 'markdown-basics/syntaxes/markdown.tmLanguage.json', sample: 'sample.md' },
  html: { scope: 'text.html.derivative', grammar: 'html/syntaxes/html-derivative.tmLanguage.json', sample: 'sample.html' },
  css: { scope: 'source.css', grammar: 'css/syntaxes/css.tmLanguage.json', sample: 'sample.css' },
  json: { scope: 'source.json', grammar: 'json/syntaxes/JSON.tmLanguage.json', sample: 'sample.json' },
  bash: { scope: 'source.shell', grammar: 'shellscript/syntaxes/shell-unix-bash.tmLanguage.json', sample: 'sample.sh' },
  cpp: { scope: 'source.cpp', grammar: 'cpp/syntaxes/cpp.tmLanguage.json', sample: 'sample.cpp' },
  java: { scope: 'source.java', grammar: 'java/syntaxes/java.tmLanguage.json', sample: 'Project.java' },
  go: { scope: 'source.go', grammar: 'go/syntaxes/go.tmLanguage.json', sample: 'sample.go' },
  sql: { scope: 'source.sql', grammar: 'sql/syntaxes/sql.tmLanguage.json', sample: 'sample.sql' },
};

const builtinGrammars = require('./coverage/catalogs/vscode.json').grammars;
const grammarPaths = {
  ...Object.fromEntries(builtinGrammars.map((grammar) => [grammar.scopeName, grammar.path])),
  ...Object.fromEntries(Object.values(languages).map(({ scope, grammar }) => [scope, grammar])),
  'source.php': 'php/syntaxes/php.tmLanguage.json',
  'source.sassdoc': 'scss/syntaxes/sassdoc.tmLanguage.json',
  'source.regexp.python': 'python/syntaxes/MagicRegExp.tmLanguage.json',
  'source.js.regexp': 'javascript/syntaxes/Regular Expressions (JavaScript).tmLanguage',
  'text.html': 'html/syntaxes/html.tmLanguage.json',
  'text.html.basic': 'html/syntaxes/html.tmLanguage.json',
  'source.c': 'cpp/syntaxes/c.tmLanguage.json',
  'source.c.platform': 'cpp/syntaxes/platform.tmLanguage.json',
  'source.cpp.embedded.macro': 'cpp/syntaxes/cpp.embedded.macro.tmLanguage.json',
  'documentation.injection.ts': 'typescript-basics/syntaxes/jsdoc.ts.injection.tmLanguage.json',
  'documentation.injection.js.jsx': 'typescript-basics/syntaxes/jsdoc.js.injection.tmLanguage.json',
  ...Object.fromEntries(['1.0', '1.1', '1.2', '1.3', 'embedded'].map((version) => [
    `source.yaml.${version}`, `yaml/syntaxes/yaml-${version}.tmLanguage.json`,
  ])),
};

// Resolve bundled grammars exactly as VS Code does, including full language support.
const contributedGrammars = require('../vscode/package.json').contributes.grammars;
const bundledGrammarPaths = Object.fromEntries(
  contributedGrammars.map(({ scopeName, path: file }) => [
    scopeName, path.join(ROOT, 'vscode', file),
  ]),
);

const injections = {
  'text.html.jinja': ['theme-lab.injection.jinja'],
  'source.dockerfile': ['theme-lab.injection.dockerfile'],
  'source.rust': ['theme-lab.injection.rust'],
  'source.python': ['theme-lab.injection.python'],
  'source.js': ['documentation.injection.js.jsx'],
  'source.js.jsx': ['documentation.injection.js.jsx'],
  'source.ts': ['documentation.injection.ts'],
  'source.tsx': ['documentation.injection.ts'],
};

let onigLib;
// grammarDirectory is the VS Code extensions root, e.g. /usr/share/code/resources/app/extensions.
async function createRegistry(theme, { grammarDirectory = process.env.VSCODE_EXTENSIONS_DIR } = {}) {
  if (!onigLib) {
    onigLib = oniguruma.loadWASM(fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')))
      .then(() => ({
        createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
        createOnigString: (text) => new oniguruma.OnigString(text),
      }));
  }

  const registry = new textmate.Registry({
    onigLib,
    theme: {
      name: theme.name,
      settings: [{ settings: { foreground: theme.colors['editor.foreground'] } }, ...theme.tokenColors],
    },
    loadGrammar: async (scopeName) => {
      const bundled = bundledGrammarPaths[scopeName];
      if (bundled) {
        return textmate.parseRawGrammar(fs.readFileSync(bundled, 'utf8'), bundled);
      }
      const relativePath = grammarPaths[scopeName];
      if (!relativePath) return null;
      const file = grammarDirectory ? path.join(grammarDirectory, relativePath) : relativePath;
      const source = grammarDirectory ? fs.readFileSync(file, 'utf8') : readGrammar(relativePath);
      return textmate.parseRawGrammar(source, file);
    },
    getInjections: (scopeName) => [...new Set([
      ...(injections[scopeName] || []),
      ...builtinGrammars.filter((grammar) => grammar.injectTo?.includes(scopeName)).map((grammar) => grammar.scopeName),
      ...contributedGrammars.filter((grammar) => grammar.injectTo?.includes(scopeName)).map((grammar) => grammar.scopeName),
    ])],
  });
  registerRegistry(registry, theme);
  return registry;
}

module.exports = { languages, grammarPaths, createRegistry };
