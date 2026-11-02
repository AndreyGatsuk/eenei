const textmate = require('vscode-textmate');
const { createRegistry } = require('../grammars');

const MARKER_BASE = 0x340000;
const marker = (index) => `#${(MARKER_BASE + index + 1).toString(16).padStart(6, '0')}`;
function selectors(theme) {
  return theme.tokenColors.flatMap((rule, ruleIndex) =>
    (Array.isArray(rule.scope) ? rule.scope : [rule.scope]).map((scope) => ({
      ruleIndex, name: rule.name || scope, scope, settings: rule.settings,
    })));
}

// Let TextMate select the winner itself. Distinct colors identify individual
// selectors; foreground and fontStyle are traced independently so style-only
// rules cannot incorrectly claim the foreground of an underlying rule.
async function createTrace(theme, field, registryFactory = createRegistry) {
  const entries = selectors(theme);
  const tokenColors = entries.map((entry, index) => {
    const settings = { ...entry.settings };
    delete settings.foreground;
    if (entry.settings[field] !== undefined) settings.foreground = marker(index);
    return { scope: entry.scope, settings };
  });
  const traced = { ...theme, name: `${theme.name} (${field} trace)`,
    colors: { ...theme.colors, 'editor.foreground': '#000001' }, tokenColors };
  const registry = await registryFactory(traced);
  const loaded = new Map();
  const grammarFor = async (scope) => {
    if (!loaded.has(scope)) loaded.set(scope, registry.loadGrammar(scope));
    const grammar = await loaded.get(scope);
    if (!grammar) throw new Error(`Missing grammar ${scope}`);
    return grammar;
  };
  const decode = (metadata) => {
    const color = registry.getColorMap()[(metadata >>> 15) & 511];
    const index = parseInt(color.slice(1), 16) - MARKER_BASE - 1;
    return index >= 0 && index < entries.length ? index : null;
  };
  return {
    entries,
    async scan(scope, source, onToken) {
      const grammar = await grammarFor(scope);
      let stack = textmate.INITIAL;
      for (const [lineIndex, line] of source.split('\n').entries()) {
        const result = grammar.tokenizeLine2(line, stack);
        if (result.stoppedEarly) throw new Error(`Tokenization timed out: ${scope}:${lineIndex + 1}`);
        stack = result.ruleStack;
        for (let index = 0; index < result.tokens.length; index += 2) {
          const start = result.tokens[index];
          const end = index + 2 < result.tokens.length ? result.tokens[index + 2] : line.length;
          const text = line.slice(start, end);
          if (text.trim()) onToken(decode(result.tokens[index + 1]), { line: lineIndex, start, end, text });
        }
      }
    },
    async winners(scope, source) {
      const result = [];
      await this.scan(scope, source, (index, token) => result.push({ ...token, index }));
      return result;
    },
    dispose: () => registry.dispose(),
  };
}
function verifiesStyle(fontStyle, expected) {
  const positive = fontStyle.split(/\s+/).filter(Boolean).map((style) => style === 'strikethrough' ? 'strikethrough' : style);
  if (!positive.length) return ['bold', 'italic', 'underline', 'strikethrough'].every((style) => expected[style] === false);
  return positive.every((style) => expected[style] === true);
}
module.exports = { selectors, createTrace, verifiesStyle };
