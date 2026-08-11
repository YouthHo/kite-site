<script setup>
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

const MODE_LABEL = {
  browse: '浏览',
  decrypt: '解密',
  path: '路径',
  tour: '巡览',
}
const MODE_CLS = {
  browse: 'border-[#8a8275]',
  decrypt: 'border-[#d8a0a8]',
  path: 'border-[#b8860b]',
  tour: 'border-[#b8860b]',
}
</script>

<template>
  <div class="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.12em] text-[#e8dcc8] bg-[#0e0e0e]/90 border border-[#2a2520] px-3 py-1.5 pointer-events-none on-media overflow-hidden">
    <span class="flex items-center gap-1.5 shrink-0">
      <span class="w-1.5 h-1.5 rounded-full" :class="mode === 'browse' ? 'bg-[#8a8275]' : mode === 'decrypt' ? 'bg-[#9d2235]' : 'bg-[#b8860b]'"></span>
      MODE
      <span class="border px-1.5 py-0.5" :class="MODE_CLS[mode]">{{ MODE_LABEL[mode] }}</span>
    </span>
    <span v-if="hoverName" class="hidden md:inline text-[#e8dcc8] truncate on-media">· {{ hoverName }}</span>
    <span v-if="focusName" class="hidden lg:inline truncate on-media">· 隔离 {{ focusName }}</span>
    <span v-if="escHint" class="text-[#b8860b] shrink-0 on-media">· [Esc] {{ escHint }}</span>
    <span class="hidden 2xl:inline opacity-80 truncate on-media">· {{ statsText }}</span>
  </div>
</template>

