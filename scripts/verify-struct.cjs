#!/usr/bin/env node
// Stage 1 · 结构静态校验（内容审计用，只读不改数据）
// 输出 reports/struct-check.md
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const strip = (s) => s.replace(/^\uFEFF/, '')
const read = (rel) => JSON.parse(strip(fs.readFileSync(path.join(ROOT, rel), 'utf8')))

const errors = []
const warns = []
const err = (file, line, msg, sev = 'error') => (sev === 'error' ? errors : warns).push({ file, line, msg, sev })

/* ---------- 1. BOM 检测 ---------- */
const dataFiles = fs.readdirSync(path.join(ROOT, 'src', 'data')).filter((f) => f.endsWith('.json'))
for (const f of dataFiles) {
  const buf = fs.readFileSync(path.join(ROOT, 'src', 'data', f))
  if (buf[0] === 0xef) warn(`src/data/${f}`, 1, '文件带 UTF-8 BOM', 'warn')
}

/* ---------- 2. schema 校验 relationships ---------- */
const rel = read('src/data/relationships.json')
const TYPE_SET = new Set(['enemy', 'superior', 'family', 'love', 'comrade', 'partner'])
const FACTION_SET = new Set(['junton', 'zhongtong', 'underground', 'gongan', 'civilian'])
const nodeIds = new Set(rel.nodes.map((n) => n.id))
const seenNode = new Set()
rel.nodes.forEach((n, i) => {
  const L = i + 2
  if (seenNode.has(n.id)) err('relationships.json', L, `节点 id 重复: ${n.id}`)
  seenNode.add(n.id)
  if (!n.id || !n.name || !n.faction) err('relationships.json', L, `节点缺必填: ${n.id || '(no id)'}`)
  if (n.faction && !FACTION_SET.has(n.faction)) err('relationships.json', L, `faction 非法: ${n.id}=${n.faction}`)
  if (typeof n.x !== 'number' || typeof n.y !== 'number') err('relationships.json', L, `节点缺坐标: ${n.id}`)
})
rel.links.forEach((l, i) => {
  const L = rel.nodes.length + i + 3
  if (!TYPE_SET.has(l.type)) err('relationships.json', L, `link ${l.source}->${l.target} type 非法: ${l.type}`)
  if (!(l.strength >= 1 && l.strength <= 5)) err('relationships.json', L, `link strength 越界: ${l.source}->${l.target}=${l.strength}`)
  if (![-1, 0, 1].includes(l.tone)) err('relationships.json', L, `link tone 非法: ${l.source}->${l.target}=${l.tone}`)
  if (!nodeIds.has(l.source)) err('relationships.json', L, `link source 悬挂: ${l.source}`)
  if (!nodeIds.has(l.target)) err('relationships.json', L, `link target 悬挂: ${l.target}`)
})

/* ---------- 3. 交叉引用 ---------- */
const chars = read('src/data/characters.json')
const charIds = new Set(chars.map((c) => c.id))
const charLine = Object.fromEntries(chars.map((c) => [c.id, c]))
for (const n of rel.nodes) if (!charIds.has(n.id)) err('relationships.json', 0, `图谱节点不在 characters.json: ${n.id}`)
for (const c of chars) if (!nodeIds.has(c.id)) err('characters.json', 0, `角色不在图谱节点: ${c.id}`, 'warn')

const quotes = read('src/data/quotes.json')
const seenQ = new Set()
quotes.forEach((q, i) => {
  const L = i + 2
  if (seenQ.has(q.id)) err('quotes.json', L, `quote id 重复: ${q.id}`)
  seenQ.add(q.id)
  if (q.character && !charIds.has(q.character)) err('quotes.json', L, `quote ${q.id} character 悬挂: ${q.character}`)
  if (q.episode !== undefined && !(q.episode >= 1 && q.episode <= 46)) err('quotes.json', L, `quote ${q.id} episode 越界: ${q.episode}`)
})

const scenes = read('src/data/scenes.json')
const seenS = new Set()
scenes.forEach((s, i) => {
  const L = i + 2
  if (seenS.has(s.id)) err('scenes.json', L, `scene id 重复: ${s.id}`)
  seenS.add(s.id)
  if (s.episode !== undefined && !(s.episode >= 1 && s.episode <= 46)) err('scenes.json', L, `scene ${s.id} episode 越界: ${s.episode}`)
})

/* ---------- 4. 破图检测 ---------- */
const imageRefs = new Set()
const collect = (obj) => {
  if (typeof obj === 'string') {
    const m = obj.match(/\/images\/[^"'\s)]+/g)
    if (m) m.forEach((x) => imageRefs.add(x))
  } else if (Array.isArray(obj)) obj.forEach(collect)
  else if (obj && typeof obj === 'object') Object.values(obj).forEach(collect)
}
for (const f of dataFiles) collect(read('src/data/' + f))
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (/\.(vue|js)$/.test(f)) {
      const s = fs.readFileSync(p, 'utf8')
      const m = s.match(/\/images\/[^"'\s)>]+/g)
      if (m) m.forEach((x) => imageRefs.add(x))
    }
  }
}
walk(path.join(ROOT, 'src'))
for (const ref of imageRefs) {
  if (!fs.existsSync(path.join(ROOT, 'public', ref.replace(/^\//, '')))) {
    err('多处', 0, `破图引用: ${ref}（public 下不存在）`)
  }
}

/* ---------- 5. 占位域名 ---------- */
for (const f of ['public/sitemap.xml', 'public/robots.txt']) {
  const p = path.join(ROOT, f)
  if (fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes('kite.example.com')) {
    err(f, 0, '含占位域名 kite.example.com（构建期由 VITE_SITE_URL 注入，本地默认值属预期）', 'warn')
  }
}

/* ---------- 输出 ---------- */
const md = []
md.push('# Stage 1 · 结构静态校验报告')
md.push('')
md.push(`- HEAD: ${require('node:child_process').execSync('git log --oneline -1').toString().trim()}`)
md.push(`- 日期: ${new Date().toISOString().slice(0, 10)}`)
md.push('')
md.push(`## 结果：error=${errors.length} warn=${warns.length}`)
md.push('')
md.push('| 文件 | 行 | 问题 | 严重度 |')
md.push('| --- | --- | --- | --- |')
for (const e of errors) md.push(`| ${e.file} | ${e.line || '-'} | ${e.msg} | ${e.sev} |`)
for (const w of warns) md.push(`| ${w.file} | ${w.line || '-'} | ${w.msg} | ${w.sev} |`)
md.push('')
md.push('## 规模快照')
md.push(`- relationships: ${rel.nodes.length} 节点 / ${rel.links.length} 边`)
md.push(`- characters: ${chars.length} · quotes: ${quotes.length} · scenes: ${scenes.length}`)
fs.writeFileSync(path.join(ROOT, 'reports', 'struct-check.md'), md.join('\n'), 'utf8')
console.log(`[verify-struct] error=${errors.length} warn=${warns.length} -> reports/struct-check.md`)
process.exit(errors.length ? 1 : 0)
