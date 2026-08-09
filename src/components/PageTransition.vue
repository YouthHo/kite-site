<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'

// 页面切换过渡：淡入 + 轻微上移；元素错落入场在页面内由 data-enter 驱动
const route = useRoute()
let enterTween = null

onMounted(() => {
  const el = document.querySelector('.page-transition-root')
  if (!el) return
  try {
    enterTween = gsap.fromTo(
      el,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
    )
  } catch (e) {
    // 兜底：动画异常时确保内容可见
    gsap.set(el, { opacity: 1, y: 0 })
  }
})

onBeforeUnmount(() => enterTween?.kill())
</script>

<template>
  <div class="page-transition-root" :key="route.fullPath">
    <slot />
  </div>
</template>
