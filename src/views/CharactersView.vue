<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import gsap from 'gsap'
import characters from '@/data/characters.json'
import episodes from '@/data/episodes.json'
import quotes from '@/data/quotes.json'
import CharacterCard from '@/components/CharacterCard.vue'
import NameBadge from '@/components/NameBadge.vue'
import SealStamp from '@/components/SealStamp.vue'
import SpoilerGuard from '@/components/SpoilerGuard.vue'
import { pageEnter, imageReveal, prefersReduced } from '@/utils/anim'

const route = useRoute()
const selected = ref(characters[0])
const detailEl = ref(null)

const GROUPS = [
  { id: 'underground', label: '中共地下战线', color: '#1e4a52' },
  { id: 'junton', label: '军统 / 保密局', color: '#9d2235' },
  { id: 'zhongtong', label: '中统 / 党通局', color: '#7d3b52' },
  { id: 'gongan', label: '公安 / 新中国', color: '#3d3d3d' },
  { id: 'civilian', label: '平民百姓', color: '#8b7355' },
]
const grouped = computed(() =>
  GROUPS.map((g) => ({ ...g, items: characters.filter((c) => c.faction === g.id) })).filter((g) => g.items.length)
)

const epTags = computed(() => {
  const list = []
  episodes.forEach((e) => {
    if (e.cast.includes(selected.value.id)) list.push(e.id)
  })
  return list
})
const charQuotes = computed(() => quotes.filter((q) => q.speaker === selected.value.name).slice(0, 3))
const relatedChars = computed(() => {
  const ids = selected.value.related.map((r) => r.id)
  return characters.filter((c) => ids.includes(c.id))
})

function select(c) {
  if (c.id === selected.value.id) return
  selected.value = c
  animateDetail()
}

function animateDetail() {
  if (!detailEl.value) return
  const el = detailEl.value
  gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' })
  el.querySelectorAll('img').forEach((img) => imageReveal(img))
}

onMounted(async () => {
  await nextTick()
  pageEnter(document.querySelector('.char-page'))
  if (!prefersReduced) gsap.fromTo('.char-detail-root', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, delay: 0.15 })
  imageReveal(detailEl.value?.querySelector('.char-hero-img'))
  // 支持搜索跳转 ?q=id
  const q = route.query.q
  if (q) {
    const c = characters.find((x) => x.id === q)
    if (c) selected.value = c
  }
})

watch(() => route.query.q, (q) => {
  const c = characters.find((x) => x.id === q)
  if (c && c.id !== selected.value.id) select(c)
})
</script>

