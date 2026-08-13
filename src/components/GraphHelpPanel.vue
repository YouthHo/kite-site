<script setup>
import { X } from 'lucide-vue-next'
import { TYPE_META } from '@/graph/useGraphData'

/**
 * 操作帮助面板：图例语义 + 操作说明 + 快捷键（? 按钮打开）
 */
defineEmits(['close'])
</script>

<template>
  <div class="absolute inset-0 z-[75] flex items-center justify-center p-4" role="dialog" aria-label="操作帮助与图例说明">
    <div class="absolute inset-0 bg-black/60" @click="$emit('close')"></div>
    <div class="relative w-full max-w-[520px] max-h-[86%] overflow-y-auto bg-[#0e0e0e] border border-[#2a2520] p-6">
      <button class="absolute top-4 right-4 text-[#8a8275] hover:text-[#e8dcc8]" aria-label="关闭帮助" @click="$emit('close')"><X :size="18" /></button>
      <div class="font-mono text-[10px] tracking-[0.3em] text-[#8c4a2f]">GRAPH MANUAL</div>
      <h3 class="serif-title text-2xl mt-2 text-[#e8dcc8]">图谱操作手册</h3>

      <div class="mt-5 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">基本操作</div>
      <ul class="mt-2 space-y-1.5 text-[12px] leading-6 text-[#8a8275]">
        <li>· 滚轮 / 双指捏合 —— 以光标为中心缩放</li>
        <li>· 按住空白拖拽 —— 平移画布</li>
        <li>· 点击节点 —— 打开人物档案与关系洞察</li>
        <li>· 右侧人物列表：点击名字行 = 勾选筛显该人物；点击 ⓘ = 打开档案详情</li>
        <li>· 悬停节点 —— 高亮其关系网，沿边亮起电报脉冲（可在工具条关闭）</li>
        <li>· 拖拽节点 —— 手动微调布局（重置可恢复）</li>
        <li>· 方向键 + 回车 —— 键盘导航；Esc —— 退出当前层级</li>
      </ul>

      <div class="mt-5 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">三种模式</div>
      <ul class="mt-2 space-y-1.5 text-[12px] leading-6 text-[#8a8275]">
        <li><span class="text-[#8c4a2f]">档案巡览</span> —— 10 幕引导，沿图谱揭示「风筝」与「影子」的双轴秘密</li>
        <li><span class="text-[#a8443a]">解密模式</span> —— 节点被遮蔽为「机密」，逐一点击揭开；全部解开触发揭示</li>
        <li><span class="text-[#8c4a2f]">路径模式</span> —— 依次点选起点与终点，高亮两人间最短关系链</li>
      </ul>

      <div class="mt-5 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">图例语义</div>
      <ul class="mt-2 space-y-1.5 text-[12px] leading-6 text-[#8a8275]">
        <li class="flex items-center gap-2"><span class="w-3 h-3 rounded-full border-2 border-[#8c4a2f] inline-block"></span> 金色双环印章 = 关键轴「风筝」</li>
        <li class="flex items-center gap-2"><span class="w-3 h-3 rounded-full border-2 border-[#d8475c] inline-block"></span> 血红双环印章 = 关键轴「影子」</li>
        <li>· 节点越大 = 剧情权重越高（中心性驱动，非出场长短）</li>
        <li>· 虚线 = 敌对关系 · 点线 = 秘密关系（解密模式中隐藏）</li>
        <li>· 箭头 = 有向关系（上线→下属 / 密令 / 审讯等）</li>
        <li class="flex items-center gap-1.5 flex-wrap">
          <template v-for="(m, k) in TYPE_META" :key="k">
            <span class="flex items-center gap-1"><span class="w-3.5 h-[2px] inline-block" :style="{ background: m.color }"></span><span class="text-[#e8dcc8]">{{ m.label }}</span></span>
          </template>
          —— 六色关系类型，可点击图例筛选
        </li>
        <li>· 左下阵营色点：军统 / 中统 / 地下党 / 公安 / 平民</li>
      </ul>

      <div class="mt-5 font-mono text-[10px] tracking-[0.3em] text-[#8a8275]">时间轴</div>
      <p class="mt-2 text-[12px] leading-6 text-[#8a8275]">底部集数滑块拖动全剧 46 集：角色按出场时间浮现与消散，边随之形成。播放键自动演化。</p>
    </div>
  </div>
</template>
