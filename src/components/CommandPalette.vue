<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Moon, Sun, Shuffle, Star, CornerDownLeft } from 'lucide-vue-next'
import { searchIndex, searchCounts } from '@/utils/search-index'
import { theme, toggleTheme } from '@/store/app'
import { favoriteCount } from '@/store/library'

/**
 * 全局命令面板（X · Cmd/Ctrl+K）
 * 输入即搜全站（复用 search-index）+ 命令（主题/随机/收藏）
 * a11y：Escape 关闭、上下键选择、Enter 执行、aria 完整
 */
const router = useRouter()
const open = ref(false)
const keyword = ref('')
const idx = ref(0)
const input = ref(null)

const COMMANDS = computed(() => [
  { id: 'theme', label: theme.value === 'dark' ? '切换到浅色主题' : '切换到深色主题', icon: theme.value === 'dark' ? Sun : Moon, run: () => toggleTheme() },
  {
    id: 'random',
    label: '随机潜入一处档案',
    icon: Shuffle,
    run: () => {
      const routes = ['/graph', '/characters', '/episodes', '/timeline', '/architecture', '/history', '/scenes']
      router.push(routes[Math.floor(Math.random() * routes.length)] + '?ref=random')
    },
  },
  { id: 'library', label: `打开收藏夹（${favoriteCount()}）`, icon: Star, run: () => router.push('/library') },
])

const results = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return COMMANDS.value
  const hits = searchIndex(kw).slice(0, 8)
  return [...COMMANDS.value.filter((c) => c.label.toLowerCase().includes(kw)), ...hits]
})

function run(item) {
  close()
  if (item.run) item.run()
  else router.push(item.to)
}

function onKey(e) {
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowDown') {
    e.preventDefault()
    idx.value = (idx.value + 1) % results.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    idx.value = (idx.value - 1 + results.value.length) % results.value.length
  } else if (e.key === 'Enter') {
    if (results.value[idx.value]) run(results.value[idx.value])
  }
}

function close() {
  open.value = false
  keyword.value = ''
}

function onGlobalKey(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    open.value = !open.value
    if (open.value) nextTick(() => input.value?.focus())
  }
}

onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[95] flex items-start justify-center pt-[16vh] px-4" role="dialog" aria-modal="true" aria-label="命令面板">
      <div class="absolute inset-0 bg-black/60" @click="close"></div>
      <div class="relative w-full max-w-[540px] bg-[#0e0e0e] border border-[#2a2520] shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
        <!-- 输入行 -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-[#2a2520]">
          <Search :size="16" class="text-[#8a8275]" />
          <input
            ref="input"
            v-model="keyword"
            class="flex-1 bg-transparent outline-none text-[14px] text-[#e8dcc8] placeholder:text-[#555048]"
            placeholder="搜索人物 / 剧集 / 台词…… 或输入命令"
            @keydown="onKey"
          />
          <span class="font-mono text-[9px] tracking-[0.2em] text-[#555048]">ESC</span>
        </div>
        <!-- 结果列表 -->
        <ul class="max-h-[46vh] overflow-y-auto py-2" role="listbox">
          <li v-for="(r, i) in results" :key="r.id || r.type + r.title" role="option" :aria-selected="i === idx">
            <button
              class="w-full text-left flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors"
              :class="i === idx ? 'bg-[#161616] text-[#e8dcc8] border-l-2 border-[#9d2235]' : 'text-[#8a8275] border-l-2 border-transparent'"
              @mouseenter="idx = i"
              @click="run(r)"
            >
              <span v-if="r.icon" class="shrink-0 text-[#b8860b]"><component :is="r.icon" :size="14" /></span>
              <span v-else class="shrink-0 font-mono text-[9px] tracking-[0.2em] text-[#9d2235] w-10">{{ r.type }}</span>
              <span class="flex-1 min-w-0 truncate">{{ r.title }}</span>
              <span v-if="r.sub" class="hidden md:inline text-[10px] text-[#555048] truncate max-w-[180px]">{{ r.sub }}</span>
              <CornerDownLeft v-if="i === idx" :size="12" class="shrink-0 text-[#555048]" />
            </button>
          </li>
          <li v-if="!results.length" class="px-4 py-8 text-center text-[12px] tracking-[0.2em] text-[#555048]">没有匹配的档案</li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>
