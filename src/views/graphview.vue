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

function visibleNodeIds() {
  const kw = keyword.value.trim().toLowerCase()
  return graph.nodes.filter((n) => {
    if (!activeFactions.value.has(n.faction)) return false
    if (!kw) return true
    const c = charMap.value[n.id]
    return (n.name + (n.code || '') + (c?.identity || '')).toLowerCase().includes(kw)
  })
}

function buildOption(center = false) {
  const ids = new Set(visibleNodeIds().map((n) => n.id))
  const nodes = graph.nodes.filter((n) => ids.has(n.id)).map((n) => {
    const c = charMap.value[n.id] || {}
    const size = c.episodes && c.episodes[1] - c.episodes[0] > 30 ? 46 : c.episodes && c.episodes[1] - c.episodes[0] > 10 ? 34 : 24
    return {
      id: n.id,
      name: n.name,
      x: center ? 50 : n.x,
      y: center ? 50 : n.y,
      symbolSize: size,
      category: n.faction,
      itemStyle: {
        color: FACTION[n.faction]?.color || '#555048',
        shadowBlur: 16,
        shadowColor: FACTION[n.faction]?.color + '88',
        borderColor: 'rgba(232,220,200,0.25)',
        borderWidth: 1,
      },
      label: { show: true, formatter: '{b}', color: '#e8dcc8', fontSize: 12, fontFamily: '"Noto Serif SC", serif' },
      // 头像图片：占位
      // symbol: 'image://https://picsum.photos/seed/' + n.id + '/80/80',
    }
  })
  const links = graph.links.filter((l) => ids.has(l.source) && ids.has(l.target)).map((l) => ({
    source: l.source,
    target: l.target,
    label: l.label,
    lineStyle: { color: 'rgba(138,130,117,0.4)', width: 1, curveness: 0.08 },
  }))
  // 流动光点：lines 系列沿边流动
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
        animationDurationUpdate: 750,
        animationEasingUpdate: 'cubicOut',
        emphasis: {
          focus: 'adjacency',
          blurScope: 'coordinateSystem',
          itemStyle: { shadowBlur: 34, shadowColor: '#9d2235' },
          lineStyle: { width: 2.5, color: '#b8860b', opacity: 0.9 },
          label: { color: '#f0e6d2', fontSize: 14 },
        },
        lineStyle: { color: 'rgba(138,130,117,0.35)', width: 1 },
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
  // 入场：先全部聚拢在中心 → 爆炸式扩散
  chart.setOption(buildOption(true), true)
  setTimeout(() => {
    chart.setOption(buildOption(false), true)
  }, 120)
  chart.on('click', (p) => {
    if (p.dataType === 'node') openPanel(p.data.id)
  })
  // 呼吸脉动：节点大小缓慢起伏
  if (!prefersReduced) {
    let pulse = 1
    pulseTimer = setInterval(() => {
      if (!chart) return
      pulse = pulse === 1 ? 1.06 : 1
      const ids = new Set(visibleNodeIds().map((n) => n.id))
      const data = graph.nodes
        .filter((n) => ids.has(n.id))
        .map((n) => {
          const c = charMap.value[n.id] || {}
          const base = c.episodes && c.episodes[1] - c.episodes[0] > 30 ? 46 : c.episodes && c.episodes[1] - c.episodes[0] > 10 ? 34 : 24
          return { id: n.id, symbolSize: Math.round(base * pulse) }
        })
      chart.setOption({ series: [{ data }] })
    }, 2400)
  }
  // 移动端手势缩放已由 roam:true 提供
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
  chart?.setOption(buildOption(false), true)
}

onBeforeUnmount(() => {
  clearInterval(pulseTimer)
  panelTween?.kill()
  chart?.dispose()
})
</script>

