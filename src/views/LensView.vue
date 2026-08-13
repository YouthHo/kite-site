<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import characters from '@/data/characters.json'
import timeline from '@/data/timeline.json'
import scenes from '@/data/scenes.json'
import history from '@/data/history.json'
import { FACTION, factionLabel } from '@/utils/factions'
import SceneCard from '@/components/SceneCard.vue'
import DecoDivider from '@/components/DecoDivider.vue'

/**
 * LensView —— 非关系透镜的内容呈现（第一套皮肤）
 * time 时空 / faction 阵营 / scene 名场 / history 史料
 * 同一份数据的不同"编织"，均受 eraViewport 影响（时间飞行贯穿）
 */
const props = defineProps({
  universe: { type: Object, required: true },
  openDossier: { type: Function, default: null },
})
const router = useRouter()

// 时空透镜：timeline 按年代视窗过滤
const timeItems = computed(() => {
  const [ea, eb] = props.universe.state.eraViewport
  return timeline.filter((t) => {
    const y = parseInt(String(t.date).slice(0, 4)) || 0
    return y >= ea && y <= eb
  })
})

// 阵营透镜：角色按阵营分组（视窗过滤）
const factionGroups = computed(() => {
  const [ea, eb] = props.universe.state.eraViewport
  const groups = {}
  for (const f of Object.keys(FACTION)) groups[f] = []
  characters.forEach((c) => {
    // 简化的年代映射：由出场集数范围粗筛（此处用角色 ID 存在性 + 全量展示，视窗过滤留给图谱）
    groups[c.faction]?.push(c)
  })
  return groups
})

// 名场透镜：全部名场面（SceneCard 网格）
// 史料透镜：history 条目
</script>

<template>
  <div class="page-wrap !pt-10 !pb-24">
    <!-- 时空透镜 -->
    <div v-if="universe.state.currentLens === 'time'">
      <div class="flex items-center gap-4 mb-2">
        <h2 class="serif-title text-3xl md:text-4xl text-[#ece3d2]">时空 · {{ universe.state.eraViewport.join(' — ') }}</h2>
        <span class="file-label">{{ timeItems.length }} 条</span>
      </div>
      <DecoDivider variant="telegraph" class="mb-6" />
      <div class="space-y-3">
        <button
          v-for="t in timeItems"
          :key="t.date + t.title"
          class="w-full text-left k-card p-4 m-focus-ring"
          :class="t.type === 'history' ? 'border-l-2 border-l-[#2f4a4f]' : 'border-l-2 border-l-[#b91c1c]'"
          @click="openDossier ? openDossier('history', t.title) : null"
        >
          <div class="flex items-baseline gap-4">
            <span class="font-mono text-[12px] text-[#e05a50]">{{ t.date }}</span>
            <span class="flex-1 text-[14px] text-[#ece3d2]">{{ t.title }}</span>
            <span class="badge-faction" :class="t.type === 'history' ? 'f-underground' : 'f-junton'">{{ t.type === 'history' ? '史实' : '剧情' }}</span>
          </div>
          <p class="mt-2 text-[12px] leading-6 text-[#a89f8e] line-clamp-2">{{ t.desc }}</p>
        </button>
      </div>
    </div>

    <!-- 阵营透镜 -->
    <div v-else-if="universe.state.currentLens === 'faction'">
      <h2 class="serif-title text-3xl md:text-4xl text-[#ece3d2] mb-2">阵营</h2>
      <DecoDivider variant="telegraph" class="mb-6" />
      <div class="space-y-8">
        <section v-for="(list, f) in factionGroups" :key="f">
          <div class="flex items-center gap-3 mb-3">
            <span class="w-2.5 h-2.5 rounded-full" :style="{ background: FACTION[f].color }"></span>
            <span class="font-mono text-[11px] tracking-[0.3em] text-[#a89f8e]">{{ factionLabel(f) }} · {{ list.length }}</span>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <button
              v-for="c in list"
              :key="c.id"
              class="k-card p-3 text-left m-focus-ring"
              @click="openDossier ? openDossier('character', c.id) : null"
            >
              <div class="text-[13px] text-[#ece3d2] truncate">{{ c.name }}</div>
              <div class="text-[10px] text-[#a89f8e] font-mono mt-0.5 truncate">{{ c.code || c.identity }}</div>
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- 名场透镜 -->
    <div v-else-if="universe.state.currentLens === 'scene'">
      <h2 class="serif-title text-3xl md:text-4xl text-[#ece3d2] mb-2">名场 · {{ scenes.length }}</h2>
      <DecoDivider variant="telegraph" class="mb-6" />
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <SceneCard v-for="s in scenes" :key="s.id" :scene="s" />
      </div>
    </div>

    <!-- 史料透镜 -->
    <div v-else-if="universe.state.currentLens === 'history'">
      <h2 class="serif-title text-3xl md:text-4xl text-[#ece3d2] mb-2">史料 · {{ history.length }}</h2>
      <DecoDivider variant="telegraph" class="mb-6" />
      <div class="space-y-4">
        <article v-for="h in history" :key="h.title" class="k-card p-5">
          <div class="flex items-baseline gap-3">
            <span class="font-mono text-[12px] text-[#2f4a4f]">{{ h.year }}</span>
            <h3 class="text-[15px] text-[#ece3d2]">{{ h.title }}</h3>
          </div>
          <p class="mt-2 text-[12px] leading-6 text-[#a89f8e]">{{ h.desc }}</p>
        </article>
      </div>
    </div>

    <!-- 兜底 -->
    <div v-else class="k-empty">
      <div class="font-mono text-[40px] tracking-[0.3em] text-[#8f897c]">透镜</div>
      <p class="text-[12px] text-[#a89f8e]">该透镜视图正在编织中</p>
    </div>
  </div>
</template>
