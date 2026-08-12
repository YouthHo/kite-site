<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { prefersReduced } from '@/utils/anim'

/**
 * 艺术化加载：风筝线一笔画出 + 电报逐字解码
 * 纯 CSS/SVG；reduced-motion 下为静态标题
 */
const props = defineProps({
  text: { type: String, default: '正在解密档案' },
  size: { type: Number, default: 96 },
})
const shown = ref('')
const dots = ref('')
let timer = null

onMounted(() => {
  if (prefersReduced) {
    shown.value = props.text
    return
  }
  const full = props.text
  let i = 0
  timer = setInterval(() => {
    i++
    shown.value = full.slice(0, i)
    dots.value = '.'.repeat((i % 3) + 1)
    if (i >= full.length) clearInterval(timer)
  }, 90)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="art-loader" role="status" aria-label="加载中">
    <svg :width="size" :height="Math.round(size * 0.42)" viewBox="0 0 200 84" fill="none" class="art-line">
      <path
        d="M8 60 Q 60 6 96 36 T 190 22"
        stroke="var(--gold)"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-dasharray="240"
        stroke-dashoffset="240"
        class="line-draw"
      />
      <path d="M96 36 L104 28 L110 38 Z" fill="var(--blood)" class="line-kite" />
    </svg>
    <div class="art-text font-mono" :style="{ fontSize: '11px', letterSpacing: '0.4em' }">
      {{ shown }}<span class="art-dots">{{ dots }}</span>
    </div>
  </div>
</template>

<style scoped>
.art-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-4);
  color: var(--ink);
}
.line-draw {
  animation: drawLine 1.6s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}
@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}
.line-kite {
  animation: kitePulse 2.4s ease-in-out infinite;
}
@keyframes kitePulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
.art-dots {
  color: var(--gold);
}
@media (prefers-reduced-motion: reduce) {
  .line-draw {
    animation: none;
    stroke-dashoffset: 0;
  }
  .line-kite {
    animation: none;
    opacity: 0.8;
  }
}
</style>
