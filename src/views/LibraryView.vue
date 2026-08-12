<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star, BookmarkX } from 'lucide-vue-next'
import { favoritesList, libraryState } from '@/store/library'
import characters from '@/data/characters.json'
import episodes from '@/data/episodes.json'
import scenes from '@/data/scenes.json'
import quotes from '@/data/quotes.json'
import actors from '@/data/actors.json'
import DecoDivider from '@/components/DecoDivider.vue'

/**
 * 收藏夹（W · LibraryView）：按类型分组展示全部收藏
 */
const router = useRouter()

const POOL = {
  character: { data: characters, to: (id) => `/characters?q=${id}` },
  episode: { data: episodes, to: (id) => `/episodes?ep=${id}` },
  scene: { data: scenes, to: () => '/scenes' },
  quote: { data: quotes, to: () => '/scenes?tab=quotes' },
  actor: { data: actors, to: () => '/cast' },
}

const groups = computed(() => {
  const g = {}
  for (const f of favoritesList()) {
    const pool = POOL[f.type]
    const item = pool?.data.find((x) => String(x.id) === f.id)
    if (!item) continue
    ;(g[f.type] = g[f.type] || []).push({ id: f.id, item, to: pool.to(f.id) })
  }
  return g
})

const total = computed(() => favoritesList().length)
const TITLES = { character: '人物', episode: '剧集', scene: '名场面', quote: '台词', actor: '演员' }
const SUB = (item) => item.desc || item.brief || item.summary || item.identity || item.role || ''
void libraryState
</script>

<template>
  <div class="page-wrap">
    <div class="mb-8 flex items-center gap-4">
      <Star :size="22" class="text-[#b8860b]" />
      <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]">收藏夹</h2>
      <span class="file-label">{{ total }} 条档案</span>
    </div>
    <DecoDivider variant="telegraph" class="mb-8" />

    <div v-if="!total" class="k-empty">
      <div class="empty-seal font-mono text-[42px] tracking-[0.35em] text-[#8a8275]">密 档</div>
      <div class="empty-title serif-title text-xl text-[#e8dcc8]">档案柜还是空的</div>
      <p class="empty-desc">
        在人物、剧集、名场面与台词卡片上点击星标，即可把感兴趣的档案收藏到这里。按
        <span class="font-mono text-[#b8860b]">Cmd/Ctrl + K</span> 可快速探索全站。
      </p>
    </div>

    <section v-for="(list, type) in groups" :key="type" class="mb-10">
      <div class="file-label mb-4">{{ TITLES[type] || type }} · {{ list.length }}</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <button
          v-for="f in list"
          :key="`${type}:${f.id}`"
          class="k-card group relative text-left p-5 m-focus-ring"
          @click="router.push(f.to)"
        >
          <div class="flex items-baseline justify-between gap-3">
            <span class="title-sans text-[15px] text-[#e8dcc8] truncate">{{ f.item.title || f.item.name }}</span>
            <BookmarkX :size="13" class="shrink-0 text-[#555048] group-hover:text-[#9d2235]" />
          </div>
          <div class="mt-2 text-[11px] leading-5 text-[#8a8275] line-clamp-2">{{ SUB(f.item) }}</div>
        </button>
      </div>
    </section>
  </div>
</template>
