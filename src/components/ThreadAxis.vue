<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Star, Sun, Moon, Languages, Palette } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'
import { theme, toggleTheme, commandOpen } from '@/store/app'
import { LENSES, LENS_LABEL, VIEWPOINTS } from '@/store/universe'

/**
 * ThreadAxis —— 线轴导航（第一套皮肤「一线宇宙」）
 * 替代 NavBar：常驻底部时间轴（1927-1980）+ 透镜切换 + 图标簇
 * 拖动/滚轮/方向键 = 年代间飞行（eraViewport 驱动）
 */
const props = defineProps({
  universe: { type: Object, required: true },
})
const router = useRouter()
const { t, locale } = useI18n()


const YEARS = computed(() => {
  const [a, b] = props.universe.state.eraViewport
  const out = []
  for (let y = 1927; y <= 1980; y += 4) out.push(y)
  return out
})


const trackRef = ref(null)
let dragging = false
function eraFromEvent(e) {
  const rect = trackRef.value.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  return Math.round(1927 + ratio * (1980 - 1927))
}
function onTrackDown(e) {
  dragging = true
  props.universe.setEra(eraFromEvent(e), Math.min(1980, eraFromEvent(e) + 12))
}
function onTrackMove(e) {
  if (dragging) props.universe.setEra(eraFromEvent(e), Math.min(1980, eraFromEvent(e) + 12))
}
function onTrackUp() {
  dragging = false
}
function onTrackWheel(e) {
  e.preventDefault()
  const [a, b] = props.universe.state.eraViewport
  const delta = e.deltaY > 0 ? 2 : -2
  props.universe.setEra(Math.max(1927, Math.min(1980, a + delta)), Math.max(1927, Math.min(1980, b + delta)))
}
function onTrackKey(e) {
  const [a, b] = props.universe.state.eraViewport
  const step = e.shiftKey ? 10 : 2
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    e.preventDefault()
    props.universe.setEra(Math.min(1980, a + step), Math.min(1980, b + step))
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    e.preventDefault()
    props.universe.setEra(Math.max(1927, a - step), Math.max(1927, b - step))
  }
}

function setEraYear(y) {
  props.universe.setEra(y, Math.min(1980, y + 12))
}
function toggleLang() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh')
  props.universe.state.lang = locale.value
}

const viewSel = ref('all')
function onViewChange() {
  props.universe.setViewpoint(viewSel.value)
}
const skinId = ref('')
try {
  skinId.value = localStorage.getItem('kite-skin') || 'thread-universe'
} catch (e) {
  skinId.value = 'thread-universe'
}
const SKINS = ['thread-universe', 'demo-contrast']
function toggleSkin() {
  const i = SKINS.indexOf(skinId.value)
  skinId.value = SKINS[(i + 1) % SKINS.length]
  try {
    localStorage.setItem('kite-skin', skinId.value)
  } catch (e) { /* ignore */ }
  document.documentElement.setAttribute('data-skin', skinId.value)
}
function goLibrary() {
  router.push('/library')
}
</script>

