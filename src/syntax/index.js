const scopes = (byLanguage) => Object.values(byLanguage).flat();

const tokenColors = (c, status) => [
  {
    name: 'Regular text and embedded languages',
    scope: ['source', 'text', 'meta.embedded'],
    settings: { foreground: c.regular },
  },
  {
    name: 'Important: control flow, ?, macros, unsafe',
    scope: scopes({
      any: ['keyword.control', 'entity.name.function.macro', 'entity.name.type.macro'],
      clojure: ['storage.control.clojure'],
      pug: ['meta.control.flow.pug storage.type.function.pug'],
      rust: ['keyword.operator.question.rust', 'keyword.other.unsafe.rust'],
    }),
    settings: { foreground: c.important },
  },
  {
    name: 'Bold: type names at their definition, top-level functions',
    scope: scopes({
      rust: [
        'entity.name.type.struct',
        'entity.name.type.enum',
        'entity.name.type.trait',
        'entity.name.type.declaration',
        'meta.impl.rust > entity.name.type',
        'meta.toplevel.rust meta.function.definition.rust entity.name.function',
      ],
      python: ['entity.name.type.class', 'meta.toplevel.python meta.function.python entity.name.function'],
    }),
    settings: { fontStyle: 'bold' },
  },
  {
    name: 'Italic: comments',
    scope: scopes({
      any: ['comment', 'comment punctuation.definition.comment'],
    }),
    settings: { foreground: c.comment, fontStyle: 'italic' },
  },
  {
    name: 'Strings',
    scope: scopes({
      any: ['string', 'punctuation.definition.string', 'punctuation.definition.char', 'constant.character.escape'],
      python: ['storage.type.string.python', 'string.regexp keyword', 'string.regexp punctuation'],
      dotenv: ['property.value.dotenv'],
    }),
    settings: { foreground: c.string },
  },
  {
    name: 'Configuration keys and embedded expression names',
    scope: [
      'support.type.property-name.json',
      'string variable', 'variable.interpolation.dotenv',
    ],
    settings: { foreground: c.regular },
  },
  {
    name: 'YAML: mapping keys, numbers, booleans and null',
    scope: [
      'entity.name.tag.yaml', 'source.yaml constant.numeric', 'source.yaml constant.language',
      'meta.embedded.block.yaml constant.numeric', 'meta.embedded.block.yaml constant.language',
      'meta.embedded.yaml constant.numeric', 'meta.embedded.yaml constant.language',
    ],
    settings: { foreground: c.regular },
  },
  {
    name: 'Insignificant: keywords, syntax operators, punctuation',
    scope: scopes({
      any: ['keyword', 'storage', 'keyword.control.import', 'keyword.control.export', 'keyword.control.from', 'punctuation', 'meta.brace'],
      rust: [
        'meta.impl.rust keyword.control',
        'variable.language.super',
        'meta.use entity.name.namespace',
        'entity.name.type.lifetime',
        'meta.attribute.rust',
        'meta.attribute.rust string',
        'meta.attribute.rust punctuation.definition.string',
      ],
      python: [
        'entity.name.namespace.python',
        'constant.character.format.placeholder.other.python',
        'meta.function.decorator.python',
        'meta.function.decorator.python string',
        'meta.function.decorator.python punctuation.definition.string',
      ],
      yaml: [
        'entity.name.tag.yaml punctuation.definition.string', 'source.yaml keyword.control',
        'meta.embedded.block.yaml keyword.control', 'meta.embedded.yaml keyword.control',
      ],
      cpp: ['keyword.control.directive.include'],
      jinja: ['entity.other.jinja.delimiter'],
      mdx: ['source.mdx string.other.begin', 'source.mdx string.other.end'],
      vue: [
        'meta.attribute.directive.vue punctuation.definition.string',
        'meta.attribute.directive.control.vue punctuation.definition.string',
      ],
    }),
    settings: { foreground: c.insignificant },
  },
  {
    name: 'Regular: math, comparison, logic operators',
    scope: scopes({
      any: [
        'keyword.operator.math',
        'keyword.operator.arithmetic',
        'keyword.operator.comparison',
        'keyword.operator.relational',
        'keyword.operator.logical',
        'keyword.operator.bitwise',
        'keyword.operator.increment',
        'keyword.operator.decrement',
        'keyword.operator.exponent',
        'keyword.operator.assignment.compound',
      ],
      rust: ['keyword.operator.assignment.rust'],
      nix: ['keyword.operator.computation.nix', 'keyword.operator.unary.nix'],
    }),
    settings: { foreground: c.regular },
  },
  {
    name: 'Italic insignificant: doc comments',
    scope: scopes({
      any: [
        'comment.line.documentation',
        'comment.block.documentation',
        'comment.line.documentation punctuation.definition.comment',
        'comment.block.documentation punctuation.definition.comment',
      ],
      python: ['string.quoted.docstring', 'string.quoted.docstring punctuation.definition.string'],
      lua: ['comment.line.double-dash.documentation.lua', 'comment.line.double-dash.documentation.lua punctuation.definition.comment'],
      java: ['comment.block.javadoc.java', 'comment.block.javadoc.java punctuation.definition.comment'],
      cpp: [
        'comment.line.double-slash.documentation.cpp',
        'comment.line.double-slash.documentation.cpp punctuation.definition.comment',
      ],
    }),
    settings: { foreground: c.docComment, fontStyle: 'italic' },
  },
  {
    name: 'Document navigation: headings',
    scope: ['markup.heading', 'entity.name.section.markdown'],
    settings: { foreground: c.important, fontStyle: 'bold' },
  },
  {
    name: 'Document navigation: links',
    scope: ['markup.underline.link', 'string.other.link.title', 'constant.other.reference.link.markdown', 'string.other.link.destination.mdx'],
    settings: { foreground: c.important, fontStyle: 'underline' },
  },
  {
    name: 'Document code spans',
    scope: ['markup.inline.raw'],
    settings: { foreground: c.string },
  },
  {
    name: 'Document quotations',
    scope: ['markup.quote'],
    settings: { foreground: c.comment },
  },
  {
    name: 'Diff additions retain their status color',
    scope: ['markup.inserted', 'meta.diff.header.to-file', 'punctuation.definition.inserted', 'punctuation.definition.to-file'],
    settings: { foreground: status['gitDecoration.addedResourceForeground'].slice(0, 7) },
  },
  {
    name: 'Diff removals retain their status color',
    scope: ['markup.deleted', 'meta.diff.header.from-file', 'punctuation.definition.deleted', 'punctuation.definition.from-file'],
    settings: { foreground: status['gitDecoration.deletedResourceForeground'].slice(0, 7) },
  },
  {
    name: 'Diff navigation',
    scope: ['meta.diff.range', 'meta.diff.range punctuation'],
    settings: { foreground: c.important },
  },
  { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
  { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
  { scope: ['markup.strikethrough'], settings: { fontStyle: 'strikethrough' } },
];

module.exports = { tokenColors };
