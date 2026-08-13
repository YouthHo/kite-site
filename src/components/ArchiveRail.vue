<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
import { X, Users, FileText, Film, Quote, Landmark, Library, Network, CalendarRange } from 'lucide-vue-next'
import characters from '@/data/characters.json'
import episodes from '@/data/episodes.json'
import scenes from '@/data/scenes.json'
import { favoritesList } from '@/store/library'
import { prefersReduced } from '@/utils/anim'

/**
 * 档案系统浮层（V · ArchiveRail）
 * 右侧滑出：按内容类型组织的全站索引 + 最近收藏 + 探索模式入口
 * 不新增路由，浮层实现
 */
const router = useRouter()
const open = ref(false)
const panel = ref(null)
let tween = null

const SECTIONS = [
  { key: 'graph', label: '关系图谱', icon: Network, to: '/graph' },
  { key: 'characters', label: '角色档案', icon: Users, to: '/characters', count: characters.length },
  { key: 'episodes', label: '分集剧情', icon: FileText, to: '/episodes', count: episodes.length },
  { key: 'scenes', label: '名场面', icon: Film, to: '/scenes', count: scenes.length },
  { key: 'library', label: '收藏夹', icon: Library, to: '/library' },
  { key: 'timeline', label: '时间线', icon: CalendarRange, to: '/timeline' },
  { key: 'cast', label: '演员', icon: Users, to: '/cast' },
  { key: 'history', label: '历史背景', icon: Landmark, to: '/history' },
]

const favCount = computed(() => favoritesList().length)

function toggle() {
  open.value = !open.value
  if (!panel.value) return
  if (open.value) {
    tween = gsap.fromTo(panel.value, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: 'power3.out' })
  } else {
    tween = gsap.to(panel.value, { xPercent: 100, duration: 0.35, ease: 'power2.in' })
  }
}

function go(to) {
  toggle()
  router.push(to)
}

function onKey(e) {
  if (e.key === 'Escape' && open.value) toggle()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  tween?.kill()
})

defineExpose({ toggle, open })
</script>

<template>
  <Teleport to="body">
    <!-- 触发按钮（右侧边缘常驻） -->
    <button
      class="fixed right-0 top-1/2 -translate-y-1/2 z-[70] px-1.5 py-3 border border-r-0 border-[#2a2520] bg-[var(--axis-bg-glass)] text-[#a89f8e] hover:text-[#e8dcc8] hover:border-[#b91c1c] transition-colors"
      style="writing-mode: vertical-rl; letter-spacing: 0.3em; font-size: 10px"
      :aria-label="open ? '关闭档案索引' : '打开档案索引'"
      @click="toggle"
    >
      档案索引
    </button>

    <!-- 遮罩 + 面板 -->
    <div v-if="open" class="fixed inset-0 z-[85]">
      <div class="absolute inset-0 bg-[var(--axis-bg-glass)]" @click="toggle"></div>
      <aside ref="panel" class="absolute right-0 top-0 bottom-0 w-[300px] max-w-[86vw] bg-[#0e0e0e] border-l border-[#2a2520] p-6 overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <div class="font-mono text-[10px] tracking-[0.35em] text-[#8c4a2f]">ARCHIVE INDEX</div>
          <button class="text-[#a89f8e] hover:text-[#e8dcc8]" aria-label="关闭档案索引" @click="toggle"><X :size="18" /></button>
        </div>

        <nav class="space-y-1" aria-label="档案索引">
          <button
            v-for="s in SECTIONS"
            :key="s.key"
            class="w-full flex items-center gap-3 px-3 py-2.5 text-[13px] tracking-[0.1em] text-[#a89f8e] hover:text-[#e8dcc8] hover:bg-[#161616] border-l-2 border-transparent hover:border-[#b91c1c] transition-colors text-left"
            @click="go(s.to)"
          >
            <component :is="s.icon" :size="15" class="shrink-0 text-[#b91c1c]" />
            <span class="flex-1">{{ s.label }}</span>
            <span v-if="s.count" class="font-mono text-[9px] text-[#8f897c]">{{ s.count }}</span>
          </button>
        </nav>

        <div class="mt-6 pt-4 border-t border-[#2a2520]">
          <div class="font-mono text-[9px] tracking-[0.3em] text-[#8f897c]">收藏 · {{ favCount }}</div>
          <p class="mt-2 text-[11px] leading-5 text-[#a89f8e]">按 <span class="text-[#8c4a2f]">Cmd/Ctrl+K</span> 打开命令面板，或点击内容卡片上的星标收藏档案。</p>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
