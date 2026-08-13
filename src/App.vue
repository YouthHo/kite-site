<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import NavBar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'
import SearchModal from '@/components/SearchModal.vue'
import ProgressSetting from '@/components/ProgressSetting.vue'
import BackToTop from '@/components/BackToTop.vue'
import FilmGrain from '@/components/FilmGrain.vue'
import CustomCursor from '@/components/CustomCursor.vue'
import LoadingScreen from '@/components/LoadingScreen.vue'
import PageTransition from '@/components/PageTransition.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import ArchiveRail from '@/components/ArchiveRail.vue'
import { refreshTriggers } from '@/utils/anim'

const route = useRoute()
// 加载屏：每个浏览器会话只完整播放一次（sessionStorage 标记），刷新/二次访问秒进
const loading = ref(!sessionStorage.getItem('kite-loaded'))
let idleTimer = null

// 路由切换顶部红色进度条
const progress = ref(null)
let progressTween = null
watch(
  () => route.fullPath,
  () => {
    if (!progress.value) return
    progressTween?.kill()
    progressTween = gsap.fromTo(
      progress.value,
      { scaleX: 0, opacity: 1 },
      {
        scaleX: 1,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => gsap.to(progress.value, { opacity: 0, duration: 0.3, delay: 0.1 }),
      }
    )
    refreshTriggers()
  }
)

// 首屏加载完成后淡出
function onLoaded() {
  loading.value = false
  try {
    sessionStorage.setItem('kite-loaded', '1')
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  // 空闲时预热常用页面分包（跳过图谱/时间线，避免提前拉取 1MB 的 echarts）
  const idle = (cb) => (window.requestIdleCallback ? requestIdleCallback(cb) : setTimeout(cb, 600))
  idleTimer = idle(() => {
    import('@/views/HomeView.vue')
    import('@/views/CharactersView.vue')
    import('@/views/CastView.vue')
    import('@/views/EpisodesView.vue')
    import('@/views/HistoryView.vue')
    import('@/views/ArchitectureView.vue')
    import('@/views/ScenesView.vue')
  })
})

onBeforeUnmount(() => {
  progressTween?.kill()
  if (idleTimer && typeof cancelIdleCallback === 'function') cancelIdleCallback(idleTimer)
})
</script>

<template>
  <LoadingScreen v-if="loading" @done="onLoaded" />
  <CustomCursor />
  <FilmGrain />

  <!-- 路由切换进度条 -->
  <div
    ref="progress"
    class="fixed top-0 left-0 right-0 h-[2px] z-[90] origin-left opacity-0"
    style="background: linear-gradient(90deg, transparent, #b91c1c 30%, #8c4a2f 70%, transparent)"
  ></div>

  <NavBar />
  <CommandPalette />
    <ArchiveRail />
    <PageTransition>
    <router-view :key="route.fullPath" />
  </PageTransition>
  <Footer />

  <SearchModal />
  <ProgressSetting />
  <BackToTop />
</template>
