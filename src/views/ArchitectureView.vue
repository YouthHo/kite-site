<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import gsap from 'gsap'
import { X } from 'lucide-vue-next'
import architecture from '@/data/architecture.json'
import characters from '@/data/characters.json'
import { pageEnter, prefersReduced } from '@/utils/anim'

const activeTab = ref('junton')
const modal = ref(null)
const modalEl = ref(null)
let modalTween = null

const charMap = computed(() => {
  const m = {}
  characters.forEach((c) => (m[c.id] = c))
  return m
})
const currentOrg = computed(() => architecture.find((o) => o.id === activeTab.value))
// 按层级分组（树形展平）
const byLevel = computed(() => {
  const org = currentOrg.value
  if (!org) return []
  const maxLevel = Math.max(...org.nodes.map((n) => n.level))
  const levels = []
  for (let l = 0; l <= maxLevel; l++) {
    levels.push(org.nodes.filter((n) => n.level === l))
  }
  return levels
})

function openModal(node) {
  const c = node.person ? charMap.value[node.person] : null
  modal.value = { node, c }
  gsap.fromTo(modalEl.value, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' })
  gsap.fromTo('.arch-mask', { opacity: 0 }, { opacity: 1, duration: 0.3 })
}
function closeModal() {
  modalTween = gsap.to(modalEl.value, { scale: 0.9, opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => (modal.value = null) })
  gsap.to('.arch-mask', { opacity: 0, duration: 0.25 })
}

onMounted(async () => {
  await nextTick()
  pageEnter(document.querySelector('.arch-page'))
})

// 切换标签：下划线滑动 + 树逐层展开
let treeTween = null
function switchTab(id) {
  if (id === activeTab.value) return
  activeTab.value = id
  nextTick(() => {
    if (prefersReduced) return
    treeTween?.kill()
    treeTween = gsap.fromTo(
      '.arch-node',
      { opacity: 0, y: 24, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.06, ease: 'back.out(1.5)' }
    )
    gsap.fromTo('.arch-connector', { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.03, delay: 0.15 })
  })
}
onBeforeUnmount(() => {
  modalTween?.kill()
  treeTween?.kill()
})
</script>

<template>
  <div class="arch-page page-wrap">
    <div class="mb-8">
      <h2 class="serif-title text-4xl md:text-5xl text-[#e8dcc8]" data-enter>势力架构</h2>
      <div class="gold-line w-40 mt-3" data-enter></div>
      <p class="mt-3 font-mono text-[11px] tracking-[0.3em] text-[#8a8275]" data-enter>三方势力 · 徽章式树形图 · 点击节点查看详情</p>
    </div>

    <!-- 顶部标签页：下划线跟随 -->
    <div class="flex gap-8 border-b border-[#2a2520] mb-10" data-enter>
      <button
        v-for="org in architecture"
        :key="org.id"
        class="relative pb-3 text-[14px] tracking-[0.2em] transition-colors"
        :class="activeTab === org.id ? 'text-[#e8dcc8]' : 'text-[#555048] hover:text-[#8a8275]'"
        @click="switchTab(org.id)"
      >
        {{ org.name }}
        <span
          class="absolute bottom-[-1px] left-0 right-0 h-[2px] transition-all duration-400"
          :class="activeTab === org.id ? 'opacity-100' : 'opacity-0'"
          :style="{ background: org.color, boxShadow: activeTab === org.id ? `0 0 12px ${org.color}` : 'none' }"
        ></span>
      </button>
    </div>

    <p class="mb-8 text-[12px] leading-6 text-[#8a8275]" data-enter>{{ currentOrg.desc }}</p>

    <!-- 树形架构：逐层行 -->
    <div class="overflow-x-auto pb-6">
      <div class="min-w-[720px]">
        <div v-for="(level, li) in byLevel" :key="li" class="relative mb-8">
          <!-- 层间连接线 -->
          <div v-if="li > 0" class="arch-connector absolute -top-8 left-1/2 w-px h-8" :style="{ background: `linear-gradient(${currentOrg.color}, transparent)` }"></div>
          <div class="flex items-start justify-center gap-6">
            <div
              v-for="node in level"
              :key="node.id"
              class="arch-node relative flex flex-col items-center cursor-pointer group w-44"
              @click="openModal(node)"
            >
              <!-- 父级连接竖线 -->
              <div v-if="node.parent" class="absolute -top-8 w-px h-8" :style="{ background: currentOrg.color + '55' }"></div>
              <!-- 徽章节点 -->
              <div
                class="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-2 grid place-items-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_28px_rgba(157,34,53,0.45)]"
                :style="{
                  borderColor: currentOrg.color,
                  background: 'radial-gradient(circle, ' + currentOrg.color + '26, #0e0e0e 70%)',
                  boxShadow: node.level === 0 ? `0 0 30px ${currentOrg.color}55` : 'none',
                }"
              >
                <div class="text-center px-2">
                  <div class="serif-title text-[13px] leading-5 text-[#e8dcc8]">{{ node.name }}</div>
                  <div class="mt-0.5 font-mono text-[9px] tracking-[0.1em] text-[#8a8275]">{{ node.role }}</div>
                </div>
                <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-[#080808]" :style="{ background: node.level === 0 ? '#b8860b' : currentOrg.color }"></span>
              </div>
              <!-- 下级水平连接线 -->
              <div v-if="level.some((n) => n.parent === node.id)" class="absolute -bottom-8 left-[10%] right-[10%] h-px" :style="{ background: currentOrg.color + '44' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 点击节点：详情弹窗 -->
    <Teleport to="body">
      <div v-if="modal" class="fixed inset-0 z-[94] grid place-items-center p-4">
        <div class="arch-mask absolute inset-0 bg-black/75 backdrop-blur-md" @click="closeModal"></div>
        <div ref="modalEl" class="relative w-full max-w-md bg-[#0e0e0e] border border-[#2a2520] p-6 archive-tape">
          <button class="absolute top-4 right-4 text-[#8a8275] hover:text-[#e8dcc8]" @click="closeModal"><X :size="18" /></button>
          <div class="font-mono text-[10px] tracking-[0.3em]" :style="{ color: currentOrg.color }">{{ currentOrg.name }} / 节点档案</div>
          <div class="flex items-center gap-4 mt-4">
            <img v-if="modal.c" :src="modal.c.image" :alt="modal.c.name" class="w-16 h-16 rounded-full object-cover border-2 border-[#2a2520]" />
            <div>
              <h3 class="serif-title text-2xl text-[#e8dcc8]">{{ modal.c?.name || modal.node.name }}</h3>
              <p class="text-[12px] tracking-[0.15em] text-[#8a8275] mt-1">{{ modal.node.role }}</p>
            </div>
          </div>
          <p class="mt-4 text-[13px] leading-7 text-[#8a8275]">{{ modal.c?.brief || modal.node.desc }}</p>
          <p class="mt-3 text-[12px] leading-6 text-[#555048]">{{ modal.node.desc }}</p>
          <router-link
            v-if="modal.c"
            :to="`/characters?q=${modal.c.id}`"
            class="mt-5 block text-center border border-[#9d2235] py-2 text-[12px] tracking-[0.25em] text-[#e8dcc8] hover:bg-[#9d2235]/15 transition-colors"
          >
            查看完整档案
          </router-link>
        </div>
      </div>
    </Teleport>
  </div>
</template>
