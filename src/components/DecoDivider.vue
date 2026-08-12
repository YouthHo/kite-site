<script setup>
import { computed } from 'vue'

/**
 * 装饰分隔线（三种母题）：seal 封条 / rope 红绳 / telegraph 电报码
 * 纯 CSS/SVG，双主题随 currentColor 与令牌
 */
const props = defineProps({
  variant: { type: String, default: 'telegraph' },
})

const CODE = computed(() => {
  // 电报码装饰（固定字符，仅装饰）
  const seg = ['01001010', '01101011', '01010100', '01101011']
  return seg.join(' ')
})
</script>

<template>
  <div class="deco-divider" :class="`deco-${variant}`" role="presentation" aria-hidden="true">
    <!-- 封条：两端红块 + 中间虚线 -->
    <template v-if="variant === 'seal'">
      <span class="seal-block left"></span>
      <span class="seal-line"></span>
      <span class="seal-block right"></span>
    </template>
    <!-- 红绳：双线交叉 -->
    <template v-else-if="variant === 'rope'">
      <span class="rope-a"></span>
      <span class="rope-b"></span>
    </template>
    <!-- 电报码：字符 + 收尾点 -->
    <template v-else>
      <span class="telegraph-code">{{ CODE }}</span>
      <span class="telegraph-dot"></span>
    </template>
  </div>
</template>

<style scoped>
.deco-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-3);
  width: 100%;
  color: var(--ink);
}

/* 封条 */
.deco-seal .seal-block {
  width: 28px;
  height: 10px;
  background: var(--blood);
  opacity: 0.55;
  border-radius: 2px;
}
.deco-seal .seal-line {
  flex: 1;
  max-width: 320px;
  border-top: 1px dashed var(--line);
}

/* 红绳 */
.deco-rope {
  position: relative;
  height: 12px;
}
.deco-rope .rope-a,
.deco-rope .rope-b {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 140px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--blood), transparent);
  opacity: 0.6;
}
.deco-rope .rope-a {
  transform: translate(-50%, -50%) rotate(6deg);
}
.deco-rope .rope-b {
  transform: translate(-50%, -50%) rotate(-6deg);
}

/* 电报码 */
.deco-telegraph .telegraph-code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9px;
  letter-spacing: 0.35em;
  color: var(--ink);
  opacity: 0.55;
}
.deco-telegraph .telegraph-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--gold);
  opacity: 0.7;
}
</style>
