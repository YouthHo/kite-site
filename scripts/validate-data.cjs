#!/usr/bin/env node
// 数据正确性门禁：schema / 交叉引用 / 破图 / 占位域名 / 一致性（G9）
// 用法：node scripts/validate-data.cjs   （--fix 自动去 BOM）
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const strip = (s) => s.replace(/^\uFEFF/, '')
const read = (rel) => JSON.parse(strip(fs.readFileSync(path.join(ROOT, rel), 'utf8')))

let errors = []
let warnings = []
const err = (msg) => errors.push(msg)
const warn = (msg) => warnings.push(msg)

/* ---------- 1. schema 校验：relationships ---------- */
const rel = read('src/data/relationships.json')
const TYPE_SET = new Set(['enemy', 'superior', 'family', 'love', 'comrade', 'partner'])
const FACTION_SET = new Set(['junton', 'zhongtong', 'underground', 'gongan', 'civilian'])
const nodeIds = new Set(rel.nodes.map((n) => n.id))
for (const n of rel.nodes) {
  if (!n.id || !n.name || !n.faction) err(`relationship node 缺必填: ${n.id || '(no id)'}`)
  if (n.faction && !FACTION_SET.has(n.faction)) err(`node ${n.id} faction 非法: ${n.faction}`)
  if (typeof n.x !== 'number' || typeof n.y !== 'number') err(`node ${n.id} 缺坐标`)
  if (typeof n.centrality !== 'number') warn(`node ${n.id} 缺 centrality（建议补）`)
}
for (const l of rel.links) {
  if (!TYPE_SET.has(l.type)) err(`link ${l.source}->${l.target} type 非法: ${l.type}`)
  if (!(l.strength >= 1 && l.strength <= 5)) err(`link ${l.source}->${l.target} strength 越界: ${l.strength}`)
  if (![-1, 0, 1].includes(l.tone)) err(`link ${l.source}->${l.target} tone 非法: ${l.tone}`)
}

/* ---------- 2. 交叉引用 ---------- */
const chars = read('src/data/characters.json')
const charIds = new Set(chars.map((c) => c.id))
for (const l of rel.links) {
  if (!nodeIds.has(l.source)) err(`link source 悬挂: ${l.source}`)
  if (!nodeIds.has(l.target)) err(`link target 悬挂: ${l.target}`)
}
for (const n of rel.nodes) {
  if (!charIds.has(n.id)) err(`图谱节点不在 characters.json: ${n.id}`)
}
for (const c of chars) {
  if (!nodeIds.has(c.id)) warn(`characters.json 角色不在图谱: ${c.id}`)
  if (c.episodes && !Array.isArray(c.episodes)) err(`characters ${c.id} episodes 非数组`)
}
const quotes = read('src/data/quotes.json')
for (const q of quotes) {
  if (q.character && !charIds.has(q.character)) err(`quote ${q.id} character 悬挂: ${q.character}`)
  if (q.episode !== undefined && !(q.episode >= 1 && q.episode <= 46)) err(`quote ${q.id} episode 越界: ${q.episode}`)
}
const scenes = read('src/data/scenes.json')
for (const s of scenes) {
  if (s.episode !== undefined && !(s.episode >= 1 && s.episode <= 46)) err(`scene ${s.id} episode 越界: ${s.episode}`)
}

/* ---------- 3. 破图检测：/images/ 引用必须存在于 public/ ---------- */
const imageRefs = new Set()
const collect = (obj, base) => {
  if (typeof obj === 'string') {
    const m = obj.match(/\/images\/[^"'\s)]+/g)
    if (m) m.forEach((x) => imageRefs.add(x))
  } else if (Array.isArray(obj)) {
    obj.forEach((o) => collect(o, base))
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach((o) => collect(o, base))
  }
}
for (const f of ['src/data/characters.json', 'src/data/scenes.json', 'src/data/history.json', 'src/data/actors.json']) {
  collect(read(f), f)
}
// 也扫 .vue 中的 /images/ 字面量
const vueFiles = []
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (/\.vue$/.test(f)) vueFiles.push(p)
  }
}
walk(path.join(ROOT, 'src'))
for (const f of vueFiles) {
  const s = fs.readFileSync(f, 'utf8')
  const m = s.match(/\/images\/[^"'\s)>]+/g)
  if (m) m.forEach((x) => imageRefs.add(x))
}
for (const ref of imageRefs) {
  const p = path.join(ROOT, 'public', ref.replace(/^\//, ''))
  if (!fs.existsSync(p)) err(`破图引用: ${ref}（public 下不存在）`)
}

/* ---------- 4. 占位域名一致性：sitemap 与 SITE_URL 一致，index.html 无 {{SITE_URL}} 残留 ---------- */
const siteUrl = (process.env.VITE_SITE_URL || 'https://kite.example.com').replace(/\/$/, '')
const sitemap = fs.readFileSync(path.join(ROOT, 'public', 'sitemap.xml'), 'utf8')
if (!sitemap.includes(siteUrl)) err(`sitemap.xml 与 VITE_SITE_URL(${siteUrl}) 不一致（可能未运行 gen-sitemap）`)
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
if (idx.includes('{{SITE_URL}}')) warn('index.html 含 {{SITE_URL}} 占位（构建期由 injectSiteUrl 替换，属预期；若已构建请检查注入）')
const distIdx = path.join(ROOT, 'dist', 'index.html')
if (fs.existsSync(distIdx) && fs.readFileSync(distIdx, 'utf8').includes('{{SITE_URL}}')) {
  err('dist/index.html 含未替换的 {{SITE_URL}}（构建注入失效）')
}

/* ---------- 5. activeEra 一致性 ---------- */
const charById = Object.fromEntries(chars.map((c) => [c.id, c]))
for (const l of rel.links) {
  if (l.activeEra) {
    const [a, b] = l.activeEra
    const ca = charById[l.source]?.episodes || [1, 46]
    const cb = charById[l.target]?.episodes || [1, 46]
    if (a < Math.max(ca[0], cb[0]) - 1 || b > Math.min(ca[1], cb[1]) + 1) {
      warn(`link ${l.source}->${l.target} activeEra [${a},${b}] 超出两端出场交集`)
    }
  }
}

/* ---------- 6. 规模一致性 ---------- */
if (rel.nodes.length !== 30) warn(`图谱节点数 ${rel.nodes.length}（预期 30）`)
if (rel.links.length !== 67) warn(`图谱边数 ${rel.links.length}（预期 67）`)
if (chars.length !== 30) warn(`角色数 ${chars.length}（预期 30）`)

/* ---------- 输出 ---------- */
if (errors.length) {
  console.error(`[validate-data] FAIL: ${errors.length} 个错误`)
  errors.forEach((e) => console.error('  ✗ ' + e))
  process.exit(1)
}
if (warnings.length) {
  console.log(`[validate-data] OK（${warnings.length} 条警告）`)
  warnings.forEach((w) => console.log('  ⚠ ' + w))
} else {
  console.log('[validate-data] OK')
}
