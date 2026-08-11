<script setup>
import { BookOpen, Unlock, Route, Network, Locate, HelpCircle, Eye, EyeOff, Download } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

/**
 * 图谱工具条：图标 + 文字 + tooltip；激活态强对比（底填充 + 亮边框）
 * 模式互斥由父层状态机保证；悬停高亮开关独立于模式
 */
defineProps({
  mode: { type: String, default: 'browse' },
  tourIdx: { type: Number, default: 0 },
  tourTotal: { type: Number, default: 10 },
  decryptCount: { type: Number, default: 0 },
  nodeTotal: { type: Number, default: 30 },
  layoutMode: { type: String, default: 'none' },
  hoverHighlight: { type: Boolean, default: true },
})
const emit = defineEmits(['mode', 'layout', 'reset', 'help', 'highlight', 'export'])
const { t } = useI18n()

const activeCls = 'border-[#b8860b] text-[#b8860b] bg-[#b8860b]/15 on-media'
const idleCls = 'border-[#2a2520] bg-[#0e0e0e]/90 text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235] on-media'
</script>

<template>
  <div class="flex gap-1.5 flex-wrap justify-end">
    <!-- 档案巡览（10 幕双轴秘密引导） -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="mode === 'tour' ? activeCls : idleCls"
      :title="mode === 'tour' ? t('graph.escExitTour') : t('graph.tour')"
      :aria-pressed="mode === 'tour'"
      @click="emit('mode', mode === 'tour' ? 'browse' : 'tour')"
    >
      <BookOpen :size="12" />
      <span>{{ mode === 'tour' ? t('graph.tourActive', { n: tourIdx + 1, total: tourTotal }) : t('graph.tour') }}</span>
    </button>
    <!-- 解密模式（逐节点揭开遮蔽） -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5 on-media"
      :class="mode === 'decrypt' ? 'border-[#9d2235] text-[#d8a0a8] bg-[#9d2235]/15' : idleCls"
      :title="mode === 'decrypt' ? t('graph.escExitDecrypt') : t('graph.decrypt')"
      :aria-pressed="mode === 'decrypt'"
      @click="emit('mode', mode === 'decrypt' ? 'browse' : 'decrypt')"
    >
      <Unlock :size="12" />
      <span>{{ mode === 'decrypt' ? t('graph.decryptActive', { n: decryptCount, total: nodeTotal }) : t('graph.decrypt') }}</span>
    </button>
    <!-- 路径模式（显式双步） -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="mode === 'path' ? activeCls : idleCls"
      :title="mode === 'path' ? t('graph.escExitPath') : t('graph.path')"
      :aria-pressed="mode === 'path'"
      @click="emit('mode', mode === 'path' ? 'browse' : 'path')"
    >
      <Route :size="12" />
      <span>{{ t('graph.path') }}</span>
    </button>
    <!-- 力导向布局 -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="layoutMode === 'force' ? activeCls : idleCls"
      :title="layoutMode === 'force' ? t('graph.forceActive') : t('graph.force')"
      :aria-pressed="layoutMode === 'force'"
      @click="emit('layout')"
    >
      <Network :size="12" />
      <span>{{ layoutMode === 'force' ? t('graph.forceActive') : t('graph.force') }}</span>
    </button>
    <!-- 重置视图 -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="idleCls"
      :title="t('graph.reset')"
      @click="emit('reset')"
    >
      <Locate :size="12" />
      <span>{{ t('graph.reset') }}</span>
    </button>
    <!-- 悬停高亮开关（C2：关闭时悬停无任何高亮/强调/脉冲） -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5 on-media"
      :class="hoverHighlight ? 'border-[#2a2520] bg-[#0e0e0e]/90 text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235]' : 'border-[#555048] text-[#555048] bg-[#0e0e0e]/60'"
      :title="hoverHighlight ? t('graph.hoverHighlight') : t('graph.highlightOff')"
      :aria-pressed="hoverHighlight"
      @click="emit('highlight')"
    >
      <Eye v-if="hoverHighlight" :size="12" />
      <EyeOff v-else :size="12" />
      <span>{{ hoverHighlight ? t('graph.hoverHighlight') : t('graph.highlightOff') }}</span>
    </button>
    <!-- 导出 PNG -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="idleCls"
      :title="t('graph.export')"
      @click="emit('export')"
    >
      <Download :size="12" />
      <span>{{ t('graph.export') }}</span>
    </button>
    <!-- 帮助 -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="idleCls"
      :title="t('graph.help')"
      :aria-label="t('graph.help')"
      @click="emit('help')"
    >
      <HelpCircle :size="12" />
      <span>?</span>
    </button>
  </div>
</template>
