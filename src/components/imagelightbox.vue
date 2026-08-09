<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

/**
 * 灯箱：点击图片位置放大出现（传 originRect），背景模糊。
 */
const props = defineProps({
  src: String,
  alt: String,
  originRect: Object, // {x, y, w, h}
  list: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
})
const emit = defineEmits(['close', 'change'])
const img = ref(null)
let tween = null

onMounted(() => {
  const el = img.value
  const r = props.originRect || { x: innerWidth / 2, y: innerHeight / 2, w: 0, h: 0 }
  const cx = r.x + r.w / 2
  const cy = r.y + r.h / 2
  gsap.fromTo(
    el,
    { x: cx - innerWidth / 2, y: cy - innerHeight / 2, scale: Math.min(innerWidth / Math.max(r.w, 1), innerHeight / Math.max(r.h, 1)) * 0.5, opacity: 0 },
    { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.55, ease: 'power3.out' }
  )
  gsap.fromTo('.lightbox-mask', { opacity: 0 }, { opacity: 1, duration: 0.4 })
})

function close() {
  tween = gsap.to(img.value, { scale: 0.85, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => emit('close') })
  gsap.to('.lightbox-mask', { opacity: 0, duration: 0.3 })
}

function prev() { emit('change', (props.index - 1 + props.list.length) % props.list.length) }
function next() { emit('change', (props.index + 1) % props.list.length) }

onBeforeUnmount(() => tween?.kill())
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[96]">
      <div class="lightbox-mask absolute inset-0 bg-black/85 backdrop-blur-lg" @click="close"></div>
      <button class="absolute top-5 right-5 z-10 text-[#8a8275] hover:text-[#e8dcc8]" @click="close"><X :size="22" /></button>
      <button v-if="list.length > 1" class="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 text-[#8a8275] hover:text-[#e8dcc8]" @click="prev"><ChevronLeft :size="26" /></button>
      <button v-if="list.length > 1" class="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 text-[#8a8275] hover:text-[#e8dcc8]" @click="next"><ChevronRight :size="26" /></button>
      <div class="absolute inset-0 grid place-items-center p-8">
        <figure class="max-w-4xl w-full">
          <img ref="img" :src="src" :alt="alt" class="w-full max-h-[78vh] object-contain border border-[#2a2520] shadow-2xl" />
          <figcaption class="mt-3 text-center font-mono text-[11px] tracking-[0.3em] text-[#8a8275]">{{ alt }}</figcaption>
        </figure>
      </div>
    </div>
  </Teleport>
</template>
