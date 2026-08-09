<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import scenes from '@/data/scenes.json'
import quotes from '@/data/quotes.json'
import SealStamp from '@/components/SealStamp.vue'
import ImageLightbox from '@/components/ImageLightbox.vue'
import QuoteCard from '@/components/QuoteCard.vue'
import { pageEnter, prefersReduced } from '@/utils/anim'

const tab = ref('scenes')
const lightbox = ref(null)
const lightIndex = ref(0)
let crossTween = null

function openLightbox(scene, ev) {
  const rect = ev.currentTarget.getBoundingClientRect()
  lightIndex.value = scenes.findIndex((s) => s.id === scene.id)
  lightbox.value = { origin: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }, list: scenes }
}
function changeLight(i) {
  lightIndex.value = i
}

function switchTab(t) {
  if (t === tab.value) return
  tab.value = t
  nextTick(() => {
    if (prefersReduced) return
    crossTween?.kill()
    crossTween = gsap.fromTo('.scenes-item', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: 'power3.out' })
  })
}

onMounted(async () => {
  await nextTick()
  pageEnter(document.querySelector('.scenes-page'))
})
onBeforeUnmount(() => crossTween?.kill())
</script>

<template>
  <div class="scenes-page page-wrap">
    <div class="mb-8 flex flex-wrap items-center gap-6">
      <div class="flex items-center gap-4">
        <SealStamp :text="'名场\n面录'" />
        <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]" data-enter>名场面与台词</h2>
      </div>
      <!-- 标签切换 -->
      <div class="flex gap-1 border-b border-[#2a2520]" data-enter>
        <button
          class="relative px-5 py-2.5 text-[13px] tracking-[0.2em] transition-colors"
          :class="tab === 'scenes' ? 'text-[#e8dcc8]' : 'text-[#555048] hover:text-[#8a8275]'"
          @click="switchTab('scenes')"
        >
          名场面
          <span v-if="tab === 'scenes'" class="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#9d2235] shadow-[0_0_10px_rgba(157,34,53,0.7)]"></span>
        </button>
        <button
          class="relative px-5 py-2.5 text-[13px] tracking-[0.2em] transition-colors"
          :class="tab === 'quotes' ? 'text-[#e8dcc8]' : 'text-[#555048] hover:text-[#8a8275]'"
          @click="switchTab('quotes')"
        >
          经典台词
          <span v-if="tab === 'quotes'" class="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#9d2235] shadow-[0_0_10px_rgba(157,34,53,0.7)]"></span>
        </button>
      </div>
    </div>

    <!-- 名场面瀑布流 -->
    <div v-if="tab === 'scenes'" class="columns-1 sm:columns-2 xl:columns-3 gap-5 [&>*]:mb-5">
      <figure
        v-for="s in scenes"
        :key="s.id"
        class="scenes-item k-card archive-tape relative overflow-hidden cursor-pointer break-inside-avoid group"
        @click="openLightbox(s, $event)"
      >
        <img :src="s.image" :alt="s.title" loading="lazy" class="w-full object-cover brightness-[0.82] contrast-105 group-hover:brightness-100 group-hover:scale-[1.03] transition-all duration-700" />
        <!-- 底部文字：默认半透明，hover 清晰 -->
        <figcaption class="absolute inset-x-0 bottom-0 p-4 pt-10" style="background: linear-gradient(transparent, rgba(8,8,8,0.92))">
          <div class="font-mono text-[10px] tracking-[0.3em] text-[#9d2235]">EP.{{ String(s.episode).padStart(2, '0') }}</div>
          <div class="serif-title text-[15px] mt-1 text-[#e8dcc8] on-media opacity-60 group-hover:opacity-100 transition-opacity duration-500">{{ s.title }}</div>
          <div class="text-[11px] leading-5 text-[#8a8275] on-media opacity-0 group-hover:opacity-100 transition-opacity duration-500 mt-1">{{ s.desc }}</div>
        </figcaption>
        <!-- 胶片角标 -->
        <span class="absolute top-3 left-3 font-mono text-[9px] tracking-[0.25em] text-[#e8dcc8]/50 border border-[#e8dcc8]/20 px-1.5 py-0.5">SCENE-{{ s.id.toUpperCase() }}</span>
      </figure>
    </div>

    <!-- 经典台词 -->
    <div v-else class="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <div v-for="q in quotes" :key="q.id" class="scenes-item">
        <QuoteCard :quote="q" />
      </div>
    </div>

    <!-- 灯箱 -->
    <ImageLightbox
      v-if="lightbox"
      :src="scenes[lightIndex].image"
      :alt="scenes[lightIndex].title"
      :origin-rect="lightbox.origin"
      :list="lightbox.list"
      :index="lightIndex"
      @close="lightbox = null"
      @change="changeLight"
    />
  </div>
</template>
