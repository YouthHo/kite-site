<script setup>
import { BookOpen, Unlock, Route, Network, Locate, HelpCircle, Eye, EyeOff, Download } from 'lucide-vue-next'

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

const activeCls = 'border-[#b8860b] text-[#b8860b] bg-[#b8860b]/15 on-media'
const idleCls = 'border-[#2a2520] bg-[#0e0e0e]/90 text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235] on-media'
</script>

<template>
  <div class="flex gap-1.5 flex-wrap justify-end">
    <!-- 档案巡览（10 幕双轴秘密引导） -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="mode === 'tour' ? activeCls : idleCls"
      :title="mode === 'tour' ? '退出档案巡览' : '沿图谱揭示风筝与影子的双轴秘密（10 幕引导）'"
      :aria-pressed="mode === 'tour'"
      @click="emit('mode', mode === 'tour' ? 'browse' : 'tour')"
    >
      <BookOpen :size="12" />
      <span>{{ mode === 'tour' ? `巡览 ${tourIdx + 1}/${tourTotal}` : '档案巡览' }}</span>
    </button>
    <!-- 解密模式（逐节点揭开遮蔽） -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5 on-media"
      :class="mode === 'decrypt' ? 'border-[#9d2235] text-[#d8a0a8] bg-[#9d2235]/15' : idleCls"
      :title="mode === 'decrypt' ? '退出解密模式' : '解密模式：点击被遮蔽节点逐层揭开（共 30 份档案）'"
      :aria-pressed="mode === 'decrypt'"
      @click="emit('mode', mode === 'decrypt' ? 'browse' : 'decrypt')"
    >
      <Unlock :size="12" />
      <span>{{ mode === 'decrypt' ? `解密 ${decryptCount}/${nodeTotal}` : '解密模式' }}</span>
    </button>
    <!-- 路径模式（显式双步） -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="mode === 'path' ? activeCls : idleCls"
      :title="mode === 'path' ? '退出路径模式' : '路径模式：依次点选起点与终点，高亮最短关系链'"
      :aria-pressed="mode === 'path'"
      @click="emit('mode', mode === 'path' ? 'browse' : 'path')"
    >
      <Route :size="12" />
      <span>路径模式</span>
    </button>
    <!-- 力导向布局 -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="layoutMode === 'force' ? activeCls : idleCls"
      :title="layoutMode === 'force' ? '恢复手绘布局（回归导演编排的王牌视图）' : '力导向布局：物理模拟自动排布（可选叠加，可随时恢复手绘）'"
      :aria-pressed="layoutMode === 'force'"
      @click="emit('layout')"
    >
      <Network :size="12" />
      <span>{{ layoutMode === 'force' ? '力导向中' : '力导向' }}</span>
    </button>
    <!-- 重置视图 -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="idleCls"
      title="重置视图：恢复初始缩放与手绘布局"
      @click="emit('reset')"
    >
      <Locate :size="12" />
      <span>重置</span>
    </button>
    <!-- 悬停高亮开关（C2：关闭时悬停无任何高亮/强调/脉冲） -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5 on-media"
      :class="hoverHighlight ? 'border-[#2a2520] bg-[#0e0e0e]/90 text-[#8a8275] hover:text-[#e8dcc8] hover:border-[#9d2235]' : 'border-[#555048] text-[#555048] bg-[#0e0e0e]/60'"
      :title="hoverHighlight ? '悬停高亮已开启：悬停节点会高亮其关系网' : '悬停高亮已关闭：悬停不产生任何高亮（点击等主交互不受影响）'"
      :aria-pressed="hoverHighlight"
      @click="emit('highlight')"
    >
      <Eye v-if="hoverHighlight" :size="12" />
      <EyeOff v-else :size="12" />
      <span>{{ hoverHighlight ? '悬停高亮' : '高亮关闭' }}</span>
    </button>
    <!-- 导出 PNG -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="idleCls"
      title="导出当前视图为 PNG 图片"
      @click="emit('export')"
    >
      <Download :size="12" />
      <span>导出</span>
    </button>
    <!-- 帮助 -->
    <button
      class="px-2.5 py-1.5 border font-mono text-[10px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
      :class="idleCls"
      title="操作帮助与图例说明"
      aria-label="操作帮助"
      @click="emit('help')"
    >
      <HelpCircle :size="12" />
      <span>?</span>
    </button>
  </div>
</template>

