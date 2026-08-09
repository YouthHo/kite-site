<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { ArrowUp } from 'lucide-vue-next'

const show = ref(false)
let tween = null

onMounted(() => {
  const onScroll = () => {
    const v = window.scrollY > 500
    if (v !== show.value) {
      show.value = v
      const btn = document.querySelector('.k-backtop')
      if (btn) {
        tween?.kill()
        tween = gsap.to(btn, { opacity: v ? 1 : 0, y: v ? 0 : 16, duration: 0.35, ease: 'power2.out' })
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
})

function toTop() {
  gsap.to(window, { scrollTo: 0, duration: 0.9, ease: 'power3.inOut' })
}

onBeforeUnmount(() => tween?.kill())
</script>

<template>
  <button
    v-show="show"
    class="k-backtop fixed bottom-6 right-5 md:right-8 z-[75] w-11 h-11 rounded-full border border-[#2a2520] bg-[#0e0e0e]/85 backdrop-blur grid place-items-center text-[#8a8275] opacity-0 hover:text-[#e8dcc8] hover:border-[#9d2235] hover:shadow-[0_0_24px_rgba(157,34,53,0.4)] transition-colors"
    aria-label="返回顶部"
    @click="toTop"
  >
    <ArrowUp :size="18" />
  </button>
</template>
