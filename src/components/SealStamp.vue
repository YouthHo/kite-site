<script setup>
import { computed } from 'vue'

/**
 * 红印章（档案戳记）：四字自动两字一行，三字 1+2，两字单行
 */
const props = defineProps({
  text: { type: String, default: '风筝档案' },
  size: { type: Number, default: 54 },
})

const display = computed(() => {
  const t = (props.text || '').replace(/\n/g, '')
  if (t.length >= 4) return t.slice(0, 2) + '\n' + t.slice(2, 4)
  if (t.length === 3) return t[0] + '\n' + t.slice(1)
  return t
})
</script>

<template>
  <span class="seal" :style="{ width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.22) + 'px' }">{{ display }}</span>
</template>
