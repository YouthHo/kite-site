import { ref, computed } from 'vue'
import graph from '@/data/relationships.json'
import characters from '@/data/characters.json'
import { FACTION, factionLabel } from '@/utils/factions'
import { theme } from '@/store/app'

/**
 * 图谱统一数据层（契约见 src/graph/schema.md）
 * 图谱/筛选/搜索/路径/档案卡/洞察面板唯一事实源，禁止直接读 JSON。
 */

export const TYPE_META = {
  enemy: { label: '敌对', color: '#9d2235', dash: true },
  superior: { label: '上下级', color: '#1e4a52', dash: false },
  family: { label: '亲情', color: '#b8860b', dash: false },
  love: { label: '爱情', color: '#c96f7f', dash: false },
  comrade: { label: '同志', color: '#2f8f7f', dash: false },
  partner: { label: '接头', color: '#8b7355', dash: false },
}
export const TYPE_ORDER = Object.keys(TYPE_META)
export const FACTION_ORDER = ['junton', 'zhongtong', 'underground', 'gongan', 'civilian']
export const EP_MAX = 46

const charMap = Object.fromEntries(characters.map((c) => [c.id, c]))

/** 兼容读取：任何字段缺省都安全回退 */
export function normalize() {
  return {
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      code: n.code || null,
      faction: n.faction,
      x: typeof n.x === 'number' ? n.x : 50,
      y: typeof n.y === 'number' ? n.y : 50,
      role: n.role || charMap[n.id]?.identity || '',
      key: n.key || null,
      aliases: n.aliases || charMap[n.id]?.aliases || [],
      centrality: typeof n.centrality === 'number' ? n.centrality : 1,
      episodes: n.episodes || charMap[n.id]?.episodes || [1, EP_MAX],
    })),
    links: graph.links.map((l) => ({
      source: l.source,
      target: l.target,
      label: l.label,
      type: TYPE_META[l.type] ? l.type : 'comrade',
      strength: Math.min(5, Math.max(1, l.strength || 2)),
      tone: l.tone ?? 0,
      directed: !!l.directed,
      secret: !!l.secret,
      evidence: l.evidence || '',
      activeEra: Array.isArray(l.activeEra) ? l.activeEra : [1, EP_MAX],
    })),
  }
}

/** 颜色提亮（径向渐变高光） */
export function lightenHex(hex, amt) {
  const m = hex.replace('#', '')
  const n = parseInt(m.length === 3 ? m.split('').map((x) => x + x).join('') : m, 16)
  const r = Math.min(255, ((n >> 16) & 255) + Math.round(255 * amt))
  const g = Math.min(255, ((n >> 8) & 255) + Math.round(255 * amt))
  const b = Math.min(255, (n & 255) + Math.round(255 * amt))
  return `rgb(${r},${g},${b})`
}

export function nodeSize(n) {
  // 叙事权重：介数中心性驱动尺寸（契约字段 centrality），叠加出场跨度下限
  const span = n.episodes[1] - n.episodes[0]
  return Math.max(30, Math.min(58, 26 + n.centrality * 1.9 + (span > 30 ? 6 : span > 10 ? 2 : 0)))
}

