<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'
import ScanLine from '@/components/ScanLine.vue'
import HeroField from '@/components/HeroField.vue'
import SealStamp from '@/components/SealStamp.vue'
import ShareButton from '@/components/ShareButton.vue'
import { pageEnter, prefersReduced } from '@/utils/anim'

const heroBg = ref(null)
const heroTitle = ref(null)
let tweens = []

const cards = [
  { to: '/graph', title: '人物关系图谱', desc: '谁是风筝 · 谁是影子' },
  { to: '/characters', title: '角色档案库', desc: '30 份绝密人物档案' },
  { to: '/cast', title: '演员阵容', desc: '柳云龙 / 罗海琼 / 李小冉' },
  { to: '/episodes', title: '分集剧情', desc: '46 集 · 完整剧情解密' },
  { to: '/timeline', title: '全剧时间线', desc: '1927—1980 时代长卷' },
  { to: '/architecture', title: '势力架构', desc: '军统 / 中统 / 中共战线' },
  { to: '/history', title: '历史背景', desc: '真实历史 · 四类档案' },
  { to: '/scenes', title: '名场面·台词', desc: '37 个名场面 · 57 句台词' },
]

onMounted(() => {
  if (prefersReduced) return
  const bg = heroBg.value
  const title = heroTitle.value
  // Ken Burns：极缓慢放大 + 呼吸式明暗
  tweens.push(gsap.fromTo(bg, { scale: 1, filter: 'brightness(0.9)' }, { scale: 1.1, filter: 'brightness(1.02)', duration: 26, ease: 'none' }))
  tweens.push(gsap.to('.hero-breathe', { opacity: 0.5, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' }))
  // 标题：titleSweep 显影——模糊淡入 + 字距从宽收束（0.58em → 0.42em）
  tweens.push(
    gsap.fromTo(
      title,
      { filter: 'blur(16px)', scale: 1.12, opacity: 0, letterSpacing: '0.58em' },
      { filter: 'blur(0px)', scale: 1, opacity: 1, letterSpacing: '0.42em', duration: 1.6, ease: 'power3.out', delay: 0.15 }
    )
  )
  // 印章压印出现（快速旋转复位）
  tweens.push(
    gsap.fromTo('.hero-seal', { scale: 1.6, opacity: 0, rotation: -14 }, { scale: 1, opacity: 1, rotation: -10, duration: 0.5, ease: 'back.out(2.2)', delay: 1.1 })
  )
  // 金色细线从中间展开
  tweens.push(gsap.fromTo('.hero-goldline', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut', delay: 1.5 }))
  // 副标题淡入（含双 CTA）
  tweens.push(gsap.fromTo('.hero-sub', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, delay: 1.9 }))
  tweens.push(gsap.fromTo('.hero-ctas', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, delay: 2.3 }))
  // 电报码闪烁
  tweens.push(
    gsap.to('.telegraph', { opacity: 0.08, duration: 0.4, repeat: -1, yoyo: true, stagger: 0.3, ease: 'sine.inOut', delay: 3 })
  )
  // 入口索引错落入场
  pageEnter(document.querySelector('.hero-cards'), { stagger: 0.04, y: 14, delay: 2.2 })
})

onBeforeUnmount(() => tweens.forEach((t) => t.kill()))

// O · 随机潜入：随机跳转一个内容页（命令面板同源能力）
function randomExplore() {
  const routes = ['/graph', '/characters', '/episodes', '/timeline', '/architecture', '/history', '/scenes']
  const pick = routes[Math.floor(Math.random() * routes.length)]
  window.location.href = pick + '?ref=random'
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- 背景：历史影像低透明度铺底 + 深色渐变保证文字永远可读 -->
    <div class="absolute inset-0 overflow-hidden">
      <img
        ref="heroBg"
        src="/images/history/hist_chongqing_bombing.webp"
        alt="重庆 1940s 历史影像（公版照片）"
        class="w-full h-full object-cover opacity-25"
        style="filter: blur(2px) saturate(0.6)"
      />
      <!-- 深色渐变层：文字可读性的根基 -->
      <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(8,8,8,0.88) 0%, rgba(8,8,8,0.6) 38%, rgba(8,8,8,0.9) 100%), radial-gradient(ellipse at 50% 40%, rgba(157,34,53,0.10), transparent 65%)"></div>
      <!-- 暗角 -->
      <div class="absolute inset-0" style="background: radial-gradient(ellipse at center, transparent 35%, rgba(8,8,8,0.85) 100%)"></div>
      <!-- 呼吸层 -->
      <div class="hero-breathe absolute inset-0" style="background: radial-gradient(ellipse at 50% 40%, rgba(30,74,82,0.10), transparent 70%)"></div>
      <!-- 余烬粒子质感层 -->
      <HeroField />
    </div>
    <ScanLine />

    <!-- 电报码装饰 -->
    <div class="telegraph absolute top-32 left-6 text-[10px] leading-6">01001010 01101011<br />01010100 01101011<br />01101011 01101010</div>
    <div class="telegraph absolute bottom-32 right-6 text-[10px] leading-6 text-right">11010110 01011010<br />00110110 11010110<br />10110101 00110101</div>

    <!-- 居中标题 -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-5 pt-20">
      <div ref="heroTitle" class="text-center relative">
        <h1 class="serif-title text-[17vw] md:text-[10rem] leading-none text-[#e8dcc8] on-media" style="letter-spacing: 0.42em; text-indent: 0.42em; text-shadow: 0 0 34px rgba(157,34,53,0.55), 0 2px 18px rgba(0,0,0,0.9);">
          风 筝
        </h1>
        <!-- 档案印章：标题右侧压印（仅桌面，移动端避免溢出） -->
        <div class="hero-seal hidden md:block absolute -right-24 top-1/2 -translate-y-1/2 opacity-0" style="transform: rotate(-10deg);">
          <SealStamp text="绝密档案" :size="64" />
        </div>
      </div>
      <div class="hero-goldline gold-line w-[280px] md:w-[420px] mt-6 origin-center"></div>
      <p class="hero-sub mt-6 text-[13px] tracking-[0.4em] text-[#d9a441] on-media" style="text-shadow: 0 0 18px rgba(184,134,11,0.35);">信仰至上 · 半生潜伏</p>
      <p class="hero-sub mt-3 text-[11px] tracking-[0.3em] text-[#8a8275] on-media">THE KITE · 2017 · 柳云龙 导演作品</p>

      <!-- O · 双主 CTA：随机潜入 + 进入档案 -->
      <div class="hero-sub hero-ctas mt-8 flex flex-wrap items-center justify-center gap-4">
        <router-link
          to="/graph"
          class="px-6 py-2.5 border border-[#9d2235] text-[#e8dcc8] text-[12px] tracking-[0.3em] on-media bg-[#9d2235]/10 hover:bg-[#9d2235]/25 transition-colors m-focus-ring"
        >
          进入档案 →
        </router-link>
        <button
          class="px-6 py-2.5 border border-[#2a2520] text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235] text-[12px] tracking-[0.3em] transition-colors on-media m-focus-ring"
          @click="randomExplore"
        >
          随机潜入
        </button>
      </div>

      <!-- 功能入口：编辑式索引（无边框盒，编号+细线+悬停变色） -->
      <div class="hero-cards grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-12 mt-24 w-full max-w-6xl">
        <router-link
          v-for="(c, i) in cards"
          :key="c.to"
          :to="c.to"
          class="group block border-t border-[#2a2520] pt-5 relative transition-colors duration-300 hover:border-[#9d2235]"
        >
          <div class="text-[11px] tracking-[0.3em] text-[#8a8275] on-media group-hover:text-[#9d2235] transition-colors duration-200">{{ String(i + 1).padStart(2, '0') }}</div>
          <div class="title-sans text-[17px] mt-3 text-[#e8dcc8] on-media group-hover:text-[#f0e6d2] transition-colors duration-200">{{ c.title }}</div>
          <div class="mt-1.5 text-[12px] leading-5 text-[#a89f8e] on-media">{{ c.desc }}</div>
          <span class="absolute right-0 top-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#9d2235] text-[15px]">→</span>
        </router-link>
      </div>
    </div>

    <!-- 分享：左上角，与右上角设置齿轮左右对称 -->
    <div class="absolute top-16 md:top-20 left-5 md:left-8 z-20">
      <ShareButton title="风筝 The Kite · 信仰至上 半生潜伏" />
    </div>
  </div>
</template>

