<script setup>
/**
 * 图谱状态条：常驻显示 当前模式 / 选中节点 / Esc 可退项 / 统计
 * —— 消灭"我点了但不知道发生了什么"
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
  browse: 'text-[#8a8275] border-[#2a2520]',
  decrypt: 'text-[#d8a0a8] border-[#9d2235]',
  path: 'text-[#b8860b] border-[#b8860b]',
  tour: 'text-[#b8860b] border-[#b8860b]',
}
</script>

<template>
  <div class="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.12em] text-[#8a8275] bg-black/45 border border-[#2a2520] px-3 py-1.5 pointer-events-none max-w-[92%]">
    <span class="flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full" :class="mode === 'browse' ? 'bg-[#8a8275]' : mode === 'decrypt' ? 'bg-[#9d2235]' : 'bg-[#b8860b]'"></span>
      MODE
      <span class="border px-1.5 py-0.5" :class="MODE_CLS[mode]">{{ MODE_LABEL[mode] }}</span>
    </span>
    <span v-if="hoverName" class="hidden md:inline text-[#e8dcc8]">· {{ hoverName }}</span>
    <span v-if="focusName" class="hidden lg:inline">· 隔离 {{ focusName }}</span>
    <span v-if="escHint" class="text-[#b8860b]">· [Esc] {{ escHint }}</span>
    <span class="hidden xl:inline opacity-70">· {{ statsText }}</span>
  </div>
</template>
