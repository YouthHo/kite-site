<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
// ECharts 按需引入：仅 GraphChart + CanvasRenderer
import * as echarts from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([GraphChart, GridComponent, TooltipComponent, CanvasRenderer])
import gsap from 'gsap'
import { X, Search, ArrowRight, Info, Play, Pause } from 'lucide-vue-next'
import graph from '@/data/relationships.json'
import characters from '@/data/characters.json'
import NameBadge from '@/components/NameBadge.vue'
import SealStamp from '@/components/SealStamp.vue'
import { FACTION, factionLabel } from '@/utils/factions'
import { theme } from '@/store/app'
import { prefersReduced, typewriter } from '@/utils/anim'

const chartEl = ref(null)
const panelEl = ref(null)
const keyword = ref('')
const selected = ref(null)
let chart = null
let panelTween = null
let resizeObs = null
let resizeTimer = null
let resizeTimer2 = null
let winResizeCleanup = null
let roamCleanup = null

function onWinResize() {
  chart?.resize()
}

const activeFactions = ref(new Set(Object.keys(FACTION)))
// 人物级筛选（与阵营筛选叠加生效）+ 排序
const personSel = ref(new Set(graph.nodes.map((n) => n.id)))
const sortBy = ref('faction')

const FACTION_ORDER = ['junton', 'zhongtong', 'underground', 'gongan', 'civilian']
const SORTS = [
  { id: 'faction', label: '阵营' },
  { id: 'name', label: '姓名' },
  { id: 'code', label: '代号' },
  { id: 'span', label: '出场' },
]

/* ================= 关系类型系统（数据已按剧情语义标注 type/tone/strength） ================= */
const TYPE_META = {
  enemy: { label: '敌对', color: '#9d2235', dash: true },
  superior: { label: '上下级', color: '#1e4a52', dash: false },
  family: { label: '亲情', color: '#b8860b', dash: false },
  love: { label: '爱情', color: '#c96f7f', dash: false },
  comrade: { label: '同志', color: '#2f8f7f', dash: false },
  partner: { label: '接头', color: '#8b7355', dash: false },
}
const activeTypes = ref(new Set(Object.keys(TYPE_META)))
function toggleType(k) {
  const s = new Set(activeTypes.value)
  if (s.has(k)) s.delete(k)
  else s.add(k)
  activeTypes.value = s
  chart?.setOption(buildOption(), false) // merge：保留当前视图
}

/* ================= 集数演化（时间轴 1-46，数据来自角色出场集数范围，零编造） ================= */
const ep = ref(46)
const epPlaying = ref(false)
let eraTimer = null
function toggleEraPlay() {
  if (epPlaying.value) {
    epPlaying.value = false
    clearInterval(eraTimer)
    return
  }
  if (ep.value >= 46) ep.value = 1
  epPlaying.value = true
  eraTimer = setInterval(() => {
    if (ep.value >= 46) {
      epPlaying.value = false
      clearInterval(eraTimer)
      return
    }
    ep.value++
  }, 700)
}
watch(ep, () => {
  if (chart) chart.setOption(buildOption(), false) // merge：演化不打断用户视角
})

/* ================= 布局模式 + 物理参数（力导向实时调节） ================= */
const layoutMode = ref('none') // none=手绘坐标（默认王牌视图） / force=力导向模拟
const repulsion = ref(220)
const edgeLen = ref(100)
watch(layoutMode, () => {
  if (chart) chart.setOption(buildOption(), true)
})
watch([repulsion, edgeLen], () => {
  if (layoutMode.value === 'force' && chart) chart.setOption(buildOption(), false)
})

/* ================= 最短路径（BFS）+ 键盘导航 ================= */
const pathMode = ref(false)
const pathStart = ref(null)
const pathResult = ref(null)
const kbIndex = ref(0)
const focusNodeId = ref(null)

