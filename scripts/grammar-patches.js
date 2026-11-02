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
// Repair exact source fragments before parsing, with guards against upstream drift.
function applyGrammarSourcePatches(source, patches = []) {
  let result = source;
  for (const patch of patches) {
    if (!patch.find) throw new Error('Grammar source patch must have a nonempty find string');
    const parts = result.split(patch.find);
    const count = parts.length - 1;
    if (count !== patch.count) {
      throw new Error(`Grammar source patch expected ${patch.count} matches, found ${count}: ${patch.reason}`);
    }
    result = parts.join(patch.replace);
  }
  return result;
}
module.exports = { applyGrammarPatches, applyGrammarSourcePatches };
