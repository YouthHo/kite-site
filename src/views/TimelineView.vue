<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as echarts from 'echarts'
import timeline from '@/data/timeline.json'
import TimelineNode from '@/components/TimelineNode.vue'
import { prefersReduced } from '@/utils/anim'

const pinRef = ref(null)
const trackRef = ref(null)
const lineRef = ref(null)
const lit = ref(new Set())
let ctx = null
let miniChart = null

// 五个时间段分区
const SECTIONS = [
  { id: 1, label: '潜伏前夜', sub: '1927—1937', color: 'rgba(139,115,85,0.05)' },
  { id: 2, label: '烽火抗战', sub: '1938—1945', color: 'rgba(61,61,61,0.07)' },
  { id: 3, label: '山城谍影', sub: '1946—1949', color: 'rgba(157,34,53,0.06)' },
  { id: 4, label: '建国肃特', sub: '1950—1965', color: 'rgba(30,74,82,0.06)' },
  { id: 5, label: '风雨归途', sub: '1966—1990', color: 'rgba(184,134,11,0.05)' },
]
const sectionOf = (date) => {
  const y = Number(date.slice(0, 4))
  if (y <= 1937) return 1
  if (y <= 1945) return 2
  if (y <= 1949) return 3
  if (y <= 1965) return 4
  return 5
}
const nodes = computed(() => timeline.map((n) => ({ ...n, section: sectionOf(n.date) })))

// 分区：给每个节点插一个 section header（每段开头）
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

function onNodeVisible(i) {
  lit.value = new Set(lit.value).add(i)
}

onMounted(async () => {
  await nextTick()
  const isMobile = window.matchMedia('(max-width: 767px)')
  ctx = gsap.matchMedia()
  ctx.add({ isDesktop: '(min-width: 768px)', isMobile: '(max-width: 767px)' }, (c) => {
    const { isDesktop } = c.conditions
    if (isDesktop && trackRef.value && !prefersReduced) {
      // 横向长卷轴：钉住滚动
      const getDist = () => Math.max(0, trackRef.value.scrollWidth - window.innerWidth)
      gsap.to(trackRef.value, {
        x: () => -getDist(),
        ease: 'none',
        scrollTrigger: {
          trigger: pinRef.value,
          start: 'top top',
          end: () => '+=' + getDist(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })
      // 主线从左到右逐渐画出
      gsap.fromTo(
        lineRef.value,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: pinRef.value, start: 'top top', end: () => '+=' + getDist(), scrub: 1 },
        }
      )
      // 分区高亮：当前区亮、其他区暗
      SECTIONS.forEach((s) => {
        const secEl = document.querySelector(`[data-sec="${s.id}"]`)
        if (!secEl) return
        gsap.fromTo(
          secEl,
          { opacity: 0.45 },
          {
            opacity: 1,
            ease: 'none',
            scrollTrigger: { trigger: secEl, start: 'left 75%', end: 'left 25%', scrub: true },
          }
        )
      })
    } else {
      // 移动端：纵向时间线 + 普通滚入
      document.querySelectorAll('.m-node').forEach((el) => {
        gsap.fromTo(el, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.7, scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
      })
    }
  })
  initMiniChart()
})

function initMiniChart() {
  const el = document.querySelector('.mini-chart')
  if (!el) return
  miniChart = echarts.init(el)
  miniChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 40, right: 16, top: 30, bottom: 30 },
    tooltip: { trigger: 'axis', backgroundColor: '#121212', borderColor: '#2a2520', textStyle: { color: '#e8dcc8' } },
    legend: { data: ['剧情节点', '真实历史'], textStyle: { color: '#8a8275' }, top: 0 },
    xAxis: { type: 'category', data: SECTIONS.map((s) => s.label), axisLine: { lineStyle: { color: '#2a2520' } }, axisLabel: { color: '#8a8275' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(42,37,32,0.6)' } }, axisLabel: { color: '#555048' } },
    series: [
      { name: '剧情节点', type: 'bar', data: SECTIONS.map((s) => nodes.value.filter((n) => n.section === s.id && n.type === 'plot').length), itemStyle: { color: '#9d2235' }, barWidth: 18 },
      { name: '真实历史', type: 'bar', data: SECTIONS.map((s) => nodes.value.filter((n) => n.section === s.id && n.type === 'history').length), itemStyle: { color: '#b8860b' }, barWidth: 18 },
    ],
  })
}

onBeforeUnmount(() => {
  ctx?.revert()
  miniChart?.dispose()
})
</script>

