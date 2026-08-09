<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ChevronDown } from 'lucide-vue-next'
import history from '@/data/history.json'
import SealStamp from '@/components/SealStamp.vue'
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
  // 单选互斥：点开一张卡时，自动收起其他卡（当前已展开的卡再点一次则收起）
  const prev = expanded.value
  if (prev === id) {
    expanded.value = null
    return
  }
  if (prev) {
    const prevEl = document.querySelector(`[data-hist="${prev}"] .hist-expand`)
    if (prevEl) gsap.to(prevEl, { opacity: 0, y: 14, duration: 0.18, ease: 'power2.in' })
  }
  setTimeout(() => {
    expanded.value = id
    nextTick(() => {
      if (prefersReduced || !expanded.value) return
      gsap.fromTo('.hist-expand', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
    })
  }, prev ? 180 : 0)
}

onMounted(async () => {
  await nextTick()
  pageEnter(document.querySelector('.hist-page'))
})
onBeforeUnmount(() => crossTween?.kill())
</script>

<template>
  <div class="hist-page page-wrap">
    <div class="mb-10 flex items-center gap-5">
      <SealStamp :text="'历史\n档案'" />
      <div>
        <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]" data-enter>历史背景</h2>
        <div class="gold-line w-40 mt-3" data-enter></div>
        <p class="mt-3 font-mono text-[11px] tracking-[0.3em] text-[#8a8275]" data-enter>真实历史档案 · 四类分类 · 点击卡片展开</p>
      </div>
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

    <!-- 牛皮纸档案卡 -->
    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      <article
        v-for="card in currentCat().cards"
        :key="card.id"
        :data-hist="card.id"
        :aria-expanded="expanded === card.id ? 'true' : 'false'"
        class="hist-card kraft-card relative p-6 cursor-pointer transition-all duration-300"
        @click="toggleExpand(card.id)"
      >
        <!-- 边角磨损 -->
        <div class="absolute -top-px -left-px w-7 h-7 pointer-events-none" style="background: radial-gradient(circle at 0 0, #080808 42%, transparent 44%);"></div>
        <div class="absolute -bottom-px -right-px w-7 h-7 pointer-events-none" style="background: radial-gradient(circle at 100% 100%, #080808 42%, transparent 44%);"></div>
        <!-- 折角 -->
        <div class="absolute top-0 right-0 w-0 h-0 pointer-events-none" style="border-style: solid; border-width: 0 26px 26px 0; border-color: transparent rgba(120, 90, 50, 0.35) transparent transparent;"></div>

        <div class="kraft-period">{{ card.period }}</div>
        <h3 class="kraft-title mt-2">{{ card.title }}</h3>
        <div class="red-line mt-3"></div>

        <div v-if="expanded === card.id" class="hist-expand mt-4">
          <div v-for="sec in card.body" :key="sec.h" class="mb-4">
            <h4 class="text-[14px] tracking-[0.1em] text-[#6a3d1e] mb-2">{{ sec.h }}</h4>
            <p class="kraft-body text-[12.5px] leading-7">{{ sec.p }}</p>
          </div>
          <div class="mt-4 border-t pt-3" style="border-color: rgba(120,90,50,0.4)">
            <div class="kraft-period mb-2 !text-[#7a6a50]">重要术语</div>
            <div class="flex flex-wrap gap-2">
              <span v-for="t in card.terms" :key="t.t" class="kraft-term px-2.5 py-1 border text-[11px]" :title="t.d">
                {{ t.t }}<span class="block font-mono text-[9px] mt-0.5">{{ t.d }}</span>
              </span>
            </div>
          </div>
          <div v-if="card.image" class="mt-4 border p-1.5" style="border-color: rgba(120,90,50,0.5); background: #eadfc4;">
            <img :src="card.image" :alt="card.title" loading="lazy" class="w-full h-36 object-cover k-img" />
            <div class="font-mono text-[9px] tracking-[0.2em] text-[#7a6a50] mt-1.5">图：历史档案照片</div>
          </div>
        </div>

        <div v-else class="mt-3 flex items-center justify-between text-[11px] tracking-[0.2em] text-[#7a6a50]">
          <span>{{ card.body.length }} 个章节 · {{ card.terms.length }} 个术语</span>
          <ChevronDown :size="14" />
        </div>
      </article>
    </div>
  </div>
</template>
