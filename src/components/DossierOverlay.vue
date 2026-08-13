<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import characters from '@/data/characters.json'
import episodes from '@/data/episodes.json'
import scenes from '@/data/scenes.json'
import quotes from '@/data/quotes.json'
import { FACTION, factionLabel } from '@/utils/factions'
import { typewriter, prefersReduced } from '@/utils/anim'

/**
 * DossierOverlay —— 浮层档案（替代独立详情页）
 * 按内容类型渲染模板：人物 / 剧集 / 名场面 / 台词 / 组织
 * 数据契约属核心，版式属皮肤
 */
const props = defineProps({
  type: { type: String, default: 'character' },
  id: { type: String, required: true },
})
const emit = defineEmits(['close'])

const POOL = {
  character: { data: characters, title: (x) => x.name, sub: (x) => x.identity || '', brief: (x) => x.brief || '' },
  episode: { data: episodes, title: (x) => `第${x.id}集 · ${x.title}`, sub: (x) => `年代 ${x.era || '—'}`, brief: (x) => x.summary || '' },
  scene: { data: scenes, title: (x) => x.title, sub: (x) => `EP.${x.episode}`, brief: (x) => x.desc || '' },
  quote: { data: quotes, title: (x) => (x.text || '').slice(0, 24), sub: (x) => `${x.speaker || ''} · 第${x.episode}集`, brief: (x) => x.context || '' },
}

const item = computed(() => {
  const pool = POOL[props.type]
  return pool?.data.find((x) => String(x.id) === props.id) || null
})

function close() {
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-[85]">
    <div class="absolute inset-0 bg-black/60" @click="close"></div>
    <aside
      class="absolute right-0 top-0 bottom-0 w-[92vw] max-w-[420px] bg-[#0e0e0e] border-l border-[#2a2520] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      :aria-label="item ? item.title || item.name : '档案'"
    >
      <div v-if="item" class="p-7">
        <div class="flex items-center justify-between">
          <div class="font-mono text-[10px] tracking-[0.35em] text-[#b91c1c]">DOSSIER · {{ type.toUpperCase() }}</div>
          <button class="text-[#a89f8e] hover:text-[#ece3d2] m-focus-ring" aria-label="关闭档案" @click="close"><X :size="18" /></button>
        </div>

        <h3 class="serif-title text-3xl mt-4 text-[#ece3d2]">{{ POOL[type].title(item) }}</h3>
        <div class="mt-1 font-mono text-[10px] tracking-[0.2em] text-[#a89f8e]">{{ POOL[type].sub(item) }}</div>
        <div class="gold-line mt-4 w-20"></div>

        <template v-if="type === 'character'">
          <div class="mt-4 flex flex-wrap gap-2">
            <span v-if="item.code" class="badge-faction f-junton">代号 · {{ item.code }}</span>
            <span class="badge-faction" :class="`f-${item.faction}`">{{ factionLabel(item.faction) }}</span>
          </div>
          <p class="mt-4 text-[13px] leading-7 text-[#a89f8e]">{{ item.brief }}</p>
          <p class="mt-2 text-[12px] text-[#8f897c]">出场：第 {{ item.episodes[0] }}—{{ item.episodes[1] }} 集</p>
        </template>
        <p v-else class="mt-4 text-[13px] leading-7 text-[#a89f8e]">{{ POOL[type].brief(item) }}</p>

        <button class="mt-6 w-full py-2.5 border border-[#b91c1c] text-[#ece3d2] text-[12px] tracking-[0.25em] hover:bg-[#b91c1c]/15 transition-colors m-focus-ring" @click="close">关闭档案</button>
      </div>
      <div v-else class="p-7 text-[12px] text-[#a89f8e]">档案不存在</div>
    </aside>
  </div>
</template>
