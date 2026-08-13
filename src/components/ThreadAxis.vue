<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Star, Sun, Moon, Languages } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'
import { theme, toggleTheme } from '@/store/app'
import { LENSES, LENS_LABEL } from '@/store/universe'

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
const eraInput = ref('')

const YEARS = computed(() => {
  const [a, b] = props.universe.state.eraViewport
  const out = []
  for (let y = 1927; y <= 1980; y += 4) out.push(y)
  return out
})

function setEraYear(y) {
  props.universe.setEra(y, Math.min(1980, y + 12))
  eraInput.value = String(y)
}
function toggleLang() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh')
  props.universe.state.lang = locale.value
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
    <div class="bg-[#0e0e0e]/92 backdrop-blur border-t border-[#2a2520] px-3 md:px-6 py-2.5">
      <!-- 透镜切换（非路由跳转） -->
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex gap-1.5 overflow-x-auto" role="tablist" aria-label="透镜切换">
          <button
            v-for="l in LENSES"
            :key="l"
            role="tab"
            :aria-selected="universe.state.currentLens === l"
            class="px-3 py-1 border font-mono text-[10px] tracking-[0.2em] whitespace-nowrap transition-colors m-focus-ring"
            :class="universe.state.currentLens === l ? 'border-[#b91c1c] text-[#ece3d2] bg-[#b91c1c]/15' : 'border-[#2a2520] text-[#a89f8e] hover:border-[#b91c1c]'"
            @click="universe.setLens(l)"
          >
            {{ LENS_LABEL[l] }}
          </button>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="w-8 h-8 grid place-items-center text-[#a89f8e] hover:text-[#ece3d2] hover:border-[#b91c1c] border border-transparent transition-colors m-focus-ring" aria-label="线索检索 (Cmd+K)" title="线索检索" @click="router.push('/')"><Search :size="14" /></button>
          <button class="w-8 h-8 grid place-items-center text-[#a89f8e] hover:text-[#ece3d2] hover:border-[#b91c1c] border border-transparent transition-colors m-focus-ring" aria-label="收藏的线索" title="收藏的线索" @click="goLibrary"><Star :size="14" /></button>
          <button class="w-8 h-8 grid place-items-center text-[#a89f8e] hover:text-[#ece3d2] hover:border-[#b91c1c] border border-transparent transition-colors m-focus-ring" :aria-label="locale === 'zh' ? 'English' : '中文'" title="语言" @click="toggleLang"><Languages :size="14" /><span class="sr-only">{{ locale }}</span></button>
          <button class="w-8 h-8 grid place-items-center text-[#a89f8e] hover:text-[#ece3d2] hover:border-[#b91c1c] border border-transparent transition-colors m-focus-ring" :aria-label="`皮肤：${skinId === 'thread-universe' ? '一线宇宙' : '暗房显影'}`" :title="`皮肤：${skinId === 'thread-universe' ? '一线宇宙' : '暗房显影'}`" @click="toggleSkin"><Palette :size="14" /></button>
          <button class="w-8 h-8 grid place-items-center text-[#a89f8e] hover:text-[#ece3d2] hover:border-[#b91c1c] border border-transparent transition-colors m-focus-ring" :aria-label="theme === 'dark' ? '昼' : '夜'" title="主题" @click="toggleTheme"><Sun v-if="theme === 'dark'" :size="14" /><Moon v-else :size="14" /></button>
        </div>
      </div>
      <!-- 年代线轴 -->
      <div class="flex items-center gap-1 overflow-x-auto pb-1" role="slider" :aria-label="`年代视窗 ${universe.state.eraViewport.join('—')}`" aria-valuemin="1927" aria-valuemax="1980" :aria-valuenow="universe.state.eraViewport[0]">
        <span class="font-mono text-[9px] tracking-[0.2em] text-[#8f897c] shrink-0 w-10">{{ universe.state.eraViewport[0] }}</span>
        <div class="relative flex-1 h-6 min-w-[200px]">
          <!-- 朱砂刻度 -->
          <div class="absolute inset-x-0 top-1/2 h-px bg-[#2a2520]"></div>
          <button
            v-for="y in YEARS"
            :key="y"
            class="absolute top-1/2 -translate-y-1/2 w-[3px] h-3 transition-colors m-focus-ring"
            :class="y >= universe.state.eraViewport[0] && y <= universe.state.eraViewport[1] ? 'bg-[#b91c1c]' : 'bg-[#3a352c]'"
            :aria-label="String(y)"
            :title="String(y)"
            @click="setEraYear(y)"
          ></button>
        </div>
        <span class="font-mono text-[9px] tracking-[0.2em] text-[#8f897c] shrink-0 w-10">{{ universe.state.eraViewport[1] }}</span>
      </div>
    </div>
  </div>
</template>
