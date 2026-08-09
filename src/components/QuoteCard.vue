<script setup>
import { ref } from 'vue'
import gsap from 'gsap'
import { Copy, Check } from 'lucide-vue-next'

/**
 * 经典台词卡片：仿电报纸条，hover 出现复制按钮，复制成功对勾弹入
 */
const props = defineProps({
  quote: { type: Object, required: true },
})
const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(`「${props.quote.text}」—— ${props.quote.speaker}《风筝》`)
  } catch {
    /* ignore */
  }
  copied.value = true
  gsap.fromTo('.qcheck', { scale: 0, rotate: -90 }, { scale: 1, rotate: 0, duration: 0.45, ease: 'back.out(2)' })
  setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <article class="quote-card relative border border-[#2a2520] bg-[#0f0e0c] p-5 hover:-translate-y-1 hover:shadow-[0_14px_34px_rgba(0,0,0,0.55)] transition-all duration-300 group">
    <!-- 电报角标 -->
    <span class="absolute top-2 left-3 font-mono text-[9px] tracking-[0.3em] text-[#555048]">MSG-{{ String(quote.episode).padStart(2, '0') }}</span>
    <span class="absolute top-2 right-3 w-2 h-2 rounded-full border border-[#9d2235] opacity-60"></span>
    <blockquote class="serif-title !font-medium text-[14px] leading-8 text-[#e8dcc8] mt-4 pr-2">
      “{{ quote.text }}”
    </blockquote>
    <footer class="mt-4 flex items-center justify-between">
      <span class="text-[11px] tracking-[0.2em] text-[#b8860b]">—— {{ quote.speaker }}</span>
      <button
        class="opacity-0 group-hover:opacity-100 transition-opacity text-[#8a8275] hover:text-[#e8dcc8]"
        :aria-label="copied ? '已复制' : '复制台词'"
        @click="copy"
      >
        <Check v-if="copied" :size="14" class="qcheck text-[#b8860b]" />
        <Copy v-else :size="14" />
      </button>
    </footer>
  </article>
</template>
