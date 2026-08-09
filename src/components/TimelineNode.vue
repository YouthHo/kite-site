<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'

/**
 * 时间线节点卡片：滚动到视口时节点点亮、卡片从对应方向滑入。
 * side: 'top' | 'bottom'（交替分布在主线上下）
 */
const props = defineProps({
  node: { type: Object, required: true },
  side: { type: String, default: 'top' },
  index: { type: Number, default: 0 },
  /** 手动模式：由父级（横向时间线）驱动入场动画，组件自身不建 ScrollTrigger */
  manual: { type: Boolean, default: false },
})
const emit = defineEmits(['visible'])

let tween = null

onMounted(() => {
  if (props.manual) return
  const el = document.querySelector(`[data-tnode="${props.index}"]`)
  if (!el) return
  tween = gsap.fromTo(
    el,
    { opacity: 0, x: props.side === 'top' ? 46 : -46, scale: 0.94 },
    {
      opacity: 1,
      x: 0,
      scale: 1,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        once: true,
        onEnter: () => emit('visible', props.index),
      },
    }
  )
})

onBeforeUnmount(() => tween?.kill())
</script>

<template>
  <div :data-tnode="index" class="tnode relative w-[300px] md:w-[360px] opacity-0">
    <!-- 节点圆点（由父级在线上点亮，这里只负责卡片） -->
    <div class="k-card p-4 archive-tape">
      <div class="font-mono text-[10px] tracking-[0.25em] text-[#9d2235]">{{ node.date }}</div>
      <h4 class="serif-title text-[14px] mt-1 text-[#e8dcc8]">{{ node.title }}</h4>
      <p class="mt-2 text-[12px] leading-6 text-[#8a8275]">{{ node.desc }}</p>
      <span v-if="node.type === 'history'" class="inline-block mt-2 font-mono text-[9px] tracking-[0.2em] text-[#8b7355] border border-[#8b7355]/40 px-1.5 py-0.5">真实历史</span>
    </div>
  </div>
</template>
