// 名字徽章：全站统一的人物"头像"方案（真实照片缺失时，以完整姓名为图形）
// 尺寸: sm=列表小圆 / md=头像圆 / lg=大档案名卡（用于角色详情）
<script setup>
import { computed } from 'vue'
import { factionColor } from '@/utils/factions'

const props = defineProps({
  name: { type: String, required: true },
  faction: { type: String, default: 'civilian' },
  size: { type: String, default: 'sm' }, // sm | md | lg
  sub: { type: String, default: '' }, // 小字（lg 用）
  code: { type: String, default: '' }, // 代号（lg 用）
})

const color = computed(() => factionColor(props.faction))
const cls = computed(() => {
  if (props.size === 'lg') return 'w-full h-full'
  if (props.size === 'md') return 'w-14 h-14'
  return 'w-9 h-9'
})
// 名字自适应：超过 2 字自动缩小字号，保证不溢出圆圈
const badgeFont = computed(() => {
  const n = (props.name || '').length
  if (props.size === 'lg') return Math.round(46 - Math.max(0, n - 3) * 6)
  const base = props.size === 'md' ? 12 : 10
  const shrink = n >= 4 ? 0.62 : n === 3 ? 0.78 : 1
  return Math.max(8, Math.round(base * shrink))
})
</script>

<template>
  <!-- 大档案名卡 -->
  <div v-if="size === 'lg'" class="relative w-full h-full overflow-hidden" :style="{ background: 'linear-gradient(160deg, #fdfaf3, #f0ead9)' }">
    <div class="absolute top-0 left-0 right-0 h-1.5" :style="{ background: color }"></div>
    <div class="absolute inset-0 grid place-items-center px-6">
      <div class="text-center">
        <div class="serif-title text-5xl md:text-6xl tracking-[0.18em] text-[#2f2b23]">{{ name }}</div>
        <div class="gold-line w-32 mx-auto mt-4"></div>
        <div v-if="code" class="mt-3 font-mono text-[11px] tracking-[0.35em]" :style="{ color }">代号 · {{ code }}</div>
        <div v-else-if="sub" class="mt-3 font-mono text-[11px] tracking-[0.3em] text-[#6e675a]">{{ sub }}</div>
      </div>
    </div>
    <div class="absolute bottom-2 left-3 font-mono text-[9px] tracking-[0.3em]" :style="{ color }">KITE FILE</div>
  </div>

  <!-- 圆形名字徽章（无衬线 + 字号自适应，防溢出） -->
  <div
    v-else
    class="grid place-items-center rounded-full overflow-hidden title-sans text-[#f5f2e9] shrink-0 select-none"
    :class="cls"
    :style="{ background: `radial-gradient(circle at 35% 30%, ${color}cc, ${color})`, border: '1px solid rgba(255,255,255,0.3)', boxShadow: `0 2px 8px ${color}55`, fontSize: badgeFont + 'px', lineHeight: 1.2 }"
  >
    {{ name }}
  </div>
</template>
