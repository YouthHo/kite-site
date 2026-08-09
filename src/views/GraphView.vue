<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import gsap from 'gsap'
import { X, Search, ArrowRight } from 'lucide-vue-next'
import graph from '@/data/relationships.json'
import characters from '@/data/characters.json'
import { prefersReduced } from '@/utils/anim'

const chartEl = ref(null)
const panelEl = ref(null)
const keyword = ref('')
const selected = ref(null)
let chart = null
let pulseTimer = null
let panelTween = null
let resizeObs = null

const FACTION = {
  junton: { label: '军统', color: '#9d2235' },
  zhongtong: { label: '中统', color: '#7d3b52' },
  underground: { label: '地下党', color: '#1e4a52' },
  gongan: { label: '公安', color: '#3d3d3d' },
  civilian: { label: '平民', color: '#8b7355' },
}
const activeFactions = ref(new Set(Object.keys(FACTION)))

const charMap = computed(() => {
  const m = {}
  characters.forEach((c) => (m[c.id] = c))
  return m
})

/** 生成字母头像（SVG data URI）：真实照片缺失时使用，避免随机占位图当头像 */
function avatarUri(id, name, faction) {
  const color = FACTION[faction]?.color || '#555048'
  const ch = (name || '?').slice(0, 2)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">` +
    `<rect width="120" height="120" fill="${color}"/>` +
    `<rect width="120" height="120" fill="url(#g)" opacity="0.55"/>` +
    `<defs><radialGradient id="g" cx="0.5" cy="0.4" r="0.9">` +
    `<stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#000000" stop-opacity="0.55"/>` +
    `</radialGradient></defs>` +
    `<text x="60" y="74" text-anchor="middle" font-family="'Noto Serif SC',serif" font-size="44" fill="#f0e6d2">${ch}</text>` +
    `<rect x="18" y="96" width="84" height="2" fill="#e8dcc8" opacity="0.35"/>` +
    `</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

/** 是否真实照片（本地图片或 http 图片源，picsum 占位不算） */
function isRealPhoto(url) {
  return !!url && !String(url).includes('picsum.photos')
}

function visibleNodeIds() {
  const kw = keyword.value.trim().toLowerCase()
  return graph.nodes.filter((n) => {
    if (!activeFactions.value.has(n.faction)) return false
    if (!kw) return true
    const c = charMap.value[n.id]
    return (n.name + (n.code || '') + (c?.identity || '')).toLowerCase().includes(kw)
  })
}

/** 完整构建 option（每次全量重建，杜绝增量更新破坏节点数据） */
function buildOption({ center = false, pulse = 1 } = {}) {
  const ids = new Set(visibleNodeIds().map((n) => n.id))
  const nodes = graph.nodes
    .filter((n) => ids.has(n.id))
    .map((n) => {
      const c = charMap.value[n.id] || {}
      const span = c.episodes ? c.episodes[1] - c.episodes[0] : 5
      const base = span > 30 ? 54 : span > 10 ? 42 : 32
      const size = Math.round(base * pulse)
      const realImg = isRealPhoto(c.image)
      return {
        id: n.id,
        name: n.name,
        x: center ? 50 : n.x,
        y: center ? 50 : n.y,
        symbolSize: size,
        symbol: realImg ? 'image://' + c.image : avatarUri(n.id, n.name, n.faction),
        symbolKeepAspect: true,
        category: n.faction,
        itemStyle: {
          color: FACTION[n.faction]?.color || '#555048',
          borderColor: 'rgba(232,220,200,0.35)',
          borderWidth: realImg ? 2 : 1,
          shadowBlur: 18,
          shadowColor: FACTION[n.faction]?.color + '99',
        },
        label: {
          show: true,
          position: 'bottom',
          distance: 6,
          formatter: (p) => (p.data.name ? p.data.name + (n.code ? ' · ' + n.code : '') : ''),
          color: '#e8dcc8',
          fontSize: 12,
          fontFamily: '"Noto Serif SC", serif',
        },
      }
    })
  const links = graph.links
    .filter((l) => ids.has(l.source) && ids.has(l.target))
    .map((l) => ({
      source: l.source,
      target: l.target,
      label: l.label,
      lineStyle: { color: 'rgba(138,130,117,0.45)', width: 1.2, curveness: 0.08 },
    }))
  const lines = graph.links
    .filter((l) => ids.has(l.source) && ids.has(l.target))
    .map((l) => {
      const s = graph.nodes.find((n) => n.id === l.source)
      const t = graph.nodes.find((n) => n.id === l.target)
      return { coords: [[s.x, s.y], [t.x, t.y]] }
    })
  return {
    backgroundColor: 'transparent',
    grid: { left: 0, right: 0, top: 0, bottom: 0 },
    xAxis: { type: 'value', min: 0, max: 100, show: false },
    yAxis: { type: 'value', min: 0, max: 100, show: false },
    tooltip: { show: false },
    series: [
      {
        type: 'graph',
        layout: 'none',
        roam: true,
        data: nodes,
        links,
        animationDurationUpdate: pulse === 1 ? 750 : 500,
        animationEasingUpdate: 'cubicOut',
        edgeSymbol: ['none', 'circle'],
        edgeSymbolSize: [0, 4],
        edgeLabel: {
          show: true,
          formatter: (p) => p.data.label || '',
          color: 'rgba(232,220,200,0.55)',
          fontSize: 9,
          fontFamily: '"JetBrains Mono","Noto Sans SC",monospace',
          distance: 8,
        },
        emphasis: {
          focus: 'adjacency',
          blurScope: 'coordinateSystem',
          itemStyle: { shadowBlur: 34, shadowColor: '#9d2235' },
          lineStyle: { width: 2.5, color: '#b8860b', opacity: 0.95 },
          edgeLabel: { show: true, color: '#f0e6d2', fontSize: 10 },
          label: { color: '#f0e6d2', fontSize: 13 },
        },
        lineStyle: { color: 'rgba(138,130,117,0.4)', width: 1 },
        label: { show: true },
      },
      {
        type: 'lines',
        coordinateSystem: 'cartesian2d',
        data: lines.map((l) => ({ coords: l.coords })),
        lineStyle: { opacity: 0 },
        effect: { show: true, period: 5, symbol: 'circle', symbolSize: 3, trailLength: 0.25, color: '#b8860b' },
        zlevel: 2,
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
  // 呼吸脉动：全量重建，安全且不破坏节点
  if (!prefersReduced) {
    let pulse = 1
    pulseTimer = setInterval(() => {
      if (!chart || selected.value) return
      pulse = pulse === 1 ? 1.05 : 1
      chart.setOption(buildOption({ pulse }), false)
    }, 2600)
  }
  // 窗口尺寸变化自适应
  resizeObs = new ResizeObserver(() => chart && chart.resize())
  resizeObs.observe(chartEl.value)
})

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
  clearInterval(pulseTimer)
  resizeObs?.disconnect()
  panelTween?.kill()
  chart?.dispose()
})
</script>

<template>
  <div class="page-wrap !pt-16 !pb-0 h-screen flex flex-col">
    <div class="flex items-center gap-3 mb-4">
      <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]">人物关系图谱</h2>
      <span class="file-label">WHO IS KITE · WHO IS SHADOW</span>
    </div>
    <div class="flex-1 flex flex-col lg:flex-row gap-0 min-h-0">
      <!-- 图谱区域：谍战网格背景 -->
      <div class="flex-1 relative min-h-[420px] border border-[#2a2520] bg-[#0b0b0b]"
        style="background-image: linear-gradient(rgba(138,130,117,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(138,130,117,0.05) 1px, transparent 1px); background-size: 42px 42px;">
        <div ref="chartEl" class="absolute inset-0"></div>
        <div class="absolute top-3 left-3 font-mono text-[10px] tracking-[0.25em] text-[#555048] pointer-events-none">KITE-MAP · 悬停高亮 · 点击查看档案</div>
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
        <div class="mb-2 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">人物索引（{{ visibleNodeIds().length }}）</div>
        <div class="space-y-0.5">
          <button v-for="n in graph.nodes.filter((n) => visibleNodeIds().map((v) => v.id).includes(n.id))" :key="n.id"
            class="w-full text-left flex items-center gap-2.5 px-2.5 py-2 text-[12px] border-l-2 border-transparent hover:border-[#9d2235] hover:bg-[#161616] transition-colors"
            :class="selected?.id === n.id ? 'border-[#9d2235] bg-[#161616]' : ''"
            @click="openPanel(n.id)">
            <img v-if="isRealPhoto(charMap[n.id]?.image)" :src="charMap[n.id].image" class="w-6 h-6 rounded-full object-cover border border-[#2a2520]" />
            <span v-else class="w-6 h-6 rounded-full grid place-items-center text-[10px] text-[#f0e6d2] shrink-0" :style="{ background: FACTION[n.faction].color }">{{ n.name.slice(0, 1) }}</span>
            <span class="text-[#e8dcc8] truncate">{{ n.name }}</span>
            <span v-if="n.code" class="font-mono text-[9px] text-[#b8860b] shrink-0">{{ n.code }}</span>
          </button>
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
            <div class="mt-5 w-full h-48 overflow-hidden border border-[#2a2520]">
              <img :src="selected.image" :alt="selected.name" class="w-full h-full object-cover" style="filter: brightness(0.9) contrast(1.05)" />
            </div>
            <h3 class="serif-title text-3xl mt-6 text-[#e8dcc8]">{{ selected.name }}</h3>
            <div class="gold-line mt-2 w-24"></div>
            <div class="mt-4 flex flex-wrap gap-2">
              <span v-if="selected.code" class="badge-faction f-junton">代号 · {{ selected.code }}</span>
              <span class="badge-faction" :class="`f-${selected.faction}`">{{ { junton: '军统', zhongtong: '中统', underground: '地下党', gongan: '公安', civilian: '平民' }[selected.faction] }}</span>
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
