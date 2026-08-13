<script setup>
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { ref } from 'vue'
import gsap from 'gsap'
import { X } from 'lucide-vue-next'
import characters from '@/data/characters.json'
import episodes from '@/data/episodes.json'
import scenes from '@/data/scenes.json'
import quotes from '@/data/quotes.json'
import { FACTION, factionLabel } from '@/utils/factions'
import { prefersReduced } from '@/utils/anim'

/**
 * DossierOverlay —— 居中自由档案卡片（v2）
 * 弹入（scale+opacity+y，back.out）/ 收回（scale 收缩淡出）丝滑动画
 * 五内容模板：人物 / 剧集 / 名场面 / 台词 / 组织
 */
const props = defineProps({
  type: { type: String, default: 'character' },
  id: { type: String, required: true },
})
const emit = defineEmits(['close'])

const cardEl = ref(null)
const closing = ref(false)

const POOL = {
  character: { data: characters, title: (x) => x.name, sub: (x) => x.identity || '', brief: (x) => x.brief || '', code: (x) => x.code, faction: (x) => x.faction, eps: (x) => x.episodes },
  episode: { data: episodes, title: (x) => `第${x.id}集 · ${x.title}`, sub: (x) => `年代 ${x.era || '—'}`, brief: (x) => x.summary || '' },
  scene: { data: scenes, title: (x) => x.title, sub: (x) => `EP.${x.episode}`, brief: (x) => x.desc || '' },
  quote: { data: quotes, title: (x) => (x.text || '').slice(0, 30), sub: (x) => `${x.speaker || ''} · 第${x.episode}集`, brief: (x) => x.context || '' },
}

const item = computed(() => {
  const pool = POOL[props.type]
  return pool?.data.find((x) => String(x.id) === props.id) || null
})

const pool = computed(() => POOL[props.type])

function onKey(e) {
  if (e.key === 'Escape') close()
}

function close() {
  if (closing.value) return
  closing.value = true
  if (prefersReduced || !cardEl.value) {
    emit('close')
    return
  }
  // 收回：缩放收缩 + 淡出（丝滑）
  gsap.to(cardEl.value, {
    scale: 0.9,
    y: 14,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => emit('close'),
  })
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  // 弹入：缩放 + 上浮 + 淡入（back.out 丝滑）
  if (!prefersReduced && cardEl.value) {
    gsap.fromTo(
      cardEl.value,
      { scale: 0.88, y: 18, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.7)' }
    )
  }
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fixed inset-0 z-[85] grid place-items-center p-4" role="dialog" aria-modal="true" :aria-label="item ? (item.title || item.name) : '档案'">
    <!-- 遮罩 -->
    <div class="absolute inset-0 bg-black/60" @click="close"></div>

    <!-- 居中自由卡片 -->
    <div
      ref="cardEl"
      class="relative w-full max-w-[560px] max-h-[84vh] overflow-y-auto rounded-lg border border-[var(--dossier-border)] bg-[var(--dossier-bg)] shadow-[var(--elev-3)] m-4"
    >
      <div v-if="item" class="p-7">
        <div class="flex items-center justify-between">
          <div class="font-mono text-[10px] tracking-[0.35em] text-[var(--dossier-accent)]">DOSSIER · {{ type.toUpperCase() }}</div>
          <button class="w-8 h-8 grid place-items-center rounded border border-[var(--dossier-border)] text-[var(--dossier-text-dim)] hover:text-[var(--dossier-text)] hover:border-[var(--dossier-accent)] transition-colors m-focus-ring" aria-label="关闭档案" @click="close">
            <X :size="16" />
          </button>
        </div>

        <h3 class="serif-title text-3xl mt-4 text-[var(--dossier-text)]">{{ pool.title(item) }}</h3>
        <div class="mt-1 font-mono text-[10px] tracking-[0.2em] text-[var(--dossier-text-dim)]">{{ pool.sub(item) }}</div>
        <div class="gold-line mt-4 w-20"></div>

        <template v-if="type === 'character'">
          <div class="mt-4 flex flex-wrap gap-2">
            <span v-if="item.code" class="badge-faction f-junton">代号 · {{ item.code }}</span>
            <span class="badge-faction" :class="`f-${item.faction}`">{{ factionLabel(item.faction) }}</span>
          </div>
          <p class="mt-4 text-[13px] leading-7 text-[var(--dossier-text-dim)]">{{ item.brief }}</p>
          <p class="mt-2 text-[12px] text-[var(--dossier-text-dim)]">出场：第 {{ item.episodes[0] }}—{{ item.episodes[1] }} 集</p>
        </template>
        <p v-else class="mt-4 text-[13px] leading-7 text-[var(--dossier-text-dim)]">{{ pool.brief(item) }}</p>

        <button class="mt-6 w-full py-2.5 border border-[var(--dossier-accent)] text-[var(--dossier-text)] text-[12px] tracking-[0.25em] hover:bg-[var(--dossier-accent)]/10 transition-colors m-focus-ring" @click="close">收 回</button>
      </div>
      <div v-else class="p-7 text-[12px] text-[var(--dossier-text-dim)]">档案不存在</div>
    </div>
  </div>
</template>
