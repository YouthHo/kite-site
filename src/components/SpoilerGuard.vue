<script setup>
import { computed } from 'vue'
import { Lock } from 'lucide-vue-next'
import { appState } from '@/store/app'

/**
 * 防剧透守卫：未看完（默认 46 集）时，内容模糊加锁；
 * 解锁时播放 模糊→清晰 过渡。
 */
const props = defineProps({
  threshold: { type: Number, default: 46 },
  label: { type: String, default: '结局档案' },
})

const unlocked = computed(() => appState.unlocked(props.threshold))
</script>

<template>
  <div class="relative">
    <div v-if="!unlocked" class="relative overflow-hidden rounded-sm">
      <div class="blur-[6px] opacity-40 select-none pointer-events-none" aria-hidden="true">
        <slot />
      </div>
      <div class="absolute inset-0 z-10 grid place-items-center">
        <div class="text-center">
          <Lock :size="20" class="mx-auto text-[#b91c1c] mb-2" />
          <p class="text-[12px] tracking-[0.25em] text-[#a89f8e]">{{ label }}已加密</p>
          <p class="mt-1 text-[10px] tracking-[0.15em] text-[#8f897c]">观看到第 {{ threshold }} 集后自动解锁</p>
          <button
            class="mt-3 text-[11px] tracking-[0.2em] border border-[#b91c1c] text-[#e8dcc8] px-4 py-1.5 hover:bg-[#b91c1c]/20 transition-colors"
            @click="appState.markRange(1, threshold)"
          >
            标记已看完 {{ threshold }} 集
          </button>
        </div>
      </div>
    </div>
    <transition name="reveal">
      <div v-if="unlocked"><slot /></div>
    </transition>
  </div>
</template>

<style scoped>
.reveal-enter-active { transition: filter 0.8s ease, opacity 0.8s ease; }
.reveal-enter-from { filter: blur(8px); opacity: 0; }
</style>