function togglePathMode() {
  pathMode.value = !pathMode.value
  pathStart.value = null
  pathResult.value = null
  if (chart) chart.setOption(buildOption(), false)
}
function computePath(a, b) {
  // BFS 无权图最短路径（基于当前可见图）
  const ids = new Set(visibleNodeIds().map((n) => n.id))
  const adj = {}
  graph.links.forEach((l) => {
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
  if (!found) {
    pathResult.value = { ids: [a, b], hops: -1, pairs: [] }
    chart?.setOption(buildOption(), false)
    return
  }
  const idsPath = [b]
  let cur = b
  while (cur !== a) {
    cur = prev[cur]
    idsPath.unshift(cur)
  }
  const pairs = []
  for (let i = 0; i < idsPath.length - 1; i++) pairs.push(idsPath[i] + '>' + idsPath[i + 1])
  pathResult.value = { ids: idsPath, hops: idsPath.length - 1, pairs }
  chart?.setOption(buildOption(), false)
}
function onKey(e) {
  const list = sortedList.value
  if (!list.length) return
  let i = kbIndex.value
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    i = (i + 1) % list.length
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    i = (i - 1 + list.length) % list.length
  } else if (e.key === 'Enter') {
    if (focusNodeId.value) openPanel(focusNodeId.value)
    return
  } else if (e.key === 'Escape') {
    if (pathMode.value) togglePathMode()
    else if (selected.value) closePanel()
    else if (focusNodeId.value) {
      focusNodeId.value = null
      chart?.setOption(buildOption(), false)
    }
    return
  } else {
    return
  }
  e.preventDefault()
  kbIndex.value = i
  focusNodeId.value = list[i].id
  chart?.setOption(buildOption(), false)
}

/* ================= 统计 ================= */
const stats = computed(() => {
  const ids = new Set(visibleNodeIds().map((n) => n.id))
  const deg = {}
  let edges = 0
  const factions = new Set()
  visibleNodeIds().forEach((n) => factions.add(n.faction))
  graph.links.forEach((l) => {
    if (!ids.has(l.source) || !ids.has(l.target)) return
    if (!activeTypes.value.has(l.type)) return
    edges++
    deg[l.source] = (deg[l.source] || 0) + 1
    deg[l.target] = (deg[l.target] || 0) + 1
  })
  const top = Object.entries(deg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, d]) => `${charMap.value[id]?.name || id} ${d}`)
    .join(' · ')
  return { nodes: ids.size, edges, factions: factions.size, top }
})

const charMap = computed(() => {
  const m = {}
  characters.forEach((c) => (m[c.id] = c))
  return m
})

