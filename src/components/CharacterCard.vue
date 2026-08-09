<script setup>
import { computed } from 'vue'
import NameBadge from '@/components/NameBadge.vue'

/**
 * 角色卡片（列表行 / 头像两种形态），统一使用完整名字徽章
 */
const props = defineProps({
  character: { type: Object, required: true },
  active: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
})
const emit = defineEmits(['select'])

const FACTION_LABEL = {
  junton: '军统',
  zhongtong: '中统',
  underground: '地下党',
  gongan: '公安',
  civilian: '平民',
}
const factionClass = computed(() => `f-${props.character.faction}`)
</script>

<template>
  <button
    v-if="compact"
    class="w-full text-left flex items-center gap-3 px-3 py-2.5 border-l-2 transition-all duration-300 group"
    :class="active ? 'border-[#9d2235] bg-[#161616]' : 'border-transparent hover:bg-[#141414]'"
    @click="emit('select', character)"
  >
    <NameBadge :name="character.name" :faction="character.faction" size="sm" />
    <span class="flex-1 min-w-0">
      <span class="block text-[13px] text-[#e8dcc8] truncate">{{ character.name }}</span>
      <span class="block text-[10px] text-[#555048] font-mono tracking-wider truncate">{{ character.code ? '代号 · ' + character.code : character.identity }}</span>
    </span>
    <span class="badge-faction shrink-0" :class="factionClass">{{ FACTION_LABEL[character.faction] }}</span>
  </button>

  <!-- 图谱/关联人物头像卡 -->
  <div v-else class="text-center group cursor-pointer w-16" @click="emit('select', character)">
    <div class="relative mx-auto transition-all duration-300 group-hover:scale-110">
      <NameBadge :name="character.name" :faction="character.faction" size="md" />
    </div>
    <p class="mt-1.5 text-[11px] text-[#8a8275] group-hover:text-[#e8dcc8] transition-colors truncate">{{ character.name }}</p>
  </div>
</template>
