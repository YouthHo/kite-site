<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight, Check } from 'lucide-vue-next'
import episodes from '@/data/episodes.json'
import characters from '@/data/characters.json'
import EpisodeCard from '@/components/EpisodeCard.vue'
import { appState } from '@/store/app'
import { pageEnter, imageReveal, prefersReduced } from '@/utils/anim'

const route = useRoute()
const detailEl = ref(null)
const lockThreshold = 8 // 前 8 集默认解锁，其余需按观剧进度解锁（可调）

const current = ref(episodes[0])
const castMap = computed(() => {
  const m = {}
  characters.forEach((c) => (m[c.id] = c))
  return m
})

function selectEp(ep) {
  current.value = ep
  animateDetail()
}
function prev() {
  if (current.value.id > 1) selectEp(episodes[current.value.id - 2])
}
function next() {
  if (current.value.id < 46) selectEp(episodes[current.value.id])
}

function animateDetail() {
  if (!detailEl.value) return
  gsap.fromTo(detailEl.value, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
  const img = detailEl.value.querySelector('.ep-hero-img')
  if (img) imageReveal(img)
  detailEl.value.querySelectorAll('.ep-tag').forEach((el, i) => {
    gsap.fromTo(el, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.4, delay: 0.15 + i * 0.07, ease: 'back.out(2)' })
  })
}

onMounted(async () => {
  await nextTick()
  pageEnter(document.querySelector('.ep-page'))
  const ep = Number(route.query.ep)
  if (ep && episodes[ep - 1]) current.value = episodes[ep - 1]
  await nextTick()
  animateDetail()
})

watch(() => route.query.ep, (ep) => {
  const n = Number(ep)
  if (n && episodes[n - 1] && episodes[n - 1].id !== current.value.id) selectEp(episodes[n - 1])
})
onBeforeUnmount(() => gsap.killTweensOf('.ep-tag'))
</script>

<template>
  <div class="ep-page page-wrap !pt-16">
    <div class="mb-6 flex items-center gap-3">
      <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]" data-enter>分集剧情</h2>
      <span class="file-label" data-enter>46 EPISODES · 翻阅档案</span>
    </div>

    <div class="grid lg:grid-cols-[300px_1fr] gap-8">
      <!-- 左侧集数导航 -->
      <aside class="lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto pr-1">
        <div class="grid grid-cols-10 lg:grid-cols-7 gap-1.5" data-enter>
          <EpisodeCard
            v-for="ep in episodes"
            :key="ep.id"
            :episode="ep"
            :active="current.id === ep.id"
            :locked="ep.id > lockThreshold && !appState.isWatched(ep.id)"
            @select="selectEp"
          />
        </div>
        <p class="mt-3 font-mono text-[10px] leading-5 tracking-[0.15em] text-[#555048]">
          前 {{ lockThreshold }} 集免费解锁；第 {{ lockThreshold + 1 }} 集起需在右上角“观剧进度”中标记已看（或标记全部）。
        </p>
      </aside>

      <!-- 右侧详情：档案纸张质感 -->
      <section ref="detailEl" class="min-w-0">
        <article class="paper-bg relative border border-[#2a2520] p-6 md:p-10">
          <div class="absolute top-0 left-0 right-0 h-[5px] bg-[repeating-linear-gradient(135deg,rgba(157,34,53,0.45)_0_10px,transparent_10px_20px)]"></div>
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="font-mono text-[11px] tracking-[0.3em] text-[#9d2235]">EPISODE {{ String(current.id).padStart(2, '0') }} · {{ current.era }}</div>
            <button
              class="flex items-center gap-1.5 text-[11px] tracking-[0.15em] px-3 py-1.5 border transition-colors"
              :class="appState.isWatched(current.id) ? 'border-[#b8860b] text-[#b8860b]' : 'border-[#2a2520] text-[#555048] hover:border-[#9d2235] hover:text-[#e8dcc8]'"
              @click="appState.toggleWatch(current.id)"
            >
              <Check :size="12" />
              {{ appState.isWatched(current.id) ? '已标记看过' : '标记看过' }}
            </button>
          </div>

          <!-- 剧照（带胶片孔） -->
          <div class="film-holes mt-5">
            <img :src="current.image" :alt="`第${current.id}集 ${current.title}`" class="ep-hero-img k-img w-full h-48 md:h-64 object-cover border border-[#2a2520]" />
          </div>

          <h3 class="serif-title text-3xl md:text-4xl mt-6 text-[#e8dcc8]">{{ current.title }}</h3>
          <div class="gold-line w-36 mt-3"></div>

          <!-- 剧情正文：首行缩进 -->
          <div class="para-indent mt-6">
            <p class="text-[14px] leading-8 text-[#d8ccb8]">{{ current.summary }}</p>
          </div>

          <!-- 关键事件标签 -->
          <div class="mt-6 flex flex-wrap gap-2">
            <span v-for="ev in current.events" :key="ev" class="ep-tag px-3 py-1 text-[11px] tracking-[0.1em] border border-[#9d2235]/70 text-[#d8a0a8] bg-[#9d2235]/8">{{ ev }}</span>
          </div>

          <!-- 出场人物 -->
          <div class="mt-6">
            <div class="file-label mb-3">出场人物</div>
            <div class="flex flex-wrap gap-3">
              <router-link
                v-for="id in current.cast"
                :key="id"
                :to="`/characters?q=${id}`"
                class="group flex flex-col items-center w-14"
              >
                <img :src="castMap[id]?.image" :alt="castMap[id]?.name" loading="lazy"
                  class="w-10 h-10 rounded-full object-cover border border-[#2a2520] group-hover:border-[#9d2235] group-hover:scale-110 transition-all" />
                <span class="mt-1 text-[10px] text-[#8a8275] group-hover:text-[#e8dcc8] truncate w-full text-center">{{ castMap[id]?.name }}</span>
              </router-link>
            </div>
          </div>

          <!-- 上下集悬浮按钮 -->
          <div class="mt-8 flex justify-between items-center">
            <button v-if="current.id > 1" @click="prev" class="flex items-center gap-2 text-[12px] tracking-[0.2em] text-[#8a8275] hover:text-[#e8dcc8] hover:-translate-x-1 transition-all">
              <ChevronLeft :size="16" /> 上一集
            </button>
            <span v-else></span>
            <button v-if="current.id < 46" @click="next" class="flex items-center gap-2 text-[12px] tracking-[0.2em] text-[#8a8275] hover:text-[#e8dcc8] hover:translate-x-1 transition-all">
              下一集 <ChevronRight :size="16" />
            </button>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>
