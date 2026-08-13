<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import { X, Search, ArrowRight, Info, Play, Pause } from 'lucide-vue-next'
import { GraphEngine } from '@/graph/GraphEngine'
import { useGraphData, TYPE_META } from '@/graph/useGraphData'
import NameBadge from '@/components/NameBadge.vue'
import SealStamp from '@/components/SealStamp.vue'
import GraphToolbar from '@/components/GraphToolbar.vue'
import GraphStatusBar from '@/components/GraphStatusBar.vue'
import GraphOnboarding from '@/components/GraphOnboarding.vue'
import FactionEmblem from '@/components/FactionEmblem.vue'
import GraphHelpPanel from '@/components/GraphHelpPanel.vue'
import { FACTION, factionLabel } from '@/utils/factions'
import { theme } from '@/store/app'
import { prefersReduced, typewriter } from '@/utils/anim'

const g = useGraphData()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const props = defineProps({
  universe: { type: Object, default: null }, // 宇宙状态（ThreadAxis 年代视窗驱动）
  openDossier: { type: Function, default: null }, // 宇宙浮层回调（UniverseView 传入）
})
const chartEl = ref(null)
const panelEl = ref(null)
const briefEl = ref(null)
const hoverEl = ref(null)
const tourEl = ref(null)
const selected = ref(null)

/* ================= Layer 0 · 交互状态机（互斥模式 + 解耦选择） ================= */
const mode = ref('browse') // browse | decrypt | path | tour（任一时刻唯一）
const pathStart = ref(null)
const pathResult = ref(null)
const focusClickId = ref(null) // 隔离聚焦（引擎 focusClick 的响应式镜像）
const kbIndex = ref(0)
const focusNodeId = ref(null) // 键盘焦点
const layoutMode = ref('none')
const decryptCount = ref(0)
const secretFound = ref(0)
const tourIdx = ref(0)
const tourText = ref('')
const hoverNodeId = ref(null)
const hoverSummary = ref('')
const hoverHighlight = ref(true)
// 悬停高亮开关：localStorage 持久化（默认开）
try {
  hoverHighlight.value = localStorage.getItem('kite-graph-highlight') !== '0'
} catch (e) {
  /* ignore */
}
function toggleHighlight() {
  hoverHighlight.value = !hoverHighlight.value
  engine?.setHoverHighlight(hoverHighlight.value)
  try {
    localStorage.setItem('kite-graph-highlight', hoverHighlight.value ? '1' : '0')
  } catch (e) {
    /* ignore */
  }
}
const helpOpen = ref(false)
const liveText = ref('')
const revealed = ref(false)
const noteText = ref('')
const noteKey = ref('')

const secretTotal = computed(() => g.links.filter((l) => l.secret).length)
const statsText = computed(() =>
  t('graph.stats', {
    nodes: g.stats.value.nodes,
    edges: g.stats.value.edges,
    factions: g.stats.value.factions,
    top: g.stats.value.top,
  })
)
const escHint = computed(() => {
  if (mode.value === 'path') return t('graph.escExitPath')
  if (selected.value) return t('graph.escClosePanel')
  if (mode.value === 'decrypt') return t('graph.escExitDecrypt')
  if (mode.value === 'tour') return t('graph.escExitTour')
  if (focusClickId.value) return t('graph.escExitFocus')
  return ''
})

let engine = null
let briefType = null
let tourType = null
let resizeObs = null

const SORTS = [
  { id: 'faction', label: '阵营' },
  { id: 'name', label: '姓名' },
  { id: 'code', label: '代号' },
  { id: 'span', label: '出场' },
]

/* ---------- 模式进入/退出（互斥，统一收口） ---------- */
function setMode(m) {
  if (mode.value === m) return
  // 退出旧模式（清理副作用）
  if (mode.value === 'tour') {
    tourType?.kill?.()
    engine?.setFocusClick(null)
    focusClickId.value = null
  }
  if (mode.value === 'decrypt') engine?.setDecrypt(false)
  if (mode.value === 'path') {
    pathStart.value = null
    pathResult.value = null
    engine?.setPath(null)
  }
  mode.value = m
  // 进入新模式（可见的"进入态"）
  if (m === 'tour') {
    tourIdx.value = 0
    playTourStep(0)
  }
  if (m === 'decrypt') {
    engine?.setDecrypt(true)
    engine?.decrypted.clear()
    handleDecrypt()
  }
  if (m === 'path') {
    pathStart.value = null
    pathResult.value = null
  }
  liveText.value = `进入${m}模式`
}

