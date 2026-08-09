<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import gsap from 'gsap'
import { X, Search, ArrowRight, Info } from 'lucide-vue-next'
import graph from '@/data/relationships.json'
import characters from '@/data/characters.json'
import NameBadge from '@/components/NameBadge.vue'
import SealStamp from '@/components/SealStamp.vue'
import { FACTION, factionLabel } from '@/utils/factions'
import { theme } from '@/store/app'
import { prefersReduced } from '@/utils/anim'

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

const charMap = computed(() => {
  const m = {}
  characters.forEach((c) => (m[c.id] = c))
  return m
})

const sortedList = computed(() => {
  // 列表只按阵营筛选 + 搜索过滤：人物勾选状态不影响名字显示（随时可反悔重新勾选）
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
    if (!kw) return true
    const c = charMap.value[n.id]
    return (n.name + (n.code || '') + (c?.identity || '')).toLowerCase().includes(kw)
  })
}

/** 完整构建 option（全量重建；节点统一为“完整名字”徽章） */
function buildOption({ center = false, pulse = 1 } = {}) {
  const light = theme.value === 'light'
  const ids = new Set(visibleNodeIds().map((n) => n.id))
  const nodes = graph.nodes
    .filter((n) => ids.has(n.id))
    .map((n) => {
      const c = charMap.value[n.id] || {}
      const span = c.episodes ? c.episodes[1] - c.episodes[0] : 5
      // 节点尺寸缩小一档（64/54/44），给关系标签留出可读空间；缩放由原生 roam 整体等比处理
      const size = span > 30 ? 64 : span > 10 ? 54 : 44
      return {
        id: n.id,
        name: n.name,
        x: center ? 50 : n.x,
        y: center ? 50 : n.y,
        symbolSize: size,
        symbol: 'circle',
        category: n.faction,
        itemStyle: {
          color: FACTION[n.faction]?.color || '#555048',
          borderColor: light ? 'rgba(47,43,35,0.25)' : 'rgba(232,220,200,0.4)',
          borderWidth: 1.5,
          shadowBlur: 26,
          shadowColor: (FACTION[n.faction]?.color || '#555048') + (light ? '66' : 'aa'),
        },
        label: {
          show: true,
          position: 'inside',
          formatter: n.name,
          color: '#f5f2e9',
          fontSize: n.name.length > 2 ? 12 : 13,
          fontFamily: '"Noto Serif SC", serif',
          letterSpacing: 1,
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowBlur: 4,
        },
      }
    })
  const links = graph.links
    .filter((l) => ids.has(l.source) && ids.has(l.target))
    .map((l) => ({
      source: l.source,
      target: l.target,
      label: l.label,
      lineStyle: { color: light ? 'rgba(110,103,90,0.45)' : 'rgba(138,130,117,0.42)', width: 1.2, curveness: 0.08 },
    }))
  return {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 8, top: 8, bottom: 8 },
    xAxis: { type: 'value', min: 0, max: 100, show: false },
    yAxis: { type: 'value', min: 0, max: 100, show: false },
    tooltip: { show: false },
    series: [
      {
        type: 'graph',
        layout: 'none',
        // roam 关闭：改为容器级手动平移/缩放（任意空白处可拖拽，双指捏合缩放）
        roam: false,
        data: nodes,
        links,
        animationDurationUpdate: 300,
        animationEasingUpdate: 'cubicOut',
        edgeSymbol: ['none', 'circle'],
        edgeSymbolSize: [0, 4],
        edgeLabel: {
          show: true,
          formatter: (p) => p.data.label || '',
          color: light ? 'rgba(70,63,52,0.95)' : 'rgba(232,220,200,0.95)',
          fontSize: 10,
          fontFamily: '"JetBrains Mono","Noto Sans SC",monospace',
          backgroundColor: light ? 'rgba(250,244,231,0.78)' : 'rgba(8,8,8,0.68)',
          borderColor: light ? 'rgba(70,63,52,0.2)' : 'rgba(232,220,200,0.15)',
          borderWidth: 1,
          borderRadius: 3,
          padding: [2, 5],
          distance: 10,
        },
        emphasis: {
          focus: 'adjacency',
          blurScope: 'coordinateSystem',
          itemStyle: { shadowBlur: 42, shadowColor: '#9d2235' },
          lineStyle: { width: 3, color: '#b8860b', opacity: 0.95 },
          edgeLabel: { show: true, color: light ? '#7a1a29' : '#f0e6d2', fontSize: 11 },
          label: { color: '#ffffff', fontSize: 14 },
        },
        lineStyle: { color: light ? 'rgba(110,103,90,0.4)' : 'rgba(138,130,117,0.38)', width: 1.2 },
        label: { show: true },
      },
    ],
  }
}

