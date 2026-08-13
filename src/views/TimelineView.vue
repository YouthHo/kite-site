<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// ECharts 按需引入：时间线统计图仅用 BarChart
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])
import timeline from '@/data/timeline.json'
import SealStamp from '@/components/SealStamp.vue'
import TimelineNode from '@/components/TimelineNode.vue'
import { theme } from '@/store/app'
import { prefersReduced } from '@/utils/anim'

const pinRef = ref(null)
const trackRef = ref(null)
const lineRef = ref(null)
const activeEra = ref(1)
const lit = ref(new Set())
let hTween = null
let ctx = null
let miniChart = null

const SECTIONS = [
  { id: 1, label: '潜伏前夜', sub: '1927—1937', color: 'rgba(139,115,85,0.07)' },
  { id: 2, label: '烽火抗战', sub: '1938—1945', color: 'rgba(61,61,61,0.09)' },
  { id: 3, label: '山城谍影', sub: '1946—1949', color: 'rgba(157,34,53,0.08)' },
  { id: 4, label: '建国肃特', sub: '1950—1965', color: 'rgba(30,74,82,0.08)' },
  { id: 5, label: '风雨归途', sub: '1966—1990', color: 'rgba(184,134,11,0.07)' },
]
const sectionOf = (date) => {
  const y = Number(date.slice(0, 4))
  if (y <= 1937) return 1
  if (y <= 1945) return 2
  if (y <= 1949) return 3
  if (y <= 1965) return 4
  return 5
}

const INTRO_W = 560
const HEADER_W = 200
const NODE_W = 380

const nodes = computed(() => timeline.map((n) => ({ ...n, section: sectionOf(n.date) })))
const decorated = computed(() => {
  const out = []
  let lastSec = 0
  nodes.value.forEach((n) => {
    if (n.section !== lastSec) {
      out.push({ type: 'header', section: n.section })
      lastSec = n.section
    }
    out.push({ type: 'node', node: n })
  })
  return out
})

// 每个元素在轨道内的 left 偏移 + 分区起止
const layout = computed(() => {
  let x = INTRO_W
  const items = []
  const secs = SECTIONS.map((s) => ({ ...s, left: 0, width: 0 }))
  decorated.value.forEach((it) => {
    const w = it.type === 'header' ? HEADER_W : NODE_W
    items.push({ ...it, left: x, width: w })
    const sec = secs.find((s) => s.id === it.section)
    if (sec) {
      if (!sec.width) sec.left = x
      sec.width += w
    }
    x += w
  })
  return { items, secs, trackWidth: x + 120 }
})

// 当前时期（由横向进度推算）
const progress = ref(0)
function computeActiveEra() {
  const p = progress.value
  const idx = Math.min(SECTIONS.length - 1, Math.max(0, Math.floor(p * SECTIONS.length)))
  activeEra.value = SECTIONS[idx].id
}

// 节点逐个点亮 + 卡片浮现（手动驱动，避免容器内 ScrollTrigger 失效）
const nodeDone = new Map()
function updateNodes() {
  if (!hTween) return
  const vw = window.innerWidth
  layout.value.items.forEach((it, i) => {
    if (it.type !== 'node' || nodeDone.has(i)) return
    const el = document.querySelector(`[data-node="${i}"]`)
    if (!el) return
    const viewX = it.left - Math.abs(hTween.progress() * (layout.value.trackWidth - vw))
    if (viewX < vw - 60) {
      nodeDone.set(i, true)
      lit.value = new Set(lit.value).add(i)
      gsap.fromTo(
        el.querySelector('.tnode'),
        { opacity: 0, y: it.node.type === 'history' ? 30 : -30 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }
      )
    }
  })
}

onMounted(async () => {
  await nextTick()
  const isMobile = window.matchMedia('(max-width: 767px)')
  ctx = gsap.matchMedia()
  ctx.add({ isDesktop: '(min-width: 768px)', isMobile: '(max-width: 767px)' }, (c) => {
    const { isDesktop } = c.conditions
    if (isDesktop && trackRef.value && !prefersReduced) {
      const getDist = () => Math.max(0, trackRef.value.scrollWidth - window.innerWidth)
      hTween = gsap.to(trackRef.value, {
        x: () => -getDist(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinRef.value,
          start: 'top 152px', // 冻结标题栏（64px 导航 + ~76px 标题条）下方
          end: () => '+=' + getDist(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            progress.value = self.progress
            computeActiveEra()
            updateNodes()
          },
        },
      })
      gsap.fromTo(
        lineRef.value,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          // 前 40% 滚动距离内完成绘制：线快速延伸穿过屏幕、右端渐隐，之后保持完整
          scrollTrigger: { trigger: pinRef.value, start: 'top 152px', end: () => '+=' + getDist() * 0.4, scrub: 1 },
        }
      )
    } else {
      document.querySelectorAll('.m-node').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.7, scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
      })
    }
  })
  initMiniChart()
  // 兜底：JS 动画失效时内容依然可见（初始隐藏由 gsap.set 控制）
  document.querySelectorAll('.timeline-track .tnode').forEach((el) => gsap.set(el, { opacity: 0 }))
  requestAnimationFrame(() => updateNodes())
})

