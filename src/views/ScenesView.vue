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
  // 名称面切换不再做入场动画：直接显示，响应速度优于花哨效果
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
      <!-- 标签切换：静态激活态，无任何滑动动画 -->
      <div class="flex border-b border-[#2a2520]" data-enter>
        <button
          class="flex-1 px-5 py-2.5 text-[13px] tracking-[0.2em] transition-colors duration-200"
          :class="tab === 'scenes' ? 'text-[#e8dcc8] bg-[#9d2235]/10' : 'text-[#555048] hover:text-[#8a8275]'"
          @click="switchTab('scenes')"
        >
          名场面
        </button>
        <button
          class="flex-1 px-5 py-2.5 text-[13px] tracking-[0.2em] transition-colors duration-200"
          :class="tab === 'quotes' ? 'text-[#e8dcc8] bg-[#9d2235]/10' : 'text-[#555048] hover:text-[#8a8275]'"
          @click="switchTab('quotes')"
        >
          经典台词
        </button>
      </div>
    </div>

    <!-- 名场面：从左到右、从上到下的网格排列 -->
    <div v-if="tab === 'scenes'" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      <figure
        v-for="s in scenes"
        :key="s.id"
        class="scenes-item k-card archive-tape relative overflow-hidden cursor-pointer group"
        @click="openLightbox(s, $event)"
      >
        <img :src="s.image" :alt="s.title" loading="lazy" class="w-full object-cover brightness-[0.82] contrast-105 group-hover:brightness-100 group-hover:scale-[1.03] transition-all duration-700" />
        <!-- 底部文字：默认半透明，hover 清晰 -->
        <figcaption class="absolute inset-x-0 bottom-0 p-4 pt-14" style="background: linear-gradient(rgba(8,8,8,0.05) 0%, rgba(8,8,8,0.72) 42%, rgba(8,8,8,0.94) 100%)">
          <div class="font-mono text-[10px] tracking-[0.3em] text-[#d8a0a8] on-media">EP.{{ String(s.episode).padStart(2, '0') }}</div>
          <div class="title-sans text-[15px] mt-1 on-media opacity-60 group-hover:opacity-100 transition-opacity duration-300" style="text-shadow: 0 1px 8px rgba(0,0,0,0.9);">{{ s.title }}</div>
          <div class="text-[11px] leading-5 on-media opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1" style="text-shadow: 0 1px 6px rgba(0,0,0,0.9);">{{ s.desc }}</div>
        </figcaption>
        <!-- 胶片角标 -->
        <span class="absolute top-3 left-3 text-[10px] tracking-[0.2em] on-media opacity-50 border border-[#e8dcc8]/20 px-1.5 py-0.5">SCENE-{{ s.id.toUpperCase() }}</span>
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