<template>
  <div class="page-wrap !pt-16 !max-w-none !px-0">
    <div class="px-5 md:px-8 mb-6 flex flex-wrap items-center gap-3">
      <h2 class="serif-title text-3xl text-[#e8dcc8]" data-enter>全剧时间线</h2>
      <span class="file-label" data-enter>1927—1980 · 史诗长卷</span>
      <p class="w-full font-mono text-[11px] tracking-[0.25em] text-[#8a8275]" data-enter>横向滚动阅读 · 金色为真实历史节点 · 拖动页面即可</p>
    </div>

    <!-- 桌面端：钉住横向滚动 -->
    <div ref="pinRef" class="relative hidden md:block h-[80vh] overflow-hidden border-y border-[#2a2520]">
      <div ref="trackRef" class="timeline-track absolute top-0 left-0 h-full flex will-change-transform">
        <!-- 分区色带 + 竖排标题 -->
        <template v-for="s in SECTIONS" :key="s.id">
          <div class="h-full shrink-0" :data-sec="s.id" :style="{ width: '100vw', background: s.color }">
            <div class="h-full flex items-center justify-center">
              <div class="serif-title text-4xl tracking-[0.5em] text-[#e8dcc8]/60" style="writing-mode: vertical-rl;">
                {{ s.label }}<span class="block mt-3 font-mono text-[11px] tracking-[0.3em] text-[#8a8275]/70">{{ s.sub }}</span>
              </div>
            </div>
          </div>
        </template>
        <!-- 节点内容区 -->
        <div class="h-full shrink-0 relative" :style="{ width: (decorated.length * 380) + 'px' }">
          <!-- 主线 -->
          <div ref="lineRef" class="absolute left-0 right-0 top-1/2 h-[2px] origin-left" style="background: linear-gradient(90deg, transparent, #9d2235 20%, #b8860b 60%, transparent 100%); box-shadow: 0 0 14px rgba(157,34,53,0.5);"></div>
          <div v-for="(item, i) in decorated" :key="i">
            <template v-if="item.type === 'header'">
              <div class="absolute w-px bg-[#9d2235]/50" :style="{ left: (i * 380 + 190) + 'px', top: 0, bottom: 0 }"></div>
            </template>
            <template v-else>
              <div class="absolute" :style="{ left: (i * 380 + 60) + 'px', top: item.node.section % 2 ? '3%' : '52%' }">
                <div
                  class="timeline-dot absolute w-3.5 h-3.5 rounded-full border-2 border-[#080808] transition-all duration-500"
                  :class="lit.has(i) ? 'scale-125' : ''"
                  :style="{ background: lit.has(i) ? (item.node.type === 'history' ? '#b8860b' : '#9d2235') : '#2a2520', boxShadow: lit.has(i) ? '0 0 16px rgba(157,34,53,0.8)' : 'none', top: item.node.section % 2 ? '50%' : '-8px' }"
                ></div>
                <TimelineNode :node="item.node" :index="i" :side="item.node.section % 2 ? 'top' : 'bottom'" @visible="onNodeVisible" />
              </div>
            </template>
          </div>
        </div>
      </div>
      <!-- 图例 -->
      <div class="absolute bottom-4 left-4 z-10 flex gap-4 font-mono text-[10px] tracking-[0.25em] text-[#8a8275] bg-black/50 px-3 py-1.5">
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#9d2235]"></span>剧情节点</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#b8860b]"></span>真实历史</span>
      </div>
    </div>

    <!-- 移动端：纵向时间线 -->
    <div class="md:hidden relative pl-8">
      <div class="absolute left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#9d2235] via-[#b8860b] to-transparent"></div>
      <div v-for="(item, i) in decorated" :key="i" class="m-node relative mb-6">
        <template v-if="item.type === 'header'">
          <div class="serif-title text-xl tracking-[0.3em] text-[#e8dcc8] mb-4">{{ SECTIONS[item.section - 1].label }}</div>
        </template>
        <template v-else>
          <span class="absolute -left-[21px] top-2 w-3 h-3 rounded-full border-2 border-[#080808]" :style="{ background: item.node.type === 'history' ? '#b8860b' : '#9d2235' }"></span>
          <TimelineNode :node="item.node" :index="i" side="bottom" @visible="onNodeVisible" />
        </template>
      </div>
    </div>

    <!-- ECharts 年代分布统计 -->
    <div class="max-w-5xl mx-auto mt-10 px-5 md:px-8">
      <div class="file-label mb-4">年代分布统计（ECharts）</div>
      <div class="mini-chart h-64 border border-[#2a2520] bg-[#0b0b0b]"></div>
    </div>
  </div>
</template>
