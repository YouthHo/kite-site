<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { Search, X, Users, Clapperboard, FileText, Quote, Film, ArrowRight } from 'lucide-vue-next'
import { searchOpen } from '@/store/app'
import { searchIndex, searchCounts } from '@/utils/search-index'

const router = useRouter()
const keyword = ref('')
const tab = ref('all')
const panel = ref(null)
const input = ref(null)

const TABS = [
  { id: 'all', label: '全部', icon: Search },
  { id: 'character', label: '人物', icon: Users },
  { id: 'actor', label: '演员', icon: Clapperboard },
  { id: 'episode', label: '剧集', icon: FileText },
  { id: 'quote', label: '台词', icon: Quote },
  { id: 'scene', label: '名场面', icon: Film },
]

const results = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return []
  const all = searchIndex(kw)
  if (tab.value === 'all') return all.slice(0, 24)
  return all.filter((r) => r.type === tab.value).slice(0, 24)
})
const counts = computed(() => (keyword.value.trim() ? searchCounts(keyword.value) : null))

let openTween = null
watch(searchOpen, async (v) => {
  if (v) {
    await nextTick()
    keyword.value = ''
    tab.value = 'all'
    gsap.fromTo('.search-panel', { y: -60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' })
    gsap.fromTo('.search-mask', { opacity: 0 }, { opacity: 1, duration: 0.35 })
    setTimeout(() => input.value?.focus(), 350)
  } else {
    gsap.to('.search-panel', { y: -60, opacity: 0, duration: 0.3, ease: 'power2.in' })
    gsap.to('.search-mask', { opacity: 0, duration: 0.3 })
  }
})

function close() {
  searchOpen.value = false
}
function go(r) {
  close()
  router.push(r.to)
}
function onKey(e) {
  if (e.key === 'Escape') close()
  if (e.key === 'Enter' && results.value.length) go(results.value[0])
}
onBeforeUnmount(() => openTween?.kill())
</script>

<template>
  <Teleport to="body">
    <div v-if="searchOpen" class="fixed inset-0 z-[95]">
      <div class="search-mask absolute inset-0 bg-black/80 backdrop-blur-md" @click="close"></div>
      <div ref="panel" class="search-panel relative max-w-2xl mx-auto mt-[12vh] mx-4 px-2">
        <div class="glass p-5 md:p-7">
          <div class="flex items-center gap-3 border-b border-[#2a2520] pb-4">
            <Search :size="18" class="text-[#b91c1c]" />
            <input
              ref="input"
              v-model="keyword"
              class="flex-1 bg-transparent outline-none text-[15px] text-[#e8dcc8] placeholder:text-[#8f897c] tracking-wider"
              placeholder="搜索人物 / 演员 / 剧集 / 台词 / 名场面……"
              @keydown="onKey"
            />
            <button class="text-[#a89f8e] hover:text-[#e8dcc8]" @click="close"><X :size="18" /></button>
          </div>
          <!-- 分类标签：下划线滑动 -->
          <div class="flex gap-1 mt-4 overflow-x-auto">
            <button
              v-for="t in TABS"
              :key="t.id"
              class="shrink-0 px-3 py-1.5 text-[12px] tracking-[0.15em] border-b-2 transition-colors"
              :class="tab === t.id ? 'border-[#b91c1c] text-[#e8dcc8]' : 'border-transparent text-[#8f897c] hover:text-[#a89f8e]'"
              @click="tab = t.id"
            >
              <component :is="t.icon" :size="12" class="inline mr-1" />{{ t.label }}
            </button>
          </div>
          <!-- 结果列表 -->
          <div class="mt-3 max-h-[46vh] overflow-y-auto">
            <p v-if="keyword && !results.length" class="py-8 text-center text-[12px] tracking-[0.2em] text-[#8f897c]">没有匹配的档案</p>
            <p v-else-if="!keyword" class="py-8 text-center font-mono text-[11px] tracking-[0.3em] text-[#8f897c]">输入关键词开始解密……</p>
            <button
              v-for="(r, i) in results"
              :key="r.type + r.title + i"
              class="w-full text-left flex items-center gap-3 px-3 py-2.5 border-l-2 border-transparent hover:border-[#b91c1c] hover:bg-[#161616] transition-colors"
              @click="go(r)"
            >
              <span class="font-mono text-[10px] text-[#b91c1c] w-14 shrink-0">{{ { character: '人物', actor: '演员', episode: '剧集', quote: '台词', scene: '场面' }[r.type] }}</span>
              <span class="flex-1 min-w-0">
                <span class="block text-[13px] text-[#e8dcc8] truncate">{{ r.title }}</span>
                <span class="block text-[11px] text-[#8f897c] truncate">{{ r.sub }}</span>
              </span>
              <ArrowRight :size="14" class="text-[#8f897c]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