const sortedList = computed(() => {
  const ids = new Set(
    graph.nodes
      .filter((n) => activeFactions.value.has(n.faction))
      .filter((n) => {
        const kw = keyword.value.trim().toLowerCase()
        if (!kw) return true
        const c = charMap.value[n.id]
        return (n.name + (n.code || '') + (c?.identity || '')).toLowerCase().includes(kw)
      })
      .map((n) => n.id)
  )
  const list = graph.nodes.filter((n) => ids.has(n.id))
  const copy = [...list]
  const byName = (a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN-u-co-pinyin')
  if (sortBy.value === 'faction') copy.sort((a, b) => FACTION_ORDER.indexOf(a.faction) - FACTION_ORDER.indexOf(b.faction) || byName(a, b))
  else if (sortBy.value === 'name') copy.sort(byName)
  else if (sortBy.value === 'code') copy.sort((a, b) => (b.code ? 1 : 0) - (a.code ? 1 : 0) || byName(a, b))
  else if (sortBy.value === 'span') {
    const span = (n) => {
      const c = charMap.value[n.id]
      return c?.episodes ? c.episodes[1] - c.episodes[0] : 0
    }
    copy.sort((a, b) => span(b) - span(a))
  }
  return copy
})

function togglePerson(id) {
  const s = new Set(personSel.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  personSel.value = s
  chart?.setOption(buildOption(), true)
}
// 行点击：路径模式 = 选择起点/终点；普通模式 = 勾选切换
function onRowClick(n) {
  if (pathMode.value) {
    if (!pathStart.value) {
      pathStart.value = n.id
      chart?.setOption(buildOption(), false)
    } else {
      computePath(pathStart.value, n.id)
      pathStart.value = null
    }
    return
  }
  togglePerson(n.id)
}
function selectAllPeople() {
  personSel.value = new Set(graph.nodes.map((n) => n.id))
  chart?.setOption(buildOption(), true)
}
function selectNonePeople() {
  personSel.value = new Set()
  chart?.setOption(buildOption(), true)
}

function visibleNodeIds() {
  const kw = keyword.value.trim().toLowerCase()
  return graph.nodes.filter((n) => {
    if (!activeFactions.value.has(n.faction)) return false
    if (!personSel.value.has(n.id)) return false
    const c = charMap.value[n.id]
    if (!c?.episodes || c.episodes[0] > ep.value) return false // 集数演化：未出场角色不显示
    if (!kw) return true
    return (n.name + (n.code || '') + (c?.identity || '')).toLowerCase().includes(kw)
  })
}

/** 颜色提亮（用于节点径向渐变高光） */
function lightenHex(hex, amt) {
  const m = hex.replace('#', '')
  const n = parseInt(m.length === 3 ? m.split('').map((x) => x + x).join('') : m, 16)
  const r = Math.min(255, ((n >> 16) & 255) + Math.round(255 * amt))
  const g = Math.min(255, ((n >> 8) & 255) + Math.round(255 * amt))
  const b = Math.min(255, (n & 255) + Math.round(255 * amt))
  return `rgb(${r},${g},${b})`
}

/** 完整构建 option（全量重建或 merge 增量；国际顶尖图谱视觉） */
function buildOption({ center = false } = {}) {
  const light = theme.value === 'light'
  const ids = new Set(visibleNodeIds().map((n) => n.id))
  const pathIds = pathResult.value?.ids ? new Set(pathResult.value.ids) : null
  const pathPairs = pathResult.value?.pairs ? new Set(pathResult.value.pairs) : null
  const nodes = graph.nodes
    .filter((n) => ids.has(n.id))
    .map((n) => {
      const c = charMap.value[n.id] || {}
      const span = c.episodes ? c.episodes[1] - c.episodes[0] : 5
      const size = span > 30 ? 50 : span > 10 ? 40 : 32
      const color = FACTION[n.faction]?.color || '#555048'
      const onPath = pathIds?.has(n.id)
      const isFocus = focusNodeId.value === n.id
      const isStart = pathMode.value && pathStart.value === n.id
      const item = {
        color: {
          type: 'radial',
          x: 0.35,
          y: 0.3,
          r: 0.9,
          colorStops: [{ offset: 0, color: lightenHex(color, 0.35) }, { offset: 1, color }],
        },
        borderColor: light ? 'rgba(60,52,40,0.3)' : 'rgba(255,255,255,0.2)',
        borderWidth: 1.2,
        shadowBlur: 14,
        shadowColor: color + (light ? '33' : '44'),
        opacity: onPath ? 1 : pathIds ? 0.2 : 1,
      }
      if (onPath) {
        item.borderColor = '#b8860b'
        item.borderWidth = 2.5
        item.shadowColor = 'rgba(184,134,11,0.85)'
        item.shadowBlur = 22
      } else if (isFocus) {
        item.borderColor = '#b8860b'
        item.borderWidth = 2
        item.shadowColor = 'rgba(184,134,11,0.6)'
        item.shadowBlur = 18
      } else if (isStart) {
        item.borderColor = '#d8a0a8'
        item.borderWidth = 2
      }
      return {
        id: n.id,
        name: n.name,
        x: center ? 50 : n.x,
        y: center ? 50 : n.y,
        symbolSize: size,
        symbol: 'circle',
        category: n.faction,
        itemStyle: item,
        label: {
          show: true,
          position: 'bottom',
          distance: 6,
          formatter: n.name,
          color: light ? 'rgba(60,52,40,0.95)' : 'rgba(235,225,205,0.95)',
          fontSize: 11,
          fontFamily: '"Noto Sans SC", sans-serif',
          fontWeight: 500,
          textShadowColor: light ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.7)',
          textShadowBlur: 3,
          opacity: onPath ? 1 : pathIds ? 0.25 : 1,
        },
      }
    })
  const links = graph.links
    .filter((l) => ids.has(l.source) && ids.has(l.target))
    .filter((l) => activeTypes.value.has(l.type))
    .map((l) => {
      const meta = TYPE_META[l.type] || TYPE_META.enemy
      const onPath = pathPairs?.has(l.source + '>' + l.target) || pathPairs?.has(l.target + '>' + l.source)
      const dim = pathIds ? (onPath ? 1 : 0.12) : 1
      return {
        id: l.source + '>' + l.target,
        source: l.source,
        target: l.target,
        label: l.label,
        lineStyle: {
          color: meta.color,
          width: (0.8 + (l.strength || 2) * 0.35) * (onPath ? 2.2 : 1),
          opacity: (light ? 0.5 : 0.55) * dim,
          curveness: 0.05,
          type: meta.dash ? 'dashed' : 'solid',
        },
      }
    })
  const series = {
    type: 'graph',
    layout: layoutMode.value,
    // 原生 roam：滚轮以光标为中心缩放、双指捏合、节点拖拽平移
    roam: true,
    data: nodes,
    links,
    animationDurationUpdate: 300,
    animationEasingUpdate: 'cubicOut',
    edgeSymbol: ['none', 'circle'],
    edgeSymbolSize: [0, 3],
    edgeLabel: {
      show: false,
      formatter: (p) => p.data.label || '',
      color: light ? 'rgba(60,52,40,0.95)' : 'rgba(235,225,205,0.95)',
      fontSize: 10.5,
      fontFamily: '"Noto Sans SC", sans-serif',
      backgroundColor: light ? 'rgba(250,244,231,0.9)' : 'rgba(12,12,12,0.82)',
      borderColor: light ? 'rgba(60,52,40,0.15)' : 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderRadius: 10,
      padding: [3, 8],
      distance: 8,
    },
    emphasis: {
      focus: 'adjacency',
      blurScope: 'coordinateSystem',
      scale: 1.12,
      itemStyle: { shadowBlur: 24, shadowColor: '#9d2235' },
      lineStyle: { width: 1.8, color: '#b8860b', opacity: 0.9 },
      edgeLabel: { show: true, color: '#b8860b', fontSize: 11 },
      label: { color: '#ffffff', fontSize: 12 },
    },
    lineStyle: { width: 1 },
    label: { show: true },
  }
  if (layoutMode.value === 'force') {
    series.force = {
      repulsion: repulsion.value,
      edgeLength: edgeLen.value,
      gravity: 0.08,
      friction: 0.6,
      layoutAnimation: true,
    }
  }
  return {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: { type: 'value', min: 0, max: 100, show: false },
    yAxis: { type: 'value', min: 0, max: 100, show: false },
    tooltip: { show: false },
    series: [series],
  }
}

onMounted(async () => {
  await nextTick()
  chart = echarts.init(chartEl.value, null, { renderer: 'canvas' })
  // 入场：先聚拢中心 → 爆炸式扩散
  chart.setOption(buildOption({ center: true }), true)
  setTimeout(() => chart.setOption(buildOption(), true), 120)
  chart.on('click', (p) => {
    if (p.dataType !== 'node') return
    if (pathMode.value) {
      if (!pathStart.value) {
        pathStart.value = p.data.id
        chart?.setOption(buildOption(), false)
      } else {
        computePath(pathStart.value, p.data.id)
        pathStart.value = null
      }
      return
    }
    openPanel(p.data.id)
  })
  // 窗口尺寸变化自适应
  resizeObs = new ResizeObserver(() => chart && chart.resize())
  resizeObs.observe(chartEl.value)
  window.addEventListener('resize', onWinResize)
  resizeTimer = setTimeout(() => chart?.resize(), 3500)
  resizeTimer2 = setTimeout(() => chart?.resize(), 6000)

  // ---- 混合 roam：原生 roam（节点上拖拽/滚轮/捏合）+ 空白处手动平移（窗口级，互斥不冲突） ----
  const el = chartEl.value
  let manualPan = false
  let lastX = 0
  let lastY = 0

  const pxPerUnit = () => {
    const rect = el.getBoundingClientRect()
    return (rect.width * 0.84) / 100
  }
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return
    const rect = el.getBoundingClientRect()
    const coord = chart?.convertFromPixel({ seriesIndex: 0 }, [e.clientX - rect.left, e.clientY - rect.top])
    let hitNode = false
    if (coord && Number.isFinite(coord[0])) {
      const thr = (64 / 2 + 6) / pxPerUnit()
      hitNode = graph.nodes.some((n) => Math.hypot(coord[0] - n.x, coord[1] - n.y) < thr)
    }
    if (hitNode) return // 交给原生 roam（节点拖拽）
    manualPan = true
    lastX = e.clientX
    lastY = e.clientY
  }
  const onWinMove = (e) => {
    if (!manualPan || !chart) return
    chart.dispatchAction({ type: 'graphRoam', seriesIndex: 0, dx: e.clientX - lastX, dy: e.clientY - lastY })
    lastX = e.clientX
    lastY = e.clientY
  }
  const onWinUp = () => {
    manualPan = false
  }
  el.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onWinMove)
  window.addEventListener('pointerup', onWinUp)
  window.addEventListener('pointercancel', onWinUp)
  roamCleanup = () => {
    el.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('pointermove', onWinMove)
    window.removeEventListener('pointerup', onWinUp)
    window.removeEventListener('pointercancel', onWinUp)
  }
})

