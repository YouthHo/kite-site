<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import gsap from 'gsap'
import { Share2, GitBranch, FileText, Clapperboard, Calendar, Landmark, Library, Quote } from 'lucide-vue-next'
import ScanLine from '@/components/ScanLine.vue'
import ShareButton from '@/components/ShareButton.vue'
import { pageEnter, prefersReduced } from '@/utils/anim'

const heroBg = ref(null)
const heroTitle = ref(null)
let tweens = []

const cards = [
  { to: '/graph', icon: GitBranch, title: '人物关系图谱', desc: '谁是风筝 · 谁是影子', faction: 'junton' },
  { to: '/characters', icon: FileText, title: '角色档案库', desc: '29 份绝密人物档案', faction: 'underground' },
  { to: '/cast', icon: Clapperboard, title: '演员阵容', desc: '柳云龙 / 罗海琼 / 李小冉', faction: 'zhongtong' },
  { to: '/episodes', icon: Library, title: '分集剧情', desc: '46 集 · 完整剧情解密', faction: 'gongan' },
  { to: '/timeline', icon: Calendar, title: '全剧时间线', desc: '1927—1980 时代长卷', faction: 'junton' },
  { to: '/architecture', icon: Landmark, title: '势力架构', desc: '军统 / 中统 / 中共战线', faction: 'underground' },
  { to: '/history', icon: Library, title: '历史背景', desc: '真实历史 · 四类档案', faction: 'civilian' },
  { to: '/scenes', icon: Quote, title: '名场面·台词', desc: '37 个名场面 · 57 句台词', faction: 'zhongtong' },
]

onMounted(() => {
  if (prefersReduced) return
  const bg = heroBg.value
  const title = heroTitle.value
  // Ken Burns：极缓慢放大 + 呼吸式明暗
  tweens.push(gsap.fromTo(bg, { scale: 1, filter: 'brightness(0.9)' }, { scale: 1.1, filter: 'brightness(1.02)', duration: 26, ease: 'none' }))
  tweens.push(gsap.to('.hero-breathe', { opacity: 0.5, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' }))
  // 标题：模糊→清晰 + 大→小
  tweens.push(
    gsap.fromTo(
      title,
      { filter: 'blur(18px)', scale: 1.18, opacity: 0 },
      { filter: 'blur(0px)', scale: 1, opacity: 1, duration: 1.8, ease: 'power3.out', delay: 0.15 }
    )
  )
  // 金色细线从中间展开
  tweens.push(gsap.fromTo('.hero-goldline', { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut', delay: 1.5 }))
  // 副标题淡入
  tweens.push(gsap.fromTo('.hero-sub', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, delay: 1.9 }))
  // 电报码闪烁
  tweens.push(
    gsap.to('.telegraph', { opacity: 0.08, duration: 0.4, repeat: -1, yoyo: true, stagger: 0.3, ease: 'sine.inOut', delay: 3 })
  )
  // 入口卡片错落入场（含图标旋转）
  pageEnter(document.querySelector('.hero-cards'), { stagger: 0.08, y: 34, delay: 2.3 })
  gsap.fromTo('.hero-card-icon', { rotate: -140, scale: 0 }, { rotate: 0, scale: 1, duration: 0.7, stagger: 0.08, delay: 2.5, ease: 'back.out(1.8)' })
})

onBeforeUnmount(() => tweens.forEach((t) => t.kill()))
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <!-- 全屏背景：占位图（替换：public/hero.jpg 或改为正式剧照） -->
    <div class="absolute inset-0 overflow-hidden">
      <img
        ref="heroBg"
        src="/images/history/hist_chongqing_bombing.jpg"
        alt="重庆 1940s 历史影像（公版照片）"
        class="w-full h-full object-cover"
        style="filter: brightness(0.5) contrast(1.15) saturate(0.7)"
      />
      <!-- 暗角 -->
      <div class="absolute inset-0" style="background: radial-gradient(ellipse at center, transparent 30%, rgba(8,8,8,0.9) 100%)"></div>
      <!-- 呼吸层 -->
      <div class="hero-breathe absolute inset-0" style="background: radial-gradient(ellipse at 50% 40%, rgba(30,74,82,0.10), transparent 70%)"></div>
    </div>
    <ScanLine />

    <!-- 电报码装饰 -->
    <div class="telegraph absolute top-24 left-6 text-[10px] leading-6">01001010 01101011<br />01010100 01101011<br />01101011 01101010</div>
    <div class="telegraph absolute bottom-32 right-6 text-[10px] leading-6 text-right">11010110 01011010<br />00110110 11010110<br />10110101 00110101</div>

    <!-- 居中标题 -->
    <div class="relative z-10 min-h-screen flex flex-col items-center justify-center px-5 pt-20">
      <div ref="heroTitle" class="text-center">
        <h1 class="serif-title text-[17vw] md:text-[10rem] leading-none text-[#e8dcc8] on-media" style="letter-spacing: 0.42em; text-indent: 0.42em; text-shadow: 0 0 34px rgba(157,34,53,0.55), 0 2px 18px rgba(0,0,0,0.9);">
          风 筝
        </h1>
      </div>
      <div class="hero-goldline gold-line w-[280px] md:w-[420px] mt-6 origin-center"></div>
      <p class="hero-sub mt-6 font-mono text-[12px] md:text-sm tracking-[0.5em] text-[#b8860b] on-media">信仰至上 · 半生潜伏</p>
      <p class="hero-sub mt-3 font-mono text-[10px] tracking-[0.4em] text-[#8a8275] on-media">THE KITE · 2017 · 柳云龙 导演作品</p>

      <!-- 功能入口卡片 8 个 -->
      <div class="hero-cards grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-16 w-full max-w-6xl">
        <router-link
          v-for="c in cards"
          :key="c.to"
          :to="c.to"
          class="k-card relative block p-6 md:p-7 group"
        >
          <component :is="c.icon" :size="24" class="hero-card-icon text-[#8a8275] group-hover:text-[#9d2235] group-hover:drop-shadow-[0_0_10px_rgba(157,34,53,0.8)] transition-all duration-300" />
          <div class="serif-title text-[15px] md:text-[17px] mt-4 text-[#e8dcc8]">{{ c.title }}</div>
          <div class="mt-1.5 text-[12px] md:text-[13px] text-[#8a8275] leading-6">{{ c.desc }}</div>
          <span class="absolute top-3 right-4 font-mono text-[9px] tracking-[0.2em] opacity-0 group-hover:opacity-60 transition-opacity" :style="{ color: `var(--${c.faction})` }">FILE-{{ c.faction.toUpperCase() }}</span>
        </router-link>
      </div>
    </div>

    <!-- 分享：右上角齿轮下方小圆按钮（菜单向下展开，不与卡片区重叠） -->
    <div class="absolute top-24 right-6 z-20">
      <ShareButton title="风筝 The Kite · 信仰至上 半生潜伏" />
    </div>
  </div>
</template>
