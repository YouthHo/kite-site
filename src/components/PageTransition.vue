<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { prefersReduced } from '@/utils/anim'

/**
 * 签名页面切换：红线揭幕（一条红色细线从顶部扫到底部 + 暗幕淡入淡出 + 内容淡入）
 * reduced-motion 降级为纯淡入
 */
const route = useRoute()
const veil = ref(null)
const line = ref(null)
const content = ref(null)
let tl = null

function runWipe() {
  const c = content.value
  if (!c) return
  tl?.kill()
  if (prefersReduced) {
    gsap.set(c, { opacity: 1 })
    return
  }
  gsap.set(c, { opacity: 0 })
  tl = gsap.timeline()
    .fromTo(line.value, { top: '-2%', opacity: 1 }, { top: '102%', duration: 0.5, ease: 'power2.inOut' })
    .fromTo(veil.value, { opacity: 0.4 }, { opacity: 0, duration: 0.35, ease: 'power2.out' }, 0.2)
    .to(c, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.38)
}

watch(() => route.fullPath, runWipe, { immediate: true })

onBeforeUnmount(() => tl?.kill())
</script>

<template>
  <div class="relative">
    <div ref="content" class="pt-content">
      <slot />
    </div>
    <!-- 红线揭幕层 -->
    <div ref="veil" class="pt-veil pointer-events-none fixed inset-0 z-[55] bg-[#080808]" style="opacity: 0"></div>
    <div
      ref="line"
      class="pt-line pointer-events-none fixed left-0 right-0 z-[56] h-[3px]"
      style="top: -2%; background: linear-gradient(90deg, transparent, #9d2235 20%, #b8860b 55%, #9d2235 80%, transparent); box-shadow: 0 0 18px rgba(157,34,53,0.8); opacity: 0"
    ></div>
  </div>
</template>
