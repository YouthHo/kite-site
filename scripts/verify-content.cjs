#!/usr/bin/env node
// Stage 2 · 跨文件一致性校验（只读不改数据）
// 输出 reports/cross-check.md
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const strip = (s) => s.replace(/^\uFEFF/, '')
const read = (rel) => JSON.parse(strip(fs.readFileSync(path.join(ROOT, rel), 'utf8')))

const conflicts = []
const add = (a, b, msg, va, vb) => conflicts.push({ a, b, msg, va, vb })

const chars = read('src/data/characters.json')
const rel = read('src/data/relationships.json')
const quotes = read('src/data/quotes.json')
const scenes = read('src/data/scenes.json')
const actors = read('src/data/actors.json')
const timeline = read('src/data/timeline.json')
const history = read('src/data/history.json')
const architecture = read('src/data/architecture.json')

const charById = Object.fromEntries(chars.map((c) => [c.id, c]))
const charLine = {}
chars.forEach((c, i) => (charLine[c.id] = i + 2))

/* 1. 台词/名场面集数 ∈ 角色出场区间 */
for (const q of quotes) {
  const c = q.character ? charById[q.character] : null
  if (c?.episodes && q.episode !== undefined) {
    const [a, b] = c.episodes
    if (q.episode < a || q.episode > b) {
      add('quotes.json:' + (quotes.indexOf(q) + 2), `characters.json:${charLine[c.id]}`, `台词集数超出角色出场区间`, `ep=${q.episode}`, `${c.name} episodes=[${a},${b}]`)
    }
  }
}
for (const s of scenes) {
  // 名场面按标题关键词找角色
  const c = chars.find((x) => s.title.includes(x.name) || (x.aliases || []).some((a) => s.title.includes(a)))
  if (c?.episodes && s.episode !== undefined) {
    const [a, b] = c.episodes
    if (s.episode < a || s.episode > b) {
      add('scenes.json:' + (scenes.indexOf(s) + 2), `characters.json:${charLine[c.id]}`, `名场面集数超出相关角色出场区间`, `ep=${s.episode}`, `${c.name} episodes=[${a},${b}]`)
    }
  }
}

/* 2. activeEra ∈ 两端出场交集 */
rel.links.forEach((l, i) => {
  if (!l.activeEra) return
  const [a, b] = l.activeEra
  const ca = charById[l.source]?.episodes || [1, 46]
  const cb = charById[l.target]?.episodes || [1, 46]
  const lo = Math.max(ca[0], cb[0])
  const hi = Math.min(ca[1], cb[1])
  if (a < lo || b > hi) {
    add(`relationships.json:${rel.nodes.length + i + 3}`, `characters.json`, `activeEra 超出两端出场交集`, `[${a},${b}]`, `交集=[${lo},${hi}]`)
  }
})

/* 3. faction 与 architecture 阵营词表一致 */
const archFactions = new Set()
for (const o of architecture) {
  archFactions.add(o.id)
  for (const n of o.nodes || []) {
    // 架构成员通过 person 字段关联角色（id 为内部编号 j1/j2…）
    const pid = n.person || n.id
    if (pid && !charById[pid]) add('architecture.json', 'characters.json', `架构成员 person 不在角色表`, n.id, pid)
  }
}
const FACTION_SET = new Set(['junton', 'zhongtong', 'underground', 'gongan', 'civilian'])
for (const n of rel.nodes) {
  if (!FACTION_SET.has(n.faction)) add('relationships.json', 'schema.md', `faction 不在枚举`, n.id, n.faction)
}

/* 4. actors 饰演角色 ∈ characters */
for (const a of actors) {
  if (a.character && !charById[a.character]) {
    add('actors.json', 'characters.json', `演员饰演角色不在角色表`, a.name, a.character)
  }
}

/* 5. timeline/history 年代范围（1940s-1980s 合理带） */
for (const t of timeline) {
  const y = t.year
  if (typeof y === 'number' && (y < 1920 || y > 2000)) add('timeline.json', '-', `年代超出合理范围`, String(y), '-')
}
for (const h of history) {
  if (h.year && (h.year < 1920 || h.year > 2000)) add('history.json', '-', `年代超出合理范围`, String(h.year), '-')
}

/* 输出 */
const md = []
md.push('# Stage 2 · 跨文件一致性校验报告')
md.push('')
md.push(`- 日期: ${new Date().toISOString().slice(0, 10)}`)
md.push('')
md.push(`## 冲突数：${conflicts.length}`)
md.push('')
md.push('| 文件A | 文件B | 冲突 | 值A | 值B |')
md.push('| --- | --- | --- | --- | --- |')
for (const c of conflicts) md.push(`| ${c.a} | ${c.b} | ${c.msg} | ${c.va} | ${c.vb} |`)
fs.writeFileSync(path.join(ROOT, 'reports', 'cross-check.md'), md.join('\n'), 'utf8')
console.log(`[verify-content] conflicts=${conflicts.length} -> reports/cross-check.md`)
