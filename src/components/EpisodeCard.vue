<script setup>
import { computed } from 'vue'
import { Play, Lock } from 'lucide-vue-next'
import { appState } from '@/store/app'

/**
 * 剧集卡片（集数导航按钮形态）
 */
const props = defineProps({
  episode: { type: Object, required: true },
  active: { type: Boolean, default: false },
  locked: { type: Boolean, default: false }, // 未解锁集（进度锁）
})
const emit = defineEmits(['select'])
const watched = computed(() => appState.isWatched(props.episode.id))
</script>

<template>
  <button
    class="relative aspect-square w-full border flex flex-col items-center justify-center gap-0.5 transition-all duration-300 group"
    :class="
      active
        ? 'border-[#b91c1c] bg-[#1a1415] text-[#e8dcc8] shadow-[0_0_14px_rgba(157,34,53,0.25)]'
        : 'border-[#2a2520] bg-[#101010] text-[#a89f8e] hover:border-[#b91c1c]/70 hover:text-[#e8dcc8]'
    "
    :title="`第${episode.id}集 ${episode.title}`"
    @click="emit('select', episode)"
  >
    <!-- 当前集左侧红条 -->
    <span v-if="active" class="absolute left-0 top-0 bottom-0 w-[3px] bg-[#b91c1c]"></span>
    <template v-if="locked">
      <Lock :size="12" class="text-[#8f897c]" />
    </template>
    <template v-else>
      <Play v-if="watched" :size="11" class="text-[#8c4a2f]" />
      <span class="font-mono text-[13px] font-bold" :class="watched ? 'text-[#8c4a2f]' : ''">{{ episode.id }}</span>
    </template>
  </button>
</template>
