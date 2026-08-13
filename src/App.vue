<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { createUniverseState } from '@/store/universe'
import UniverseShell from '@/components/UniverseShell.vue'
import PageTransition from '@/components/PageTransition.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import ArchiveRail from '@/components/ArchiveRail.vue'
import CustomCursor from '@/components/CustomCursor.vue'
import LoadingScreen from '@/components/LoadingScreen.vue'
import InkTexture from '@/components/InkTexture.vue'
import PaperGrain from '@/components/PaperGrain.vue'

/**
 * 宇宙外壳（第一套皮肤）：NavBar 退役 → ThreadAxis 线轴导航
 * 核心状态 UniverseState 由本层创建并注入
 */
const route = useRoute()
const loading = ref(true)
const universe = createUniverseState()

onMounted(() => {
  universe.restoreFromUrl()
  // 加载显影（沿用既有 LoadingScreen 语义，时长短促）
  const t = setTimeout(() => (loading.value = false), 1400)
  watch(
    () => loading.value,
    (v) => { if (!v) clearTimeout(t) }
  )
})
</script>

<template>
  <div :data-theme="universe.state.theme">
    <LoadingScreen v-if="loading" @done="loading = false" />
    <CustomCursor />
    <InkTexture />
    <PaperGrain />

    <!-- 宇宙壳：线轴 + 浮层档案 + 内容区 -->
    <UniverseShell :universe="universe">
      <template #default="{ openDossier }">
        <PageTransition>
          <router-view :key="route.path" :universe="universe" :open-dossier="openDossier" />
        </PageTransition>
      </template>
    </UniverseShell>

    <CommandPalette />
    <ArchiveRail />
  </div>
</template>
