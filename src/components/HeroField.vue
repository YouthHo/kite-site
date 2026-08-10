<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { prefersReduced } from '@/utils/anim'

/**
 * 签名质感层：余烬粒子 Canvas（隐喻“风筝线/潜伏”的暗涌）
 * 桌面启用（约 40 粒子），移动端 / reduced-motion 自动降级为静态渐变
 */
const canvas = ref(null)
let raf = null
let particles = []
let running = false

onMounted(() => {
  const el = canvas.value
  if (!el) return
  const fine = window.matchMedia('(pointer: fine)').matches
  const mobile = window.innerWidth < 768
  if (!fine || mobile || prefersReduced) return
  const ctx = el.getContext('2d')
  let w = 0
  let h = 0

  const resize = () => {
    const rect = el.parentElement.getBoundingClientRect()
    w = el.width = rect.width * 0.5 // 半分辨率：性能优先
    h = el.height = rect.height * 0.5
    const count = Math.min(44, Math.floor(w / 18))
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.6,
      vy: 0.08 + Math.random() * 0.28,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.004 + Math.random() * 0.01,
      hue: Math.random() > 0.6 ? '184,134,11' : '157,34,53',
    }))
  }
  resize()
  window.addEventListener('resize', resize)

  const tick = () => {
    if (!running) return
    ctx.clearRect(0, 0, w, h)
    for (const p of particles) {
      p.y -= p.vy
      p.sway += p.swaySpeed
      if (p.y < -4) {
        p.y = h + 4
        p.x = Math.random() * w
      }
      const x = p.x + Math.sin(p.sway) * 14
      const a = 0.12 + 0.22 * Math.abs(Math.sin(p.sway * 1.7))
      ctx.beginPath()
      ctx.arc(x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${p.hue},${a})`
      ctx.shadowColor = `rgba(${p.hue},0.8)`
      ctx.shadowBlur = 6
      ctx.fill()
      ctx.shadowBlur = 0
    }
    raf = requestAnimationFrame(tick)
  }
  running = true
  tick()

  onBeforeUnmount(() => {
    running = false
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  })
})
</script>

<template>
  <canvas ref="canvas" class="hero-field pointer-events-none absolute inset-0" aria-hidden="true"></canvas>
</template>