onMounted(async () => {
  await nextTick()
  chart = echarts.init(chartEl.value, null, { renderer: 'canvas' })
  // 入场：先聚拢中心 → 爆炸式扩散
  chart.setOption(buildOption({ center: true }), true)
  setTimeout(() => chart.setOption(buildOption(), true), 120)
  chart.on('click', (p) => {
    if (p.dataType === 'node') openPanel(p.data.id)
  })
  // 窗口尺寸变化自适应（防止画布被 CSS 非等比拉伸导致圆形变椭圆）
  resizeObs = new ResizeObserver(() => chart && chart.resize())
  resizeObs.observe(chartEl.value)
  window.addEventListener('resize', onWinResize)
  // 加载屏消失、布局稳定后各补一次 resize（兜底非等比拉伸）
  resizeTimer = setTimeout(() => chart?.resize(), 3500)
  resizeTimer2 = setTimeout(() => chart?.resize(), 6000)

  // ---- 容器级手动 roam：任意位置拖拽平移、滚轮以光标为中心缩放、双指捏合 ----
  const el = chartEl.value
  const pointers = new Map()
  let lastX = 0
  let lastY = 0
  let pinchDist = 0

  const onPointerDown = (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    el.setPointerCapture?.(e.pointerId)
    if (pointers.size === 1) {
      lastX = e.clientX
      lastY = e.clientY
    }
  }
  const onPointerMove = (e) => {
    if (!pointers.has(e.pointerId)) return
    if (pointers.size === 1) {
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      if (chart) chart.dispatchAction({ type: 'graphRoam', seriesIndex: 0, dx, dy })
    } else if (pointers.size === 2) {
      // 双指捏合缩放
      const pts = [...pointers.values()]
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      if (pinchDist > 0 && d > 0 && chart) {
        const midX = (pts[0].x + pts[1].x) / 2 - el.getBoundingClientRect().left
        const midY = (pts[0].y + pts[1].y) / 2 - el.getBoundingClientRect().top
        chart.dispatchAction({ type: 'graphRoam', seriesIndex: 0, zoom: d / pinchDist, originX: midX, originY: midY })
      }
      pinchDist = d
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }
  }
  const onPointerUp = (e) => {
    pointers.delete(e.pointerId)
    pinchDist = 0
  }
  const onWheel = (e) => {
    e.preventDefault()
    if (!chart) return
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    const rect = el.getBoundingClientRect()
    chart.dispatchAction({
      type: 'graphRoam',
      seriesIndex: 0,
      zoom: factor,
      originX: e.clientX - rect.left,
      originY: e.clientY - rect.top,
    })
  }

  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', onPointerUp)
  el.addEventListener('pointercancel', onPointerUp)
  el.addEventListener('wheel', onWheel, { passive: false })
  roamCleanup = () => {
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointermove', onPointerMove)
    el.removeEventListener('pointerup', onPointerUp)
    el.removeEventListener('pointercancel', onPointerUp)
    el.removeEventListener('wheel', onWheel)
  }
})

// 主题切换时重绘
watch(theme, () => {
  if (chart) chart.setOption(buildOption(), true)
})

// 重置视图：恢复初始缩放与位置（notMerge 清空 roam 变换）
function resetView() {
  if (!chart) return
  chart.setOption(buildOption(), true)
}

function openPanel(id) {
  const c = charMap.value[id]
  if (!c) return
  selected.value = c
  gsap.fromTo(panelEl.value, { x: 420, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
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
  window.removeEventListener('resize', onWinResize)
  roamCleanup?.()
  resizeObs?.disconnect()
  panelTween?.kill()
  chart?.dispose()
})
</script>

<template>
  <div class="page-wrap !pt-16 !pb-0 h-screen flex flex-col">
    <div class="flex items-center gap-4 mb-4">
      <SealStamp text="关系图谱" />
      <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]">人物关系图谱</h2>
      <span class="file-label">WHO IS KITE · WHO IS SHADOW</span>
    </div>
    <div class="flex-1 flex flex-col lg:flex-row gap-0 min-h-0">
      <!-- 图谱区域：谍战网格背景 -->
      <div class="flex-1 relative min-h-[420px] border border-[#2a2520] bg-[#0b0b0b]"
        style="background-image: linear-gradient(rgba(138,130,117,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(138,130,117,0.05) 1px, transparent 1px); background-size: 42px 42px;">
        <div ref="chartEl" class="absolute inset-0" style="touch-action: none;"></div>
        <div class="absolute top-3 left-3 font-mono text-[10px] tracking-[0.25em] text-[#555048] pointer-events-none">KITE-MAP · 滚轮/双指局部缩放 · 拖拽平移 · 点击节点查看档案</div>
        <!-- 视图重置 -->
        <div class="absolute top-3 right-3 z-10">
          <button
            class="px-3 py-1.5 border border-[#2a2520] bg-[#0e0e0e]/85 backdrop-blur font-mono text-[11px] tracking-[0.15em] text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235] transition-colors"
            @click="resetView"
          >
            重置视图
          </button>
        </div>
        <div class="absolute bottom-3 left-3 flex gap-4 font-mono text-[10px] tracking-[0.15em] text-[#8a8275] pointer-events-none">
          <span v-for="(v, k) in FACTION" :key="k" class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full" :style="{ background: v.color }"></span>{{ v.label }}
          </span>
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
              <span v-if="activeFactions.has(k)" class="text-[9px] text-white">✓</span>
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
        <div class="mb-1 font-mono text-[10px] tracking-[0.15em] text-[#555048]">点击名字行 = 勾选/取消（控制图谱显示）· 点击右侧详情图标查看档案</div>
        <div class="space-y-0.5">
          <!-- 行点击 = 勾选切换；详情为独立按钮 -->
          <div
            v-for="n in sortedList"
            :key="n.id"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] border-l-2 cursor-pointer select-none transition-colors"
            :class="selected?.id === n.id ? 'border-[#9d2235] bg-[#161616]' : 'border-transparent hover:bg-[#161616]'"
            @click="togglePerson(n.id)"
          >
            <span
              class="w-3.5 h-3.5 border grid place-items-center shrink-0 transition-colors"
              :style="{ borderColor: FACTION[n.faction].color, background: personSel.has(n.id) ? FACTION[n.faction].color : 'transparent' }"
            >
              <span v-if="personSel.has(n.id)" class="text-[9px] text-white">✓</span>
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
            <p class="mt-5 text-[13px] leading-7 text-[#8a8275]">{{ selected.brief }}</p>
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
