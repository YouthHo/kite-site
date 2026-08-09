<script setup>
// 红印章（档案戳记）：匠心装饰元素，用于页面标题区
defineProps({
  text: { type: String, default: '风筝\n档案' },
  size: { type: Number, default: 54 },
})
</script>

<template>
  <span class="seal" :style="{ width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.22) + 'px' }">{{ text }}</span>
</template>
