<script setup>
import { ref } from 'vue'
import ThreadAxis from '@/components/ThreadAxis.vue'
import DossierOverlay from '@/components/DossierOverlay.vue'

/**
 * UniverseShell —— 宇宙外壳（第一套皮肤「一线宇宙」唯一常驻容器）
 * 承载线轴导航 + 浮层档案 + 内容区
 * 状态机（透镜/聚焦/年代/视角）由核心 UniverseState 驱动
 */
const props = defineProps({
  universe: { type: Object, required: true },
})
const dossier = ref(null) // { type, id } | null

function openDossier(type, id) {
  dossier.value = { type, id }
  props.universe.setFocus(id)
}
function closeDossier() {
  dossier.value = null
  props.universe.setFocus(null)
}
</script>

<template>
  <div class="universe-shell min-h-screen">
    <!-- 内容区（透镜呈现：默认关系图谱，由父层路由/视图承载） -->
    <main class="pb-20">
      <slot :open-dossier="openDossier" />
    </main>

    <!-- 线轴导航（替代 NavBar） -->
    <ThreadAxis :universe="universe" />

    <!-- 浮层档案 -->
    <DossierOverlay v-if="dossier" :type="dossier.type" :id="dossier.id" @close="closeDossier" />
  </div>
</template>
