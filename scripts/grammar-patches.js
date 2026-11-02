// Apply small, audited scope adaptations without changing pattern precedence.
// Exact matches and cardinality guards make upstream refreshes fail visibly.
function applyGrammarPatches(grammar, patches = []) {
  const result = structuredClone(grammar);
  for (const patch of patches) {
    let count = 0;
    const visit = (value) => {
      if (!value || typeof value !== 'object') return;
      if (!Array.isArray(value) && Object.entries(patch.find).every(([key, expected]) => value[key] === expected)) {
        Object.assign(value, structuredClone(patch.replace));
        count++;
      }
      for (const child of Object.values(value)) visit(child);
    };
    visit(result);
    if (count !== 1) throw new Error(`Grammar patch expected one matching rule, found ${count}: ${patch.reason}`);
  }
  return result;
}
module.exports = { applyGrammarPatches };