/* ---------- 主操作：点节点 = 看档案（browse 恒成立；其他模式显式改变时伴随进入态） ---------- */
function handleNodeClick(id) {
  if (mode.value === 'tour') {
    nextTourStep()
    return
  }
  if (mode.value === 'path') {
    if (!pathStart.value) pathStart.value = id
    else computePath(pathStart.value, id)
    engine?.requestRender()
    return
  }
  if (mode.value === 'decrypt' && !engine?.decrypted.has(id)) {
    engine?.decryptNode(id)
    handleDecrypt()
    return
  }
  // 聚焦隔离（非特殊模式下的附加视觉，不改变主操作）
  engine?.setFocusClick(id)
  focusClickId.value = id
  engine?.centerOn(id, 420)
  if (props.openDossier) {
    // 宇宙内：走 DossierOverlay 浮层（统一范式）
    props.openDossier('character', id)
  } else {
    openPanel(id)
  }
}
function clearFocus() {
  engine?.setFocusClick(null)
  focusClickId.value = null
  engine?.requestRender()
}

/* ---------- I.1 可分享状态（URL query 编码/还原） ---------- */
function syncUrl() {
  const q = {}
  if (mode.value !== 'browse') q.mode = mode.value
  if (pathStart.value) q.from = pathStart.value
  if (pathResult.value && pathResult.value.hops >= 0) q.to = pathResult.value.ids[pathResult.value.ids.length - 1]
  if (g.ep.value < 46) q.ep = String(g.ep.value)
  if (focusClickId.value) q.focus = focusClickId.value
  router.replace({ query: q })
}
function restoreFromUrl() {
  const q = route.query
  if (q.ep) {
    const e = Math.min(46, Math.max(1, Number(q.ep) || 46))
    g.ep.value = e
  }
  if (q.mode && ['decrypt', 'path', 'tour'].includes(q.mode)) setMode(q.mode)
  if (q.from && g.byId[q.from]) {
    pathStart.value = q.from
    if (q.to && g.byId[q.to]) computePath(q.from, q.to)
  }
  if (q.focus && g.byId[q.focus]) {
    engine?.setFocusClick(q.focus)
    focusClickId.value = q.focus
  }
}
watch([mode, pathStart, pathResult, focusClickId, () => g.ep.value], syncUrl)

