<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { prefersReduced } from '@/utils/anim'
import { presets } from '@/utils/motion'

/**
 * 签名页面切换（P · per-route 变体）：
 * - /graph    → seal 封条撕裂（血红竖条自右向左撕开）
 * - /history  → paper 档案展开（两侧展开）
 * - 默认      → wipe 红线揭幕（保留既有签名）
 * reduced-motion 一律纯淡入
 */
const route = useRoute()
const veil = ref(null)
const line = ref(null)
const seal = ref(null)
const content = ref(null)
let tl = null

function variant() {
  const p = route.path
  if (p === '/graph') return 'seal'
  if (p === '/history') return 'paper'
  if (p === '/scenes') return 'ink'
  return 'unfurl'
}

function runTransition() {
  const c = content.value
  if (!c) return
  tl?.kill()
  if (prefersReduced) {
    gsap.set(c, { opacity: 1 })
    return
  }
  const v = variant()
  gsap.set(c, { opacity: 0 })
  tl = gsap.timeline()

  if (v === 'seal') {
    // 封印撕裂：朱砂竖条自右向左撕开 + 内容淡入
    tl.fromTo(seal.value, { left: '102%', opacity: 1 }, { left: '-2%', duration: 0.55, ease: 'power2.inOut' })
      .to(seal.value, { opacity: 0, duration: 0.2 }, 0.5)
      .to(c, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.45)
  } else if (v === 'paper') {
    // 档案展开：内容从中心向两侧展开
    tl.fromTo(veil.value, { opacity: 0.45 }, { opacity: 0, duration: 0.4, ease: 'power2.out' })
      .fromTo(c, { scale: 0.985, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: presets.ease.out }, 0.1)
  } else if (v === 'ink') {
    // 墨迹划过：竖向墨带自上而下扫过
    tl.fromTo(seal.value, { top: '-2%', left: '50%', height: '0%', opacity: 1, width: '40%' }, { top: '102%', height: '104%', duration: 0.6, ease: 'power2.inOut' })
      .to(c, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.45)
  } else {
    // 卷轴展开（3.0 主语言）：内容自上而下展开
    tl.fromTo(veil.value, { opacity: 0.35 }, { opacity: 0, duration: 0.4, ease: 'power2.out' })
      .fromTo(c, { opacity: 0.3, clipPath: 'inset(100% 0 0 0)' }, { opacity: 1, clipPath: 'inset(0% 0 0 0)', duration: 0.6, ease: presets.ease.inOut }, 0.05)
  }
}

watch(() => route.fullPath, runTransition, { immediate: true })

onBeforeUnmount(() => tl?.kill())
</script>

<template>
  <div class="relative">
    <div ref="content" class="pt-content">
      <slot />
    </div>
    <!-- 揭幕层（红线/暗幕） -->
    <div ref="veil" class="pt-veil pointer-events-none fixed inset-0 z-[55] bg-[#080808]" style="opacity: 0"></div>
    <div
      ref="line"
      class="pt-line pointer-events-none fixed left-0 right-0 z-[56] h-[3px]"
      style="top: -2%; background: linear-gradient(90deg, transparent, #b91c1c 20%, #8c4a2f 55%, #b91c1c 80%, transparent); box-shadow: 0 0 18px rgba(157,34,53,0.8); opacity: 0"
    ></div>
    <!-- 封条撕裂竖条（graph 变体） -->
    <div
      ref="seal"
      class="pt-seal pointer-events-none fixed top-0 bottom-0 z-[56] w-[3px]"
      style="left: 102%; background: linear-gradient(180deg, transparent, #b91c1c 18%, #8c4a2f 50%, #b91c1c 82%, transparent); box-shadow: 0 0 22px rgba(157,34,53,0.85); opacity: 0"
    ></div>
  </div>
</template>
