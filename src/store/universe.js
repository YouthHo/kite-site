import { reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * UniverseState —— 核心状态原语（皮肤无关，任何皮肤都消费它）
 * lens / focus / era / faction / viewpoint / collection / theme / lang
 * 变更即写 URL query（可分享、可回溯、刷新可还原）
 */
export const LENSES = ['relation', 'time', 'faction', 'scene', 'history']
export const LENS_LABEL = {
  relation: '关系',
  time: '时空',
  faction: '阵营',
  scene: '名场',
  history: '史料',
}
export const VIEWPOINTS = [
  { id: 'all', label: '全景' },
  { id: 'zheng', label: '郑耀先' },
  { id: 'han', label: '韩冰' },
  { id: 'kmind', label: '国民党' },
  { id: 'underground', label: '地下战线' },
]

export function createUniverseState() {
  const route = useRoute()
  const router = useRouter()

  const state = reactive({
    currentLens: 'relation',
    focusNode: null,
    eraViewport: [1927, 1980],
    factionFilter: 'all',
    viewpoint: 'all',
    collection: new Set(), // type:id
    theme: 'dark',
    lang: 'zh',
  })

  /** 变更即写 URL（replace，不产生历史噪音） */
  function syncUrl() {
    const q = {}
    if (state.currentLens !== 'relation') q.lens = state.currentLens
    if (state.focusNode) q.focus = state.focusNode
    if (state.eraViewport[0] !== 1927 || state.eraViewport[1] !== 1980) q.era = state.eraViewport.join('-')
    if (state.factionFilter !== 'all') q.faction = state.factionFilter
    if (state.viewpoint !== 'all') q.view = state.viewpoint
    router.replace({ query: q })
  }

  /** 从 URL 还原（刷新/分享链接） */
  function restoreFromUrl() {
    const q = route.query
    if (q.lens && LENSES.includes(q.lens)) state.currentLens = q.lens
    if (q.focus) state.focusNode = q.focus
    if (q.era && typeof q.era === 'string') {
      const [a, b] = q.era.split('-').map(Number)
      if (a && b) state.eraViewport = [a, b]
    }
    if (q.faction && q.faction !== 'all') state.factionFilter = q.faction
    if (q.view && VIEWPOINTS.some((v) => v.id === q.view)) state.viewpoint = q.view
  }

  function setLens(lens) {
    if (LENSES.includes(lens)) state.currentLens = lens
  }
  function setFocus(id) {
    state.focusNode = id || null
  }
  function setEra(a, b) {
    state.eraViewport = [a, b]
  }
  function setFaction(f) {
    state.factionFilter = f
  }
  function setViewpoint(v) {
    state.viewpoint = v
  }
  function toggleCollect(type, id) {
    const k = `${type}:${id}`
    if (state.collection.has(k)) state.collection.delete(k)
    else state.collection.add(k)
  }

  watch(
    () => [state.currentLens, state.focusNode, state.eraViewport.join('-'), state.factionFilter, state.viewpoint],
    syncUrl
  )

  return { state, setLens, setFocus, setEra, setFaction, setViewpoint, toggleCollect, restoreFromUrl }
}
