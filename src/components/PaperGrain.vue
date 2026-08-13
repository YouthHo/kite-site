<script setup>
/**
 * 宣纸纹理（N2 · PaperGrain）：纤维质感 + 淡墨点，替换「老电影」胶片隐喻
 * 纯 CSS/SVG（feTurbulence 噪声 + 极淡墨点），零图片，双主题自适应
 */
</script>

<template>
  <div class="paper-grain" aria-hidden="true"></div>
</template>

<style scoped>
.paper-grain {
  position: fixed;
  inset: 0;
  z-index: 69;
  pointer-events: none;
  opacity: 0.5;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23p)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}
/* 浅色主题：宣纸纤维更明显 */
:global([data-theme='light']) .paper-grain {
  opacity: 0.3;
  mix-blend-mode: multiply;
}
</style>
