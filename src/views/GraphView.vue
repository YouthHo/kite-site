<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { X, Search, ArrowRight, Info, Play, Pause } from 'lucide-vue-next'
import { GraphEngine } from '@/graph/GraphEngine'
import { useGraphData, TYPE_META } from '@/graph/useGraphData'
import NameBadge from '@/components/NameBadge.vue'
import SealStamp from '@/components/SealStamp.vue'
import { FACTION, factionLabel } from '@/utils/factions'
import { theme } from '@/store/app'
import { prefersReduced, typewriter } from '@/utils/anim'

const g = useGraphData()
const chartEl = ref(null)
const panelEl = ref(null)
const selected = ref(null)
const pathMode = ref(false)
const pathStart = ref(null)
const pathResult = ref(null)
const kbIndex = ref(0)
const focusNodeId = ref(null)
const layoutMode = ref('none')
const decryptMode = ref(false)
const hoverNodeId = ref(null)
const hoverSummary = ref('')
const decryptedCount = ref(0)
const secretFound = ref(0)
const secretTotal = computed(() => g.links.filter((l) => l.secret).length)
function handleDecrypt() {
  decryptedCount.value = engine?.decrypted?.size || 0
  const dec = engine?.decrypted
  secretFound.value = dec ? g.links.filter((l) => l.secret && dec.has(l.source) && dec.has(l.target)).length : 0
}

let engine = null
let briefType = null
let resizeObs = null

const SORTS = [
  { id: 'faction', label: '阵营' },
  { id: 'name', label: '姓名' },
  { id: 'code', label: '代号' },
  { id: 'span', label: '出场' },
]

/* ================= 交互 ================= */
let hoverType = null
function handleNodeClick(id) {
  if (pathMode.value) {
    if (!pathStart.value) {
      pathStart.value = id
      engine?.requestRender()
    } else {
      computePath(pathStart.value, id)
      pathStart.value = null
    }
    return
  }
  // 聚焦隔离 + 打开档案（Esc 释放）
  engine?.setFocusClick(id)
  engine?.centerOn(id, 420)
  openPanel(id)
}

function toggleDecrypt() {
  decryptMode.value = !decryptMode.value
  engine?.setDecrypt(decryptMode.value)
  handleDecrypt()
}

function handleHover(id) {
  hoverNodeId.value = id
  hoverType?.kill?.()
  if (!id) {
    hoverSummary.value = ''
    return
  }
  const n = g.byId[id]
  if (!n) return
  // 悬停电报条：打字机逐字浮现核心关系摘要
  const rels = g.visibleLinks.value
    .filter((l) => l.source === id || l.target === id)
    .map((l) => l.label)
    .slice(0, 4)
    .join(' · ')
  const key = n.key ? (n.key === 'kite' ? ' [风筝轴]' : ' [影子轴]') : ''
  const text = `接入 ${n.name}${key} · ${n.code ? '代号「' + n.code + '」· ' : ''}${rels || '孤悬于网'}`
  hoverSummary.value = text
  if (hoverEl.value && !prefersReduced) {
    hoverType = typewriter(hoverEl.value, text, { speed: 14, caret: false })
  } else if (hoverEl.value) {
    hoverEl.value.textContent = text
  }
}

function onSearchEnter() {
  const kw = g.keyword.value.trim()
  if (!kw || !engine) return
  const hit = g.sortedList.value[0]
  if (hit) {
    engine.setFocusClick(hit.id)
    engine.centerOn(hit.id, 500)
  }
}

function computePath(a, b) {
  const res = g.shortestPath(a, b)
  if (!res) {
    pathResult.value = { ids: [a, b], hops: -1, pairs: [] }
  } else {
    pathResult.value = res
  }
  engine?.setPath(pathResult.value)
}

function togglePathMode() {
  pathMode.value = !pathMode.value
  pathStart.value = null
  if (!pathMode.value) {
    pathResult.value = null
    engine?.setPath(null)
  }
}

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
  pathResult.value = null
  engine?.setPath(null)
  engine?.fit()
}

function openPanel(id) {
  const c = g.charMap[id]
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
  gsap.to(panelEl.value, { x: 420, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => (selected.value = null) })
}

