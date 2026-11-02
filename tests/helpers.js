const assert = require('node:assert/strict');
const textmate = require('vscode-textmate');
const { recordAssertion } = require('../scripts/coverage/coverage-data');

function tokenAt(registry, grammar, source, lineNumber, text) {
  const lines = source.split('\n');
  assert.ok(lineNumber < lines.length, `Missing line ${lineNumber + 1}`);
  const offset = lines[lineNumber].indexOf(text);
  assert.notEqual(offset, -1, `Missing ${JSON.stringify(text)} on line ${lineNumber + 1}`);
  let stack = textmate.INITIAL;
  let tokens;
  let scopedTokens;
  for (let index = 0; index <= lineNumber; index++) {
    if (index === lineNumber) scopedTokens = grammar.tokenizeLine(lines[index], stack).tokens;
    const result = grammar.tokenizeLine2(lines[index], stack);
    stack = result.ruleStack;
    tokens = result.tokens;
  }
  let metadata;
  for (let index = 0; index < tokens.length && tokens[index] <= offset; index += 2) {
    metadata = tokens[index + 1];
  }
  assert.notEqual(metadata, undefined, `No token at ${lineNumber + 1}:${offset + 1}`);
  return {
    color: registry.getColorMap()[(metadata >>> 15) & 511].toLowerCase(),
    italic: Boolean((metadata >>> 11) & 1),
    bold: Boolean((metadata >>> 11) & 2),
    underline: Boolean((metadata >>> 11) & 4),
    strikethrough: Boolean((metadata >>> 11) & 8),
    scopes: scopedTokens.find((token) => token.startIndex <= offset && token.endIndex > offset)?.scopes || [],
  };
}

function checkTokens(registry, grammar, colors, source, cases) {
  for (const [line, text, role, styles = {}] of cases) {
    const token = tokenAt(registry, grammar, source, line, text);
    const location = `${text} at line ${line + 1}`;
    let passed = false;
    try {
      assert.equal(token.color, colors[role].toLowerCase(), `${location}: expected ${role}`);
      for (const [style, expected] of Object.entries(styles)) {
        assert.equal(token[style], expected, `${location}: ${style}`);
      }
      passed = true;
    } finally {
      recordAssertion(registry, { source, line, text, role, expectedColor: colors[role], styles, actual: token, passed });
    }
  }
}

module.exports = { tokenAt, checkTokens };