<template>
  <div class="char-page page-wrap">
    <div class="mb-10 flex items-center gap-5">
      <SealStamp text="角色\n档案" />
      <div>
        <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]" data-enter>角色档案库</h2>
        <div class="gold-line w-40 mt-3" data-enter></div>
        <p class="mt-3 font-mono text-[11px] tracking-[0.3em] text-[#8a8275]" data-enter>29 份档案 · 按阵营归档 · 结局含剧透保护</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-[320px_1fr] gap-8">
      <!-- 左侧人物列表 -->
      <aside class="lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto pr-1">
        <div v-for="g in grouped" :key="g.id" class="mb-5">
          <div class="flex items-center gap-2 mb-2" data-enter>
            <span class="w-6 h-[2px]" :style="{ background: g.color }"></span>
            <span class="text-[12px] tracking-[0.25em]" :style="{ color: g.color }">{{ g.label }}</span>
            <span class="font-mono text-[10px] text-[#555048]">{{ g.items.length }}</span>
          </div>
          <CharacterCard v-for="c in g.items" :key="c.id" :character="c" :active="selected.id === c.id" compact @select="select" />
        </div>
      </aside>

      <!-- 右侧详情 -->
      <section ref="detailEl" class="char-detail-root min-w-0">
        <div class="k-card archive-tape relative p-6 md:p-12">
          <!-- 顶部档案名卡（统一名字版式） -->
          <div class="film-holes">
            <div class="char-hero-img w-full h-56 md:h-72 border border-[#2a2520] overflow-hidden">
              <NameBadge :name="selected.name" :faction="selected.faction" :code="selected.code" :sub="selected.identity" size="lg" />
            </div>
          </div>
          <div class="flex flex-wrap items-end justify-between gap-3 mt-6">
            <div>
              <div class="font-mono text-[10px] tracking-[0.35em] text-[#9d2235]">KITE FILE / {{ selected.id.toUpperCase() }}</div>
              <h3 class="serif-title text-4xl md:text-5xl mt-2 text-[#e8dcc8]">{{ selected.name }}</h3>
              <div class="gold-line w-32 mt-3"></div>
            </div>
            <div class="flex flex-wrap gap-2">
              <span v-if="selected.code" class="badge-faction f-junton">代号 · {{ selected.code }}</span>
              <span class="badge-faction" :class="`f-${selected.faction}`">{{ { junton: '军统', zhongtong: '中统', underground: '地下党', gongan: '公安', civilian: '平民' }[selected.faction] }}</span>
              <span v-if="selected.cover" class="badge-faction f-civilian">公开身份 · {{ { junton: '军统', zhongtong: '中统', underground: '地下党', gongan: '公安', civilian: '平民' }[selected.cover] }}</span>
            </div>
          </div>

          <!-- 基础信息栏：仿档案表格 -->
          <div class="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
            <div class="flex gap-3 border-b border-[#2a2520] pb-2">
              <span class="font-mono text-[10px] tracking-[0.2em] text-[#555048] w-16 shrink-0 mt-0.5">扮演者</span>
              <span class="text-[#e8dcc8]">{{ selected.actor || '待考' }}</span>
            </div>
            <div class="flex gap-3 border-b border-[#2a2520] pb-2">
              <span class="font-mono text-[10px] tracking-[0.2em] text-[#555048] w-16 shrink-0 mt-0.5">身份</span>
              <span class="text-[#e8dcc8]">{{ selected.identity }}</span>
            </div>
            <div class="flex gap-3 border-b border-[#2a2520] pb-2">
              <span class="font-mono text-[10px] tracking-[0.2em] text-[#555048] w-16 shrink-0 mt-0.5">别名</span>
              <span class="text-[#8a8275]">{{ selected.aliases?.join(' / ') || '—' }}</span>
            </div>
            <div class="flex gap-3 border-b border-[#2a2520] pb-2">
              <span class="font-mono text-[10px] tracking-[0.2em] text-[#555048] w-16 shrink-0 mt-0.5">出场</span>
              <span class="text-[#8a8275]">第 {{ selected.episodes[0] }}—{{ selected.episodes[1] }} 集</span>
            </div>
          </div>

          <!-- 剧情履历 -->
          <div class="para-indent mt-8">
            <div class="file-label mb-4">剧情履历</div>
            <p v-for="(p, i) in selected.bio" :key="i" class="mb-4 first-letter:text-2xl first-letter:font-serif first-letter:text-[#b8860b]">{{ p }}</p>
          </div>

          <!-- 结局（防剧透保护） -->
          <div class="mt-8">
            <div class="file-label !border-[#9d2235] !text-[#9d2235] mb-4">最终结局</div>
            <SpoilerGuard :threshold="46" label="结局档案">
              <p class="text-[13px] leading-7 text-[#e8dcc8] border-l-2 border-[#9d2235] pl-4 py-2 bg-[#9d2235]/5">{{ selected.fate }}</p>
            </SpoilerGuard>
          </div>

          <!-- 经典台词 -->
          <div v-if="charQuotes.length" class="mt-8">
            <div class="file-label mb-4">剧中台词</div>
            <blockquote v-for="q in charQuotes" :key="q.id" class="border-l-2 border-[#9d2235] pl-4 py-2 mb-3 serif-title !font-medium text-[14px] leading-8 text-[#e8dcc8]">
              “{{ q.text }}”
              <span class="block mt-1 text-[11px] tracking-[0.2em] text-[#b8860b]">—— 第 {{ q.episode }} 集</span>
            </blockquote>
          </div>

          <!-- 关联人物 -->
          <div v-if="relatedChars.length" class="mt-8">
            <div class="file-label mb-4">关联人物</div>
            <div class="flex flex-wrap gap-4">
              <CharacterCard v-for="c in relatedChars" :key="c.id" :character="c" @select="select" />
            </div>
          </div>

          <!-- 出场集数标签云 -->
          <div class="mt-8">
            <div class="file-label mb-4">出场集数</div>
            <div class="flex flex-wrap gap-1.5">
              <router-link
                v-for="ep in epTags"
                :key="ep"
                :to="`/episodes?ep=${ep}`"
                class="px-2.5 py-1 font-mono text-[11px] border border-[#2a2520] text-[#8a8275] hover:border-[#9d2235] hover:text-[#e8dcc8] hover:-translate-y-0.5 transition-all"
              >
                第{{ ep }}集
              </router-link>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
