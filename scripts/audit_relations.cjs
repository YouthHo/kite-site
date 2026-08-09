// 人物关系穷尽性审计：characters.related 中的每一对，是否都在 relationships.links 里
const fs = require('fs');
const chars = JSON.parse(fs.readFileSync('src/data/characters.json', 'utf8'));
const rel = JSON.parse(fs.readFileSync('src/data/relationships.json', 'utf8'));

const linkSet = new Set(rel.links.map((l) => [l.source, l.target].sort().join('|')));
const nodeIds = new Set(rel.nodes.map((n) => n.id));
const charIds = new Set(chars.map((c) => c.id));

const missingInGraph = [...charIds].filter((id) => !nodeIds.has(id));
const missingEdges = [];
chars.forEach((c) => {
  (c.related || []).forEach((r) => {
    if (!linkSet.has([c.id, r.id].sort().join('|'))) missingEdges.push(`${c.id} — ${r.id} (${r.rel})`);
  });
});

console.log('== 角色档案里有关联、但图谱缺边 ==');
missingEdges.forEach((e) => console.log('  MISSING:', e));
console.log('== 在角色档案中、但不在图谱节点中 ==');
missingInGraph.forEach((id) => console.log('  NO_NODE:', id));
console.log('== 统计 ==');
console.log('characters:', chars.length, '| graph nodes:', rel.nodes.length, '| links:', rel.links.length);
