<template>
  <!-- 老式监视器扫描线：极细亮线自上而下缓慢移动 -->
  <div class="scan-line" aria-hidden="true"></div>
</template>

<style scoped>
.scan-line {
  position: fixed;
  left: 0;
  right: 0;
  height: 1px;
  z-index: 71;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(232, 220, 200, 0.22), transparent);
  box-shadow: 0 0 12px rgba(232, 220, 200, 0.15);
  animation: scan 9s linear infinite;
  opacity: 0.55;
}
@keyframes scan {
  0% { top: -5%; }
  100% { top: 105%; }
}
@media (prefers-reduced-motion: reduce) {
  .scan-line { display: none; }
}
</style>
