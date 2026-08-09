<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ChevronDown } from 'lucide-vue-next'
import history from '@/data/history.json'
import { pageEnter, prefersReduced } from '@/utils/anim'

const activeTab = ref('junton-history')
const expanded = ref(null)
let crossTween = null

const currentCat = () => history.find((h) => h.id === activeTab.value)

function switchTab(id) {
  if (id === activeTab.value) return
  activeTab.value = id
  expanded.value = null
  nextTick(() => {
    if (prefersReduced) return
    crossTween?.kill()
    crossTween = gsap.fromTo('.hist-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.09, ease: 'power3.out' })
  })
}

function toggleExpand(id) {
  expanded.value = expanded.value === id ? null : id
  nextTick(() => {
    if (prefersReduced || !expanded.value) return
    gsap.fromTo('.hist-expand', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
  })
}

onMounted(async () => {
  await nextTick()
  pageEnter(document.querySelector('.hist-page'))
})
onBeforeUnmount(() => crossTween?.kill())
</script>

<template>
  <div class="hist-page page-wrap">
    <div class="mb-8">
      <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]" data-enter>历史背景</h2>
      <div class="gold-line w-40 mt-3" data-enter></div>
      <p class="mt-3 font-mono text-[11px] tracking-[0.3em] text-[#8a8275]" data-enter>真实历史档案 · 四类分类 · 点击卡片展开</p>
    </div>

    <!-- 分类标签：仿档案分类签 -->
    <div class="flex flex-wrap gap-3 mb-10" data-enter>
      <button
        v-for="cat in history"
        :key="cat.id"
        class="px-5 py-2.5 border text-[13px] tracking-[0.2em] transition-all duration-300"
        :class="activeTab === cat.id ? 'border-[#9d2235] bg-[#9d2235]/10 text-[#e8dcc8] shadow-[0_0_16px_rgba(157,34,53,0.2)]' : 'border-[#2a2520] text-[#8a8275] hover:border-[#555048]'"
        @click="switchTab(cat.id)"
      >
        {{ cat.name }}
      </button>
    </div>

    <p class="mb-8 text-[13px] leading-7 text-[#8a8275] max-w-3xl" data-enter>{{ currentCat().desc }}</p>

    <!-- 旧纸卡片列表 -->
    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      <article
        v-for="card in currentCat().cards"
        :key="card.id"
        class="hist-card k-card archive-tape relative p-6 cursor-pointer"
        @click="toggleExpand(card.id)"
      >
        <!-- 边角磨损 -->
        <div class="absolute -top-px -left-px w-6 h-6 pointer-events-none" style="background: radial-gradient(circle at 0 0, #080808 40%, transparent 42%);"></div>
        <div class="absolute -bottom-px -right-px w-6 h-6 pointer-events-none" style="background: radial-gradient(circle at 100% 100%, #080808 40%, transparent 42%);"></div>

        <div class="font-mono text-[10px] tracking-[0.3em] text-[#b8860b]">{{ card.period }}</div>
        <h3 class="serif-title text-lg mt-2 text-[#e8dcc8]">{{ card.title }}</h3>
        <div class="red-line mt-3"></div>

        <div v-if="expanded === card.id" class="hist-expand mt-4">
          <div v-for="sec in card.body" :key="sec.h" class="mb-4">
            <h4 class="text-[14px] tracking-[0.1em] text-[#b8860b] mb-2">{{ sec.h }}</h4>
            <p class="text-[12.5px] leading-7 text-[#8a8275]">{{ sec.p }}</p>
          </div>
          <div class="mt-4 border-t border-[#2a2520] pt-3">
            <div class="font-mono text-[10px] tracking-[0.25em] text-[#555048] mb-2">重要术语</div>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in card.terms" :key="t.t" class="px-2.5 py-1 border border-[#9d2235]/50 text-[11px] text-[#d8a0a8]" :title="t.d">
                {{ t.t }}<span class="block font-mono text-[9px] text-[#555048] mt-0.5">{{ t.d }}</span>
              </span>
            </div>
          </div>
          <div v-if="card.image" class="mt-4 border border-[#2a2520] p-1.5 bg-[#0b0b0b]">
            <img :src="card.image" :alt="card.title" loading="lazy" class="w-full h-36 object-cover k-img" />
            <div class="font-mono text-[9px] tracking-[0.2em] text-[#555048] mt-1.5">图：占位图，替换为历史照片</div>
          </div>
        </div>

        <div v-else class="mt-3 flex items-center justify-between text-[11px] tracking-[0.2em] text-[#555048]">
          <span>{{ card.body.length }} 个章节 · {{ card.terms.length }} 个术语</span>
          <ChevronDown :size="14" />
        </div>
      </article>
    </div>
  </div>
</template>