<template>
  <div class="thread-axis fixed bottom-0 inset-x-0 z-[60] on-media" :data-theme="theme" role="navigation" aria-label="一线宇宙导航">
    <div class="bg-[var(--axis-bg-glass)] backdrop-blur border-t border-[var(--axis-line)] px-3 md:px-6 py-2.5">
      <!-- 透镜切换（非路由跳转） -->
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="透镜切换">
          <button
            v-for="l in LENSES"
            :key="l"
            role="tab"
            :aria-selected="universe.state.currentLens === l"
            class="px-3 py-1 border font-mono text-[10px] tracking-[0.2em] whitespace-nowrap transition-colors m-focus-ring"
            :class="universe.state.currentLens === l ? 'border-[var(--axis-accent)] text-[var(--axis-text-strong)] bg-[var(--axis-accent)]/15' : 'border-[var(--axis-line)] text-[var(--axis-text)] hover:border-[var(--axis-accent)]'"
            @click="universe.setLens(l)"
          >
            {{ LENS_LABEL[l] }}
          </button>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="w-8 h-8 grid place-items-center text-[var(--axis-text)] hover:text-[var(--axis-text-strong)] hover:border-[var(--axis-accent)] border border-transparent transition-colors m-focus-ring" aria-label="线索检索 (Cmd+K)" title="线索检索" @click="commandOpen = true"><Search :size="14" /></button>
          <button class="w-8 h-8 grid place-items-center text-[var(--axis-text)] hover:text-[var(--axis-text-strong)] hover:border-[var(--axis-accent)] border border-transparent transition-colors m-focus-ring" aria-label="收藏的线索" title="收藏的线索" @click="goLibrary"><Star :size="14" /></button>
          <button class="w-8 h-8 grid place-items-center text-[var(--axis-text)] hover:text-[var(--axis-text-strong)] hover:border-[var(--axis-accent)] border border-transparent transition-colors m-focus-ring" :aria-label="locale === 'zh' ? 'English' : '中文'" title="语言" @click="toggleLang"><Languages :size="14" /><span class="sr-only">{{ locale }}</span></button>
          <button class="w-8 h-8 grid place-items-center text-[var(--axis-text)] hover:text-[var(--axis-text-strong)] hover:border-[var(--axis-accent)] border border-transparent transition-colors m-focus-ring" :aria-label="`皮肤：${skinId === 'thread-universe' ? '一线宇宙' : '暗房显影'}`" :title="`皮肤：${skinId === 'thread-universe' ? '一线宇宙' : '暗房显影'}`" @click="toggleSkin"><Palette :size="14" /></button>
          <button class="w-8 h-8 grid place-items-center text-[var(--axis-text)] hover:text-[var(--axis-text-strong)] hover:border-[var(--axis-accent)] border border-transparent transition-colors m-focus-ring" :aria-label="theme === 'dark' ? '昼' : '夜'" title="主题" @click="toggleTheme"><Sun v-if="theme === 'dark'" :size="14" /><Moon v-else :size="14" /></button>
        </div>
      </div>
      <!-- 多视角叙事 -->
      <select class="hidden md:block px-2 py-1 border font-mono text-[10px] tracking-[0.15em] bg-[var(--axis-bg-glass)] text-[var(--axis-text)] border-[var(--axis-line)] m-focus-ring" aria-label="视角" v-model="viewSel" @change="onViewChange">
        <option v-for="v in VIEWPOINTS" :key="v.id" :value="v.id">{{ v.label }}</option>
      </select>
      <!-- 年代线轴 -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1">
        <span class="font-mono text-[9px] tracking-[0.2em] text-[var(--axis-text-dim)] shrink-0 w-10">{{ universe.state.eraViewport[0] }}</span>
        <div ref="trackRef" class="relative flex-1 h-6 min-w-[200px] cursor-ew-resize m-focus-ring" tabindex="0" role="slider" :aria-valuenow="universe.state.eraViewport[0]" aria-valuemin="1927" aria-valuemax="1980" aria-label="年代视窗（可拖拽/滚轮/方向键）" @pointerdown="onTrackDown" @pointermove="onTrackMove" @pointerup="onTrackUp" @pointerleave="onTrackUp" @wheel.prevent="onTrackWheel" @keydown="onTrackKey">
          <!-- 朱砂刻度 -->
          <div class="absolute inset-x-0 top-1/2 h-px bg-[var(--axis-line)]"></div>
          <!-- 视窗高亮区：当前年代范围（朱砂淡染） -->
          <div class="absolute top-1/2 -translate-y-1/2 h-3.5 rounded-sm bg-[var(--axis-accent)]/15 border border-[var(--axis-accent)]/40" :style="{ left: ((universe.state.eraViewport[0] - 1927) / 53 * 100) + '%', width: ((universe.state.eraViewport[1] - universe.state.eraViewport[0]) / 53 * 100) + '%' }"></div>
          <button
            v-for="y in YEARS"
            :key="y"
            class="absolute top-1/2 -translate-y-1/2 w-[3px] h-3 transition-colors m-focus-ring"
            :class="y >= universe.state.eraViewport[0] && y <= universe.state.eraViewport[1] ? 'var(--axis-accent)' : 'var(--axis-tick)'"
            :aria-label="String(y)"
            :title="String(y)"
            @click="setEraYear(y)"
          ></button>
        </div>
        <span class="font-mono text-[9px] tracking-[0.2em] text-[var(--axis-text-dim)] shrink-0 w-10">{{ universe.state.eraViewport[1] }}</span>
        <span class="hidden md:inline font-mono text-[9px] tracking-[0.15em] text-[var(--axis-text-dim)] shrink-0 ml-2">拖动 / 滚轮 / ←→ 穿越年代</span>
      </div>
    </div>
  </div>
</template>