/* ---------- I.2 导出 PNG ---------- */
function handleExport() {
  if (!engine) return
  const a = document.createElement('a')
  a.href = engine.exportPNG()
  a.download = `kite-graph-${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/* ---------- I.3 私人备注（localStorage，仅本机） ---------- */
function loadNote(id) {
  noteKey.value = id || ''
  try {
    noteText.value = localStorage.getItem('kite-note-' + id) || ''
  } catch (e) {
    noteText.value = ''
  }
}
function saveNote() {
  if (!noteKey.value) return
  try {
    localStorage.setItem('kite-note-' + noteKey.value, noteText.value)
  } catch (e) {
    /* ignore */
  }
}

/* ---------- 路径模式（显式双步） ---------- */
function computePath(a, b) {
  const res = g.shortestPath(a, b)
  pathResult.value = res ? res : { ids: [a, b], hops: -1, pairs: [] }
  engine?.setPath(pathResult.value)
}
function cancelPath() {
  pathStart.value = null
  pathResult.value = null
  engine?.setPath(null)
  engine?.requestRender()
}

/* ---------- 解密 ---------- */
function handleDecrypt() {
  decryptCount.value = engine?.decrypted?.size || 0
  const dec = engine?.decrypted
  secretFound.value = dec ? g.links.filter((l) => l.secret && dec.has(l.source) && dec.has(l.target)).length : 0
  if (dec && dec.size >= g.nodes.length && !revealed.value) {
    revealed.value = true
    liveText.value = '全部档案已解密：风筝与影子，同一根线。'
  }
}

/* ---------- 档案巡览（10 幕） ---------- */
const TOUR_STEPS = [
  { id: 'zheng-yaoxian', text: '1946 年的重庆，他是军统王牌「六哥」。没有人知道，他的真实代号叫——风筝。' },
  { id: 'han-bing', text: '她是最接近他的人，也是他的一生之敌。她的代号——影子。' },
  { id: 'lu-hanqing', text: '上线陆汉卿，把最后一块银元吞进肚里，也不说出风筝的名字。' },
  { id: 'cheng-zhener', text: '程真儿，他的恋人，也是同志。隔着餐厅玻璃，他看着她被车撞死，不能相认。' },
  { id: 'zeng-moyi', text: '曾墨怡，他亲手送她上刑场——「送你上路的，是你的同志。」' },
  { id: 'gong-shu', text: '徒弟宫庶，视他如父，最终却要亲手杀他。' },
  { id: 'gao-junbao', text: '高君宝，恨了他一辈子，却不知杀父仇人另有其人。' },
  { id: 'zhou-qiao', text: '周乔，他的女儿。父女相见，已是陌路。' },
  { id: 'daili', text: '戴笠密令影子潜伏调查风筝——两大特工，互为镜像。' },
  { id: 'jian-bing', text: '三十年后，简冰为风筝作证。身份被证实的那一刻，他依然选择沉默。' },
]
function playTourStep(i) {
  const s = TOUR_STEPS[i]
  engine?.setFocusClick(s.id)
  focusClickId.value = s.id
  engine?.centerOn(s.id, 750)
  tourText.value = s.text
  tourType?.kill?.()
  if (tourEl.value && !prefersReduced) {
    tourType = typewriter(tourEl.value, s.text, { speed: 22, caret: false })
  } else if (tourEl.value) {
    tourEl.value.textContent = s.text
  }
  liveText.value = `巡览第 ${i + 1} 幕：${g.charMap[s.id]?.name || ''}。${s.text}`
}
function nextTourStep() {
  tourIdx.value = (tourIdx.value + 1) % TOUR_STEPS.length
  playTourStep(tourIdx.value)
}
function prevTourStep() {
  tourIdx.value = (tourIdx.value - 1 + TOUR_STEPS.length) % TOUR_STEPS.length
  playTourStep(tourIdx.value)
}

/* ---------- 键盘（Esc 由状态机唯一决定，状态条实时提示） ---------- */
function onKey(e) {
  if (e.key === 'Escape') {
    if (mode.value === 'path') {
      setMode('browse')
    } else if (selected.value) {
      closePanel()
    } else if (mode.value === 'decrypt') {
      setMode('browse')
    } else if (mode.value === 'tour') {
      setMode('browse')
    } else if (focusClickId.value) {
      clearFocus()
    } else if (focusNodeId.value) {
      focusNodeId.value = null
      engine?.setFocus(null)
    }
    return
  }
  const list = g.sortedList.value
  if (!list.length) return
  let i = kbIndex.value
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    i = (i + 1) % list.length
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    i = (i - 1 + list.length) % list.length
  } else if (e.key === 'Enter') {
    if (focusNodeId.value) openPanel(focusNodeId.value)
    return
  } else {
    return
  }
  e.preventDefault()
  kbIndex.value = i
  focusNodeId.value = list[i].id
  engine?.setFocus(focusNodeId.value)
  engine?.centerOn(focusNodeId.value, 380)
}

/* ---------- 侧栏（点击名字行 = 勾选筛显；ⓘ = 看档案；路径模式下行=选端点） ---------- */
function onRowClick(n) {
  if (mode.value === 'path') {
    if (!pathStart.value) pathStart.value = n.id
    else computePath(pathStart.value, n.id)
    engine?.requestRender()
    return
  }
  togglePerson(n.id)
}
function togglePerson(id) {
  const s = new Set(g.personSel.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  g.personSel.value = s
}
function selectAllPeople() {
  g.personSel.value = new Set(g.nodes.map((n) => n.id))
}
function selectNonePeople() {
  g.personSel.value = new Set()
}
function toggleType(k) {
  const s = new Set(g.activeTypes.value)
  if (s.has(k)) s.delete(k)
  else s.add(k)
  g.activeTypes.value = s
}
function toggleFaction(k) {
  const s = new Set(g.activeFactions.value)
  if (s.has(k)) s.delete(k)
  else s.add(k)
  g.activeFactions.value = s
}

/* ---------- 悬停信息条（静态简洁：姓名·阵营·代号；关系语义由线上嵌字承载） + live region ---------- */
function handleHover(id) {
  hoverNodeId.value = id
  if (!id) {
    hoverSummary.value = ''
    return
  }
  const n = g.byId[id]
  if (!n) return
  const key = n.key ? (n.key === 'kite' ? ' · 风筝轴' : ' · 影子轴') : ''
  hoverSummary.value = `${n.name} · ${g.factionLabel(n.faction)}${n.code ? ' · ' + n.code : ''}${key}`
  if (hoverEl.value) hoverEl.value.textContent = hoverSummary.value
  const deg = g.degree.value[id] || 0
  liveText.value = `节点 ${n.name}，${n.role || g.factionLabel(n.faction)}，${key.trim()}，连接 ${deg} 条关系`
}

function onSearchEnter() {
  const kw = g.keyword.value.trim()
  if (!kw || !engine) return
  const hit = g.sortedList.value[0]
  if (hit) {
    engine.setFocusClick(hit.id)
    focusClickId.value = hit.id
    engine.centerOn(hit.id, 500)
  }
}

/* ---------- 档案卡 ---------- */
function openPanel(id) {
  const c = g.charMap[id]
  if (!c) return
  selected.value = c
  loadNote(id)
  gsap.fromTo(panelEl.value, { x: 420, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' })
  briefType?.kill?.()
  if (briefEl.value && !prefersReduced) {
    briefType = typewriter(briefEl.value, c.brief, { speed: 9 })
  } else if (briefEl.value) {
    briefEl.value.textContent = c.brief
  }
}
function closePanel() {
  gsap.to(panelEl.value, { x: 420, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => (selected.value = null) })
}

/* ---------- 布局/重置 ---------- */
function toggleLayout() {
  layoutMode.value = layoutMode.value === 'force' ? 'none' : 'force'
  if (layoutMode.value === 'force') {
    engine?.setForce(true)
  } else {
    engine?.setForce(false)
    engine?.nodePos.clear()
    engine?.appear.clear()
  }
  engine?.requestRender()
}
function resetView() {
  engine?.nodePos.clear()
  engine?.appear.clear()
  cancelPath()
  clearFocus()
  engine?.fit()
}

/* ---------- 洞察面板 ---------- */
const insight = computed(() => {
  if (!selected.value) return null
  const id = selected.value.id
  const kiteId = g.nodes.find((n) => n.key === 'kite')?.id
  const shadowId = g.nodes.find((n) => n.key === 'shadow')?.id
  const toKite = id === kiteId ? null : g.shortestPath(id, kiteId)
  const toShadow = id === shadowId ? null : g.shortestPath(id, shadowId)
  const common = id === kiteId || id === shadowId ? [] : g.commonNeighbors(id, kiteId).slice(0, 4)
  const spread = g.factionSpread()
  return { toKite, toShadow, common, spread }
})

/* ---------- 生命周期 ---------- */
onMounted(async () => {
  engine = new GraphEngine(chartEl.value, {
    getData: () => g,
    onNodeClick: handleNodeClick,
    onNodeHover: handleHover,
    onDecrypt: handleDecrypt,
    prefersReduced,
  })
  engine.setTheme(theme.value === 'light')
  engine.setHoverHighlight(hoverHighlight.value)
  engine.expandLayout() // 布局撑开：防重叠展开后 fit
  engine.fit()
  engine.start()
  restoreFromUrl()
  resizeObs = new ResizeObserver(() => engine?.resize())
  resizeObs.observe(chartEl.value)
})

watch(
  () => [g.activeFactions.value, g.activeTypes.value, g.personSel.value, g.keyword.value, g.ep.value, g.sortBy.value],
  () => {
    engine?.appear.clear()
    engine?.requestRender()
  }
)
watch(theme, (v) => engine?.setTheme(v === 'light'))
// 多视角：切换视角预设 = 聚焦对应核心节点（高亮其线索网）
const VIEW_FOCUS = { zheng: 'zheng-yaoxian', han: 'han-bing', kmind: 'tian-hu', underground: 'jian-bing' }
watch(
  () => props.universe?.state.viewpoint,
  (v) => {
    if (!v || v === 'all') {
      engine?.setFocusClick(null)
      focusClickId.value = null
      return
    }
    const id = VIEW_FOCUS[v]
    if (id && g.byId[id]) {
      engine?.setFocusClick(id)
      focusClickId.value = id
      engine?.centerOn(id, 500)
    }
  }
)
// P3 时间飞行：线轴年代视窗 → 图谱节点过滤
watch(
  () => props.universe?.state.eraViewport?.join('-'),
  (era) => {
    if (!era) return
    const [a, b] = era.split('-').map(Number)
    g.eraRange.value = [a, b]
    engine?.appear.clear()
    engine?.requestRender()
  }
)

onBeforeUnmount(() => {
  g.stopEraPlay()
  engine?.dispose()
  resizeObs?.disconnect()
  briefType?.kill?.()
  tourType?.kill?.()
})
</script>

<template>
  <div class="page-wrap !pt-16 !pb-0 h-screen flex flex-col">
    <div class="flex items-center gap-4 mb-4 flex-wrap">
      <SealStamp text="关系图谱" />
      <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]">人物关系图谱</h2>
      <span class="file-label">WHO IS KITE · WHO IS SHADOW</span>
    </div>
    <div class="flex-1 flex flex-col lg:flex-row gap-0 min-h-0">
      <!-- 图谱区域（自研 Canvas2D 引擎） -->
      <div class="flex-1 relative min-h-[420px] border border-[#2a2520] bg-[#0b0b0b]" style="background: radial-gradient(ellipse 70% 55% at 50% 38%, rgba(157,34,53,0.07), transparent 62%), radial-gradient(ellipse 55% 45% at 82% 88%, rgba(30,74,82,0.06), transparent 60%);">
        <canvas
          ref="chartEl"
          class="absolute inset-0 w-full h-full"
          style="touch-action: none;"
          tabindex="0"
          role="application"
          aria-label="人物关系图谱：滚轮缩放，拖拽平移，方向键移动焦点，回车查看档案，点击节点查看档案；也可使用右侧人物列表"
          @keydown="onKey"
        ></canvas>

        <!-- 顶部：状态条（左锚定 max-w-[400px]，不与右工具条重叠）+ 工具条（右锚定） -->
        <div class="absolute top-3 left-3 z-10 max-w-[400px] hidden sm:block">
          <GraphStatusBar
            :mode="mode"
            :hover-name="hoverNodeId ? (g.charMap[hoverNodeId]?.name || '') : ''"
            :focus-name="focusClickId ? (g.charMap[focusClickId]?.name || '') : ''"
            :esc-hint="escHint"
            :stats-text="statsText"
          />
        </div>
        <div class="absolute top-3 right-3 z-10 max-w-[52%]">
          <GraphToolbar
            :mode="mode"
            :tour-idx="tourIdx"
            :tour-total="TOUR_STEPS.length"
            :decrypt-count="decryptCount"
            :node-total="g.nodes.length"
            :layout-mode="layoutMode"
            :hover-highlight="hoverHighlight"
            @mode="setMode"
            @layout="toggleLayout"
            @reset="resetView"
            @help="helpOpen = true"
            @highlight="toggleHighlight"
            @export="handleExport"
          />
        </div>

        <!-- 路径模式：显式双步提示 + 取消（深底板+on-media） -->
        <div v-if="mode === 'path'" class="absolute top-12 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 font-mono text-[10px] tracking-[0.15em] px-3 py-1.5 border border-[#8c4a2f] bg-[var(--axis-bg-glass)] text-[#8c4a2f] whitespace-nowrap on-media">
          <template v-if="!pathStart">{{ t('graph.pathStep1') }}</template>
          <template v-else-if="!pathResult">{{ t('graph.pathStep2', { name: g.charMap[pathStart]?.name }) }}</template>
          <template v-else>
            <span v-if="pathResult.hops >= 0">{{ t('graph.pathResult', { path: pathResult.ids.map((id) => g.charMap[id]?.name || id).join(' → '), hops: pathResult.hops }) }}</span>
            <span v-else>{{ t('graph.pathDisconnected') }}</span>
          </template>
          <button class="pointer-events-auto border border-[#b91c1c] text-[#a8443a] px-2 py-0.5 hover:bg-[#b91c1c]/15 transition-colors" @click="cancelPath">{{ t('graph.cancel') }}</button>
        </div>

        <!-- 巡览旁白（深底板+on-media 双主题可读） -->
        <div v-if="mode === 'tour'" class="absolute top-12 left-1/2 -translate-x-1/2 z-10 max-w-[560px] w-[88%] bg-[#0e0e0e]/94 border border-[#8c4a2f]/50 px-4 py-3 pointer-events-none on-media">
          <div class="flex items-center justify-between mb-1.5 font-mono text-[9px] tracking-[0.3em] text-[#8c4a2f]">
            <span>DECRYPT FILE · {{ String(tourIdx + 1).padStart(2, '0') }}/{{ TOUR_STEPS.length }}</span>
            <span class="flex gap-3">
              <button class="pointer-events-auto text-[#a89f8e] hover:text-[#e8dcc8]" @click="prevTourStep">‹ 上一幕</button>
              <button class="pointer-events-auto text-[#a89f8e] hover:text-[#e8dcc8]" @click="nextTourStep">下一幕 ›</button>
            </span>
          </div>
          <p ref="tourEl" class="text-[13px] leading-6 text-[#e8dcc8]">{{ tourText }}</p>
        </div>

        <!-- 解密模式：进入态提示（深底板+on-media） -->
        <div v-if="mode === 'decrypt'" class="absolute top-12 left-3 z-10 font-mono text-[10px] tracking-[0.15em] text-[#a8443a] bg-[var(--axis-bg-glass)] border border-[#b91c1c]/50 px-3 py-1.5 pointer-events-none on-media">
          {{ t('graph.decryptHint', { n: decryptCount, total: g.nodes.length, found: secretFound, total2: secretTotal }) }}
        </div>

        <!-- 悬停信息条（静态简洁，深底板+on-media 双主题可读） -->
        <div v-if="hoverNodeId" class="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] tracking-[0.2em] text-[#e8dcc8] bg-[var(--axis-bg-glass)] border border-[#2a2520] px-4 py-1.5 whitespace-nowrap max-w-[90%] overflow-hidden text-ellipsis pointer-events-none on-media">
          <span ref="hoverEl">{{ hoverSummary }}</span>
        </div>

        <!-- 隔离退出按钮（可见的退出通道，深底板+on-media） -->
        <button
          v-if="focusClickId && mode === 'browse'"
          class="absolute bottom-12 right-3 z-10 font-mono text-[10px] tracking-[0.15em] border border-[#8c4a2f] text-[#8c4a2f] bg-[var(--axis-bg-glass)] px-2.5 py-1 hover:bg-[#8c4a2f]/15 transition-colors on-media"
          @click="clearFocus"
        >
          退出隔离
        </button>

        <!-- 揭示彩蛋 -->
        <transition name="era-fade">
          <div v-if="revealed" class="absolute inset-0 z-20 grid place-items-center pointer-events-none">
            <div class="text-center px-6">
              <div class="serif-title text-4xl md:text-5xl text-[#8c4a2f] tracking-[0.2em]" style="text-shadow: 0 0 40px rgba(184,134,11,0.6);">风筝与影子 · 同一根线</div>
              <div class="mt-3 font-mono text-[10px] tracking-[0.4em] text-[#a89f8e]">ALL FILES DECRYPTED · WHO IS KITE · WHO IS SHADOW</div>
            </div>
          </div>
        </transition>

        <!-- 底部图例：阵营 + 关系类型（类型可点击筛选） -->
        <div class="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 max-w-[48%]">
          <div class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.15em] text-[#a89f8e] pointer-events-none">
            <span v-for="(v, k) in FACTION" :key="k" class="flex items-center gap-1.5">
              <FactionEmblem :faction="k" :size="13" :style="{ color: v.color }" class="shrink-0" />
              {{ v.label }}
            </span>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.1em]">
            <button
              v-for="(m, k) in TYPE_META"
              :key="k"
              class="flex items-center gap-1.5 transition-colors"
              :class="g.activeTypes.value.has(k) ? 'text-[#a89f8e]' : 'text-[#3a352c]'"
              @click="toggleType(k)"
            >
              <span class="w-3.5 h-[2px]" :style="{ background: m.color, opacity: g.activeTypes.value.has(k) ? 1 : 0.25 }"></span>
              {{ m.label }}
            </button>
          </div>
          <div class="font-mono text-[9px] tracking-[0.1em] text-[#8f897c] pointer-events-none">
            {{ t('graph.legendHint') }}
          </div>
        </div>

        <!-- 时间轴（深底板+on-media） -->
        <div class="absolute bottom-3 right-3 z-10 flex items-center gap-2.5 bg-[var(--axis-bg-glass)] border border-[#2a2520] px-3 py-1.5 on-media">
          <button class="text-[#a89f8e] hover:text-[#e8dcc8] transition-colors" :aria-label="g.epPlaying.value ? '暂停演化' : '播放演化'" @click="g.toggleEraPlay()">
            <Pause v-if="g.epPlaying.value" :size="13" />
            <Play v-else :size="13" />
          </button>
          <input type="range" min="1" max="46" step="1" v-model.number="g.ep.value" class="w-28 md:w-40 accent-[#b91c1c]" :aria-label="`剧情集数 ${g.ep.value}`" />
          <span class="font-mono text-[10px] tracking-[0.15em] text-[#a89f8e] w-[70px]">EP {{ String(g.ep.value).padStart(2, '0') }}/46</span>
        </div>

        <!-- 屏幕阅读器 live region -->
        <div class="sr-only" aria-live="polite" role="status">{{ liveText }}</div>

        <!-- 首次引导 / 帮助面板 -->
        <GraphOnboarding v-if="!helpOpen" />
        <GraphHelpPanel v-if="helpOpen" @close="helpOpen = false" />
      </div>

      <!-- 侧边栏：行点击=看档案；勾选=独立复选框 -->
      <aside class="lg:w-[300px] glass border-t lg:border-t-0 lg:border-l border-[#2a2520] p-5 overflow-y-auto shrink-0" aria-label="人物列表（画布的等价文本视图）">
        <div class="relative mb-5">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89f8e]" />
          <input v-model="g.keyword.value" class="k-input w-full !pl-9" placeholder="搜索人物 / 代号……（回车跳转）" @keydown.enter="onSearchEnter" />
        </div>
        <div class="mb-2 font-mono text-[10px] tracking-[0.3em] text-[#a89f8e]">阵营筛选</div>
        <div class="grid grid-cols-2 gap-1.5 mb-6">
          <label v-for="(v, k) in FACTION" :key="k" class="flex items-center gap-2 text-[12px] cursor-pointer select-none"
            :class="g.activeFactions.value.has(k) ? 'text-[#e8dcc8]' : 'text-[#8f897c]'">
            <span class="w-3.5 h-3.5 border grid place-items-center transition-colors"
              :style="{ borderColor: v.color, background: g.activeFactions.value.has(k) ? v.color : 'transparent' }">
              <span v-if="g.activeFactions.value.has(k)" class="text-[9px] text-[#e8dcc8]">✓</span>
            </span>
            {{ v.label }}
            <input type="checkbox" class="hidden" :checked="g.activeFactions.value.has(k)" @change="toggleFaction(k)" />
          </label>
        </div>
        <div class="mb-2 mt-5 font-mono text-[10px] tracking-[0.3em] text-[#a89f8e]">排序方式</div>
        <div class="flex gap-1 mb-5">
          <button
            v-for="s in SORTS"
            :key="s.id"
            class="flex-1 text-[11px] py-1.5 border transition-colors"
            :class="g.sortBy.value === s.id ? 'border-[#b91c1c] text-[#e8dcc8] bg-[#b91c1c]/10' : 'border-[#2a2520] text-[#8f897c] hover:border-[#b91c1c]/60 hover:text-[#a89f8e]'"
            @click="g.sortBy.value = s.id"
          >
            {{ s.label }}
          </button>
        </div>
        <div class="mb-2 flex items-center justify-between">
          <span class="font-mono text-[10px] tracking-[0.3em] text-[#a89f8e]">人物索引（{{ g.sortedList.value.length }}）</span>
          <div class="flex gap-3">
            <button class="text-[11px] tracking-[0.1em] text-[#a89f8e] hover:text-[#e8dcc8]" @click="selectAllPeople">全部</button>
            <button class="text-[11px] tracking-[0.1em] text-[#a89f8e] hover:text-[#e8dcc8]" @click="selectNonePeople">清空</button>
          </div>
        </div>
        <div class="mb-1 font-mono text-[10px] tracking-[0.15em] text-[#8f897c]">{{ mode === 'path' ? t('graph.listHintPath') : t('graph.listHint') }}</div>
        <ul class="space-y-0.5" role="list">
          <li
            v-for="(n, i) in g.sortedList.value"
            :key="n.id"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] border-l-2 cursor-pointer select-none transition-colors"
            :class="selected?.id === n.id ? 'border-[#b91c1c] bg-[#161616]' : i === kbIndex && focusNodeId === n.id ? 'border-[#8c4a2f] bg-[#161616]' : mode === 'path' && pathStart === n.id ? 'border-[#a8443a] bg-[#161616]' : 'border-transparent hover:bg-[#161616]'"
            @click="onRowClick(n)"
          >
            <span
              class="w-3.5 h-3.5 border grid place-items-center shrink-0 cursor-pointer transition-colors"
              role="checkbox"
              :aria-checked="g.personSel.value.has(n.id)"
              :aria-label="`筛显 ${n.name}`"
              :style="{ borderColor: FACTION[n.faction].color, background: g.personSel.value.has(n.id) ? FACTION[n.faction].color : 'transparent' }"
              @click.stop="togglePerson(n.id)"
            >
              <span v-if="g.personSel.value.has(n.id)" class="text-[9px] text-[#e8dcc8]">✓</span>
            </span>
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: FACTION[n.faction].color }"></span>
            <span class="text-[#e8dcc8] truncate">{{ n.name }}</span>
            <span v-if="n.code" class="font-mono text-[9px] text-[#8c4a2f] shrink-0">{{ n.code }}</span>
            <button
              class="ml-auto w-6 h-6 grid place-items-center rounded border border-[#2a2520] text-[#a89f8e] hover:text-[#e8dcc8] hover:border-[#b91c1c] transition-colors shrink-0"
              :aria-label="`查看 ${n.name} 详情`"
              :title="`查看 ${n.name} 详情`"
              @click.stop="openPanel(n.id)"
            >
              <Info :size="12" />
            </button>
          </li>
        </ul>
      </aside>
    </div>

    <!-- 人物弹出卡片 -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[90] pointer-events-none">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-auto" @click="closePanel"></div>
        <aside ref="panelEl" class="pointer-events-auto absolute right-0 top-0 bottom-0 w-[92vw] max-w-[420px] bg-[#0e0e0e] border-l border-[#2a2520] overflow-y-auto">
          <div class="relative p-7">
            <button class="absolute top-5 right-5 text-[#a89f8e] hover:text-[#e8dcc8]" @click="closePanel"><X :size="18" /></button>
            <div class="font-mono text-[10px] tracking-[0.3em] text-[#b91c1c]">KITE FILE / {{ selected.id.toUpperCase() }}</div>
            <div class="mt-5 h-44 overflow-hidden border border-[#2a2520]">
              <NameBadge :name="selected.name" :faction="selected.faction" :code="selected.code" :sub="selected.identity" size="lg" />
            </div>
            <h3 class="serif-title text-3xl mt-6 text-[#e8dcc8]">{{ selected.name }}</h3>
            <div class="gold-line mt-2 w-24"></div>
            <div class="mt-4 flex flex-wrap gap-2">
              <span v-if="selected.code" class="badge-faction f-junton">代号 · {{ selected.code }}</span>
              <span class="badge-faction" :class="`f-${selected.faction}`">{{ factionLabel(selected.faction) }}</span>
              <span v-if="selected.actor" class="badge-faction f-civilian">{{ selected.actor }}</span>
            </div>
            <p ref="briefEl" class="mt-5 text-[13px] leading-7 text-[#a89f8e]"></p>
            <p class="mt-3 text-[12px] leading-6 text-[#8f897c]">出场：第 {{ selected.episodes[0] }}—{{ selected.episodes[1] }} 集
              <router-link :to="`/episodes?ep=${selected.episodes[0]}`" class="ml-2 text-[#e05a50] hover:text-[#ece3d2] transition-colors">进入剧集 →</router-link>
            </p>

            <!-- I.3 私人备注（仅本机 localStorage） -->
            <div class="mt-6">
              <div class="font-mono text-[10px] tracking-[0.3em] text-[#a89f8e]">私人备注 · 仅本机</div>
              <textarea
                v-model="noteText"
                class="k-input w-full mt-2 h-20 text-[12px] leading-5"
                placeholder="写下你的推演与猜想……（自动保存到本机）"
                @input="saveNote"
              ></textarea>
            </div>

            <!-- 关系网络洞察 -->
            <div v-if="insight" class="mt-6 border border-[#2a2520] bg-[#0b0b0b] p-4">
              <div class="font-mono text-[10px] tracking-[0.3em] text-[#8c4a2f]">关系网络 · INSIGHT</div>
              <div class="mt-3 space-y-2.5 text-[12px] leading-5">
                <div v-if="insight.toKite" class="text-[#a89f8e]">
                  至「风筝」最短链路：
                  <span class="text-[#8c4a2f]">{{ insight.toKite.ids.map((x) => g.charMap[x]?.name || x).join(' → ') }}</span>
                  <span class="text-[#8f897c]">（{{ insight.toKite.hops }} 跳）</span>
                </div>
                <div v-if="insight.toShadow" class="text-[#a89f8e]">
                  至「影子」最短链路：
                  <span class="text-[#a8443a]">{{ insight.toShadow.ids.map((x) => g.charMap[x]?.name || x).join(' → ') }}</span>
                  <span class="text-[#8f897c]">（{{ insight.toShadow.hops }} 跳）</span>
                </div>
                <div v-if="insight.common.length" class="text-[#a89f8e]">
                  与风筝的共同联系人：<span class="text-[#e8dcc8]">{{ insight.common.map((x) => g.charMap[x]?.name || x).join('、') }}</span>
                </div>
                <div class="text-[#a89f8e]">
                  阵营分布：
                  <span v-for="(cnt, f) in insight.spread" :key="f" class="mr-2 inline-flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full" :style="{ background: FACTION[f].color }"></span>{{ FACTION[f].label }} {{ cnt }}
                  </span>
                </div>
              </div>
            </div>
            <router-link :to="`/characters?q=${selected.id}`"
              class="mt-6 flex items-center gap-2 justify-center border border-[#b91c1c] py-2.5 text-[12px] tracking-[0.25em] text-[#e8dcc8] hover:bg-[#b91c1c]/15 transition-colors group">
              查看完整档案 <ArrowRight :size="14" class="group-hover:translate-x-1 transition-transform" />
            </router-link>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.era-fade-enter-active,
.era-fade-leave-active {
  transition: opacity 0.6s ease;
}
.era-fade-enter-from,
.era-fade-leave-to {
  opacity: 0;
}
</style>

