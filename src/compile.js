const { tokenColors } = require('./syntax');
const { workbenchColors } = require('./workbench');

function compile(variant) {
  return {
    name: variant.label,
    $schema: 'vscode://schemas/color-theme',
    type: variant.appearance,
    semanticHighlighting: false,
    colors: workbenchColors(variant),
    tokenColors: tokenColors(variant.colors, variant.status),
  };
}

module.exports = { compile };
