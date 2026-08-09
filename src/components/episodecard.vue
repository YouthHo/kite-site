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
        ? 'border-[#9d2235] bg-[#1a1415] text-[#e8dcc8] shadow-[0_0_14px_rgba(157,34,53,0.25)]'
        : 'border-[#2a2520] bg-[#101010] text-[#8a8275] hover:border-[#9d2235]/70 hover:text-[#e8dcc8]'
    "
    :title="`第${episode.id}集 ${episode.title}`"
    @click="emit('select', episode)"
  >
    <!-- 当前集左侧红条 -->
    <span v-if="active" class="absolute left-0 top-0 bottom-0 w-[3px] bg-[#9d2235]"></span>
    <template v-if="locked">
      <Lock :size="12" class="text-[#555048]" />
    </template>
    <template v-else>
      <Play v-if="watched" :size="11" class="text-[#b8860b]" />
      <span class="font-mono text-[13px] font-bold" :class="watched ? 'text-[#b8860b]' : ''">{{ episode.id }}</span>
    </template>
  </button>
</template>
