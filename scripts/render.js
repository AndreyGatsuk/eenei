const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { execFileSync } = require('node:child_process');
const textmate = require('vscode-textmate');
const { languages, createRegistry } = require('./grammars');
const frameworks = require('./frameworks.json');
const { getVariants } = require('../src/catalog');
const { compile } = require('../src/compile');

const ROOT = path.join(__dirname, '..');
const LINE_HEIGHT = 28;
const PADDING = 24;
const WIDTH = 1010;
const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function render(language, output, variantId = 'on-rose-dark', sourcePath) {
  const framework = frameworks.find(({ id }) => id === language);
  const sample = languages[language] || framework;
  if (!sample) throw new Error(`Unknown language '${language}'. Choose: ${[...Object.keys(languages), ...frameworks.map(({ id }) => id)].join(', ')}`);
  const variant = getVariants().find(({ id }) => id === variantId);
  if (!variant) throw new Error(`Unknown variant '${variantId}'. Choose: ${getVariants().map(({ id }) => id).join(', ')}`);

  const theme = compile(variant);
  const registry = await createRegistry(theme);
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'theme-lab-'));
  try {
    const grammar = await registry.loadGrammar(sample.scope);
    if (!grammar) throw new Error(`Cannot load grammar for ${language}`);
    const colors = registry.getColorMap();
    const lines = fs.readFileSync(sourcePath || path.join(ROOT, 'samples', sample.sample), 'utf8').replace(/\n$/, '').split('\n');
    let stack = textmate.INITIAL;
    const rows = lines.map((line, index) => {
      const { tokens, ruleStack } = grammar.tokenizeLine2(line, stack);
      stack = ruleStack;
      let html = `<span class="number">${index + 1}</span>`;
      for (let i = 0; i < tokens.length; i += 2) {
        const end = i + 2 < tokens.length ? tokens[i + 2] : line.length;
        const metadata = tokens[i + 1];
        const style = (metadata >>> 11) & 15;
        const color = colors[(metadata >>> 15) & 511];
        const css = [`color:${color}`, style & 1 && 'font-style:italic', style & 2 && 'font-weight:bold',
          (style & 12) && `text-decoration:${[style & 4 && 'underline', style & 8 && 'line-through'].filter(Boolean).join(' ')}`,
        ].filter(Boolean).join(';');
        html += `<span style="${css}">${escape(line.slice(tokens[i], end))}</span>`;
      }
      return `<div>${html}</div>`;
    });

    const page = `<!doctype html><meta charset="utf-8"><title>${escape(variant.label)} — ${language}</title><style>
body{margin:0;background:${theme.colors['editor.background']}}
pre{margin:0;padding:12px 24px 12px 8px;font:16px/${LINE_HEIGHT}px "JetBrains Mono","DejaVu Sans Mono",Consolas,monospace;color:${theme.colors['editor.foreground']};display:inline-block;font-variant-ligatures:none;font-feature-settings:"calt" 0,"liga" 0}
.number{color:${theme.colors['editorLineNumber.foreground']};display:inline-block;width:2.5ch;text-align:right;margin-right:2ch}
</style><pre>${rows.join('')}</pre>`;
    const htmlFile = path.join(tempDirectory, `${language}.html`);
    fs.writeFileSync(htmlFile, page);
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    const chrome = process.env.CHROME_BIN || (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : process.platform === 'win32'
        ? path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe')
        : 'chromium');
    execFileSync(chrome, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars',
      `--user-data-dir=${path.join(tempDirectory, 'chrome')}`,
      '--force-device-scale-factor=2',
      `--window-size=${WIDTH},${lines.length * LINE_HEIGHT + PADDING}`,
      `--screenshot=${path.resolve(output)}`,
      pathToFileURL(htmlFile).href,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
    console.log(`Written ${output} (${variant.label})`);
  } finally {
    registry.dispose();
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
}

if (require.main === module) {
  const [language, output, variantId] = process.argv.slice(2);
  if (!language || !output) {
    console.error('Usage: node scripts/render.js <language> <out.png> [variant-id=on-rose-dark]');
    process.exitCode = 1;
  } else {
    render(language, output, variantId).catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    });
  }
}

module.exports = { render };
