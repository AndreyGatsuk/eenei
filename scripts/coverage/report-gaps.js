function coverageGaps(variants) {
  const gaps = [];
  for (const variant of variants) {
    for (const rule of variant.rules) for (const selector of rule.selectors) {
      for (const property of ['foreground', 'fontStyle']) {
        const facet = selector[property];
        if (facet && !facet.assertions) gaps.push({
          kind: 'selector-property', variant: variant.id, rule: rule.name,
          scope: selector.scope, property, status: facet.status,
        });
      }
    }
    for (const file of variant.files) {
      if (file.grammar !== 'passed' || !file.colorAssertions || !file.styleAssertions || file.failedAssertions) {
        gaps.push({ kind: 'file', variant: variant.id, sample: file.sample,
          grammar: file.grammar, colors: file.colorAssertions, styles: file.styleAssertions,
          failures: file.failedAssertions });
      }
    }
    if (variant.assertions.untraced) gaps.push({
      kind: 'untraced-assertion', variant: variant.id, count: variant.assertions.untraced,
    });
  }
  return gaps;
}
module.exports = { coverageGaps };