export function useGraphData() {
  const { nodes, links } = normalize()

  const activeFactions = ref(new Set(FACTION_ORDER))
  const activeTypes = ref(new Set(TYPE_ORDER))
  const personSel = ref(new Set(nodes.map((n) => n.id)))
  const keyword = ref('')
  const sortBy = ref('faction')
  const ep = ref(EP_MAX) // 集数演化
  const epPlaying = ref(false)
  let eraTimer = null

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))

  const matchesKeyword = (n) => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return true
    return (n.name + (n.code || '') + (n.role || '') + n.aliases.join('')).toLowerCase().includes(kw)
  }

  /** 可见节点（阵营/人物/集数演化/搜索 四重过滤） */
  const visibleNodes = computed(() =>
    nodes.filter(
      (n) => activeFactions.value.has(n.faction) && personSel.value.has(n.id) && n.episodes[0] <= ep.value && matchesKeyword(n)
    )
  )
  const visibleIds = computed(() => new Set(visibleNodes.value.map((n) => n.id)))

  /** 可见边（两端可见 + 类型筛选） */
  const visibleLinks = computed(() => {
    const ids = visibleIds.value
    return links.filter((l) => activeTypes.value.has(l.type) && ids.has(l.source) && ids.has(l.target))
  })

  /** 侧栏列表（阵营/搜索过滤 + 排序，不受演化影响——管理视角） */
  const sortedList = computed(() => {
    const list = nodes.filter((n) => activeFactions.value.has(n.faction) && matchesKeyword(n))
    const byName = (a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN-u-co-pinyin')
    if (sortBy.value === 'faction') list.sort((a, b) => FACTION_ORDER.indexOf(a.faction) - FACTION_ORDER.indexOf(b.faction) || byName(a, b))
    else if (sortBy.value === 'name') list.sort(byName)
    else if (sortBy.value === 'code') list.sort((a, b) => (b.code ? 1 : 0) - (a.code ? 1 : 0) || byName(a, b))
    else if (sortBy.value === 'span') list.sort((a, b) => b.episodes[1] - b.episodes[0] - (a.episodes[1] - a.episodes[0]))
    return list
  })

  /** 度中心性（当前可见图） */
  const degree = computed(() => {
    const ids = visibleIds.value
    const d = {}
    visibleLinks.value.forEach((l) => {
      d[l.source] = (d[l.source] || 0) + 1
      d[l.target] = (d[l.target] || 0) + 1
    })
    return d
  })

  const stats = computed(() => {
    const factions = new Set(visibleNodes.value.map((n) => n.faction))
    const top = Object.entries(degree.value)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, d]) => `${byId[id]?.name || id} ${d}`)
      .join(' · ')
    return { nodes: visibleNodes.value.length, edges: visibleLinks.value.length, factions: factions.size, top }
  })

  /** 共同邻居（洞察面板） */
  function commonNeighbors(a, b) {
    const na = new Set(links.filter((l) => l.source === a).map((l) => l.target).concat(links.filter((l) => l.target === a).map((l) => l.source)))
    const nb = new Set(links.filter((l) => l.source === b).map((l) => l.target).concat(links.filter((l) => l.target === b).map((l) => l.source)))
    return [...na].filter((x) => nb.has(x))
  }

  /** 阵营分布（洞察面板） */
  function factionSpread() {
    const spread = {}
    visibleNodes.value.forEach((n) => (spread[n.faction] = (spread[n.faction] || 0) + 1))
    return spread
  }

  /** BFS 最短路径（当前可见图） */
  function shortestPath(a, b) {
    const ids = visibleIds.value
    const adj = {}
    links.forEach((l) => {
      if (!ids.has(l.source) || !ids.has(l.target)) return
      if (!activeTypes.value.has(l.type)) return
      ;(adj[l.source] = adj[l.source] || []).push(l.target)
      ;(adj[l.target] = adj[l.target] || []).push(l.source)
    })
    const prev = {}
    const seen = new Set([a])
    const q = [a]
    let found = false
    while (q.length && !found) {
      const cur = q.shift()
      for (const nb of adj[cur] || []) {
        if (seen.has(nb)) continue
        seen.add(nb)
        prev[nb] = cur
        if (nb === b) {
          found = true
          break
        }
        q.push(nb)
      }
    }
    if (!found) return null
    const path = [b]
    let cur = b
    while (cur !== a) {
      cur = prev[cur]
      path.unshift(cur)
    }
    const pairs = []
    for (let i = 0; i < path.length - 1; i++) pairs.push(path[i] + '>' + path[i + 1])
    return { ids: path, hops: path.length - 1, pairs }
  }

  /* ---------- 演化播放 ---------- */
  function toggleEraPlay() {
    if (epPlaying.value) {
      epPlaying.value = false
      clearInterval(eraTimer)
      return
    }
    if (ep.value >= EP_MAX) ep.value = 1
    epPlaying.value = true
    eraTimer = setInterval(() => {
      if (ep.value >= EP_MAX) {
        epPlaying.value = false
        clearInterval(eraTimer)
        return
      }
      ep.value++
    }, 700)
  }
  function stopEraPlay() {
    epPlaying.value = false
    clearInterval(eraTimer)
  }

  return {
    nodes,
    links,
    byId,
    charMap,
    theme,
    activeFactions,
    activeTypes,
    personSel,
    keyword,
    sortBy,
    ep,
    epPlaying,
    visibleNodes,
    visibleLinks,
    sortedList,
    degree,
    stats,
    toggleEraPlay,
    stopEraPlay,
    commonNeighbors,
    factionSpread,
    shortestPath,
    factionLabel,
    FACTION,
  }
}
