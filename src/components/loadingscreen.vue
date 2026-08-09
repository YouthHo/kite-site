<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { typewriter } from '@/utils/anim'

const emit = defineEmits(['done'])
const dot = ref(null)
const text = ref(null)
let tweens = []

onMounted(() => {
  // 红色光点脉冲
  tweens.push(
    gsap.fromTo(
      dot.value,
      { scale: 0.5, opacity: 0.4 },
      {
        scale: 1.25,
        opacity: 1,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      }
    )
  )
  // 打字机："正在解密档案..."
  typewriter(text.value, '正在解密档案……', {
    speed: 110,
    onDone: () => {
      // 光点扩散消失 → 页面淡入
      tweens.push(
        gsap.to(dot.value, {
          scale: 14,
          opacity: 0,
          duration: 0.9,
          ease: 'power2.in',
          delay: 0.4,
        })
      )
      tweens.push(
        gsap.to('.loading-screen', {
          opacity: 0,
          duration: 0.7,
          delay: 1.1,
          ease: 'power2.out',
          onComplete: () => emit('done'),
        })
      )
    },
  })
})

onBeforeUnmount(() => tweens.forEach((t) => t.kill()))
</script>

<template>
  <div class="loading-screen fixed inset-0 z-[100] bg-[#080808] flex flex-col items-center justify-center">
    <div ref="dot" class="w-4 h-4 rounded-full bg-[#9d2235] shadow-[0_0_30px_rgba(157,34,53,0.9)]"></div>
    <div class="mt-6 font-mono text-[13px] tracking-[0.35em] text-[#8a8275] h-6">
      <span ref="text"></span>
    </div>
    <div class="absolute bottom-8 font-mono text-[10px] tracking-[0.5em] text-[#555048] select-none">
      KITE / 1946 — 1988 · TOP SECRET
    </div>
  </div>
</template>
