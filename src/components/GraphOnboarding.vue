<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { prefersReduced } from '@/utils/anim'

/**
 * 首次进入引导（≤40 秒，可跳过、可重看、可「不再显示」）
 * 覆盖：缩放平移 / 点节点看档案 / 三种模式 / 时间轴演化 / 筛选搜索
 */
const KEY = 'kite-graph-onboarded'
const steps = [
  { target: 'canvas', title: '缩放与平移', text: '滚轮（或双指捏合）以光标为中心缩放；按住空白处拖拽平移。' },
  { target: 'canvas', title: '点击节点 = 查看档案', text: '单击任意人物节点，右侧滑出他的绝密档案与关系洞察；再点空白或按 Esc 关闭。' },
  { target: 'toolbar', title: '三种探索模式', text: '右上角可进入：档案巡览（10 幕双轴秘密引导）、解密模式（逐层揭开遮蔽）、路径模式（找两人最短关系链）。' },
  { target: 'timeline', title: '时间轴演化', text: '拖动底部集数滑块，看角色按出场时间浮现与消散——这是全剧 46 集的叙事刮擦条。' },
  { target: 'sidebar', title: '筛选与搜索', text: '右侧列表：点击名字看档案，勾选方块筛显图谱；上方可搜代号、按阵营/重要性排序。' },
]
const visible = ref(false)
const idx = ref(0)
const neverAgain = ref(false)
let timer = null

const step = computed(() => steps[idx.value])

function highlightBox(sel) {
  const el = document.querySelector(sel)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}
const targetBox = computed(() => highlightBox(step.value.target))

function dismiss() {
  visible.value = false
  clearTimeout(timer)
  if (neverAgain.value) {
    try {
      localStorage.setItem(KEY, '1')
    } catch (e) {
      /* ignore */
    }
  }
}
function next() {
  if (idx.value >= steps.length - 1) dismiss()
  else idx.value++
}
function prev() {
  idx.value = Math.max(0, idx.value - 1)
}
function reopen() {
  idx.value = 0
  visible.value = true
}

onMounted(() => {
  let done = false
  try {
    done = !!localStorage.getItem(KEY)
  } catch (e) {
    /* ignore */
  }
  if (done || prefersReduced) return
  // 延迟出现：等图谱渲染稳定
  timer = setTimeout(() => (visible.value = true), 1600)
})

onBeforeUnmount(() => clearTimeout(timer))

defineExpose({ reopen })
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-[80]" role="dialog" aria-label="图谱操作引导">
    <!-- 半透明遮罩（目标区域高亮挖空） -->
    <div class="absolute inset-0 bg-black/60" @click="next"></div>
    <div
      v-if="targetBox"
      class="absolute border-2 border-[#8c4a2f] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] rounded pointer-events-none transition-all duration-300"
      :style="{ left: targetBox.left - 4 + 'px', top: targetBox.top - 4 + 'px', width: targetBox.width + 8 + 'px', height: targetBox.height + 8 + 'px' }"
    ></div>
    <!-- 说明卡 -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[460px] bg-[#0e0e0e] border border-[#8c4a2f]/60 p-5">
      <div class="font-mono text-[9px] tracking-[0.35em] text-[#8c4a2f]">GUIDE {{ idx + 1 }}/{{ steps.length }}</div>
      <div class="serif-title text-xl mt-2 text-[#e8dcc8]">{{ step.title }}</div>
      <p class="mt-2 text-[13px] leading-6 text-[#a89f8e]">{{ step.text }}</p>
      <div class="mt-4 flex items-center justify-between">
        <label class="flex items-center gap-2 text-[11px] text-[#8f897c] cursor-pointer select-none">
          <input v-model="neverAgain" type="checkbox" class="accent-[#b91c1c]" />
          不再显示
        </label>
        <div class="flex items-center gap-2">
          <button v-if="idx > 0" class="text-[11px] tracking-[0.15em] text-[#a89f8e] hover:text-[#e8dcc8]" @click="prev">‹ 上一步</button>
          <button class="text-[11px] tracking-[0.15em] text-[#a89f8e] hover:text-[#e8dcc8]" @click="dismiss">跳过</button>
          <button class="px-3 py-1.5 border border-[#8c4a2f] text-[#8c4a2f] text-[11px] tracking-[0.2em] hover:bg-[#8c4a2f]/15 transition-colors" @click="next">
            {{ idx >= steps.length - 1 ? '开始探索' : '下一步' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
