<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * 图谱状态条：常驻显示 当前模式 / 选中节点 / Esc 可退项 / 统计
 * 双主题可读：深底板 + on-media 文字（浅色主题下强制浅字，不受 theme-light 映射影响）
 */
defineProps({
  mode: { type: String, default: 'browse' },
  hoverName: { type: String, default: '' },
  focusName: { type: String, default: '' },
  escHint: { type: String, default: '' },
  statsText: { type: String, default: '' },
})
const { t } = useI18n()

const MODE_LABEL = computed(() => ({
  browse: t('graph.modeBrowse'),
  decrypt: t('graph.modeDecrypt'),
  path: t('graph.modePath'),
  tour: t('graph.modeTour'),
}))
const MODE_CLS = {
  browse: 'border-[#8a8275]',
  decrypt: 'border-[#a8443a]',
  path: 'border-[#8c4a2f]',
  tour: 'border-[#8c4a2f]',
}
</script>

<template>
  <div class="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.12em] text-[#e8dcc8] bg-[#0e0e0e]/90 border border-[#2a2520] px-3 py-1.5 pointer-events-none on-media overflow-hidden">
    <span class="flex items-center gap-1.5 shrink-0">
      <span class="w-1.5 h-1.5 rounded-full" :class="mode === 'browse' ? 'bg-[#8a8275]' : mode === 'decrypt' ? 'bg-[#b91c1c]' : 'bg-[#8c4a2f]'"></span>
      MODE
      <span class="border px-1.5 py-0.5" :class="MODE_CLS[mode]">{{ MODE_LABEL[mode] }}</span>
    </span>
    <span v-if="hoverName" class="hidden md:inline text-[#e8dcc8] truncate on-media">· {{ hoverName }}</span>
    <span v-if="focusName" class="hidden lg:inline truncate on-media">· {{ t('graph.focusIsolated', { name: focusName }) }}</span>
    <span v-if="escHint" class="text-[#8c4a2f] shrink-0 on-media">· {{ t('graph.esc', { hint: escHint }) }}</span>
    <span class="hidden 2xl:inline opacity-80 truncate on-media">· {{ statsText }}</span>
  </div>
</template>
