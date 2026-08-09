<template>
  <!-- 全屏胶片颗粒：动态噪点（CSS 动画驱动，极轻量） -->
  <div class="film-grain" aria-hidden="true"></div>
</template>

<style scoped>
.film-grain {
  position: fixed;
  inset: -50%;
  z-index: 70;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain 8s steps(10) infinite;
}
@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -8%); }
  30% { transform: translate(4%, -4%); }
  50% { transform: translate(-3%, 6%); }
  70% { transform: translate(6%, 3%); }
  90% { transform: translate(-6%, -3%); }
}
@media (prefers-reduced-motion: reduce) {
  .film-grain { animation: none; }
}
</style>
