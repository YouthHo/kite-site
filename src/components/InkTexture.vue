<script setup>
/**
 * 淡墨点纹理（N2 · InkTexture）：极淡墨渍，随滚动漂移的东方气质
 * 纯 CSS，双主题自适应；reduced-motion 静态
 */
</script>

<template>
  <div class="ink-texture" aria-hidden="true"></div>
</template>

<style scoped>
.ink-texture {
  position: fixed;
  inset: -20%;
  z-index: 68;
  pointer-events: none;
  background-image:
    radial-gradient(ellipse 42% 30% at 12% 18%, rgba(60, 60, 66, 0.05), transparent 70%),
    radial-gradient(ellipse 30% 24% at 88% 72%, rgba(185, 28, 28, 0.028), transparent 70%),
    radial-gradient(ellipse 20% 16% at 68% 30%, rgba(60, 60, 66, 0.04), transparent 70%);
  animation: inkDrift 90s linear infinite;
}
@keyframes inkDrift {
  from {
    transform: translate3d(0, 0, 0);
  }
  to {
    transform: translate3d(-2.5%, -1.5%, 0);
  }
}
:global([data-theme='light']) .ink-texture {
  background-image:
    radial-gradient(ellipse 42% 30% at 12% 18%, rgba(90, 70, 45, 0.045), transparent 70%),
    radial-gradient(ellipse 30% 24% at 88% 72%, rgba(185, 28, 28, 0.03), transparent 70%),
    radial-gradient(ellipse 20% 16% at 68% 30%, rgba(90, 70, 45, 0.035), transparent 70%);
}
@media (prefers-reduced-motion: reduce) {
  .ink-texture {
    animation: none;
  }
}
</style>
