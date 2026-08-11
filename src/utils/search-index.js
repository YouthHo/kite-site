import characters from '@/data/characters.json'
import actors from '@/data/actors.json'
import episodes from '@/data/episodes.json'
import quotes from '@/data/quotes.json'
import scenes from '@/data/scenes.json'

/**
 * 全站搜索索引（2.0 · J）：统一事实源，供 SearchModal 与未来入口复用
 * 数据量小（~180 docs），构建期预组装 + 子串匹配（<2ms），零外部依赖
 */
const docs = [
  ...characters.map((c) => ({
    type: 'character',
    id: c.id,
    title: c.name,
    sub: c.identity || '',
    text: [c.name, c.code, ...(c.aliases || []), c.identity, c.brief].filter(Boolean).join(' '),
    to: `/characters?q=${c.id}`,
  })),
  ...actors.map((a) => ({
    type: 'actor',
    id: a.id || a.name,
    title: a.name,
    sub: a.role || '',
    text: [a.name, a.role].filter(Boolean).join(' '),
    to: '/cast',
  })),
  ...episodes.map((e) => ({
    type: 'episode',
    id: String(e.id),
    title: `第${e.id}集 · ${e.title}`,
    sub: (e.summary || '').slice(0, 40),
    text: [e.title, e.summary].filter(Boolean).join(' '),
    to: `/episodes?ep=${e.id}`,
  })),
  ...quotes.map((q) => ({
    type: 'quote',
    id: q.id,
    title: (q.text || '').slice(0, 30),
    sub: `${q.speaker || ''} · 第${q.episode}集`,
    text: [q.text, q.speaker].filter(Boolean).join(' '),
    to: '/scenes?tab=quotes',
  })),
  ...scenes.map((s) => ({
    type: 'scene',
    id: s.id,
    title: s.title,
    sub: (s.desc || '').slice(0, 40),
    text: [s.title, s.desc].filter(Boolean).join(' '),
    to: '/scenes',
  })),
]

export const DOC_TYPES = ['character', 'actor', 'episode', 'quote', 'scene']

/** 搜索：返回 { type, title, sub, to } 列表（按类型分组计数可自行聚合） */
export function searchIndex(query) {
  const kw = (query || '').trim().toLowerCase()
  if (!kw) return []
  return docs.filter((d) => d.text.toLowerCase().includes(kw)).map(({ type, title, sub, to }) => ({ type, title, sub, to }))
}

/** 按类型分组统计 */
export function searchCounts(query) {
  const hits = searchIndex(query)
  const counts = { total: hits.length }
  for (const h of hits) counts[h.type] = (counts[h.type] || 0) + 1
  return counts
}