// 主题切换时重绘
watch(theme, () => {
  if (chart) chart.setOption(buildOption(), true)
})

// 重置视图：恢复初始缩放与位置
function resetView() {
  if (!chart) return
  chart.setOption(buildOption(), true)
}

const briefEl = ref(null)
let briefType = null
function openPanel(id) {
  const c = charMap.value[id]
  if (!c) return
  selected.value = c
  gsap.fromTo(panelEl.value, { x: 420, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' })
  briefType?.kill?.()
  if (briefEl.value && !prefersReduced) {
    briefType = typewriter(briefEl.value, c.brief, { speed: 9 })
  } else if (briefEl.value) {
    briefEl.value.textContent = c.brief
  }
}
function closePanel() {
  panelTween = gsap.to(panelEl.value, { x: 420, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => (selected.value = null) })
}

function toggleFaction(f) {
  const s = new Set(activeFactions.value)
  if (s.has(f)) s.delete(f)
  else s.add(f)
  activeFactions.value = s
  chart?.setOption(buildOption(), true)
}

onBeforeUnmount(() => {
  clearTimeout(resizeTimer)
  clearTimeout(resizeTimer2)
  clearInterval(eraTimer)
  window.removeEventListener('resize', onWinResize)
  roamCleanup?.()
  resizeObs?.disconnect()
  panelTween?.kill()
  chart?.dispose()
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
      <!-- 图谱区域 -->
      <div class="flex-1 relative min-h-[420px] border border-[#2a2520] bg-[#0b0b0b]" style="background: radial-gradient(ellipse 70% 55% at 50% 38%, rgba(157,34,53,0.07), transparent 62%), radial-gradient(ellipse 55% 45% at 82% 88%, rgba(30,74,82,0.06), transparent 60%);">
        <div
          ref="chartEl"
          class="absolute inset-0"
          style="touch-action: none;"
          tabindex="0"
          role="application"
          aria-label="人物关系图谱：滚轮缩放，拖拽平移，方向键移动焦点，回车查看档案，点击节点查看档案；也可使用右侧人物列表"
          @keydown="onKey"
        ></div>
        <div class="absolute top-3 left-3 font-mono text-[10px] tracking-[0.25em] text-[#555048] pointer-events-none">KITE-MAP · 滚轮/双指缩放 · 拖拽平移 · 点击节点查看档案</div>

        <!-- 统计条 -->
        <div class="absolute top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.15em] text-[#8a8275] pointer-events-none bg-black/40 border border-[#2a2520] px-3 py-1 hidden md:block">
          {{ stats.nodes }} 节点 · {{ stats.edges }} 连线 · {{ stats.factions }} 阵营 · 核心：{{ stats.top }}
        </div>

        <!-- 顶部工具条 -->
        <div class="absolute top-3 right-3 z-10 flex gap-1.5 flex-wrap justify-end max-w-[62%]">
          <button
            class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors"
            :class="pathMode ? 'border-[#b8860b] text-[#b8860b] bg-[#b8860b]/10' : 'border-[#2a2520] bg-[#0e0e0e]/85 text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235]'"
            @click="togglePathMode"
          >
            路径模式
          </button>
          <button
            class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors"
            :class="layoutMode === 'force' ? 'border-[#b8860b] text-[#b8860b] bg-[#b8860b]/10' : 'border-[#2a2520] bg-[#0e0e0e]/85 text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235]'"
            @click="layoutMode = layoutMode === 'force' ? 'none' : 'force'"
          >
            力导向
          </button>
          <button
            class="px-2.5 py-1.5 border border-[#2a2520] bg-[#0e0e0e]/85 backdrop-blur font-mono text-[10px] tracking-[0.15em] text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235] transition-colors"
            @click="resetView"
          >
            重置视图
          </button>
        </div>

        <!-- 路径信息条 -->
        <div
          v-if="pathResult"
          class="absolute top-12 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] tracking-[0.15em] px-3 py-1.5 border border-[#b8860b] bg-[#0e0e0e]/90 text-[#b8860b] whitespace-nowrap"
        >
          <template v-if="pathResult.hops >= 0">
            最短路径：{{ pathResult.ids.map((id) => charMap[id]?.name || id).join(' → ') }} · {{ pathResult.hops }} 跳
          </template>
          <template v-else>两节点在当前图谱中不连通</template>
        </div>
        <div
          v-if="pathMode && pathStart"
          class="absolute top-12 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] tracking-[0.15em] px-3 py-1.5 border border-[#d8a0a8] bg-[#0e0e0e]/90 text-[#d8a0a8] whitespace-nowrap"
        >
          起点：{{ charMap[pathStart]?.name }} — 请点击终点
        </div>

        <!-- 底部图例：阵营 + 关系类型（类型可点击筛选） -->
        <div class="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5 max-w-[48%]">
          <div class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.15em] text-[#8a8275] pointer-events-none">
            <span v-for="(v, k) in FACTION" :key="k" class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full" :style="{ background: v.color }"></span>{{ v.label }}
            </span>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.1em]">
            <button
              v-for="(m, k) in TYPE_META"
              :key="k"
              class="flex items-center gap-1.5 transition-colors"
              :class="activeTypes.has(k) ? 'text-[#8a8275]' : 'text-[#3a352c]'"
              @click="toggleType(k)"
            >
              <span class="w-3.5 h-[2px]" :style="{ background: m.color, opacity: activeTypes.has(k) ? 1 : 0.25 }"></span>
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- 时间轴：集数演化 -->
        <div class="absolute bottom-3 right-3 z-10 flex items-center gap-2.5 bg-[#0e0e0e]/85 border border-[#2a2520] px-3 py-1.5">
          <button class="text-[#8a8275] hover:text-[#e8dcc8] transition-colors" :aria-label="epPlaying ? '暂停演化' : '播放演化'" @click="toggleEraPlay">
            <Pause v-if="epPlaying" :size="13" />
            <Play v-else :size="13" />
          </button>
          <input
            type="range"
            min="1"
            max="46"
            step="1"
            v-model.number="ep"
            class="w-32 md:w-44 accent-[#9d2235]"
            :aria-label="`剧情集数 ${ep}`"
          />
          <span class="font-mono text-[10px] tracking-[0.15em] text-[#8a8275] w-[74px]">EP {{ String(ep).padStart(2, '0') }}/46</span>
        </div>

        <!-- 物理参数（力导向模式） -->
        <div
          v-if="layoutMode === 'force'"
          class="absolute bottom-12 right-3 z-10 flex items-center gap-4 bg-[#0e0e0e]/90 border border-[#2a2520] px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-[#8a8275]"
        >
          <label class="flex items-center gap-2">斥力
            <input type="range" min="60" max="400" step="10" v-model.number="repulsion" class="w-20 md:w-28 accent-[#9d2235]" />
          </label>
          <label class="flex items-center gap-2">连线
            <input type="range" min="40" max="220" step="10" v-model.number="edgeLen" class="w-20 md:w-28 accent-[#9d2235]" />
          </label>
        </div>
      </div>
      <!-- 侧边栏：玻璃拟态 -->
      <aside class="lg:w-[300px] glass border-t lg:border-t-0 lg:border-l border-[#2a2520] p-5 overflow-y-auto shrink-0">
        <div class="relative mb-5">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8275]" />
          <input v-model="keyword" class="k-input w-full !pl-9" placeholder="搜索人物 / 代号……" />
        </div>
        <div class="mb-2 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">阵营筛选</div>
        <div class="grid grid-cols-2 gap-1.5 mb-6">
          <label v-for="(v, k) in FACTION" :key="k" class="flex items-center gap-2 text-[12px] cursor-pointer select-none"
            :class="activeFactions.has(k) ? 'text-[#e8dcc8]' : 'text-[#555048]'">
            <span class="w-3.5 h-3.5 border grid place-items-center transition-colors"
              :style="{ borderColor: v.color, background: activeFactions.has(k) ? v.color : 'transparent' }">
              <span v-if="activeFactions.has(k)" class="text-[9px] text-[#e8dcc8]">✓</span>
            </span>
            {{ v.label }}
            <input type="checkbox" class="hidden" :checked="activeFactions.has(k)" @change="toggleFaction(k)" />
          </label>
        </div>
        <div class="mb-2 mt-5 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">排序方式</div>
        <div class="flex gap-1 mb-5">
          <button
            v-for="s in SORTS"
            :key="s.id"
            class="flex-1 text-[11px] py-1.5 border transition-colors"
            :class="sortBy === s.id ? 'border-[#9d2235] text-[#e8dcc8] bg-[#9d2235]/10' : 'border-[#2a2520] text-[#555048] hover:border-[#9d2235]/60 hover:text-[#8a8275]'"
            @click="sortBy = s.id"
          >
            {{ s.label }}
          </button>
        </div>
        <div class="mb-2 flex items-center justify-between">
          <span class="font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">人物索引（{{ sortedList.length }}）</span>
          <div class="flex gap-3">
            <button class="text-[11px] tracking-[0.1em] text-[#8a8275] hover:text-[#e8dcc8]" @click="selectAllPeople">全选</button>
            <button class="text-[11px] tracking-[0.1em] text-[#8a8275] hover:text-[#e8dcc8]" @click="selectNonePeople">全不选</button>
          </div>
        </div>
        <div class="mb-1 font-mono text-[10px] tracking-[0.15em] text-[#555048]">{{ pathMode ? '路径模式：点击人物行选择起点 → 终点' : '点击名字行 = 勾选/取消（控制图谱显示）· 点击右侧详情图标查看档案' }}</div>
        <div class="space-y-0.5">
          <div
            v-for="(n, i) in sortedList"
            :key="n.id"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] border-l-2 cursor-pointer select-none transition-colors"
            :class="selected?.id === n.id ? 'border-[#9d2235] bg-[#161616]' : i === kbIndex && focusNodeId === n.id ? 'border-[#b8860b] bg-[#161616]' : pathMode && pathStart === n.id ? 'border-[#d8a0a8] bg-[#161616]' : 'border-transparent hover:bg-[#161616]'"
            @click="onRowClick(n)"
          >
            <span
              class="w-3.5 h-3.5 border grid place-items-center shrink-0 transition-colors"
              :style="{ borderColor: FACTION[n.faction].color, background: personSel.has(n.id) ? FACTION[n.faction].color : 'transparent' }"
            >
              <span v-if="personSel.has(n.id)" class="text-[9px] text-[#e8dcc8]">✓</span>
            </span>
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: FACTION[n.faction].color }"></span>
            <span class="text-[#e8dcc8] truncate">{{ n.name }}</span>
            <span v-if="n.code" class="font-mono text-[9px] text-[#b8860b] shrink-0">{{ n.code }}</span>
            <button
              class="ml-auto w-6 h-6 grid place-items-center rounded border border-[#2a2520] text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235] transition-colors shrink-0"
              :aria-label="`查看 ${n.name} 详情`"
              :title="`查看 ${n.name} 详情`"
              @click.stop="openPanel(n.id)"
            >
              <Info :size="12" />
            </button>
          </div>
        </div>
      </aside>
    </div>

    <!-- 人物弹出卡片 -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[90] pointer-events-none">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-auto" @click="closePanel"></div>
        <aside ref="panelEl" class="pointer-events-auto absolute right-0 top-0 bottom-0 w-[92vw] max-w-[420px] bg-[#0e0e0e] border-l border-[#2a2520] overflow-y-auto">
          <div class="relative p-7">
            <button class="absolute top-5 right-5 text-[#8a8275] hover:text-[#e8dcc8]" @click="closePanel"><X :size="18" /></button>
            <div class="font-mono text-[10px] tracking-[0.3em] text-[#9d2235]">KITE FILE / {{ selected.id.toUpperCase() }}</div>
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
            <p ref="briefEl" class="mt-5 text-[13px] leading-7 text-[#8a8275]"></p>
            <p class="mt-3 text-[12px] leading-6 text-[#555048]">出场：第 {{ selected.episodes[0] }}—{{ selected.episodes[1] }} 集</p>
            <router-link :to="`/characters?q=${selected.id}`"
              class="mt-6 flex items-center gap-2 justify-center border border-[#9d2235] py-2.5 text-[12px] tracking-[0.25em] text-[#e8dcc8] hover:bg-[#9d2235]/15 transition-colors group">
              查看完整档案 <ArrowRight :size="14" class="group-hover:translate-x-1 transition-transform" />
            </router-link>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>
