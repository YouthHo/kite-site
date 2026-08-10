<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { prefersReduced } from '@/utils/anim'

/**
 * 页面切换：纯内容淡入（0.3s）。
 * 注意：此组件不允许存在任何「横条/横线/幕布」元素——
 * 用户明确否决横条类动画（历史规则），曾出现红线横扫被投诉为横纹。
 */
const route = useRoute()
const content = ref(null)
let tween = null

function runFade() {
  const c = content.value
  if (!c) return
  tween?.kill()
  if (prefersReduced) {
    gsap.set(c, { opacity: 1 })
    return
  }
  gsap.set(c, { opacity: 0 })
  tween = gsap.to(c, { opacity: 1, duration: 0.3, ease: 'power2.out' })
}

watch(() => route.fullPath, runFade, { immediate: true })

onBeforeUnmount(() => tween?.kill())
</script>

<template>
  <div class="relative">
    <div ref="content" class="pt-content">
      <slot />
    </div>
  </div>
</template>