function initMiniChart() {
  const el = document.querySelector('.mini-chart')
  if (!el) return
  if (miniChart) miniChart.dispose()
  miniChart = echarts.init(el)
  const light = theme.value === 'light'
  miniChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 40, right: 16, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis', backgroundColor: light ? '#fff' : '#121212', borderColor: light ? '#d6cfc1' : '#2a2520', textStyle: { color: light ? '#2f2b23' : '#e8dcc8' } },
    legend: { data: ['剧情节点', '真实历史'], textStyle: { color: light ? '#6e675a' : '#8a8275' }, top: 0 },
    xAxis: { type: 'category', data: SECTIONS.map((s) => s.label + ' ' + s.sub), axisLine: { lineStyle: { color: light ? '#c9b795' : '#2a2520' } }, axisLabel: { color: light ? '#6e675a' : '#8a8275', interval: 0, rotate: 0, fontSize: 10 } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: light ? 'rgba(150,120,70,0.2)' : 'rgba(42,37,32,0.6)' } }, axisLabel: { color: light ? '#7a7366' : '#555048' } },
    series: [
      { name: '剧情节点', type: 'bar', data: SECTIONS.map((s) => nodes.value.filter((n) => n.section === s.id && n.type === 'plot').length), itemStyle: { color: '#b91c1c' }, barWidth: 18 },
      { name: '真实历史', type: 'bar', data: SECTIONS.map((s) => nodes.value.filter((n) => n.section === s.id && n.type === 'history').length), itemStyle: { color: '#8c4a2f' }, barWidth: 18 },
    ],
  })
}

watch(theme, () => initMiniChart())

onBeforeUnmount(() => {
  ctx?.revert()
  miniChart?.dispose()
})
</script>

