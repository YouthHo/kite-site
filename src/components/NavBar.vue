<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { Search, Menu, X, FileText, Share2, BarChart3, Users, Calendar, Landmark, Clapperboard, Library, Sun, Moon, Languages, Star } from 'lucide-vue-next'
import { searchOpen, theme, toggleTheme } from '@/store/app'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()
const route = useRoute()
const open = ref(false)

const links = computed(() => [
  { to: '/', label: t('nav.home') },
  { to: '/graph', label: t('nav.graph') },
  { to: '/characters', label: t('nav.characters') },
  { to: '/cast', label: t('nav.cast') },
  { to: '/episodes', label: t('nav.episodes') },
  { to: '/timeline', label: t('nav.timeline') },
  { to: '/architecture', label: t('nav.architecture') },
  { to: '/history', label: t('nav.history') },
  { to: '/scenes', label: t('nav.scenes') },
])

function toggleLang() {
  setLocale(locale.value === 'zh' ? 'en' : 'zh')
}

let scrollTween = null
let drawerTween = null

onMounted(() => {
  const nav = document.querySelector('.k-nav')
  if (!nav) return
  // 滚动时背景逐渐加深
  scrollTween = gsap.to(nav, {
    backgroundColor: 'rgba(8,8,8,0.92)',
    boxShadow: '0 1px 24px rgba(0,0,0,0.5)',
    paused: true,
    duration: 0.4,
  })
  const onScroll = () => {
    if (window.scrollY > 40) scrollTween.play()
    else scrollTween.reverse()
  }
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  scrollTween?.kill()
  drawerTween?.kill()
})

function toggleDrawer() {
  open.value = !open.value
  const panel = document.querySelector('.k-drawer')
  if (!panel) return
  if (open.value) {
    drawerTween = gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: 'power3.out' })
  } else {
    drawerTween = gsap.to(panel, { xPercent: 100, duration: 0.35, ease: 'power2.in' })
  }
}
</script>

<template>
  <header class="k-nav fixed top-0 left-0 right-0 z-[80] bg-[#080808]/60 backdrop-blur-md">
    <div class="max-w-[1400px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-3 group">
        <span class="serif-title text-xl md:text-2xl tracking-[0.35em] text-[#e8dcc8] group-hover:text-[#f0e6d2] transition-colors">风 筝</span>
        <span class="hidden md:inline font-mono text-[10px] tracking-[0.3em] text-[#8a8275] border border-[#2a2520] px-2 py-0.5">THE KITE · 2017</span>
      </router-link>

      <!-- 桌面导航 -->
      <nav class="hidden lg:flex items-center gap-8 text-[14px] tracking-[0.12em] text-[#8a8275]">
        <router-link v-for="l in links" :key="l.to" :to="l.to" class="nav-link hover:text-[#e8dcc8] transition-colors">
          {{ l.label }}
        </router-link>
      </nav>

      <div class="flex items-center gap-2">
        <router-link to="/library" class="w-9 h-9 grid place-items-center text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#b91c1c] border border-transparent transition-colors" aria-label="收藏夹" title="收藏夹"><Star :size="16" /></router-link>
        <!-- 语言切换：中 / EN -->
        <button
          class="h-9 px-2 grid place-items-center text-[11px] tracking-[0.15em] text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#b91c1c] border border-transparent transition-colors font-mono"
          :aria-label="locale === 'zh' ? 'Switch to English' : '切换中文'"
          :title="locale === 'zh' ? 'EN' : '中'"
          @click="toggleLang"
        >
          <Languages :size="15" class="mr-1" />{{ locale === 'zh' ? 'EN' : '中' }}
        </button>
        <!-- 主题切换：深色胶片 / 浅色档案纸 -->
        <button
          class="w-9 h-9 grid place-items-center text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#b91c1c] border border-transparent transition-colors"
          :aria-label="theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'"
          :title="theme === 'dark' ? '浅色主题' : '深色主题'"
          @click="toggleTheme"
        >
          <Sun v-if="theme === 'dark'" :size="16" />
          <Moon v-else :size="16" />
        </button>
        <button
          class="w-9 h-9 grid place-items-center text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#b91c1c] border border-transparent transition-colors"
          aria-label="全局搜索"
          @click="searchOpen = true"
        >
          <Search :size="17" />
        </button>
        <!-- 移动端汉堡 -->
        <button
          class="lg:hidden w-9 h-9 grid place-items-center text-[#8a8275] hover:text-[#e8dcc8]"
          aria-label="菜单"
          @click="toggleDrawer"
        >
          <X v-if="open" :size="20" />
          <Menu v-else :size="20" />
        </button>
      </div>
    </div>
  </header>

  <!-- 移动端抽屉 -->
  <transition name="fade">
    <div v-if="open" class="lg:hidden fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm" @click="toggleDrawer">
      <aside class="k-drawer absolute right-0 top-0 bottom-0 w-[280px] bg-[#0e0e0e] border-l border-[#2a2520] p-8 pt-24">
        <div class="flex flex-col gap-1">
          <router-link
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="py-2.5 text-[14px] tracking-[0.15em] text-[#8a8275] hover:text-[#e8dcc8] flex items-center gap-3"
            @click="toggleDrawer"
          >
            <FileText v-if="l.to==='/characters'" :size="15" />
            <Users v-else-if="l.to==='/cast'" :size="15" />
            <Clapperboard v-else-if="l.to==='/episodes'" :size="15" />
            <BarChart3 v-else-if="l.to==='/graph'" :size="15" />
            <Calendar v-else-if="l.to==='/timeline'" :size="15" />
            <Landmark v-else-if="l.to==='/architecture'" :size="15" />
            <Library v-else-if="l.to==='/history'" :size="15" />
            <Share2 v-else-if="l.to==='/scenes'" :size="15" />
            <span v-else class="w-[15px]"></span>
            {{ l.label }}
          </router-link>
        </div>
        <div class="mt-10 font-mono text-[10px] tracking-[0.35em] text-[#555048]">KITE FILES · 1946—1988</div>
      </aside>
    </div>
  </transition>
</template>
