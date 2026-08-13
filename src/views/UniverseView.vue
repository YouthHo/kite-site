<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import GraphView from '@/views/GraphView.vue'
import LensView from '@/views/LensView.vue'
import SealStamp from '@/components/SealStamp.vue'
import { prefersReduced } from '@/utils/anim'
import { threadDraw, sealStamp } from '@/utils/motion'

/**
 * UniverseView —— 宇宙入口（第一套皮肤首屏仪式）
 * 镜1 虚空 → 镜2 朱砂线牵出《风筝》→ 镜3 封印落定 → 镜4 展开（直接落在关系图谱）
 * reduced-motion：静态朱砂线 + 标题
 */
const props = defineProps({
  universe: { type: Object, required: true },
  openDossier: { type: Function, default: null }, // 宇宙浮层回调（UniverseShell slot 传入）
})
const revealed = ref(false)
const threadEl = ref(null)
let tweens = []

const route = useRoute()

onMounted(() => {
  // 深链还原：透镜（组件挂载时导航必已完成，兜底 App 层时序）
  if (route.query.lens && props.universe.state.currentLens === 'relation') {
    props.universe.setLens(String(route.query.lens))
  }
  if (prefersReduced) {
    revealed.value = true
    return
  }
  // 镜2：一线牵出
  tweens.push(threadDraw(threadEl.value, { length: 620, duration: 1.3 }))
  // 镜3：封印落定（仪式性彩蛋）
  tweens.push(sealStamp('.ritual-seal', { delay: 1.2 }))
  // 镜4：展开
  gsap.delayedCall(1.7, () => {
    revealed.value = true
    tweens.push(gsap.fromTo('.ritual', { opacity: 1 }, { opacity: 0, duration: 0.5, onComplete: () => { document.querySelector('.ritual')?.remove() } }))
  })
})

onBeforeUnmount(() => {
  tweens.forEach((t) => t?.kill?.())
})
</script>

<template>
  <div class="relative min-h-screen">
    <!-- 镜1-3：显影仪式 -->
    <div v-if="!prefersReduced || !revealed" class="ritual fixed inset-0 z-[88] grid place-items-center bg-[#0d0d0f]">
      <div class="relative text-center px-6">
        <svg class="w-[min(78vw,620px)] h-[60px] mx-auto" viewBox="0 0 620 60" fill="none" aria-hidden="true" style="stroke-dasharray: 620;">
          <path ref="threadEl" d="M20 44 Q 180 6 310 30 T 600 20" stroke="var(--vermilion, #b91c1c)" stroke-width="1.6" stroke-linecap="round" opacity="0.9" />
        </svg>
        <h1 class="serif-title text-[16vw] md:text-[9rem] leading-none text-[#ece3d2] mt-2" style="letter-spacing: 0.34em; text-indent: 0.34em; text-shadow: 0 0 60px rgba(185,28,28,0.35);">风筝</h1>
        <div class="ritual-seal absolute -right-8 md:-right-20 top-1/2 -translate-y-1/2 opacity-0" style="transform: rotate(-10deg);">
          <SealStamp text="绝密档案" :size="64" />
        </div>
        <p class="mt-6 font-mono text-[11px] tracking-[0.4em] text-[#a89f8e]">信仰至上 · 半生潜伏</p>
      </div>
    </div>

    <!-- 镜4：宇宙内容（透镜驱动：关系=图谱，其余=对应内容形态） -->
    <template v-if="revealed || prefersReduced">
      <GraphView v-if="universe.state.currentLens === 'relation'" :universe="universe" :open-dossier="openDossier" />
      <LensView v-else :universe="universe" :open-dossier="openDossier" />
    </template>
  </div>
</template>