<template>
  <div class="page-wrap !pt-16 !max-w-none !px-0">
    <!-- 固定标题栏：滚动时保持可见 -->
    <div class="sticky top-16 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-[#1c1815]">
      <div class="px-5 md:px-8 pr-16 md:pr-20 py-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div class="flex items-center gap-4">
          <SealStamp :text="'全剧\n时间'" />
          <h2 class="serif-title text-3xl md:text-4xl text-[#e8dcc8]" data-enter>全剧时间线</h2>
          <span class="file-label hidden md:inline-block" data-enter>1927—1980 · 史诗长卷</span>
        </div>
        <p class="font-mono text-[10px] md:text-[11px] tracking-[0.25em] text-[#8a8275]" data-enter>上下滚动 → 横向展开 · 剧情上行 · 历史下行</p>
      </div>
    </div>

    <!-- 桌面端：居中主线 + 钉住横向滚动 -->
    <div ref="pinRef" class="relative hidden md:block h-[85vh] overflow-x-auto overflow-y-hidden border-y border-[#2a2520] bg-[#0a0a0a]">
      <div ref="trackRef" class="timeline-track absolute top-0 left-0 h-full flex will-change-transform" :style="{ width: layout.trackWidth + 'px' }">
        <!-- 分区色带（绝对定位，覆盖各自区域） -->
        <div
          v-for="s in layout.secs"
          :key="s.id"
          class="absolute top-0 bottom-0 transition-opacity duration-500"
          :style="{ left: s.left + 'px', width: s.width + 'px', background: s.color, opacity: activeEra === s.id ? 1 : 0.45 }"
        ></div>

        <!-- 主线：垂直居中 -->
        <div ref="lineRef" class="absolute left-0 right-0 top-1/2 h-[2px] origin-left -translate-y-1/2 z-10" style="background: linear-gradient(90deg, rgba(157,34,53,0) 0%, #b91c1c 4%, #8c4a2f 50%, #b91c1c 96%, rgba(157,34,53,0) 100%); box-shadow: 0 0 16px rgba(157,34,53,0.45);"></div>

        <!-- 序章 -->
        <div class="relative z-10 h-full flex flex-col items-center justify-center text-center shrink-0" :style="{ width: INTRO_W + 'px' }">
          <div class="serif-title text-6xl text-[#e8dcc8]/90" style="letter-spacing: 0.2em;">KITE</div>
          <div class="gold-line w-40 mt-5"></div>
          <div class="mt-4 font-mono text-[11px] tracking-[0.45em] text-[#8a8275]">1927 — 1980</div>
          <div class="mt-10 font-mono text-[10px] tracking-[0.3em] text-[#555048]">↓ 向下滚动 · 横向展开</div>
          <div class="mt-6 flex gap-5 font-mono text-[10px] tracking-[0.2em] text-[#8a8275]">
            <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#b91c1c]"></span>剧情 · 上行</span>
            <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#8c4a2f]"></span>真实历史 · 下行</span>
          </div>
        </div>

        <!-- 分区标题 + 节点 -->
        <template v-for="(it, i) in layout.items" :key="i">
          <div v-if="it.type === 'header'" class="relative z-10 h-full flex items-center justify-center shrink-0" :style="{ width: it.width + 'px' }">
            <div class="text-center">
              <div class="serif-title text-3xl tracking-[0.5em] text-[#e8dcc8]/70" style="writing-mode: vertical-rl;">
                {{ SECTIONS[it.section - 1].label }}
              </div>
              <div class="mt-4 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]/70">{{ SECTIONS[it.section - 1].sub }}</div>
            </div>
          </div>
          <div v-else :data-node="i" class="relative z-10 h-full shrink-0" :style="{ width: it.width + 'px' }">
            <!-- 节点圆点（线上） -->
            <span
              class="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#0a0a0a] transition-all duration-500 z-10"
              :style="{
                top: '50%',
                background: lit.has(i) ? (it.node.type === 'history' ? '#8c4a2f' : '#b91c1c') : '#2a2520',
                boxShadow: lit.has(i) ? '0 0 18px rgba(157,34,53,0.9)' : 'none',
                transform: lit.has(i) ? 'translate(-50%,-50%) scale(1.25)' : 'translate(-50%,-50%)',
              }"
            ></span>
            <!-- 卡片：剧情上行 · 历史下行，居中于主线 -->
            <div class="absolute left-1/2 -translate-x-1/2 w-[340px]" :style="it.node.type === 'history' ? { top: 'calc(50% + 34px)' } : { top: 'calc(50% - 226px)' }">
              <TimelineNode :node="it.node" :index="i" :side="it.node.section % 2 ? 'top' : 'bottom'" manual />
            </div>
          </div>
        </template>
        <div class="relative z-10 shrink-0" :style="{ width: '120px' }"></div>
      </div>

      <!-- 当前时期指示 -->
      <div class="absolute top-4 right-5 z-20 font-mono text-[10px] tracking-[0.35em] text-[#8a8275] on-media bg-black/50 px-3 py-1.5 border border-[#2a2520]">
        ERA {{ activeEra }} · {{ SECTIONS[activeEra - 1].label }}
      </div>

      <!-- 章节大字幕（随滚动淡入淡出） -->
      <transition name="era-fade">
        <div :key="activeEra" class="absolute inset-0 z-10 grid place-items-center pointer-events-none">
          <div class="serif-title text-7xl tracking-[0.35em] text-[#e8dcc8]/20 select-none">{{ SECTIONS[activeEra - 1].label }}</div>
        </div>
      </transition>

      <!-- 横向进度条 -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-64 h-[2px] bg-[#2a2520]/60 overflow-hidden">
        <div class="h-full origin-left" :style="{ transform: 'scaleX(' + progress + ')', background: 'linear-gradient(90deg,#b91c1c,#8c4a2f)' }"></div>
      </div>
    </div>

    <!-- 移动端：纵向时间线 -->
    <div class="md:hidden relative pl-9">
      <div class="absolute left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#b91c1c] via-[#8c4a2f] to-transparent"></div>
      <div v-for="(it, i) in layout.items" :key="i">
        <div v-if="it.type === 'header'" class="m-node relative mb-5">
          <div class="serif-title text-xl tracking-[0.3em] text-[#e8dcc8]">{{ SECTIONS[it.section - 1].label }}</div>
          <div class="font-mono text-[10px] tracking-[0.25em] text-[#8a8275]">{{ SECTIONS[it.section - 1].sub }}</div>
        </div>
        <div v-else class="m-node relative mb-6">
          <span class="absolute -left-[23px] top-2 w-3 h-3 rounded-full border-2 border-[#080808]" :style="{ background: it.node.type === 'history' ? '#8c4a2f' : '#b91c1c' }"></span>
          <TimelineNode :node="it.node" :index="i" side="bottom" />
        </div>
      </div>
    </div>

    <!-- ECharts 年代分布统计 -->
    <div class="max-w-5xl mx-auto mt-12 px-5 md:px-8">
      <div class="file-label mb-4">年代分布统计（ECharts）</div>
      <div class="mini-chart h-64 border border-[#2a2520] bg-[#0b0b0b]"></div>
    </div>
  </div>
</template>

<style scoped>
.era-fade-enter-active,
.era-fade-leave-active {
  transition: opacity 0.5s ease;
}
.era-fade-enter-from,
.era-fade-leave-to {
  opacity: 0;
}
</style>
