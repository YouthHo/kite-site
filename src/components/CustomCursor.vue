<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { prefersReduced } from '@/utils/anim'

/**
 * 签名交互：自定义光标（磁吸跟随 + 交互元素放大 + 「解密」态）
 * 仅 pointer:fine 的桌面设备启用；触屏 / prefers-reduced-motion 自动关闭
 */
const ring = ref(null)
const dot = ref(null)
const label = ref(null)
let xTo = null
let yTo = null
let xdTo = null
let ydTo = null
let cleanup = null

onMounted(() => {
  const fine = window.matchMedia('(pointer: fine)').matches
  if (!fine || prefersReduced) return
  document.documentElement.classList.add('cc-active')

  // 磁吸：环慢、点快，两层不同步产生丝滑拖尾
  xTo = gsap.quickTo(ring.value, 'x', { duration: 0.4, ease: 'power3' })
  yTo = gsap.quickTo(ring.value, 'y', { duration: 0.4, ease: 'power3' })
  xdTo = gsap.quickTo(dot.value, 'x', { duration: 0.1, ease: 'power2' })
  ydTo = gsap.quickTo(dot.value, 'y', { duration: 0.1, ease: 'power2' })

  const move = (e) => {
    xTo(e.clientX)
    yTo(e.clientY)
    xdTo(e.clientX)
    ydTo(e.clientY)
  }
  const over = (e) => {
    const t = e.target.closest('a, button, [role="button"], .k-card, canvas, input, .hero-cards a, .nav-link')
    if (t) {
      gsap.to(ring.value, { scale: 1.9, opacity: 0.85, duration: 0.3, ease: 'power2.out' })
      gsap.to(label.value, { opacity: 1, duration: 0.2 })
    } else {
      gsap.to(ring.value, { scale: 1, opacity: 1, duration: 0.3, ease: 'power2.out' })
      gsap.to(label.value, { opacity: 0, duration: 0.2 })
    }
  }
  const down = () => gsap.to(ring.value, { scale: 0.8, duration: 0.15 })
  const up = () => gsap.to(ring.value, { scale: 1, duration: 0.2 })

  window.addEventListener('mousemove', move, { passive: true })
  document.addEventListener('mouseover', over, { passive: true })
  window.addEventListener('mousedown', down)
  window.addEventListener('mouseup', up)

  cleanup = () => {
    window.removeEventListener('mousemove', move)
    document.removeEventListener('mouseover', over)
    window.removeEventListener('mousedown', down)
    window.removeEventListener('mouseup', up)
    document.documentElement.classList.remove('cc-active')
    xTo?.kill()
    yTo?.kill()
    xdTo?.kill()
    ydTo?.kill()
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div ref="ring" class="cc-ring" aria-hidden="true">
    <span ref="label" class="cc-label">解密</span>
  </div>
  <div ref="dot" class="cc-dot" aria-hidden="true"></div>
</template>

<style scoped>
.cc-ring {
  position: fixed;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  margin: -20px 0 0 -20px;
  border: 1px solid rgba(184, 134, 11, 0.75);
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: difference;
  display: flex;
  align-items: center;
  justify-content: center;
  will-change: transform;
}
.cc-label {
  font-family: 'Noto Sans SC', system-ui, sans-serif;
  font-size: 9px;
  letter-spacing: 0.3em;
  color: var(--axis-text-strong);
  opacity: 0;
}
.cc-dot {
  position: fixed;
  top: 0;
  left: 0;
  width: 5px;
  height: 5px;
  margin: -2.5px 0 0 -2.5px;
  background: #b91c1c;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  will-change: transform;
}
:global(.cc-active),
:global(.cc-active a),
:global(.cc-active button),
:global(.cc-active [role='button']),
:global(.cc-active input),
:global(.cc-active canvas),
:global(.cc-active .k-card) {
  cursor: none !important;
}
</style>