function onRowClick(n) {
  if (pathMode.value) {
    if (!pathStart.value) {
      pathStart.value = n.id
      engine?.requestRender()
    } else {
      computePath(pathStart.value, n.id)
      pathStart.value = null
    }
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

/* ================= 键盘导航 ================= */
function onKey(e) {
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
  } else if (e.key === 'Escape') {
    if (pathMode.value) togglePathMode()
    else if (selected.value) closePanel()
    else if (focusNodeId.value) {
      focusNodeId.value = null
      engine?.setFocus(null)
    } else if (engine?.focusClick) {
      engine?.setFocusClick(null)
    }
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

/* ================= 生命周期 ================= */
onMounted(async () => {
  engine = new GraphEngine(chartEl.value, {
    getData: () => g,
    onNodeClick: handleNodeClick,
    onNodeHover: handleHover,
    onDecrypt: handleDecrypt,
    prefersReduced,
  })
  engine.setTheme(theme.value === 'light')
  engine.fit()
  engine.start()

  resizeObs = new ResizeObserver(() => engine?.resize())
  resizeObs.observe(chartEl.value)
})

// 过滤状态变化 → 出生动画重置（引擎常驻 rAF 自动绘最新）
watch(
  () => [g.activeFactions.value, g.activeTypes.value, g.personSel.value, g.keyword.value, g.ep.value, g.sortBy.value],
  () => {
    engine?.appear.clear()
    engine?.requestRender()
  }
)
watch(theme, (v) => engine?.setTheme(v === 'light'))
watch(layoutMode, () => {})

const briefEl = ref(null)
const hoverEl = ref(null)
// 洞察面板：共同联系人 / 到风筝的最短链路
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

onBeforeUnmount(() => {
  g.stopEraPlay()
  engine?.dispose()
  resizeObs?.disconnect()
  briefType?.kill?.()
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
        <div class="absolute top-3 left-3 font-mono text-[10px] tracking-[0.25em] text-[#555048] pointer-events-none">KITE-MAP · 滚轮/双指缩放 · 拖拽平移 · 点击节点查看档案</div>

        <!-- 统计条 -->
        <div class="absolute top-3 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.15em] text-[#8a8275] pointer-events-none bg-black/40 border border-[#2a2520] px-3 py-1 hidden md:block">
          {{ g.stats.value.nodes }} 节点 · {{ g.stats.value.edges }} 连线 · {{ g.stats.value.factions }} 阵营 · 核心：{{ g.stats.value.top }}
        </div>

        <!-- 顶部工具条 -->
        <div class="absolute top-3 right-3 z-10 flex gap-1.5 flex-wrap justify-end max-w-[62%]">
          <button
            class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors"
            :class="decryptMode ? 'border-[#9d2235] text-[#d8a0a8] bg-[#9d2235]/15' : 'border-[#2a2520] bg-[#0e0e0e]/85 text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235]'"
            @click="toggleDecrypt"
          >
            解密模式{{ decryptMode ? ` ${decryptedCount}/30` : '' }}
          </button>
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
            @click="toggleLayout"
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
            最短路径：{{ pathResult.ids.map((id) => g.charMap[id]?.name || id).join(' → ') }} · {{ pathResult.hops }} 跳
          </template>
          <template v-else>两节点在当前图谱中不连通</template>
        </div>
        <div
          v-if="pathMode && pathStart"
          class="absolute top-12 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] tracking-[0.15em] px-3 py-1.5 border border-[#d8a0a8] bg-[#0e0e0e]/90 text-[#d8a0a8] whitespace-nowrap"
        >
          起点：{{ g.charMap[pathStart]?.name }} — 请点击终点
        </div>

        <!-- 悬停电报条（打字机） -->
        <div v-if="hoverNodeId" class="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] tracking-[0.2em] text-[#d8a0a8] bg-black/60 border border-[#9d2235]/40 px-4 py-1.5 whitespace-nowrap max-w-[90%] overflow-hidden text-ellipsis pointer-events-none">
          <span ref="hoverEl">{{ hoverSummary }}</span>
        </div>

        <!-- 解密进度条 -->
        <div v-if="decryptMode" class="absolute top-12 left-3 z-10 font-mono text-[10px] tracking-[0.15em] text-[#8a8275] bg-black/50 border border-[#2a2520] px-3 py-1.5">
          已解密 {{ decryptedCount }}/30 · 秘密线索 {{ secretFound }}/{{ secretTotal }}
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
              :class="g.activeTypes.value.has(k) ? 'text-[#8a8275]' : 'text-[#3a352c]'"
              @click="toggleType(k)"
            >
              <span class="w-3.5 h-[2px]" :style="{ background: m.color, opacity: g.activeTypes.value.has(k) ? 1 : 0.25 }"></span>
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- 时间轴：集数演化 -->
        <div class="absolute bottom-3 right-3 z-10 flex items-center gap-2.5 bg-[#0e0e0e]/85 border border-[#2a2520] px-3 py-1.5">
          <button class="text-[#8a8275] hover:text-[#e8dcc8] transition-colors" :aria-label="g.epPlaying.value ? '暂停演化' : '播放演化'" @click="g.toggleEraPlay()">
            <Pause v-if="g.epPlaying.value" :size="13" />
            <Play v-else :size="13" />
          </button>
          <input
            type="range"
            min="1"
            max="46"
            step="1"
            v-model.number="g.ep.value"
            class="w-32 md:w-44 accent-[#9d2235]"
            :aria-label="`剧情集数 ${g.ep.value}`"
          />
          <span class="font-mono text-[10px] tracking-[0.15em] text-[#8a8275] w-[74px]">EP {{ String(g.ep.value).padStart(2, '0') }}/46</span>
        </div>
      </div>
      <!-- 侧边栏 -->
      <aside class="lg:w-[300px] glass border-t lg:border-t-0 lg:border-l border-[#2a2520] p-5 overflow-y-auto shrink-0">
        <div class="relative mb-5">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8275]" />
          <input v-model="g.keyword.value" class="k-input w-full !pl-9" placeholder="搜索人物 / 代号……（回车跳转）" @keydown.enter="onSearchEnter" />
        </div>
        <div class="mb-2 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">阵营筛选</div>
        <div class="grid grid-cols-2 gap-1.5 mb-6">
          <label v-for="(v, k) in FACTION" :key="k" class="flex items-center gap-2 text-[12px] cursor-pointer select-none"
            :class="g.activeFactions.value.has(k) ? 'text-[#e8dcc8]' : 'text-[#555048]'">
            <span class="w-3.5 h-3.5 border grid place-items-center transition-colors"
              :style="{ borderColor: v.color, background: g.activeFactions.value.has(k) ? v.color : 'transparent' }">
              <span v-if="g.activeFactions.value.has(k)" class="text-[9px] text-[#e8dcc8]">✓</span>
            </span>
            {{ v.label }}
            <input type="checkbox" class="hidden" :checked="g.activeFactions.value.has(k)" @change="toggleFaction(k)" />
          </label>
        </div>
        <div class="mb-2 mt-5 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">排序方式</div>
        <div class="flex gap-1 mb-5">
          <button
            v-for="s in SORTS"
            :key="s.id"
            class="flex-1 text-[11px] py-1.5 border transition-colors"
            :class="g.sortBy.value === s.id ? 'border-[#9d2235] text-[#e8dcc8] bg-[#9d2235]/10' : 'border-[#2a2520] text-[#555048] hover:border-[#9d2235]/60 hover:text-[#8a8275]'"
            @click="g.sortBy.value = s.id"
          >
            {{ s.label }}
          </button>
        </div>
        <div class="mb-2 flex items-center justify-between">
          <span class="font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">人物索引（{{ g.sortedList.value.length }}）</span>
          <div class="flex gap-3">
            <button class="text-[11px] tracking-[0.1em] text-[#8a8275] hover:text-[#e8dcc8]" @click="selectAllPeople">全选</button>
            <button class="text-[11px] tracking-[0.1em] text-[#8a8275] hover:text-[#e8dcc8]" @click="selectNonePeople">全不选</button>
          </div>
        </div>
        <div class="mb-1 font-mono text-[10px] tracking-[0.15em] text-[#555048]">{{ pathMode ? '路径模式：点击人物行选择起点 → 终点' : '点击名字行 = 勾选/取消 · 点击右侧详情图标查看档案' }}</div>
        <div class="space-y-0.5">
          <div
            v-for="(n, i) in g.sortedList.value"
            :key="n.id"
            class="w-full flex items-center gap-2.5 px-2.5 py-2 text-[12px] border-l-2 cursor-pointer select-none transition-colors"
            :class="selected?.id === n.id ? 'border-[#9d2235] bg-[#161616]' : i === kbIndex && focusNodeId === n.id ? 'border-[#b8860b] bg-[#161616]' : pathMode && pathStart === n.id ? 'border-[#d8a0a8] bg-[#161616]' : 'border-transparent hover:bg-[#161616]'"
            @click="onRowClick(n)"
          >
            <span
              class="w-3.5 h-3.5 border grid place-items-center shrink-0 transition-colors"
              :style="{ borderColor: FACTION[n.faction].color, background: g.personSel.value.has(n.id) ? FACTION[n.faction].color : 'transparent' }"
            >
              <span v-if="g.personSel.value.has(n.id)" class="text-[9px] text-[#e8dcc8]">✓</span>
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

            <!-- 关系网络洞察 -->
            <div v-if="insight" class="mt-6 border border-[#2a2520] bg-[#0b0b0b] p-4">
              <div class="font-mono text-[10px] tracking-[0.3em] text-[#b8860b]">关系网络 · INSIGHT</div>
              <div class="mt-3 space-y-2.5 text-[12px] leading-5">
                <div v-if="insight.toKite" class="text-[#8a8275]">
                  至「风筝」最短链路：
                  <span class="text-[#b8860b]">{{ insight.toKite.ids.map((x) => g.charMap[x]?.name || x).join(' → ') }}</span>
                  <span class="text-[#555048]">（{{ insight.toKite.hops }} 跳）</span>
                </div>
                <div v-if="insight.toShadow" class="text-[#8a8275]">
                  至「影子」最短链路：
                  <span class="text-[#d8a0a8]">{{ insight.toShadow.ids.map((x) => g.charMap[x]?.name || x).join(' → ') }}</span>
                  <span class="text-[#555048]">（{{ insight.toShadow.hops }} 跳）</span>
                </div>
                <div v-if="insight.common.length" class="text-[#8a8275]">
                  与风筝的共同联系人：<span class="text-[#e8dcc8]">{{ insight.common.map((x) => g.charMap[x]?.name || x).join('、') }}</span>
                </div>
                <div class="text-[#8a8275]">
                  阵营分布：
                  <span v-for="(cnt, f) in insight.spread" :key="f" class="mr-2 inline-flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full" :style="{ background: FACTION[f].color }"></span>{{ FACTION[f].label }} {{ cnt }}
                  </span>
                </div>
              </div>
            </div>
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