<template>
  <div class="page-wrap !pt-16 !pb-0 h-screen flex flex-col">
    <div class="flex items-center gap-3 mb-4">
      <h2 class="serif-title text-2xl text-[#e8dcc8]">人物关系图谱</h2>
      <span class="file-label">WHO IS KITE · WHO IS SHADOW</span>
    </div>
    <div class="flex-1 flex flex-col lg:flex-row gap-0 min-h-0">
      <!-- 图谱区域 80%：带谍战网格背景 -->
      <div class="flex-1 relative min-h-[420px] border border-[#2a2520] bg-[#0b0b0b]"
        style="background-image: linear-gradient(rgba(138,130,117,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(138,130,117,0.05) 1px, transparent 1px); background-size: 42px 42px;">
        <div ref="chartEl" class="absolute inset-0"></div>
        <div class="absolute top-3 left-3 font-mono text-[10px] tracking-[0.25em] text-[#555048] pointer-events-none">KITE-MAP · 加密坐标</div>
      </div>
      <!-- 侧边栏 20%：玻璃拟态 -->
      <aside class="lg:w-[280px] glass border-t lg:border-t-0 lg:border-l border-[#2a2520] p-4 overflow-y-auto shrink-0">
        <div class="relative mb-4">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8275]" />
          <input v-model="keyword" class="k-input w-full !pl-9" placeholder="搜索人物 / 代号……" />
        </div>
        <div class="mb-2 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">阵营筛选</div>
        <div class="grid grid-cols-2 gap-1.5 mb-5">
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
            class="w-full text-left flex items-center gap-2 px-2 py-1.5 text-[12px] border-l-2 border-transparent hover:border-[#9d2235] hover:bg-[#161616] transition-colors"
            :class="selected?.id === n.id ? 'border-[#9d2235] bg-[#161616]' : ''"
            @click="openPanel(n.id)">
            <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: FACTION[n.faction].color }"></span>
            <span class="text-[#e8dcc8] truncate">{{ n.name }}</span>
            <span v-if="n.code" class="font-mono text-[9px] text-[#b8860b] shrink-0">{{ n.code }}</span>
          </button>
        </div>
      </aside>
    </div>

    <!-- 人物弹出卡片：右侧滑入，档案袋设计 -->
    <Teleport to="body">
      <div v-if="selected" class="fixed inset-0 z-[90] pointer-events-none">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-auto" @click="closePanel"></div>
        <aside ref="panelEl" class="pointer-events-auto absolute right-0 top-0 bottom-0 w-[92vw] max-w-[420px] bg-[#0e0e0e] border-l border-[#2a2520] overflow-y-auto">
          <div class="archive-tape relative p-6">
            <button class="absolute top-4 right-4 text-[#8a8275] hover:text-[#e8dcc8]" @click="closePanel"><X :size="18" /></button>
            <div class="font-mono text-[10px] tracking-[0.3em] text-[#9d2235]">KITE FILE / {{ selected.id.toUpperCase() }}</div>
            <div class="film-holes mt-4">
              <img :src="selected.image" :alt="selected.name" class="k-img w-full h-44 object-cover border border-[#2a2520]" />
            </div>
            <h3 class="serif-title text-3xl mt-5 text-[#e8dcc8]">{{ selected.name }}</h3>
            <div class="gold-line mt-2 w-24"></div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span v-if="selected.code" class="badge-faction f-junton">代号 · {{ selected.code }}</span>
              <span class="badge-faction" :class="`f-${selected.faction}`">{{ { junton: '军统', zhongtong: '中统', underground: '地下党', gongan: '公安', civilian: '平民' }[selected.faction] }}</span>
              <span class="badge-faction f-civilian">{{ selected.actor || '演员待考' }}</span>
            </div>
            <p class="mt-4 text-[13px] leading-7 text-[#8a8275]">{{ selected.brief }}</p>
            <p class="mt-3 text-[12px] leading-6 text-[#555048]">出场：第 {{ selected.episodes[0] }}—{{ selected.episodes[1] }} 集</p>
            <router-link :to="`/characters?q=${selected.id}`"
              class="mt-5 flex items-center gap-2 justify-center border border-[#9d2235] py-2.5 text-[12px] tracking-[0.25em] text-[#e8dcc8] hover:bg-[#9d2235]/15 transition-colors group">
              查看完整档案 <ArrowRight :size="14" class="group-hover:translate-x-1 transition-transform" />
            </router-link>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>
