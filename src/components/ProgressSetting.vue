<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { Settings, X, Check } from 'lucide-vue-next'
import { appState } from '@/store/app'
import episodes from '@/data/episodes.json'

const open = ref(false)
const panel = ref(null)
const total = computed(() => episodes.length)
const watchedCount = computed(() => appState.state.watched.size)
const percent = computed(() => Math.round((watchedCount.value / total.value) * 100))

let barTween = null

function toggle() {
  open.value = !open.value
  if (open.value) {
    gsap.fromTo(panel.value, { x: 320, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
    barTween = gsap.fromTo('.progress-fill', { width: '0%' }, { width: percent.value + '%', duration: 0.8, ease: 'power2.out', delay: 0.2 })
  }
}

onBeforeUnmount(() => barTween?.kill())
</script>

<template>
  <!-- 右上角圆形进度设置按钮 -->
  <button
    class="fixed top-16 md:top-20 right-5 md:right-8 z-[75] w-10 h-10 rounded-full border border-[#2a2520] bg-[#0e0e0e]/80 backdrop-blur grid place-items-center text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#b91c1c] hover:rotate-180 transition-all duration-500 shadow-[0_0_18px_rgba(157,34,53,0.15)]"
    aria-label="观剧进度设置"
    @click="toggle"
  >
    <Settings :size="16" />
  </button>

  <!-- 玻璃拟态面板：从右上角滑出 -->
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[88]" @click.self="open = false">
      <div ref="panel" class="glass absolute top-20 right-4 md:right-8 w-[300px] p-5 shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <span class="file-label !border-[#b91c1c]">观剧进度 · 档案解锁</span>
          <button class="text-[#555048] hover:text-[#e8dcc8]" @click="open = false"><X :size="15" /></button>
        </div>
        <div class="font-mono text-[11px] tracking-[0.2em] text-[#8a8275] mb-2">
          已解密 {{ watchedCount }} / {{ total }} 集
        </div>
        <div class="h-[6px] bg-[#1a1a1a] border border-[#2a2520] mb-4 overflow-hidden">
          <div class="progress-fill h-full" style="background: linear-gradient(90deg,#8f1616,#b91c1c,#8c4a2f);"></div>
        </div>
        <div class="grid grid-cols-10 gap-1 max-h-[180px] overflow-y-auto mb-4">
          <button
            v-for="ep in episodes"
            :key="ep.id"
            class="aspect-square text-[9px] font-mono grid place-items-center border transition-colors"
            :class="appState.isWatched(ep.id) ? 'bg-[#b91c1c] border-[#b91c1c] text-[#f0e6d2]' : 'bg-[#141414] border-[#2a2520] text-[#555048] hover:border-[#b91c1c]'"
            :title="`第${ep.id}集 ${ep.title}`"
            @click="appState.toggleWatch(ep.id)"
          >
            <Check v-if="appState.isWatched(ep.id)" :size="10" />
            <span v-else>{{ ep.id }}</span>
          </button>
        </div>
        <div class="flex gap-2">
          <button class="flex-1 text-[11px] tracking-[0.15em] py-2 border border-[#2a2520] text-[#8a8275] hover:border-[#b91c1c] hover:text-[#e8dcc8] transition-colors" @click="appState.markRange(1, 46)">标记全部</button>
          <button class="flex-1 text-[11px] tracking-[0.15em] py-2 border border-[#2a2520] text-[#8a8275] hover:border-[#b91c1c] hover:text-[#e8dcc8] transition-colors" @click="appState.clear()">清空</button>
        </div>
        <p class="mt-3 text-[10px] leading-4 text-[#555048]">标记观剧进度后，角色档案的“结局”区块与时间线大结局将自动解锁。</p>
      </div>
    </div>
  </Teleport>
</template>
